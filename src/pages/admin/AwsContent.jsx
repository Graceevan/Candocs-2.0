import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
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
  Switch,
  Progress,
  Tag,
} from "antd";
import {
  CloudOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  UnlockOutlined,
  EditOutlined,
} from "@ant-design/icons";
import "../../styles/Aws.css";
import alertService from "../../services/alertService";
import api from "../../api/axiosInstance";
import { useLocation, useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const AwsContent = () => {
  const [form] = Form.useForm();
  const [connectionStatus, setConnectionStatus] = useState("not_tested");
  const [isTestSuccessful, setIsTestSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storageAreaId, setStorageAreaId] = useState("");
  const [storageStatus, setStorageStatus] = useState("ACTIVE");
  const [isSwitchEditable, setIsSwitchEditable] = useState(false);
  const [showStorageNameInput, setShowStorageNameInput] = useState(false);

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
        accessKey: editStorage.storageDetails?.accessKey || "",
        secretKey: editStorage.storageDetails?.secretKey || "",
        bucket: editStorage.storageDetails?.bucket || "",
        path: editStorage.storageDetails?.path || "NA",
      });
      setStorageAreaId(editStorage.storageAreaId || "");
      setStorageStatus(editStorage?.status || "ACTIVE");
      setIsEditMode(true);
      setIsFormEditable(false);
      setIsSwitchEditable(false);
      setIsTestSuccessful(false);
      setConnectionStatus("not_tested");
    }
  }, [editStorage, form]);

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      setConnectionStatus("testing");

      const payload = {
        accessKey: values.accessKey,
        secretKey: values.secretKey,
        path: values.path,
        bucket: values.bucket,
      };

      if (!authToken) {
        alertService.error("Authentication Error", "User is not logged in.");
        setConnectionStatus("failed");
        return;
      }

      setLoading(true);

      const { data, status } = await api.post(
        "candocspro/test-connection?storageType=S3",
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (status === 200 && data.success) {
        setConnectionStatus("success");
        setIsTestSuccessful(true);
        setShowStorageNameInput(true);
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
    if (!storageAreaId.trim()) {
      alertService.error("Missing Field", "Please enter a Storage Area Name.");
      return;
    }

    const payload = {
      storageAreaId,
      installationId: null,
      storageType: "S3",
      storageDetails: {
        accessKey: form.getFieldValue("accessKey"),
        secretKey: form.getFieldValue("secretKey"),
        bucket: form.getFieldValue("bucket"),
        path: form.getFieldValue("path"),
      },
      status: storageStatus,
      testStatus: "ACTIVE",
      createdUserId,
      updatedUserId,
    };

    try {
      const { data, status } = await api.post("candocspro/add-storage-location", payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (status === 200) {
        alertService.success(
          "Storage Added",
          "AWS S3 storage has been added successfully."
        );

        form.resetFields();
        setStorageAreaId("");
        setConnectionStatus("not_tested");
        setIsTestSuccessful(false);
        setShowStorageNameInput(false);

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
    const payload = {
      storageAreaId,
      storageType: "S3",
      storageDetails: {
        accessKey: form.getFieldValue("accessKey"),
        secretKey: form.getFieldValue("secretKey"),
        bucket: form.getFieldValue("bucket"),
        path: form.getFieldValue("path"),
      },
      testStatus: "ACTIVE",
      status: storageStatus,
      updatedUserId,
    };

    try {
      const { data, status } = await api.post(
        `candocspro/update-storage-location/${editStorage.id}`,
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (status === 200) {
        alertService.success("Updated!", "AWS S3 storage updated successfully.");
        setIsFormEditable(false);
        setIsSwitchEditable(false);
        setIsTestSuccessful(false);
        setTimeout(() => navigate("/admin/all-locations"), 1500);
      } else {
        alertService.error("Update Failed", data?.message || "Something went wrong.");
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
            <div className="loading-icon-wrapper">
              <Spin
                indicator={
                  <CloudOutlined style={{ fontSize: 48, color: "#6366f1" }} spin />
                }
              />
            </div>
            <Paragraph className="testing-text">Testing connection...</Paragraph>
            <Progress
              percent={70}
              showInfo={false}
              size="small"
              status="active"
              strokeColor="#6366f1"
              className="loading-bar"
            />
          </div>
        );
      case "success":
        return (
          <div className="test-validation-content-success">
            <CheckCircleOutlined className="result-icon success-icon" />
            <div className="success-text">
              <Title level={5}>Connection Successful!</Title>
              <Paragraph>Your AWS credentials are valid.</Paragraph>
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
              <Paragraph>Invalid credentials. Please recheck your inputs.</Paragraph>
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
    <div className="aws-config-page">
      <div className="page-header">
        <Title level={2} className="page-title">
          Configure AWS Storage
        </Title>

        {isEditMode && (
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
        )}
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
        Enter your AWS S3 storage details to connect
      </Text>

      <Row gutter={24} className="config-row">
        <Col span={14}>
          <Card title="Connection Details" className="config-card">
            <Form form={form} layout="vertical">
              <Form.Item
                label="Access Key"
                name="accessKey"
                rules={[{ required: true, message: "Please enter the access key" }]}
              >
                <Input
                  placeholder="Enter access key"
                  disabled={isEditMode && !isFormEditable}
                  prefix={<UnlockOutlined />}
                />
              </Form.Item>

              <Form.Item
                label="Secret Key"
                name="secretKey"
                rules={[{ required: true, message: "Please enter the secret key" }]}
              >
                <Input.Password
                  placeholder="Enter secret key"
                  disabled={isEditMode && !isFormEditable}
                />
              </Form.Item>

              <Form.Item
                label="Bucket"
                name="bucket"
                rules={[{ required: true, message: "Please enter the bucket name" }]}
              >
                <Input
                  placeholder="Enter bucket name"
                  disabled={isEditMode && !isFormEditable}
                />
              </Form.Item>

              <Form.Item
                label="Path"
                name="path"
                rules={[{ required: true, message: "Please enter the path" }]}
              >
                <Input
                  placeholder="Enter path"
                  disabled={isEditMode && !isFormEditable}
                />
              </Form.Item>

              {/* Storage Area Name */}
              {isEditMode ? (
                <Form.Item label="Storage Area Name" required>
                  <Input
                    value={storageAreaId}
                    onChange={(e) => setStorageAreaId(e.target.value)}
                    placeholder="Enter Storage Area Name"
                    disabled={!isFormEditable}
                  />
                </Form.Item>
              ) : (
                showStorageNameInput && (
                  <Form.Item label="Storage Area Name" required>
                    <Input
                      value={storageAreaId}
                      onChange={(e) => setStorageAreaId(e.target.value)}
                      placeholder="e.g., S3_PUNE"
                    />
                  </Form.Item>
                )
              )}

              <div className="form-buttons">
                <Button
                  type="default"
                  className="test-button"
                  onClick={handleTestConnection}
                  loading={loading}
                  disabled={isEditMode && !isFormEditable} // disable in view mode
                >
                  Test Connection
                </Button>

                {isEditMode ? (
                  <Button
                    type="primary"
                    className="save-button"
                    onClick={submitEditStorageDetails}
                    disabled={!isTestSuccessful || !isFormEditable} // save only after test success
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

export default AwsContent;