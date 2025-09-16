import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Form,
  Input,
  Button,
  Table,
  Select,
  Checkbox,
  Divider,
  Typography,
  Switch,
  Row,
  Col,
  message,
  Tabs,
  Alert,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import alertService from "../../services/alertService";
import api from "../../api/axiosInstance";
import "../../styles/GenerateClass.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const GenerateClass = () => {
  const [activeTab, setActiveTab] = useState("basic");
  const [className, setClassName] = useState("");
  const [fields, setFields] = useState([
    { id: 1, name: "", type: "String", mandatory: false, defaultValue: "" },
  ]);
  const [securityGroups, setSecurityGroups] = useState([]);
  const [storage, setStorage] = useState({ systemType: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [securityGroupsFromApi, setSecurityGroupsFromApi] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [form] = Form.useForm();
  const authToken =
    useSelector((state) => state.auth.user?.authToken) ||
    localStorage.getItem("authToken");
    const [classOptions, setClassOptions] = useState([]);

  // Fetch groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await api.post(
          `/candocspro/group/all?page=0&size=9999`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setSecurityGroupsFromApi(data.content || []);
      } catch (error) {
        console.error("Error fetching groups:", error);
        alertService.error("Error", "Failed to fetch security groups.");
      }
    };

    if (authToken) {
      fetchGroups();
    }
  }, [authToken]);


  // Fetch class names from API
  const fetchClassNames = async () => {
    try {
      const { data } = await api.get("/candocspro/load-class");
      const filteredNames = data
        .map((item) => item.className.split(".").pop())
        .filter((name) => name !== "Structure");
      setClassOptions(filteredNames);
    } catch (err) {
      console.error("Error fetching class names:", err);
      alertService.error("Error", "Could not load class names");
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchClassNames();
    }
  }, [authToken]);


  // Fetch storage locations from API
  useEffect(() => {
    if (!authToken) return;

    const fetchStorageLocations = async () => {
      try {
        const { data } = await api.post(
          "/candocspro/get_all/storage_location",
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        // Map API data to the Ant Design Select component format
        const mappedLocations = (data || []).map(loc => ({
          value: loc.storageAreaId || loc.name || loc,
          label: loc.storageAreaId || loc.name || loc,
        }));
        setStorageLocations(mappedLocations);
      } catch (err) {
        console.error("Error fetching storage locations:", err);
        alertService.error("Error", "Could not load storage locations");
      }
    };

    fetchStorageLocations();
  }, [authToken]);

  // Validation function
  const validateValue = (type, value) => {
    if (!value || value.trim() === "") return true; // Empty value is handled by 'required'
    switch (type) {
      case "String":
        return /^[a-zA-Z0-9 ]+$/.test(value);
      case "Integer":
      case "Long":
        return /^-?\d+$/.test(value);
      case "Double":
        return /^-?\d+(\.\d+)?$/.test(value);
      case "Boolean":
        return ["true", "false"].includes(value.trim().toLowerCase());
      case "LocalDate":
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      case "LocalDateTime":
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value);
      default:
        return true;
    }
  };

  const fieldTypes = [
    'String', 'Integer', 'Long', 'Double', 'Boolean', 'LocalDate', 'LocalDateTime'
  ];

  const addField = () => {
    setFields([...fields, {
      id: fields.length + 1,
      name: "",
      type: "String",
      mandatory: false,
      defaultValue: "",
    }]);
  };

  const removeField = (id) => {
    if (fields.length > 1) {
      setFields(fields.filter((field) => field.id !== id));
    }
  };

  const updateField = (id, property, value) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, [property]: value } : field
      )
    );
  };

  const addSecurityRule = () => {
    setSecurityGroups([
      ...securityGroups,
      { id: securityGroups.length + 1, groupId: "", read: false, modify: false, delete: false, upload: false },
    ]);
  };

  const removeSecurityRule = (id) => {
    if (securityGroups.length > 1) {
      setSecurityGroups(securityGroups.filter((rule) => rule.id !== id));
    }
  };

  const updateSecurityRule = (id, property, value) => {
    setSecurityGroups(
      securityGroups.map((rule) =>
        rule.id === id ? { ...rule, [property]: value } : rule
      )
    );
  };

  const hasPermission = (rule) => {
    return rule.read || rule.modify || rule.delete || rule.upload;
  };
  
  const validateAndSubmit = async () => {
    try {
      // Validate all forms at once
      await form.validateFields();
      
      const hasValidSecurity = securityGroups.length > 0 &&
        securityGroups.some(rule => rule.groupId && hasPermission(rule));
        
      if (!hasValidSecurity) {
        message.error('At least one security group with permissions is required.');
        setActiveTab('security');
        return;
      }

      // Check for valid field data
      const hasValidFields = fields.length > 0 &&
        fields.every(field => field.name.trim() !== '' && validateValue(field.type, field.defaultValue));

      if (!hasValidFields) {
        message.error('Please ensure all fields have a name and valid default value.');
        setActiveTab('basic');
        return;
      }

      const fieldArray = fields
        .filter((f) => f.name && f.type)
        .map((f) => {
          let parsedDefault = f.defaultValue;

          if (f.defaultValue && f.defaultValue.trim() !== "") {
            switch (f.type) {
              case "Integer":
              case "Long":
                parsedDefault = Number(f.defaultValue);
                break;
              case "Double":
                parsedDefault = parseFloat(f.defaultValue);
                break;
              case "Boolean":
                parsedDefault = f.defaultValue.toLowerCase() === "true";
                break;
              default:
                parsedDefault = f.defaultValue;
            }
          }

          return {
            name: f.name,
            type: f.type,
            mandatory: f.mandatory || false,
            ...(parsedDefault !== undefined && parsedDefault !== ""
              ? { defaultValue: parsedDefault }
              : {}),
          };
        });

      const payload = {
        className,
        fields: fieldArray,
        securityPolicy: {
          groupAccess: securityGroups
            .filter((g) => g.groupId)
            .map((g) => ({
              groupId: Number(g.groupId),
              readAccess: g.read,
              modifyAccess: g.modify,
              deleteAccess: g.delete,
              uploadAccess: g.upload,
            })),
        },
        storagePolicy: {
          storageLocation: storage.location,
        },
      };

      setLoading(true);
      console.log("✅ Payload being sent:", JSON.stringify(payload, null, 2));

      const { data } = await api.post("/candocspro/generate-class", payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      alertService.success("Success", data.message || "Jar Created Successfully");
      setClassName("");
      setFields([{ id: 1, name: "", type: "String", mandatory: false, defaultValue: "" }]);
      setSecurityGroups([]);
      setStorage({ systemType: "", location: "" });
      setActiveTab('basic');
      form.resetFields();
      await fetchClassNames();
    } catch (error) {
      if (error.response) {
        const message = error.response.data?.message || "Generation failed.";
        alertService.error("Error", message);
      } else {
        console.log("Validation Failed:", error);
        message.error('Please fix the validation errors before submitting.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldTableColumns = [
    {
      title: "Field Name",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <Form.Item
          validateStatus={value ? "success" : "error"}
          style={{ margin: 0 }}
        >
          <Input
            value={value}
            onChange={(e) => updateField(record.id, "name", e.target.value)}
            placeholder="Field name"
          />
        </Form.Item>
      ),
    },
    {
      title: "Select Type",
      dataIndex: "type",
      key: "type",
      width: "150px",
      render: (value, record) => (
        <Select
          value={value}
          onChange={(val) => updateField(record.id, "type", val)}
          style={{ width: "100%" }}
        >
          {fieldTypes.map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Mandatory",
      dataIndex: "mandatory",
      key: "mandatory",
      width: "100px",
      align: "center",
      render: (value, record) => (
        <Checkbox
          checked={value}
          onChange={(e) => updateField(record.id, "mandatory", e.target.checked)}
        />
      ),
    },
    {
      title: "Default value",
      dataIndex: "defaultValue",
      key: "defaultValue",
      render: (value, record) => (
        <Input
          value={value}
          onChange={(e) => updateField(record.id, "defaultValue", e.target.value)}
          placeholder="Default value"
        />
      ),
    },
    {
      key: "actions",
      width: "60px",
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeField(record.id)}
          disabled={fields.length === 1}
        />
      ),
    },
  ];

  const securityTableColumns = [
    {
      title: "Group",
      dataIndex: "groupId",
      key: "groupId",
      render: (value, record) => (
        <Form.Item
          validateStatus={value ? "success" : "error"}
          style={{ margin: 0 }}
        >
          <Select
            value={value}
            onChange={(val) => updateSecurityRule(record.id, "groupId", val)}
            placeholder="Select Group"
            style={{ width: "100%" }}
          >
            {securityGroupsFromApi.map((group) => (
              <Option key={group.id} value={group.id}>
                {group.groupName}
              </Option>
            ))}
          </Select>
        </Form.Item>
      ),
    },
    {
      title: "Read",
      dataIndex: "read",
      key: "read",
      width: "80px",
      align: "center",
      render: (value, record) => (
        <Checkbox
          checked={value}
          onChange={(e) => updateSecurityRule(record.id, "read", e.target.checked)}
        />
      ),
    },
    {
      title: "Modify",
      dataIndex: "modify",
      key: "modify",
      width: "80px",
      align: "center",
      render: (value, record) => (
        <Checkbox
          checked={value}
          onChange={(e) => updateSecurityRule(record.id, "modify", e.target.checked)}
        />
      ),
    },
    {
      title: "Delete",
      dataIndex: "delete",
      key: "delete",
      width: "80px",
      align: "center",
      render: (value, record) => (
        <Checkbox
          checked={value}
          onChange={(e) => updateSecurityRule(record.id, "delete", e.target.checked)}
        />
      ),
    },
    {
      title: "Upload",
      dataIndex: "upload",
      key: "upload",
      width: "80px",
      align: "center",
      render: (value, record) => (
        <Checkbox
          checked={value}
          onChange={(e) => updateSecurityRule(record.id, "upload", e.target.checked)}
        />
      ),
    },
    {
      key: "actions",
      width: "60px",
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeSecurityRule(record.id)}
          disabled={securityGroups.length === 1}
        />
      ),
    },
  ];

  const storageOptions = (storageLocations || []).map(loc => ({
    value: loc.value,
    label: loc.label,
  }));

  const formValid = className.trim() && !classOptions.includes(className) && fields.length > 0 && fields.every(field => field.name.trim() !== '') &&
  securityGroups.some(rule => rule.groupId && hasPermission(rule)) && storage.location;

  return (
    <div className="class-generation-container">
      <Title level={2}  className="main-title">Generate Custom Class</Title>
      <Text type="secondary">
        Create a new class with custom fields, security permissions, and storage configuration
      </Text>

      <Divider />

      {!formValid && (
        <Alert
          message="Complete all requirements to generate class"
          description="You need at least one field, one group with permissions, and a storage location to generate the class."
          type="info"
          showIcon
          closable
          style={{ marginBottom: "20px" }}
        />
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="generation-tabs">
        <TabPane tab="Basic" key="basic">
          <Form layout="vertical" form={form}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="Class Name"
                  required
                  name="className"
                  rules={[
                    { required: true, message: "Class name is required" },
                    () => ({
                      validator(_, value) {
                        if (!value || !classOptions.includes(value)) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("This class name already exists!"));
                      },
                    }),
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input
                    placeholder="e.g., Policy"
                    size="large"
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value);
                      form.setFieldsValue({ className: e.target.value });
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Available Classes">
                  <Select
                    size="large"
                    placeholder="Select to view existing classes"
                    style={{ width: "100%" }}
                    onSelect={(value) => setClassName(value)} // Optional: Auto-fill the input
                  >
                    {classOptions.map((name) => (
                      <Option key={name} value={name}>
                        {name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <div className="fields-section">
              <div className="section-header">
                <Title level={4}>Fields</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={addField}>
                  Add Field
                </Button>
              </div>

              {fields.length === 0 ? (
                <Alert
                  message="At least one field is required"
                  type="warning"
                  showIcon
                  style={{ marginBottom: "16px" }}
                />
              ) : (
                <Table
                  dataSource={fields}
                  pagination={false}
                  rowKey="id"
                  columns={fieldTableColumns}
                  className="fields-table"
                  size="middle"
                />
              )}
            </div>
          </Form>
        </TabPane>

        <TabPane tab="Security" key="security">
          <div className="security-section">
            <Title level={4}>Security Settings</Title>
            <Text>
              Define access permissions for different user groups
            </Text>

            <Divider />

            <Table
              dataSource={securityGroups}
              pagination={false}
              rowKey="id"
              columns={securityTableColumns}
              className="security-table"
              size="middle"
            />

            <Button
              type="dashed"
              onClick={addSecurityRule}
              icon={<PlusOutlined />}
              style={{ marginTop: "16px" }}
            >
              Add Group Permission
            </Button>
          </div>
        </TabPane>

        <TabPane tab="Storage" key="storage">
          <div className="storage-section">
            <Title level={4}>Storage Settings</Title>

            <Form layout="vertical">
              <Form.Item
                label="Storage System Location"
                required
                validateStatus={storage.location ? "success" : "error"}
                help={storage.location ? "" : "Storage location is required"}
              >
                <Select
                  value={storage.location}
                  onChange={(val) => setStorage({ ...storage, location: val })}
                  placeholder="Select Location"
                  size="large"
                  style={{ width: "100%", maxWidth: "400px" }}
                >
                  {storageOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              
            </Form>
          </div>
        </TabPane>
      </Tabs>

      <Divider />

      <div className="actions">
        <Button size="large" style={{ marginRight: "12px" }}>
          Cancel
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={validateAndSubmit}
          disabled={!formValid || loading}
          className="generate-button"
        >
          {loading ? "Generating..." : "Generate Class"}
        </Button>
      </div>
    </div>
  );
};

export default GenerateClass;