import React, { useState } from "react";
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
  Modal,
} from "antd";
import {
  CloudOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import "../../styles/Azure.css";
import alertService from "../../services/alertService";

const { Title, Text, Paragraph } = Typography;

const AzureContent = () => {
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [connectionStatus, setConnectionStatus] = useState("not_tested");
  const [isTestSuccessful, setIsTestSuccessful] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const authToken = user?.authToken || localStorage.getItem("authToken");
  const createdUserId = user?.userId || localStorage.getItem("userId") || 1;
  const updatedUserId = createdUserId;

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      setConnectionStatus("testing");

      const payload = {
        accountName: values.accountName,
        accountKey: values.accountKey,
        container: values.container,
      };

      if (!authToken) {
        alertService.error("Authentication Error", "User is not logged in.");
        setConnectionStatus("failed");
        return;
      }

      const response = await fetch("/candocspro/test-connection?storageType=AZURE", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alertService.success("Success!", data.message || "Azure Blob Storage connection successful.");
        setConnectionStatus("success");
        setIsTestSuccessful(true);
      } else {
        alertService.error("Connection Failed", data.message || "Something went wrong.");
        setConnectionStatus("failed");
        setIsTestSuccessful(false);
      }
    } catch (error) {
      if (error.errorFields) {
        setConnectionStatus("not_tested");
        return;
      }
      alertService.error("Error", "Unable to connect to the server.");
      setConnectionStatus("failed");
      setIsTestSuccessful(false);
    }
  };

  const submitStorageDetails = async () => {
    try {
      const values = await modalForm.validateFields();
      const payload = {
        storageAreaId: values.storageAreaId,
        installationId: null,
        storageType: "AZURE",
        storageDetails: {
          accountName: form.getFieldValue("accountName"),
          accountKey: form.getFieldValue("accountKey"),
          container: form.getFieldValue("container"),
        },
        testStatus: "ACTIVE",
        createdUserId: parseInt(createdUserId),
        updatedUserId: parseInt(updatedUserId),
      };

      const response = await fetch("/candocspro/add-storage-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      if (response.ok) {
        alertService.success("Storage Added", "Azure storage has been added successfully.");
        form.resetFields();
        modalForm.resetFields();
        setConnectionStatus("not_tested");
        setIsTestSuccessful(false);
        setIsModalVisible(false); // Hide the modal after successful submission
      } else {
        alertService.error("Add Storage Failed", text);
      }
    } catch (error) {
      alertService.error("Error", "Failed to add storage.");
    }
  };

  const renderTestValidationContent = () => {
    switch (connectionStatus) {
      case "testing":
        return (
          <div className="test-validation-content-center">
            <Spin indicator={<CloudOutlined style={{ fontSize: 24, color: "#7c3aed" }} spin />} />
            <Paragraph className="testing-text">Testing connection...</Paragraph>
          </div>
        );
      case "success":
        return (
          <Result
            status="success"
            icon={<CheckCircleOutlined className="result-icon success-icon" />}
            title={<Title level={5}>Connection Successful! 🎉</Title>}
            subTitle={<Paragraph>Your Azure credentials are valid.</Paragraph>}
            className="no-padding-result"
          />
        );
      case "failed":
        return (
          <Result
            status="error"
            icon={<CloseCircleOutlined className="result-icon error-icon" />}
            title={<Title level={5}>Connection Failed! 😟</Title>}
            subTitle={<Paragraph>Invalid credentials. Please recheck your inputs.</Paragraph>}
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
    <div className="azure-config-page">
      <Title level={2} className="page-title">Configure Azure Storage</Title>
      <Text className="page-subtitle">Enter your Azure storage details to connect</Text>

      <Row gutter={24} className="config-row">
        <Col span={14}>
          <Card title="Connection Details" className="config-card">
            <Form form={form} layout="vertical">
              <Form.Item
                label="Storage Account Name"
                name="accountName"
                rules={[{ required: true, message: "Please enter the account name" }]}
              >
                <Input placeholder="Enter the account name" prefix={<CloudOutlined />} />
              </Form.Item>
              <Form.Item
                label="Container Name"
                name="container"
                rules={[{ required: true, message: "Please enter the container name" }]}
              >
                <Input placeholder="Enter the container name" />
              </Form.Item>
              <Form.Item
                label="Account Key"
                name="accountKey"
                rules={[{ required: true, message: "Please enter the account key" }]}
              >
                <Input.Password placeholder="Enter the account key" iconRender={visible => (visible ? <UnlockOutlined /> : <UnlockOutlined />)} />
              </Form.Item>
              <Form.Item className="form-buttons">
                <Button
                  type="default"
                  className="test-button"
                  onClick={handleTestConnection}
                  loading={connectionStatus === "testing"}
                >
                  Test Connection
                </Button>
                <Button
                  type="primary"
                  className="save-button"
                  onClick={() => setIsModalVisible(true)}
                  disabled={!isTestSuccessful}
                >
                  Add Storage
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={10}>
          <Card title="Test & Validation" className="config-card test-validation-card">
            {renderTestValidationContent()}
          </Card>
        </Col>
      </Row>

      <Modal
        title="Enter Storage Area Name"
        open={isModalVisible}
        onOk={submitStorageDetails}
        onCancel={() => setIsModalVisible(false)}
        okText="Add Storage"
        cancelText="Cancel"
      >
        <Form form={modalForm} layout="vertical">
          <Form.Item
            label="Storage Area Name"
            name="storageAreaId"
            rules={[{ required: true, message: "Please enter a storage area name" }]}
          >
            <Input placeholder="e.g., AZURE_PUNE" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AzureContent;