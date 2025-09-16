import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  List,
  Avatar,
  Tag,
  Switch,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  SearchOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../api/axiosInstance";
import alertService from "../../services/alertService";
import "../../styles/CreateNewGroup.css";

const { Title, Text } = Typography;

const CreateNewGroup = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const authToken =
    useSelector((state) => state.auth.user?.authToken) ||
    localStorage.getItem("authToken");

  // State
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [isFormEditable, setIsFormEditable] = useState(true);
  const [isSwitchEditable, setIsSwitchEditable] = useState(false);
  const [groupStatus, setGroupStatus] = useState("ACTIVE");

  // Group object for view/edit
  const groupData = location.state?.group || null;

  // Fetch all users
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!authToken) return;
      setLoadingUsers(true);
      try {
        const { data } = await api.post(
          `/candocspro/user/get`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setAvailableUsers(data || []);
      } catch (err) {
        alertService.error("Error", "Could not load users for group creation.");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchAllUsers();
  }, [authToken]);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (groupData) {
      form.setFieldsValue({ groupName: groupData.groupName });
      setSelectedUsers(groupData.user || []);
      setGroupStatus(groupData.status || "ACTIVE");
      setIsFormEditable(false);
    }
  }, [groupData]);

  // Handle form submit
  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      groupName: values.groupName,
      status: groupStatus,
      users: selectedUsers.map((u) => ({ userId: u.userId })),
    };

    try {
      if (groupData) {
        // Update existing group
        const response = await api.post(
          `/candocspro/group/update-group/${groupData.id}`,
          payload,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        alertService.success(
          "Success",
          response.data.message || "Group updated successfully!"
        );
        setIsFormEditable(false);
        setIsSwitchEditable(false);
        setTimeout(() => navigate("/admin/usermanagement"), 1500);
      } else {
        // Create new group
        const response = await api.post("/candocspro/group/create", payload, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        alertService.success(
          "Success",
          response.data.message || "Group created successfully!"
        );
        form.resetFields();
        setSelectedUsers([]);
        setTimeout(() => navigate("/admin/usermanagement"), 1500);
      }
    } catch (error) {
      alertService.error(
        "Error",
        error.response?.data?.message || "Operation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // Assign/remove users
  const handleUserSelect = (user) => {
    if (!selectedUsers.find((u) => u.userId === user.userId)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleUserRemove = (userId) => {
    setSelectedUsers(selectedUsers.filter((user) => user.userId !== userId));
  };

  // Filter available users
  const filteredUsers = isFormEditable
    ? availableUsers.filter(
        (user) =>
          (user.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchText.toLowerCase())) &&
          !selectedUsers.find((u) => u.userId === user.userId)
      )
    : [];

  return (
    <div className="create-group-container">
      <Card className="create-group-card">
        <div
          className="create-group-header"
          style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
        >
          <Title level={3} className="create-group-title">
            {groupData ? "View / Edit Group" : "Create New Group"}
          </Title>
          <div style={{ flexGrow: 1 }} />
          {groupData && (
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

        {/* Status Tag */}
        {groupData && (
          <div style={{ marginBottom: 8 }}>
            <Tag color={groupStatus === "ACTIVE" ? "green" : "red"}>
              Status: {groupStatus}
            </Tag>
          </div>
        )}

        {/* Status Toggle */}
        {groupData && isSwitchEditable && (
          <div style={{ marginBottom: 24 }}>
            <Text>Change Status: </Text>
            <Switch
              checked={groupStatus === "ACTIVE"}
              onChange={(checked) =>
                setGroupStatus(checked ? "ACTIVE" : "DEACTIVE")
              }
              checkedChildren="ACTIVE"
              unCheckedChildren="DEACTIVE"
            />
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="create-group-form"
        >
          <Row gutter={24}>
            <Col xs={24}>
              <Form.Item
                name="groupName"
                label="Group Name"
                rules={[{ required: true, message: "Please input group name!" }]}
              >
                <Input
                  prefix={<TeamOutlined />}
                  placeholder="Enter group name"
                  size="large"
                  disabled={!isFormEditable}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* User Assignment Section */}
          <div className="user-assignment-section">
            <Title level={4} className="section-title">
              <UserOutlined /> Assign Users to Group
            </Title>

            <Row gutter={[24, 24]}>
              {/* Assigned Users */}
              <Col xs={24} sm={12}>
                <div className="assigned-users">
                  <div className="user-label">Assigned Users</div>
                  <div className="selected-users-list scrollable-box">
                    {selectedUsers.length === 0 ? (
                      <div className="no-users">No users added yet</div>
                    ) : (
                      <List
                        size="small"
                        dataSource={selectedUsers}
                        renderItem={(user) => (
                          <List.Item
                            actions={[
                              isFormEditable && (
                                <Button
                                  type="text"
                                  size="small"
                                  onClick={() => handleUserRemove(user.userId)}
                                >
                                  ×
                                </Button>
                              ),
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar icon={<UserOutlined />} />}
                              title={user.userName}
                              description={user.email}
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                </div>
              </Col>

              {/* Available Users */}
              {isFormEditable && (
                <Col xs={24} sm={12}>
                  <div className="available-users">
                    <div className="user-label">Available Users</div>
                    <div className="search-box" style={{ marginBottom: 8 }}>
                      <Input
                        placeholder="Search users..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        size="large"
                      />
                    </div>
                    <div className="users-list scrollable-box">
                      <List
                        size="small"
                        loading={loadingUsers}
                        dataSource={filteredUsers}
                        renderItem={(user) => (
                          <List.Item
                            actions={[
                              <Button onClick={() => handleUserSelect(user)}>
                                Add
                              </Button>,
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar icon={<UserOutlined />} />}
                              title={user.userName}
                              description={user.email}
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

          {isFormEditable && (
            <div className="form-actions">
              <Button
                type="default"
                size="large"
                className="cancel-btn"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="create-group-btn"
                loading={loading}
              >
                Save
              </Button>
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default CreateNewGroup;
