import React, { useState, useEffect } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  SearchOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Tag,
  DatePicker,
  Switch,
  List,
  Avatar,
  Tabs,
  Spin,
  Empty,
  Table,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
  TeamOutlined,
  EditOutlined,
  CheckOutlined ,
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

// New LDAP component to display LDAP servers + groups/users
const LdapUserManagement = () => {
  const [ldapServers, setLdapServers] = useState([]);
  const [ldapData, setLdapData] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [allSelectedUsers, setAllSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingServers, setLoadingServers] = useState(true);
  const [selectedServer, setSelectedServer] = useState(null); // NEW
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const authToken =
    useSelector((state) => state.auth.user?.authToken) ||
    localStorage.getItem("authToken");

  useEffect(() => {
    fetchLdapServers();
  }, []);

  // Fetch LDAP servers list (paginated)
  const fetchLdapServers = async (
    currentPage = page,
    currentSize = pageSize
  ) => {
    setLoadingServers(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage - 1, // backend expects 0-based page
        size: currentSize,
      });

      const { data } = await api.post(
        `/candocspro/get-ldap?${queryParams.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setLdapServers(Array.isArray(data.content) ? data.content : []);
      setTotalElements(data.totalElements || 0);
      setPage(currentPage);
      setPageSize(currentSize);
    } catch (err) {
      console.error("Failed to fetch LDAP servers:", err);
      alertService.error("Error", "Failed to load LDAP server list.");
      setLdapServers([]);
      setTotalElements(0);
    } finally {
      setLoadingServers(false);
    }
  };

  //  Fetch LDAP groups/users for clicked server
  const fetchLdapUsers = async (ldapId, server) => {
    setLoading(true);
    try {
      const response = await api.post(`/candocspro/users/ldap/${ldapId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setLdapData(response.data || []);
      if (response.data?.length > 0) {
        setSelectedGroup(response.data[0].groupName);
      }
      setSelectedServer(server); // set selected server
    } catch (err) {
      console.error("Failed to fetch LDAP users:", err);
      alertService.error(
        "Error",
        "Failed to load LDAP users. Please check the server."
      );
      setLdapData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedServer(null);
    setLdapData([]);
    setAllSelectedUsers([]);
    setSelectedGroup(null);
  };

  const handleUserSelect = (user) => {
    setAllSelectedUsers((prevSelectedUsers) => {
      const isSelected = prevSelectedUsers.some(
        (u) => u.distinguishedName === user.distinguishedName
      );
      if (isSelected) {
        return prevSelectedUsers.filter(
          (u) => u.distinguishedName !== user.distinguishedName
        );
      } else {
        return [...prevSelectedUsers, { ...user, groupName: selectedGroup }];
      }
    });
  };

  const handleSaveLdapUsers = async () => {
    if (allSelectedUsers.length === 0) {
      alertService.warning(
        "Warning",
        "Please select at least one user to save."
      );
      return;
    }

    const usersByGroup = allSelectedUsers.reduce((acc, user) => {
      const groupName = user.groupName;
      if (!acc[groupName]) {
        acc[groupName] = { groupName, users: [] };
      }
      acc[groupName].users.push({
        username: user.username,
        email: user.email,
      });
      return acc;
    }, {});

    const payload = { groups: Object.values(usersByGroup) };

    setLoading(true);
    try {
      await api.post("/candocspro/save-ldap-group-user", payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      alertService.success("Success", "Selected users saved successfully!");
      setAllSelectedUsers([]);
    } catch (err) {
      alertService.error(
        "Error",
        err.response?.data?.message || "Failed to save users."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelections = () => {
    setAllSelectedUsers([]);
  };

  const usersInSelectedGroup =
    ldapData.find((g) => g.groupName === selectedGroup)?.users || [];

  return (
    <div>
      {/* If no server selected -> Show LDAP Servers list */}
      {!selectedServer ? (
        <Card title="LDAP Servers" className="ldap-card" style={{ marginBottom: 20 }}>
          {loadingServers ? (
            <Spin />
          ) : (
            <div className="eldap-table eldap-table-responsive">
              <Table
                rowKey="id"
                dataSource={ldapServers}
                loading={loadingServers}
                bordered
                pagination={{
                  current: page,
                  total: totalElements,
                  pageSize: pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50", "100"],
                  onChange: (newPage, newSize) => {
                    setPageSize(newSize);
                    fetchLdapServers(newPage, newSize);
                  },
                }}
              columns={[
                {
                  title: "LDAP Name",
                  dataIndex: "ldapName",
                  key: "ldapName",
                },
                {
                  title: "Username",
                  dataIndex: "username",
                  key: "username",
                },
                {
                  title: "URL",
                  dataIndex: "url",
                  key: "url",
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (status) => (
                     <span
                className="um-status-tag"
                style={{
                  backgroundColor: status === "ACTIVE" ? "#f6ffed" : "#f8d7da",
                  color: status === "ACTIVE" ? "#52c41a" : "#c52e3dff",
                }}
              >
                {status}
              </span>
                  ),
                },
                {
                  title: "Action",
                  key: "action",
                  render: (_, record) => (
                   <Button
                      icon={<CheckOutlined  />}
                  className="eldap-view-btn"
                 onClick={() => fetchLdapUsers(record.id, record)}
                    >
                      Select
                </Button>

                  ),
                },
              ]}

              />
            </div>
          )}
        </Card>
      ) : (
        <>
          {/* Selected server details at top */}
        <Card
        title={`Server: ${selectedServer.ldapName}`}
        extra={
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            Back
          </Button>
        }
        style={{ marginBottom: 20 }}
      >
        <div style={{ marginBottom: 8 }}>
          <Text strong>URL:</Text> {selectedServer.url}
        </div>
        <div>
          <Text strong>Status: </Text>
          <Tag
            color={
              selectedServer.status?.toUpperCase() === "ACTIVE"
                ? "green"
                : "red"
            }
            style={{ fontSize: 14 }}
          >
            {selectedServer.status}
          </Tag>
        </div>
      </Card>


          {/* Groups & Users Section */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <Spin size="large" />
            </div>
          ) : (
            <Row gutter={21} style={{ marginBottom: 10, minHeight: 100 }}>
              <Col xs={24} sm={10}>
                <Card title="Groups" className="ldap-card">
                  <List
                    dataSource={ldapData.map((group) => group.groupName)}
                    renderItem={(groupName) => (
                      <List.Item
                        className={`ldap-list-item ${
                          selectedGroup === groupName ? "selected" : ""
                        }`}
                        onClick={() => setSelectedGroup(groupName)}
                      >
                        <List.Item.Meta title={groupName} />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={14}>
                <Card
                  title={`Users in ${selectedGroup || "Selected Group"}`}
                  className="ldap-card"
                  style={{ marginBottom: 20 }}
                >
                  {usersInSelectedGroup.length > 0 ? (
                    <List
                      dataSource={usersInSelectedGroup}
                      renderItem={(user) => (
                        <List.Item
                          className={`ldap-list-item ${
                            allSelectedUsers.some(
                              (u) =>
                                u.distinguishedName === user.distinguishedName
                            )
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => handleUserSelect(user)}
                        >
                          <List.Item.Meta
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

                <Card title="Selected Users" className="ldap-card">
                  {allSelectedUsers.length > 0 ? (
                    <div>
                      {allSelectedUsers.map((selectedUser) => (
                        <div
                          key={selectedUser.distinguishedName}
                          style={{
                            marginBottom: 16,
                            borderBottom: "1px solid #f0f0f0",
                            paddingBottom: 8,
                          }}
                        >
                          <div className="user-details-grid">
                            <div className="detail-item">
                              <Text className="detail-label">Common Name:</Text>
                              <Text className="detail-value">
                                {selectedUser.commonName || "N/A"}
                              </Text>
                            </div>
                            <div className="detail-item">
                              <Text className="detail-label">Username:</Text>
                              <Text className="detail-value">
                                {selectedUser.username || "N/A"}
                              </Text>
                            </div>
                            <div className="detail-item">
                              <Text className="detail-label">Email:</Text>
                              <Text className="detail-value">
                                {selectedUser.email || "N/A"}
                              </Text>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="Select users from any group" />
                  )}
                </Card>

                {allSelectedUsers.length > 0 && (
                  <div style={{ marginTop: 20, textAlign: "right" }}>
                    <div className="form-actions">
                    <Button
                      type="default"
                      onClick={handleClearSelections}
                      style={{ marginRight: 8 }}
                    >
                      Cancel
                    </Button>
                    <Button type="primary" onClick={handleSaveLdapUsers}>
                      Save
                    </Button>
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
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
    useSelector((state) => state.auth.user?.authToken) ||
    localStorage.getItem("authToken");

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
            rules={
              userData
                ? [] // not required during update
                : [
                    {
                      required: true,
                      message: "Please input the mobile number!",
                    },
                  ]
            }
          >
            <Input prefix={<PhoneOutlined />} disabled={!isFormEditable} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="dateOfBirth"
            label="Date of Birth"
            rules={
              userData
                ? [] // not required during update
                : [{ required: true, message: "Please select date of birth!" }]
            }
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
  <div style={{ display: "flex", gap: "12px" }}>


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

        <Button
      className="back-button"
      icon={<ArrowLeftOutlined />}
      onClick={() => navigate("/admin/usermanagement")}
    >
      Back
    </Button>
  </div>
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
                setUserStatus(checked ? "ACTIVE" : "DEACTIVE")
              }
              checkedChildren="ACTIVE"
              unCheckedChildren="DEACTIVE"
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
