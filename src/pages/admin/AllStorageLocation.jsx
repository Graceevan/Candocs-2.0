import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Input,
  Select,
  Button,
  Typography,
  message,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "../../styles/AllStorageLocation.css";
import api from "../../api/axiosInstance";

const { Option } = Select;
const { Title, Paragraph } = Typography;

const AllStorageLocation = () => {
  const [storageName, setStorageName] = useState("");
  const [storageType, setStorageType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "50", "100"],
  });

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const authToken = user?.authToken || localStorage.getItem("authToken");

  // 🔹 Fetch Data
  const fetchData = async (page = 1, pageSize = 10, clearMode = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page - 1,
        size: pageSize,
      });

      if (!clearMode) {
        if (storageName) params.append("storageAreaId", storageName);
        if (storageType !== "all") params.append("storageType", storageType);
      }

      const response = await api.post(
        `/candocspro/get_storage_locations?${params.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const content = response.data?.content || [];
      const totalElements = response.data?.totalElements || 0;

      setData(content);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: totalElements,
      }));
    } catch (error) {
      console.error("Failed to fetch storage locations:", error);
      message.error("Failed to load storage locations. Please try again later.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Only initial page load
  useEffect(() => {
    fetchData(1, pagination.pageSize, true);
  }, []);

  //🔹Handle pagination
  const handleTableChange = (newPagination) => {
    fetchData(newPagination.current, newPagination.pageSize);
  };

  //🔹Search Button
  const handleSearch = () => {
    fetchData(1, pagination.pageSize);
  };

  //🔹Clear Filters
  const handleClearFilters = () => {
    setStorageName("");
    setStorageType("all");
    fetchData(1, pagination.pageSize, true);
  };

  //🔹View Button
  const handleViewClick = (record) => {
    let normalizedRecord = { ...record };

    // Normalize S3 case
    if (
      normalizedRecord.storageAreaId.startsWith("S3_") &&
      normalizedRecord.storageType === "FS"
    ) {
      normalizedRecord.storageType = "S3";
    }

    switch (normalizedRecord.storageType) {
      case "S3":
        navigate("/admin/aws", { state: { storage: normalizedRecord } });
        break;
      case "AZURE":
        navigate("/admin/azure", { state: { storage: normalizedRecord } });
        break;
      case "FS":
        navigate("/admin/filemanager", { state: { storage: normalizedRecord } });
        break;
      default:
        navigate(`/admin/storage/${normalizedRecord.id}`, {
          state: { storage: normalizedRecord },
        });
        break;
    }
  };

  const getStorageTypeName = (storageType) => {
    switch (storageType) {
      case "DB":
        return "Database";
      case "FS":
        return "File System";
      case "AZURE":
        return "Azure Blob";
      case "S3":
        return "Aws S3";
      default:
        return "Unknown";
    }
  };

  const getStorageTypeColor = (storageType) => {
    switch (storageType) {
      case "DB":
        return "purple";
      case "FS":
        return "blue";
      case "AZURE":
        return "cyan";
      case "S3":
        return "orange";
      default:
        return "gray";
    }
  };

  const columns = [
    {
      title: "Storage Name",
      dataIndex: "storageAreaId",
      key: "storageAreaId",
      render: (text) => <span className="storage-name">{text}</span>,
    },
    {
      title: "Storage Type",
      dataIndex: "storageType",
      key: "storageType",
      render: (text) => (
        <div className="storage-type">
          <span
            className="storage-type-indicator"
            style={{ backgroundColor: getStorageTypeColor(text) }}
          ></span>
          {getStorageTypeName(text)}
        </div>
      ),
        // Hide this column on screens smaller than md (768px)
    // responsive: ['md'],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={status === "ACTIVE" ? "green" : "red"}
          className="storage-status-tag"
        >
          {status?.toUpperCase()}
        </Tag>
      ),
        // Hide this column on screens smaller than md (768px)
    responsive: ['md'],
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          className="storage-view-btn"
          onClick={() => handleViewClick(record)}
          disabled={record.storageType === "DB"} // ✅ Disable for Database type
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="storage-management-container">
      <div className="storage-management-header">
        <div className="storage-header-content">
          <Title className="storage-page-title" level={2}>
            All Storage Managements
          </Title>
          <Paragraph className="storage-page-subtitle">
            Search and view all storage systems
          </Paragraph>
        </div>

        {/*🔹Add New Button */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="storage-add-btn"
          onClick={() => navigate("/admin/addnew")}
        >
          Add New Storage
        </Button>
      </div>

      {/*🔹Filters */}
      <div className="storage-filters-container">
        <div className="storage-filters-left">
          <Input
            placeholder="Enter storage name..."
            className="storage-search-input"
            value={storageName}
            onChange={(e) => setStorageName(e.target.value)}
          />
          <Select
            value={storageType}
            className="storage-filter-select"
            onChange={setStorageType}
          >
            <Option value="all">All Storage Types</Option>
            <Option value="FS">File System</Option>
            <Option value="AZURE">Azure Blob</Option>
            <Option value="S3">AWS S3</Option>
            <Option value="DB">Database</Option>
          </Select>
        </div>

        <div className="storage-filters-right">
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={handleSearch}
            className="storage-search-btn"
          >
            Search
          </Button>

          <Button
            className="storage-clear-btn"
            icon={<CloseCircleOutlined />}
            onClick={handleClearFilters}
            disabled={loading}
          >
            Clear
          </Button>
        </div>
      </div>

      {/*🔹Table */}
      
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        className="storage-table"
      />

          {/* <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        showQuickJumper: false,
        showLessItems: true, // ✅ ensures fewer numbers with "..."
        itemRender: (page, type, originalElement) => {
          if (type === "prev") {
            return <a>&lt;</a>;
          }
          if (type === "next") {
            return <a>&gt;</a>;
          }
          return originalElement;
        },
      }}
      onChange={handleTableChange}
      className="storage-table"
    /> */}

    </div>
  );
};

export default AllStorageLocation;