import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Layout,
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
  EditOutlined,
} from "@ant-design/icons";
import "../../styles/CreateLdap.css";
import alertService from "../../services/alertService";
import api from "../../api/axiosInstance";
import { useLocation, useNavigate } from "react-router-dom";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const LdapContent = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState("not_tested");
  const [isTestSuccessful, setIsTestSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ldapStatus, setLdapStatus] = useState("ACTIVE");
  const [isSwitchEditable, setIsSwitchEditable] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const authToken = user?.authToken || localStorage.getItem("authToken");
  const createdUserId = user?.userId || 0;
  const updatedUserId = user?.userId || 0;

  const location = useLocation();
  const editLdap = location.state?.ldapConfig || null;
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFormEditable, setIsFormEditable] = useState(false);

  useEffect(() => {
    if (editLdap) {
      console.log("editLdap",editLdap);
      form.setFieldsValue({
        ldapName: editLdap.ldapName || "",
        url: editLdap.url || "",
        baseDN: editLdap.baseDN || "",
        username: editLdap.username || "",
        password: editLdap.password || "",
      });
      setLdapStatus(editLdap.status || "ACTIVE");
      setIsEditMode(true);
      setIsFormEditable(false);
      setIsSwitchEditable(false);
      setIsTestSuccessful(false); // Force re-test before save in edit
    }
  }, [editLdap, form]);

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields([
        "url",
        "baseDN",
        "username",
        "password",
      ]);
      setConnectionStatus("testing");
      setLoading(true);

      const payload = {
        url: values.url,
        baseDN: values.baseDN,
        username: values.username,
        password: values.password,
      };

      const { data, status } = await api.post("/candocspro/test-ldap", payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

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

  const submitLdapDetails = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ldapName: values.ldapName,
        url: values.url,
        baseDN: values.baseDN,
        username: values.username,
        password: values.password,
        status: ldapStatus,
        createdUserId,
      };

      const { data, status } = await api.post("/candocspro/add-ldap", payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (status === 200 && data.success) {
        alertService.success(
          "LDAP Added",
          "LDAP configuration added successfully."
        );
        form.resetFields();
        setConnectionStatus("not_tested");
        setIsTestSuccessful(false);
        setTimeout(() => navigate("/admin/ldapconfig"), 1500);
      } else {
        alertService.error(
          "Add LDAP Failed",
          data?.message || "Something went wrong."
        );
      }
    } catch (error) {
      alertService.error(
        "Error",
        error.response?.data?.message || "Failed to add LDAP."
      );
    }
  };

  const submitEditLdapDetails = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ldapName: values.ldapName,
        url: values.url,
        baseDN: values.baseDN,
        username: values.username,
        password: values.password,
        status: ldapStatus,
        updatedUserId,
      };

      const { data, status } = await api.post(`/candocspro/update-ldap/${editLdap.id}`, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (status === 200) {
        alertService.success("Updated!", "LDAP updated successfully.");
        setIsFormEditable(false);
        setIsSwitchEditable(false);
        setIsTestSuccessful(false); // require test again if re-edited
        setTimeout(() => navigate("/admin/ldapconfig"), 1500);
      } else {
        alertService.error(
          "Update Failed",
          data?.message || "Something went wrong."
        );
      }
    } catch (error) {
      alertService.error(
        "Error",
        error.response?.data?.message || "Failed to update LDAP."
      );
    }
  };

  const renderTestValidationContent = () => {
    switch (connectionStatus) {
      case "testing":
        return (
          <div className="test-validation-loading">
            <Spin
              indicator={
                <CloudOutlined style={{ fontSize: 24, color: "#6366f1" }} spin />
              }
            />
            <Progress
              percent={70}
              showInfo={false}
              size="small"
              status="active"
              strokeColor="#6366f1"
            />
            <Paragraph className="testing-text">
              Testing connection...
            </Paragraph>
          </div>
        );
      case "success":
        return (
          <Result
            status="success"
            icon={
              <CheckCircleOutlined className="result-icon success-icon" />
            }
            title={<Title level={5}>Connection Successful!</Title>}
            subTitle={<Paragraph>Your LDAP credentials are valid.</Paragraph>}
          />
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
    <Layout className="ldap-config-layout">
      <Content className="main-content">
        <div className="page-header">
          <Title level={2} className="page-title">
            Configure LDAP
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
                setIsTestSuccessful(false); // force retest after edit
                if (cancelEdit && editLdap)
                  setLdapStatus(editLdap.status || "ACTIVE");
              }}
            >
              {isFormEditable ? "Cancel Edit" : "Edit"}
            </Button>
          )}
        </div>

        {isEditMode && (
          <Tag
            color={ldapStatus === "ACTIVE" ? "green" : "red"}
            style={{ marginBottom: 16, fontSize: 14 }}
          >
            Status: {ldapStatus}
          </Tag>
        )}

        {isEditMode && isSwitchEditable && (
          <div style={{ marginBottom: 24 }}>
            <Text>Change Status: </Text>
            <Switch
              checked={ldapStatus === "ACTIVE"}
              onChange={(checked) =>
                setLdapStatus(checked ? "ACTIVE" : "DEACTIVE")
              }
              checkedChildren="ACTIVE"
              unCheckedChildren="DEACTIVE"
            />
          </div>
        )}

        <Text className="page-subtitle">
          Enter your LDAP configuration details to connect
        </Text>

        <Row gutter={24} className="config-row">
          <Col span={14}>
            <Card title="LDAP Connection Details" className="config-card">
              <Form form={form} layout="vertical">
                <Form.Item
                  label="URL"
                  name="url"
                  rules={[{ required: true, message: "URL is required" }]}
                >
                  <Input
                    placeholder="ldap://hostname:port"
                    disabled={isEditMode && !isFormEditable}
                  />
                </Form.Item>

                <Form.Item
                  label="Base DN"
                  name="baseDN"
                  rules={[{ required: true, message: "Base DN is required" }]}
                >
                  <Input
                    placeholder="dc=example,dc=com"
                    disabled={isEditMode && !isFormEditable}
                  />
                </Form.Item>

                <Form.Item
                  label="Username"
                  name="username"
                  rules={[{ required: true, message: "Username is required" }]}
                >
                  <Input
                    placeholder="Enter username"
                    disabled={isEditMode && !isFormEditable}
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: "Password is required" }]}
                >
                  <Input.Password
                    placeholder="Enter password"
                    disabled={isEditMode && !isFormEditable}
                  />
                </Form.Item>

                {/* LDAP Name shown only after success or in edit */}
                {(isEditMode || isTestSuccessful) && (
                  <Form.Item
                    label="LDAP Name"
                    name="ldapName"
                    rules={[{ required: true, message: "LDAP Name is required" }]}
                  >
                    <Input
                      placeholder="e.g., ldap-3"
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
                    disabled={isEditMode && !isFormEditable} // disable test until Edit clicked
                  >
                    Test Connection
                  </Button>

                  {isEditMode ? (
                    <Button
                      type="primary"
                      className="save-button"
                      onClick={submitEditLdapDetails}
                      disabled={!isFormEditable || !isTestSuccessful}
                    >
                      Save
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      className="save-button"
                      onClick={submitLdapDetails}
                      disabled={!isTestSuccessful}
                    >
                      Add LDAP
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
      </Content>
    </Layout>
  );
};

export default LdapContent;
