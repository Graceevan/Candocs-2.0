import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Input,
  Button,
  Tabs,
  Modal,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../api/axiosInstance";
import "../../styles/UserManagement.css";

const { Title } = Typography;

const UserManagement = () => {
  const navigate = useNavigate();
  const authToken =
    useSelector((state) => state.auth.user?.authToken) ||
    localStorage.getItem("authToken");

  const [activeTab, setActiveTab] = useState("users");

  // Users state
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalElements, setUserTotalElements] = useState(0);
  const [userPageSize, setUserPageSize] = useState(10);
  const [nameSearch, setNameSearch] = useState(""); // ⬅️ NEW: State for name search
  const [emailSearch, setEmailSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Groups state
  const [groups, setGroups] = useState([]);
  const [groupPage, setGroupPage] = useState(1);
  const [groupTotalElements, setGroupTotalElements] = useState(0);
  const [groupPageSize, setGroupPageSize] = useState(10);
  const [groupSearchText, setGroupSearchText] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Fetch Users
  const fetchUsers = async (
    page = 1,
    name = "", // ⬅️ MODIFIED: Added name parameter
    email = "",
    mobile = "",
    size = userPageSize
  ) => {
    if (!authToken) return;
    setLoadingUsers(true);
    try {
      const queryParams = new URLSearchParams({
        page: page - 1,
        size,
      });
      if (name) queryParams.append("userName", name); // ⬅️ MODIFIED: Add userName to query params
      if (email) queryParams.append("email", email);
      if (mobile) queryParams.append("mobileNumber", mobile);

      const { data } = await api.post(
        `/candocspro/user/get-all-users?${queryParams.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setUsers(data.content || []);
      setUserTotalElements(data.totalElements || 0);
      setUserPage(page);
      setUserPageSize(size);
    } catch (err) {
      console.error("Error fetching users:", err);
      message.error("Could not load users");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Groups
  const fetchGroups = async (page = 1, searchText = "", size = groupPageSize) => {
    if (!authToken) return;
    setLoadingGroups(true);
    try {
      const queryParams = new URLSearchParams({
        page: page - 1,
        size,
      });
      if (searchText) queryParams.append("groupName", searchText);

      const { data } = await api.post(
        `/candocspro/group/all?${queryParams.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setGroups(data.content || []);
      setGroupTotalElements(data.totalElements || 0);
      setGroupPage(page);
      setGroupPageSize(size);
    } catch (err) {
      console.error("Error fetching groups:", err);
      message.error("Could not load groups");
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users")
      fetchUsers(userPage, nameSearch, emailSearch, mobileSearch, userPageSize); // ⬅️ MODIFIED: Pass nameSearch
    else if (activeTab === "groups")
      fetchGroups(groupPage, groupSearchText, groupPageSize);
  }, [authToken, activeTab]);

  const handleViewUser = (record) => {
    const fullUser = users.find((u) => u.userId === record.key);
    if (fullUser) {
      navigate(`/admin/createnewuser`, { state: { user: fullUser } });
    } else {
      console.error("User not found for ID:", record.key);
    }
  };

  const handleViewGroup = (group) => {
    const fullGroup = groups.find((g) => g.id === group.key);
    if (fullGroup) {
      navigate(`/admin/createnewgroup`, { state: { group: fullGroup } });
    } else {
      console.error("Group not found for ID:", group.key);
    }
  };

  const handleGroupNameClick = (members) => {
    setSelectedGroupMembers(members);
    setShowMembersModal(true);
  };

  // Users Table Mapping
  const mappedUsers = users.map((u) => ({
    key: u.userId,
    name: u.userName,
    email: u.email,
    mobile: u.mobileNumber || "",
    groupsCount: u.groups?.length || 0,
    status: u.status,
  }));

  // **MODIFIED:** Added responsive property to columns
  const userColumns = [
    { title: "Username", dataIndex: "name", key: "name", responsive: ['sm'] },
    { title: "Email ID", dataIndex: "email", key: "email" },
    // { title: "Mobile", dataIndex: "mobile", key: "mobile", responsive: ['md'] },
    {
      title: "Groups Count",
      dataIndex: "groupsCount",
      key: "groupsCount",
      render: (count) => <Tag color="blue">{count}</Tag>, // ✅ display count in a tag
      responsive: ["md"],
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
      responsive: ["md"],
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          className="um-view-btn"
          icon={<EyeOutlined />}
          onClick={() => handleViewUser(record)}
        >
          View
        </Button>
      ),
    },
  ];

  // Groups Table Mapping
  const mappedGroups = groups.map((g) => ({
    key: g.id,
    groupName: g.groupName,
    members: g.user || [],
    membersCount: g.user?.length || 0,
    status: g.status,
  }));

  // **MODIFIED:** Added responsive property to columns
  const groupColumns = [
    {
      title: "Group Name",
      dataIndex: "groupName",
      key: "groupName",
      render: (text, record) => (
        <div
          className="um-group-name um-clickable"
          onClick={() => handleGroupNameClick(record.members)}
        >
          {text}
        </div>
      ),
    },
    {
      title: "Members Count",
      dataIndex: "membersCount",
      key: "membersCount",
      render: (count) => <Tag color="blue">{count}</Tag>,
      responsive: ['md']
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
      responsive: ['md']
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          className="um-view-btn"
          icon={<EyeOutlined />}
          onClick={() => handleViewGroup(record)}
        >
          View
        </Button>
      ),
    },
  ];

  const membersColumns = [
    { title: "User Name", dataIndex: "userName", key: "userName" },
    { title: "Email", dataIndex: "email", key: "email" },
  ];

  const handleUserSearch = () =>
    fetchUsers(1, nameSearch, emailSearch, mobileSearch, userPageSize); // ⬅️ MODIFIED: Pass nameSearch
  const handleUserClear = () => {
    setNameSearch(""); // ⬅️ NEW: Clear name search state
    setEmailSearch("");
    setMobileSearch("");
    fetchUsers(1, "", "", "", userPageSize); // ⬅️ MODIFIED: Pass empty string for name
  };

  const handleGroupSearch = () => fetchGroups(1, groupSearchText, groupPageSize);
  const handleGroupClear = () => {
    setGroupSearchText("");
    fetchGroups(1, "", groupPageSize);
  };

  const renderAddButton = () => {
    if (activeTab === "users") {
      return (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="um-add-btn"
          onClick={() => navigate("/admin/createnewuser")}
        >
          Add New User
        </Button>
      );
    } else if (activeTab === "groups") {
      return (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="um-add-btn"
          onClick={() => navigate("/admin/createnewgroup")}
        >
          Add New Group
        </Button>
      );
    }
    return null;
  };

  const tabItems = [
    {
      key: "users",
      label: "Users",
      children: (
        <>
          <div className="um-filters-container">
            <Input
              placeholder="Username..." // ⬅️ NEW: Name search input
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="um-search-input"
            />
            <Input
              placeholder="Email ID..."
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              className="um-search-input"
            />
            {/* <Input
              placeholder="Mobile Number..."
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              className="um-search-input"
            /> */}
            <div className="um-filters-right">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleUserSearch}
                loading={loadingUsers}
              >
                Search
              </Button>
              <Button
                className="um-clear-btn"
                icon={<CloseCircleOutlined />}
                onClick={handleUserClear}
                disabled={loadingUsers}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="um-table-container-responsive">
            <Table
              dataSource={mappedUsers}
              columns={userColumns}
              rowKey="key"
              loading={loadingUsers}
              pagination={{
                current: userPage,
                total: userTotalElements,
                pageSize: userPageSize,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                onChange: (page, size) =>
                  fetchUsers(page, nameSearch, emailSearch, mobileSearch, size), // ⬅️ MODIFIED: Pass nameSearch
                onShowSizeChange: (current, size) =>
                  fetchUsers(1, nameSearch, emailSearch, mobileSearch, size), // ⬅️ MODIFIED: Pass nameSearch
              }}
              className="um-users-table"
            />
          </div>
        </>
      ),
    },
    {
      key: "groups",
      label: "Groups",
      children: (
        <>
          <div className="um-filters-container">
            <Input
              placeholder="Search groups..."
              value={groupSearchText}
              onChange={(e) => setGroupSearchText(e.target.value)}
              className="um-search-input"
            />
            <div className="um-filters-right">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleGroupSearch}
                loading={loadingGroups}
              >
                Search
              </Button>
              <Button
                className="um-clear-btn"
                icon={<CloseCircleOutlined />}
                onClick={handleGroupClear}
                disabled={loadingGroups}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="um-table-container-responsive">
            <Table
              dataSource={mappedGroups}
              columns={groupColumns}
              rowKey="key"
              loading={loadingGroups}
              pagination={{
                current: groupPage,
                total: groupTotalElements,
                pageSize: groupPageSize,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                onChange: (page, size) => fetchGroups(page, groupSearchText, size),
                onShowSizeChange: (current, size) =>
                  fetchGroups(1, groupSearchText, size),
              }}
              className="um-users-table"
            />
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="um-users-access-container">
      <div className="um-page-header">
        <div className="um-header-content">
          <Title className="um-page-title" level={2}>
            Users & Groups Management
          </Title>
          <p className="um-page-subtitle">
            View, create, and manage users or groups
          </p>
        </div>
        {renderAddButton()}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="um-access-tabs"
        items={tabItems}
      />

      <Modal
        title="Group Members"
        open={showMembersModal}
        onCancel={() => setShowMembersModal(false)}
        footer={null}
      >
        <Table
          dataSource={selectedGroupMembers}
          columns={membersColumns}
          pagination={false}
          locale={{ emptyText: "No members in this group" }}
        />
      </Modal>
    </div>
  );
};

export default UserManagement;