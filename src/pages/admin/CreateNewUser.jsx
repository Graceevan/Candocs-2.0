import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  DatePicker,
  Switch,
  List,
  Avatar,
  Tabs,
  Spin,
  Empty,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
  TeamOutlined,
  EditOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axiosInstance";
import alertService from "../../services/alertService";
import dayjs from "dayjs";
import "../../styles/CreateNewUser.css";

const { Title, Text } = Typography;
const { Password } = Input;

// New LDAP component to display LDAP groups and users
const LdapUserManagement = () => {
  const [ldapData, setLdapData] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authToken = useSelector((state) => state.auth.user?.authToken) || localStorage.getItem("authToken");

  useEffect(() => {
    fetchLdapUsers();
  }, []);

  const fetchLdapUsers = async () => {
    setLoading(true);
    try {
      const response = await api.post("/candocspro/users/ldap/3", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setLdapData(response.data);
      if (response.data.length > 0) {
        setSelectedGroup(response.data[0].groupName);
      }
    } catch (err) {
      console.error("Failed to fetch LDAP users:", err);
      alertService.error("Error", "Failed to load LDAP users. Please check the network or server status.");
      setLdapData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically select the first user when a new group is selected
    if (selectedGroup) {
      const group = ldapData.find((g) => g.groupName === selectedGroup);
      if (group && group.users.length > 0) {
        setSelectedUser(group.users[0]);
      } else {
        setSelectedUser(null);
      }
    } else {
      setSelectedUser(null);
    }
  }, [selectedGroup, ldapData]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  const usersInSelectedGroup = ldapData.find((g) => g.groupName === selectedGroup)?.users || [];

  return (
    <Row gutter={21} style={{ marginBottom: 10, minHeight: 100 }}>
      {/* Groups Container */}
      <Col xs={24} sm={6}>
        <Card title="Groups" className="ldap-card">
          {ldapData.length > 0 ? (
            <List
              dataSource={ldapData.map((group) => group.groupName)}
              renderItem={(groupName) => (
                <List.Item
                  className={`ldap-list-item ${selectedGroup === groupName ? "selected" : ""}`}
                  onClick={() => setSelectedGroup(groupName)}
                >
                  <List.Item.Meta title={groupName} />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              image={<WarningOutlined style={{ fontSize: 50, color: "#faad14" }} />}
              description="No LDAP groups found"
            />
          )}
        </Card>
      </Col>

      {/* Users and User Details Containers */}
      <Col xs={24} sm={18}>
        <Row gutter={[20, 20]}>
          {/* Users in 'Group' Container */}
          <Col xs={24} md={12}>
            <Card title={`Users in ${selectedGroup || "Selected Group"}`} className="ldap-card">
              {usersInSelectedGroup.length > 0 ? (
                <List
                  dataSource={usersInSelectedGroup}
                  renderItem={(user) => (
                    <List.Item
                      className={`ldap-list-item ${
                        selectedUser?.distinguishedName === user.distinguishedName ? "selected" : ""
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={user.commonName}
                        description={user.username}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No users found in this group" />
              )}
            </Card>
          </Col>

          {/* User Details Container */}
          <Col xs={24} md={12}>
            <Card title="User Details" className="ldap-card">
              {selectedUser ? (
                <div className="user-details-grid">
                  <div className="detail-item">
                    <Text className="detail-label">Common Name</Text>
                    <Text>{selectedUser.commonName || "N/A"}</Text>
                  </div>
                  <div className="detail-item">
                    <Text className="detail-label">First Name</Text>
                    <Text>{selectedUser.firstName || "N/A"}</Text>
                  </div>
                  <div className="detail-item">
                    <Text className="detail-label">Last Name</Text>
                    <Text>{selectedUser.lastName || "N/A"}</Text>
                  </div>
                  <div className="detail-item">
                    <Text className="detail-label">Username</Text>
                    <Text>{selectedUser.username || "N/A"}</Text>
                  </div>
                  <div className="detail-item">
                    <Text className="detail-label">Email</Text>
                    <Text>{selectedUser.email || "N/A"}</Text>
                  </div>
                  <div className="detail-item">
                    <Text className="detail-label">Distinguished Name</Text>
                    <Text>{selectedUser.distinguishedName || "N/A"}</Text>
                  </div>
                </div>
              ) : (
                <Empty description="Select a user to view details" />
              )}
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

const CreateNewUser = () => {
  const [form] = Form.useForm();
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [userStatus, setUserStatus] = useState("ACTIVE");
  const [isSwitchEditable, setIsSwitchEditable] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("local");

  const navigate = useNavigate();
  const location = useLocation();
  const authToken =
    useSelector((state) => state.auth.user?.authToken) || localStorage.getItem("authToken");

  const userData = location.state?.user || null;

  useEffect(() => {
    fetchGroups();

    if (userData) {
      form.setFieldsValue({
        username: userData.userName,
        email: userData.email,
        mobileNumber: userData.mobileNumber,
        dateOfBirth: userData.dateOfBirth ? dayjs(userData.dateOfBirth) : null,
      });

      const groupIds = userData.groups?.map((g) => g.groupId || g.id) || [];
      setSelectedGroups(groupIds);

      setUserStatus(userData.status || "ACTIVE");
      setIsFormEditable(false);
    }
  }, [authToken, userData]);

  const fetchGroups = async () => {
    if (!authToken) return;
    setLoadingGroups(true);
    try {
      const { data } = await api.post(
        "/candocspro/group/get",
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setAvailableGroups(
        data.map((group) => ({ id: group.id, name: group.groupName }))
      );
    } catch (err) {
      alertService.error("Error", "Failed to load groups.");
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleGroupSelect = (groupId) => {
    if (!selectedGroups.includes(groupId)) {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const handleGroupRemove = (groupId) => {
    setSelectedGroups(selectedGroups.filter((id) => id !== groupId));
  };

  const onFinish = async (values) => {
    // Validation is now specific to the active tab
    if (activeTab === "local" && selectedGroups.length === 0) {
      alertService.error(
        "Validation Error",
        "Please select at least one group for the user."
      );
      return;
    }

    let payload = {};
    let apiEndpoint = "";

    if (userData) {
      apiEndpoint = `/candocspro/user/update-user/${userData.userId}`;
      payload = {
        userName: values.username,
        email: values.email,
        mobileNumber: values.mobileNumber,
        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.format("YYYY-MM-DD")
          : null,
        groups: selectedGroups.map((id) => ({ groupId: id })),
        status: userStatus,
      };
    } else if (activeTab === "local") {
      apiEndpoint = "/candocspro/user/register";
      payload = {
        userName: values.username,
        email: values.email,
        mobileNumber: values.mobileNumber,
        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.format("YYYY-MM-DD")
          : null,
        groups: selectedGroups.map((id) => ({ groupId: id })),
        status: userStatus,
        password: values.password,
      };
    } else if (activeTab === "ldap") {
      // The LDAP UI is for viewing, not form submission, so we can return here
      return;
    }

    setLoading(true);
    try {
      await api.post(apiEndpoint, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (userData) {
        alertService.success("Success", "User updated successfully!");
        setIsFormEditable(false);
        setIsSwitchEditable(false);
      } else {
        alertService.success("Success", "User created successfully!");
        form.resetFields();
        setSelectedGroups([]);
      }

      setTimeout(() => navigate("/admin/usermanagement"), 1500);
    } catch (err) {
      alertService.error(
        "Error",
        err.response?.data?.message || "Operation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = isFormEditable
    ? availableGroups.filter(
        (group) =>
          group.name?.toLowerCase().includes(searchText.toLowerCase()) &&
          !selectedGroups.includes(group.id)
      )
    : [];

  const localFormFields = (
    <>
      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please input the username!" }]}
          >
            <Input prefix={<UserOutlined />} disabled={!isFormEditable} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please input the email!" },
              { type: "email", message: "The input is not valid E-mail!" },
            ]}
          >
            <Input prefix={<MailOutlined />} disabled={!isFormEditable} />
          </Form.Item>
        </Col>
        {!userData && (
          <Col xs={24} sm={12}>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please input the password!" },
                { min: 6, message: "Password must be at least 6 characters!" },
              ]}
            >
              <Password prefix={<LockOutlined />} disabled={!isFormEditable} />
            </Form.Item>
          </Col>
        )}
        <Col xs={24} sm={12}>
          <Form.Item
            name="mobileNumber"
            label="Mobile Number"
            rules={[{ required: true, message: "Please input the mobile number!" }]}
          >
            <Input prefix={<PhoneOutlined />} disabled={!isFormEditable} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="dateOfBirth"
            label="Date of Birth"
            rules={[{ required: true, message: "Please select date of birth!" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabled={!isFormEditable}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Col>
      </Row>
      <div className="group-membership-section">
        <Title level={4} className="section-title">
          <TeamOutlined /> Group Membership
        </Title>
        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <div className="member-of">
              <div className="group-label">Member Of</div>
              <div className="selected-groups-list scrollable-box">
                {selectedGroups.length === 0 ? (
                  <div className="no-groups">No groups added yet</div>
                ) : (
                  <List
                    size="small"
                    dataSource={selectedGroups}
                    renderItem={(groupId) => {
                      const group =
                        availableGroups.find((g) => g.id === groupId) ||
                        userData?.groups?.find(
                          (g) => g.groupId === groupId || g.id === groupId
                        );
                      return (
                        <List.Item
                          actions={[
                            isFormEditable && (
                              <Button
                                type="text"
                                size="small"
                                onClick={() => handleGroupRemove(groupId)}
                              >
                                ×
                              </Button>
                            ),
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={<TeamOutlined />} />}
                            title={group?.groupName || group?.name}
                          />
                        </List.Item>
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </Col>
          {isFormEditable && (
            <Col xs={24} sm={12}>
              <div className="available-groups">
                <div className="group-label">Available Groups</div>
                <Input.Search
                  placeholder="Search groups..."
                  allowClear
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <div className="scrollable-box">
                  <List
                    size="small"
                    dataSource={filteredGroups}
                    renderItem={(group) => (
                      <List.Item
                        actions={[
                          <Button
                            type="default"
                            size="small"
                            onClick={() => handleGroupSelect(group.id)}
                          >
                            Add
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar icon={<TeamOutlined />} />}
                          title={group.name}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              </div>
            </Col>
          )}
        </Row>
      </div>
    </>
  );

  const tabItems = [
    {
      key: "local",
      label: "Local User",
    },
    {
      key: "ldap",
      label: "LDAP User",
    },
  ];

  return (
    <div className="create-user-container">
      <Card className="create-user-card">
        <div
          className="create-user-header"
          style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
        >
          <Title level={3} className="create-user-title">
            {userData ? "View / Edit User" : "Create New User"}
          </Title>
          <div style={{ flexGrow: 1 }}></div>
          {userData && (
            <Button
              type={isFormEditable ? "default" : "primary"}
              icon={<EditOutlined />}
              onClick={() => {
                setIsFormEditable(!isFormEditable);
                setIsSwitchEditable(!isSwitchEditable);
              }}
            >
              {isFormEditable ? "Cancel Edit" : "Edit"}
            </Button>
          )}
        </div>

        {userData && (
          <div style={{ marginBottom: 8 }}>
            <Text>Status: {userStatus}</Text>
          </div>
        )}

        {userData && isSwitchEditable && (
          <div style={{ marginBottom: 24 }}>
            <Text>Change Status: </Text>
            <Switch
              checked={userStatus === "ACTIVE"}
              onChange={(checked) =>
                setUserStatus(checked ? "ACTIVE" : "INACTIVE")
              }
              checkedChildren="ACTIVE"
              unCheckedChildren="INACTIVE"
            />
          </div>
        )}

        {!userData && (
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              form.resetFields();
            }}
            items={tabItems}
          />
        )}

        {activeTab === "ldap" && !userData ? (
          <LdapUserManagement />
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="create-user-form"
          >
            {localFormFields}
            {isFormEditable && (
              <div className="form-actions">
                <Button
                  type="default"
                  onClick={() => navigate("/admin/usermanagement")}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Save
                </Button>
              </div>
            )}
          </Form>
        )}
      </Card>
    </div>
  );
};

export default CreateNewUser;