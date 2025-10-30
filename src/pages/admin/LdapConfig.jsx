import React, { useState, useEffect } from "react";
import { Eye, Plus, Search, XCircle } from "lucide-react";
import { Input, Button, Table, Typography, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import alertService from "../../services/alertService";
import api from "../../api/axiosInstance";
import "../../styles/LdapConfig.css";

const EldapConfig = () => {
  const navigate = useNavigate();
  const authToken =
    useSelector((state) => state.auth.user?.authToken) ||
    localStorage.getItem("authToken");

  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ldapNameSearch, setLdapNameSearch] = useState("");
  const [usernameSearch, setUsernameSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const { Title, Paragraph } = Typography;

  const fetchConfigs = async (
    currentPage = page,
    ldapName = ldapNameSearch,
    username = usernameSearch,
    currentSize = pageSize
  ) => {
    if (!authToken) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage - 1,
        size: currentSize,
      });

      if (ldapName) queryParams.append("ldapName", ldapName);
      if (username) queryParams.append("username", username);

      const { data } = await api.post(`/candocspro/get-ldap?${queryParams.toString()}`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setConfigs(Array.isArray(data.content) ? data.content : []);
      setTotalElements(data.totalElements || 0);
      setPage(currentPage);
      setPageSize(currentSize);
    } catch (err) {
      console.error("Error fetching configs:", err);
      if (err.response && err.response.status === 404) {
        setConfigs([]);
        setTotalElements(0);
        alertService.info(
          "Info",
          "No LDAP configurations found matching the search criteria."
        );
      } else {
        alertService.error("Error", "Could not load LDAP configs");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs(1);
  }, [authToken]);

  const handleSearch = () => fetchConfigs(1);
  const handleClear = () => {
    setLdapNameSearch("");
    setUsernameSearch("");
    fetchConfigs(1, "", "", pageSize);
  };

  const handleViewClick = (record) => {
    const fullConfig = configs.find((c) => c.id === record.id);
    if (fullConfig) {
      navigate("/admin/createldap", { state: { ldapConfig: fullConfig } });
    } else {
      console.error("LDAP config not found for ID:", record.id);
    }
  };

  const handleAddNew = () => {
    navigate("/admin/createldap", { state: { ldapConfig: null } });
  };

  const columns = [
    { title: "LDAP Name", dataIndex: "ldapName", key: "ldapName" },
    { title: "Username", dataIndex: "username", key: "username", responsive: ['md'] }, // Added responsive property
    { title: "URL", dataIndex: "url", key: "url", responsive: ['lg'] }, // Added responsive property
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
          className="eldap-view-btn"
          icon={<Eye size={14} />}
          onClick={() => handleViewClick(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="eldap-container">
      <div className="eldap-page-header">
        <div className="eldap-header-content">
          <Title className="eldap-page-title" level={2}>
            LDAP Configurations
          </Title>
          <Paragraph className="eldap-page-subtitle">
            Search, view, and manage LDAP configurations
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<Plus size={17} />}
          className="eldap-add-btn"
          onClick={handleAddNew}
        >
          Add New LDAP
        </Button>
      </div>

      <div className="eldap-filters-container">
        <div className="eldap-filters-left">
          <Input
            placeholder="LDAP Name..."
            value={ldapNameSearch}
            onChange={(e) => setLdapNameSearch(e.target.value)}
            className="eldap-search-input"
            onPressEnter={handleSearch}
          />
          <Input
            placeholder="Username..."
            value={usernameSearch}
            onChange={(e) => setUsernameSearch(e.target.value)}
            className="eldap-search-input"
            onPressEnter={handleSearch}
          />
        </div>
        <div className="eldap-filters-right">
          <Button
            type="primary"
            icon={<Search size={14} />}
            onClick={handleSearch}
            loading={loading}
          >
            Search
          </Button>
          <Button
            className="eldap-clear-btn"
            icon={<XCircle size={14} />}
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* NEW: Wrapper div for horizontal scrolling */}
      <div className="eldap-table-responsive"> 
        <Table
          dataSource={configs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total: totalElements,
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (newPage, newSize) => {
              setPageSize(newSize);
              fetchConfigs(newPage, ldapNameSearch, usernameSearch, newSize);
            },
          }}
          className="eldap-table"
          locale={{
            emptyText:
              totalElements === 0 && !loading
                ? "No LDAP configurations found."
                : "No Data",
          }}
        />
      </div>
    </div>
  );
};

export default EldapConfig;