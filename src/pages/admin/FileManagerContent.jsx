import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Typography,
  Spin,
  Result,
  Tag,
  Switch,
  Progress,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import "../../styles/FileManager.css";
import alertService from "../../services/alertService";
import api from "../../api/axiosInstance";
import { useLocation, useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const FileManagerContent = () => {
  const [form] = Form.useForm();
  const [connectionStatus, setConnectionStatus] = useState("not_tested");
  const [isTestSuccessful, setIsTestSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storageAreaId, setStorageAreaId] = useState("");
  const [storageStatus, setStorageStatus] = useState("ACTIVE");
  const [isSwitchEditable, setIsSwitchEditable] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const authToken = user?.authToken || localStorage.getItem("authToken");
  const createdUserId = user?.userId || 0;
  const updatedUserId = user?.userId || 0;

  const location = useLocation();
  const navigate = useNavigate();
  const editStorage = location.state?.storage || null;
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFormEditable, setIsFormEditable] = useState(false);

  useEffect(() => {
    if (editStorage) {
      form.setFieldsValue({
        path: editStorage.storageDetails?.path || "",
      });
      setStorageAreaId(editStorage.storageAreaId || "");
      setStorageStatus(editStorage.status || "ACTIVE");
      setIsEditMode(true);
      setIsFormEditable(false);
      setIsSwitchEditable(false);
      setIsTestSuccessful(false);
      setConnectionStatus("not_tested");
    }
  }, [editStorage, form]);

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields(["path"]);
      setConnectionStatus("testing");

      if (!authToken) {
        alertService.error("Authentication Error", "User is not logged in.");
        setConnectionStatus("failed");
        return;
      }

      setLoading(true);

      const { data, status } = await api.post(
        "candocspro/test-connection?storageType=FS",
        { path: values.path },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (status === 200 && data.success) {
        setConnectionStatus("success");
        setIsTestSuccessful(true);
      } else {
        alertService.error(
          "Connection Failed",
          data.message || "Something went wrong."
        );
        setConnectionStatus("failed");
        setIsTestSuccessful(false);
      }
    } catch (error) {
      if (error.errorFields) {
        setConnectionStatus("not_tested");
        return;
      }
      alertService.error(
        "Error",
        error.response?.data?.message || "Unable to connect to the server."
      );
      setConnectionStatus("failed");
      setIsTestSuccessful(false);
    } finally {
      setLoading(false);
    }
  };

  const submitStorageDetails = async () => {
    try {
      if (!storageAreaId.trim()) {
        alertService.error("Missing Field", "Please enter a Storage Area Name.");
        return;
      }

      const payload = {
        storageAreaId,
        installationId: null,
        storageType: "FS",
        storageDetails: {
          path: form.getFieldValue("path"),
        },
        status: storageStatus,
        testStatus: "ACTIVE",
        createdUserId,
        updatedUserId,
      };

      const { data, status } = await api.post("candocspro/add-storage-location", payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (status === 200) {
        alertService.success(
          "Storage Added",
          "File storage has been added successfully."
        );
        form.resetFields();
        setStorageAreaId("");
        setConnectionStatus("not_tested");
        setIsTestSuccessful(false);

        setTimeout(() => navigate("/admin/all-locations"), 1500);
      } else {
        alertService.error(
          "Add Storage Failed",
          data?.message || "Something went wrong."
        );
      }
    } catch (error) {
      alertService.error(
        "Error",
        error.response?.data?.message || "Failed to add storage."
      );
    }
  };

  const submitEditStorageDetails = async () => {
    try {
      const payload = {
        storageAreaId,
        storageType: "FS",
        storageDetails: {
          path: form.getFieldValue("path"),
        },
        status: storageStatus,
        testStatus: "ACTIVE",
        updatedUserId,
      };

      const { data, status } = await api.post(
        `candocspro/update-storage-location/${editStorage.id}`,
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (status === 200) {
        alertService.success("Updated!", "File storage updated successfully.");
        setIsFormEditable(false);
        setIsSwitchEditable(false);
        setIsTestSuccessful(false);
        setTimeout(() => navigate("/admin/all-locations"), 1500);
      } else {
        alertService.error(
          "Update Failed",
          data?.message || "Something went wrong."
        );
      }
    } catch (error) {
      alertService.error(
        "Error",
        error.response?.data?.message || "Failed to update storage."
      );
    }
  };

  const renderTestValidationContent = () => {
    switch (connectionStatus) {
      case "testing":
        return (
          <div className="test-validation-content-loading">
            <Spin />
            <div className="loading-text">
              <Paragraph>Testing connection...</Paragraph>
              <Progress percent={70} showInfo={false} />
            </div>
          </div>
        );
      case "success":
        return (
          <div className="test-validation-content-success">
            <CheckCircleOutlined className="result-icon success-icon" />
            <div className="success-text">
              <Title level={5}>Connection Successful!</Title>
            </div>
          </div>
        );
      case "failed":
        return (
          <Result
            status="error"
            icon={<CloseCircleOutlined className="result-icon error-icon" />}
            title={<Title level={5}>Connection Failed!</Title>}
            subTitle={
              <Paragraph>Invalid path. Please recheck your input.</Paragraph>
            }
            className="no-padding-result"
          />
        );
      default:
        return (
          <div className="test-validation-placeholder">
            <InfoCircleOutlined className="info-icon" />
            <Paragraph>Click "Test Connection" to validate.</Paragraph>
          </div>
        );
    }
  };

  return (
    <div className="fs-config-page">
<div className="page-header">
  <Title level={2} className="page-title">
    Configure File Manager Storage
  </Title>

  <div style={{ display: "flex", gap: "12px" }}>
    {/* Back Button for Add New Mode */}
    {!isEditMode && (
      <Button
        className="back-button"
         icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/admin/addnew")}
      >
        Back
      </Button>
    )}

    {/* Back Button for Edit Mode */}
    {isEditMode && (
      <>
    

        <Button
          type={isFormEditable ? "default" : "primary"}
          icon={<EditOutlined />}
          className={isFormEditable ? "cancel-edit-button" : "edit-button"}
          onClick={() => {
            const cancelEdit = isFormEditable;
            setIsFormEditable(!isFormEditable);
            setIsSwitchEditable(!isSwitchEditable);
            setIsTestSuccessful(false);
            setConnectionStatus("not_tested");

            if (cancelEdit && editStorage) {
              setStorageStatus(editStorage.status || "ACTIVE");
            }
          }}
        >
          {isFormEditable ? "Cancel Edit" : "Edit"}
        </Button>

            <Button
          className="back-button"
           icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/all-locations")}
        >
          Back
        </Button>
      </>
    )}
  </div>
</div>


      {isEditMode && (
        <Tag
          color={storageStatus === "ACTIVE" ? "green" : "red"}
          style={{ marginBottom: 16, fontSize: 14 }}
        >
          Status: {storageStatus}
        </Tag>
      )}

      {isEditMode && isSwitchEditable && (
        <div style={{ marginBottom: 24 }}>
          <Text>Change Status: </Text>
          <Switch
            checked={storageStatus === "ACTIVE"}
            onChange={(checked) =>
              setStorageStatus(checked ? "ACTIVE" : "DEACTIVE")
            }
            checkedChildren="ACTIVE"
            unCheckedChildren="DEACTIVE"
          />
        </div>
      )}

      <Text className="page-subtitle">
        Enter the file system path and details to connect
      </Text>

      

      <Row gutter={24} className="config-row">
        <Col span={14}>
          <Card title="Connection Details" className="config-card">
            <Form form={form} layout="vertical">
              <Form.Item
                label="Path"
                name="path"
                rules={[{ required: true, message: "Please enter the path" }]}
              >
                <Input.TextArea
                  placeholder="Enter file system path"
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  disabled={isEditMode && !isFormEditable}
                />
              </Form.Item>

              {(isEditMode || isTestSuccessful) && (
                <Form.Item label="Storage Area Name" required>
                  <Input
                    value={storageAreaId}
                    onChange={(e) => setStorageAreaId(e.target.value)}
                    placeholder="Enter Storage Area Name"
                    disabled={isEditMode && !isFormEditable}
                  />
                </Form.Item>
              )}

              <div className="form-buttons">
                <Button
                  type="default"
                  className="test-button"
                  onClick={handleTestConnection}
                  loading={loading}
                  disabled={isEditMode && !isFormEditable}
                >
                  Test Connection
                </Button>

                {isEditMode ? (
                  <Button
                    type="primary"
                    className="save-button"
                    onClick={submitEditStorageDetails}
                    disabled={!isTestSuccessful || !isFormEditable}
                  >
                    Save
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    className="save-button"
                    onClick={submitStorageDetails}
                    disabled={!isTestSuccessful || !storageAreaId.trim()}
                  >
                    Add Storage
                  </Button>
                )}
              </div>
            </Form>
          </Card>
        </Col>

        <Col span={10}>
          <Card
            title="Test & Validation"
            className="config-card test-validation-card"
          >
            {renderTestValidationContent()}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FileManagerContent;