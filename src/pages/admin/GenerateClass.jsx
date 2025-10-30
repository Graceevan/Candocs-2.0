import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { DatePicker } from "antd";
import dayjs from "dayjs";

import {
  Form,
  Input,
  Button,
  Table,
  Select,
  Checkbox,
  Divider,
  Typography,
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


const initialConfiguration = {
  isVersionable: false,
  isSharable: false,
  isLocked: false,
  isSoftDeleted: false,
  isAuditable: false,
  isCompoundDocument: false,
  isMetaDataSearchAllowed: true,
  isContentSearchAllowed: true, 
};

const configurationOptions = [
  { key: "isVersionable", label: "Enable Versioning " },
  { key: "isSharable", label: "Allow Sharing " },
  { key: "isLocked", label: "Allow Locking " },
  { key: "isSoftDeleted", label: "Enable Soft Deletion " },
  { key: "isAuditable", label: "Enable Auditing " },
  { key: "isCompoundDocument", label: "Is Compound Document" },
  { key: "isMetaDataSearchAllowed", label: "Allow Metadata Search " },
  { key: "isContentSearchAllowed", label: "Allow Content Search " },
];
const initialReferenceKeyConfig = {
  isReferenceKey: false,
  referenceKeyCombination: [],
};

// NEW: Constants for Class Security Config
const classSecurityOptions = [
  { key: "documentName", label: "Document Name" },
  { key: "documentTitle", label: "Document Title" },
  { key: "mimeType", label: "MIME Type" },
  { key: "storageAreaId", label: "Storage Area Id" },
  { key: "mainDocumentType", label: "Main Document Type" },
  { key: "subDocumentType", label: "Sub Document Type" },
  // You can add more fields here as needed:

];

const operatorOptions = [
  { value: "AND", label: "AND" },
  { value: "OR", label: "OR" },
];


const mimeTypeOptions = [
  { value: "pdf", label: "PDF Document (.pdf)" },
  { value: "pptx", label: "PowerPoint (.pptx)" },
  { value: "docx", label: "Word Document (.docx)" },
  { value: "xlsx", label: "Excel Spreadsheet (.xlsx)" },
  { value: "jpg", label: "JPEG Image (.jpg)" },
  { value: "png", label: "PNG Image (.png)" },
];

const GenerateClass = () => {
  const [activeTab, setActiveTab] = useState("basic");
  const [className, setClassName] = useState("");
  const [fields, setFields] = useState([
    { id: 1, name: "", type: "String", mandatory: false, defaultValue: "" },
  ]);
  const [securityGroups, setSecurityGroups] = useState([]);


  const [configuration, setConfiguration] = useState(initialConfiguration); // NEW STATE
  const [loading, setLoading] = useState(false);
  const [securityGroupsFromApi, setSecurityGroupsFromApi] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [form] = Form.useForm();
  const authToken =
    useSelector((state) => state.auth.user?.authToken) ||
    localStorage.getItem("authToken");
  const [classOptions, setClassOptions] = useState([]);
  const [touched, setTouched] = useState(false);
  const [referenceKeyConfig, setReferenceKeyConfig] = useState(
    initialReferenceKeyConfig
  ); // NEW STATE: Reference Key Configuration

  // NEW STATE: Class Security Configuration Rules
  const [classSecurityConfigs, setClassSecurityConfigs] = useState([]);
  
  // NEW: Handler for Configuration Checkboxes
  const handleConfigurationChange = (key, checked) => {
    setConfiguration(prev => ({ ...prev, [key]: checked }));
  };
// NEW: Handler for Reference Key Configuration
  const handleReferenceKeyChange = (key, value) => {
    setReferenceKeyConfig((prev) => {
      const newState = { ...prev, [key]: value };
      // If isReferenceKey is set to false, clear the combination
      if (key === "isReferenceKey" && value === "false") {
        newState.referenceKeyCombination = [];
      }
      return newState;
    });
  };

  // Predefined combination options (based on your payload example)
// ✅ Allowed fields for Reference Key Combination
const referenceKeyOptions = [
  { key: "documentName", label: "Document Name" },
  { key: "documentTitle", label: "Document Title" },
  { key: "mimeType", label: "MIME Type" },
  { key: "storageAreaId", label: "Storage Area Id" },
  { key: "mainDocumentType", label: "Main Document Type" },
  { key: "subDocumentType", label: "Sub Document Type" },
];



  // NEW: Handlers for Class Security Config
 const addClassSecurityRule = () => {
  // Default operator for new rule = "OR"
  // but ensure last rule (after adding) becomes "AND"
  setClassSecurityConfigs((prev) => {
    const updated = [...prev];
    // Update previous last rule (if any) operator to be selectable (AND/OR)
    if (updated.length > 0) {
      const lastIndex = updated.length - 1;
      if (updated[lastIndex].operator === "AND") {
        updated[lastIndex].operator = "OR";
      }
    }

    // Add new rule with default AND
    updated.push({
      id: Date.now(),
      fieldName: classSecurityOptions[0].key,
      value: "",
      operator: "AND", // last one always AND
    });

    return updated;
  });
};


const removeClassSecurityRule = (id) => {
  setClassSecurityConfigs((prev) => {
    const updated = prev.filter((rule) => rule.id !== id);
    // Always ensure last rule operator = AND
    if (updated.length > 0) {
      updated[updated.length - 1].operator = "AND";
    }
    return updated;
  });
};


const updateClassSecurityRule = (id, property, value) => {
  setClassSecurityConfigs((prevConfigs) =>
    prevConfigs.map((rule) => {
      if (rule.id === id) {
        const newRule = { ...rule, [property]: value };

        // Reset subDocumentType if Main changes
        if (property === "fieldName" && value === "mainDocumentType") {
          newRule.value = "";
        }

        // Reset value when switching between field types
        if (property === "fieldName" && value !== rule.fieldName) {
          newRule.value = "";
        }

        return newRule;
      }
      return rule;
    })
  );
};

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


  const validateValue = (type, value) => {
    if (!value || value.toString().trim() === "") return true; // Empty handled by required

    switch (type) {
      case "String":
        return true; // allow any text
      case "Integer": {
        const intRegex = /^-?\d{1,10}$/; // max 10 digits
        if (!intRegex.test(value)) return false;
        const num = Number(value);
        return num >= -2147483648 && num <= 2147483647;
      }
      case "BigInteger": {
        const bigIntRegex = /^-?\d{1,19}$/; // max 19 digits
        if (!bigIntRegex.test(value)) return false;
        try {
          const num = BigInt(value);
          return (
            num >= BigInt("-9223372036854775808") &&
            num <= BigInt("9223372036854775807")
          );
        } catch {
          return false;
        }
      }
      case "Double": {
        const doubleRegex = /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/;
        if (!doubleRegex.test(value)) return false;
        const num = Number(value);
        if (isNaN(num)) return false;
        // Limit ~15 digits precision
        return (
          Math.abs(num) >= Number.MIN_VALUE &&
          Math.abs(num) <= Number.MAX_VALUE &&
          value.replace(/[-.eE+]/g, "").length <= 15
        );
      }
      case "BigDecimal": {
        const bigDecimalRegex = /^-?\d+(\.\d+)?$/; // unlimited length
        return bigDecimalRegex.test(value);
      }
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


  // Friendly name mapping
  const fieldTypes = [
    { label: "Text", value: "String" },
    { label: "Whole Number", value: "Integer" },
    { label: "Large Whole Number", value: "BigInteger" },
    { label: "Decimal Number", value: "Double" },
    { label: "Precise Decimal", value: "BigDecimal" },
    { label: "True/False", value: "Boolean" },
    { label: "Date", value: "LocalDate" },
    { label: "Date & Time", value: "LocalDateTime" },
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

  // --- Inside component state ---
const [storagePolicy, setStoragePolicy] = useState({
  storageLocation: "",
  storagePolicyDetails: [
    {
      id: Date.now(),
      storageLocation: "",
      rules: [
        { id: Date.now(), field: "", values: [], operator: "AND" },
      ],
    },
  ],
});

const fieldOptions = [
  { value: "mimeType", label: "MIME Type" },
  { value: "documentName", label: "Document Name" },
  { value: "documentTitle", label: "Document Title" },
];

const mimeTypeList = [
  { value: "pdf", label: "PDF" },
  { value: "pptx", label: "PowerPoint" },
  { value: "docx", label: "Word" },
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPEG" },
];

// --- Handlers ---
const addStoragePolicyDetail = () => {
  setStoragePolicy((prev) => ({
    ...prev,
    storagePolicyDetails: [
      ...prev.storagePolicyDetails,
      {
        id: Date.now(),
        storageLocation: "",
        rules: [{ id: Date.now(), field: "", values: [], operator: "AND" }],
      },
    ],
  }));
};

const removeStoragePolicyDetail = (id) => {
  setStoragePolicy((prev) => ({
    ...prev,
    storagePolicyDetails: prev.storagePolicyDetails.filter((s) => s.id !== id),
  }));
};

const updateStoragePolicyDetail = (id, key, value) => {
  setStoragePolicy((prev) => ({
    ...prev,
    storagePolicyDetails: prev.storagePolicyDetails.map((s) =>
      s.id === id ? { ...s, [key]: value } : s
    ),
  }));
};

// --- Rules Handling ---
const addRule = (storageId) => {
  setStoragePolicy((prev) => ({
    ...prev,
    storagePolicyDetails: prev.storagePolicyDetails.map((detail) => {
      if (detail.id === storageId) {
        const updatedRules = [...detail.rules];
        if (updatedRules.length > 0) {
          updatedRules[updatedRules.length - 1].operator = "OR";
        }
        updatedRules.push({
          id: Date.now(),
          field: "",
          values: [],
          operator: "AND", // last always AND
        });
        return { ...detail, rules: updatedRules };
      }
      return detail;
    }),
  }));
};


const removeRule = (storageId, ruleId) => {
  setStoragePolicy((prev) => {
    const updatedDetails = prev.storagePolicyDetails.map((detail) => {
      if (detail.id === storageId) {
        const updatedRules = detail.rules.filter((r) => r.id !== ruleId);
        return { ...detail, rules: updatedRules };
      }
      return detail;
    }).filter((detail) => detail.rules.length > 0); // 🧹 Remove empty section

    return { ...prev, storagePolicyDetails: updatedDetails };
  });
};


const updateRule = (storageId, ruleId, key, value) => {
  setStoragePolicy((prev) => ({
    ...prev,
    storagePolicyDetails: prev.storagePolicyDetails.map((detail) => {
      if (detail.id === storageId) {
        const updatedRules = detail.rules.map((rule) =>
          rule.id === ruleId ? { ...rule, [key]: value } : rule
        );
        return { ...detail, rules: updatedRules };
      }
      return detail;
    }),
  }));
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
        fields.every(field => field.name.trim() !== '' && !/\s/.test(field.name) && validateValue(field.type, field.defaultValue));

      if (!hasValidFields) {
        message.error('Please ensure all fields have a name and valid default value.');
        setActiveTab('basic');
        return;
      }

      // NEW: Reference Key Validation
      const isRefKeyTrue = referenceKeyConfig.isReferenceKey === "true";
      if (isRefKeyTrue && referenceKeyConfig.referenceKeyCombination.length === 0) {
        message.error('Reference Key Combination is required when "Is Reference Key" is true.');
        setActiveTab('referenceKey'); // Switch to the new tab
        return;
      }

      const fieldArray = fields
        .filter((f) => f.name && f.type)
        .map((f) => {
          let parsedDefault = f.defaultValue;

          if (f.defaultValue && f.defaultValue.toString().trim() !== "") {
            switch (f.type) {
              case "Integer":
                parsedDefault = Number(f.defaultValue);
                break;
              case "BigInteger":
                parsedDefault = BigInt(f.defaultValue).toString(); // store as string for API
                break;
              case "Double":
                parsedDefault = parseFloat(f.defaultValue);
                break;
              case "BigDecimal":
                parsedDefault = f.defaultValue; // keep string (arbitrary precision)
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
      .filter(g => g.groupId)
      .map(g => ({
        groupId: Number(g.groupId),
        readAccess: g.read,
        modifyAccess: g.modify,
        deleteAccess: g.delete,
        uploadAccess: g.upload,
      })),
  },
  storagePolicy: {
    storageLocation: storagePolicy.storageLocation,
    storagePolicyDetails: storagePolicy.storagePolicyDetails.map(detail => ({
      storageLocation: detail.storageLocation,
      rules: detail.rules.map(rule => ({
        field: rule.field,
        values: rule.values,
        operator: rule.operator,
      })),
    })),
  },
  classConfig: configuration,
  referenceKeyConfig: {
    isReferenceKey: referenceKeyConfig.isReferenceKey === "true" || referenceKeyConfig.isReferenceKey === true,
    referenceKeyCombination:
      referenceKeyConfig.isReferenceKey === "true" || referenceKeyConfig.isReferenceKey === true
        ? referenceKeyConfig.referenceKeyCombination
        : null,
  },
  classSecurityConfig: classSecurityConfigs
    .filter(rule => rule.fieldName && rule.operator && rule.value)
    .map(rule => ({
      fieldName: rule.fieldName,
      value: Array.isArray(rule.value) ? rule.value : [rule.value],
      operator: rule.operator,
    })),
};


      setLoading(true);
      console.log("✅ Payload being sent:", JSON.stringify(payload, null, 2));

      const { data } = await api.post("/candocspro/generate-class", payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      alertService.success("Success", data.message || "Class Created Successfully");
      setClassName("");
      setFields([{ id: 1, name: "", type: "String", mandatory: false, defaultValue: "" }]);
      setSecurityGroups([]);
      setStoragePolicy({
        storageLocation: "",
        storagePolicyDetails: [
          {
            id: Date.now(),
            storageLocation: "",
            rules: [
              { id: Date.now(), field: "", values: [], operator: "AND" },
            ],
          },
        ],
      });
      setConfiguration(initialConfiguration); // Reset Configuration
      setReferenceKeyConfig(initialReferenceKeyConfig); // Reset Reference Key Config
      setClassSecurityConfigs([]); // Reset Class Security Config
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
          style={{ margin: 0 }}
          validateStatus={
            touched && (!value || /\s/.test(value)) ? "error" : ""
          }
          help={
            touched
              ? !value
                ? "Field name is required"
                : /\s/.test(value)
                ? "Field name must be a single word (no spaces allowed)"
                : ""
              : ""
          }
        >
          <Input
            value={value}
            onChange={(e) => {
              updateField(record.id, "name", e.target.value);
              if (!touched) setTouched(true); // mark as touched on first change
            }}
            onBlur={() => setTouched(true)} // also mark touched on blur
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
            <Option key={type.value} value={type.value}>
              {type.label}
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


    // Inside fieldTableColumns definition:
    {
      title: "Default value",
      dataIndex: "defaultValue",
      key: "defaultValue",
      render: (value, record) => {
        const isValid = validateValue(record.type, value);

        // Boolean → Checkbox
        if (record.type === "Boolean") {
          return (
            <Checkbox
              checked={value?.toString().toLowerCase() === "true"}
              onChange={(e) =>
                updateField(record.id, "defaultValue", e.target.checked.toString())
              }
            >
              Default
            </Checkbox>
          );
        }

        // LocalDate → DatePicker
        if (record.type === "LocalDate") {
          return (
            <Form.Item
              validateStatus={value && !isValid ? "error" : ""}
              help={value && !isValid ? `Invalid Date format (YYYY-MM-DD)` : ""}
              style={{ margin: 0 }}
            >
              <DatePicker
                value={value ? dayjs(value, "YYYY-MM-DD") : null}
                onChange={(date, dateString) =>
                  updateField(record.id, "defaultValue", dateString)
                }
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
              />
            </Form.Item>
          );
        }

        // LocalDateTime → DatePicker with time
        if (record.type === "LocalDateTime") {
          return (
            <Form.Item
              validateStatus={value && !isValid ? "error" : ""}
              help={value && !isValid ? `Invalid DateTime format (YYYY-MM-DDTHH:mm:ss)` : ""}
              style={{ margin: 0 }}
            >
              <DatePicker
                showTime
                value={value ? dayjs(value, "YYYY-MM-DDTHH:mm:ss") : null}
                onChange={(date, dateString) =>
                  updateField(record.id, "defaultValue", dateString)
                }
                format="YYYY-MM-DDTHH:mm:ss"
                style={{ width: "100%" }}
              />
            </Form.Item>
          );
        }

        // Default → Input
        return (
          <Form.Item
            validateStatus={value && !isValid ? "error" : ""}
            help={value && !isValid ? `Invalid ${record.type} value` : ""}
            style={{ margin: 0 }}
          >
            <Input
              value={value}
              onChange={(e) =>
                updateField(record.id, "defaultValue", e.target.value)
              }
              placeholder="Default value"
            />
          </Form.Item>
        );
      },
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


  // ✅ Main & Sub Document Type options
const mainDocumentTypeOptions = [
  { value: "Identity", label: "Identity" },
  { value: "Certificate", label: "Certificate" },
];

const subDocumentTypeOptionsMap = {
  Identity: [
    { value: "Aadhar", label: "Aadhar" },
    { value: "PAN", label: "PAN" },
    { value: "Driving License", label: "Driving License" },
    { value: "Voter ID", label: "Voter ID" },
  ],
  Certificate: [
    { value: "10th Marksheet", label: "10th Marksheet" },
    { value: "12th Marksheet", label: "12th Marksheet" },
    { value: "UG Consolidate", label: "UG Consolidate" },
    { value: "PG Consolidate", label: "PG Consolidate" },
  ],
};


  // ... after securityTableColumns ...

const classSecurityTableColumns = [
  {
    title: "Field Name",
    dataIndex: "fieldName",
    key: "fieldName",
    width: 200,
    render: (value, record) => (
      <Select
        value={value}
        onChange={(val) => updateClassSecurityRule(record.id, "fieldName", val)}
        style={{ width: "100%" }}
      >
        {classSecurityOptions.map((opt) => (
          <Option key={opt.key} value={opt.key}>
            {opt.label}
          </Option>
        ))}
      </Select>
    ),
  },
 {
  title: "Value",
  dataIndex: "value",
  key: "value",
  render: (value, record) => {
    // ✅ MIME Type (Multi-select)
    if (record.fieldName === "mimeType") {
      return (
        <Select
          mode="multiple"
          value={Array.isArray(value) ? value : []}
          onChange={(val) => updateClassSecurityRule(record.id, "value", val)}
          placeholder="Select MIME Types"
          style={{ width: "100%" }}
        >
          {mimeTypeOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      );
    }

    // ✅ Storage Area ID (Multi-select)
    if (record.fieldName === "storageAreaId") {
      return (
        <Select
          mode="multiple"
          value={Array.isArray(value) ? value : []}
          onChange={(val) => updateClassSecurityRule(record.id, "value", val)}
          placeholder="Select Storage Area(s)"
          style={{ width: "100%" }}
        >
          {storageLocations.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      );
    }

    // ✅ Main Document Type (Single-select)
    if (record.fieldName === "mainDocumentType") {
      return (
        <Select
          value={value || undefined}
          placeholder="Select Main Document Type"
          style={{ width: "100%" }}
          onChange={(val) => updateClassSecurityRule(record.id, "value", val)}
        >
          {mainDocumentTypeOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      );
    }

    // ✅ Sub Document Type (Dependent dropdown)
    if (record.fieldName === "subDocumentType") {
      const mainRule = classSecurityConfigs.find(
        (rule) => rule.fieldName === "mainDocumentType"
      );
      const mainType = mainRule?.value;
      const subOptions = subDocumentTypeOptionsMap[mainType] || [];

      return (
        <Select
          value={value || undefined}
          placeholder={
            mainType
              ? `Select ${mainType} Type`
              : "Select Main Document Type first"
          }
          style={{ width: "100%" }}
          disabled={!mainType}
          onChange={(val) => updateClassSecurityRule(record.id, "value", val)}
        >
          {subOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      );
    }

    // ✅ Document Name / Title → Multi-value tag input
    if (record.fieldName === "documentName" || record.fieldName === "documentTitle") {
      return (
        <Select
          mode="tags"
          value={Array.isArray(value) ? value : []}
          onChange={(val) => updateClassSecurityRule(record.id, "value", val)}
          tokenSeparators={[","]}
          placeholder={`Type and press Enter to add ${
            record.fieldName === "documentName" ? "Document Name" : "Document Title"
          } values`}
          style={{ width: "100%" }}
        />
      );
    }

    // ✅ Default input for all other fields
    return (
      <Input
        value={value}
        onChange={(e) => updateClassSecurityRule(record.id, "value", e.target.value)}
        placeholder={`Enter ${record.fieldName || "value"}`}
      />
    );
  },
},

  {
    title: "Operator",
    dataIndex: "operator",
    key: "operator",
    width: 120,
    align: "center",
    render: (value, record, index) => {
      const isLastRow = index === classSecurityConfigs.length - 1;
      if (isLastRow) {
        // ✅ Fixed "AND" for last rule (non-editable)
        return <span>AND</span>;
      }
      return (
        <Select
          value={value}
          onChange={(val) => updateClassSecurityRule(record.id, "operator", val)}
          style={{ width: "100%" }}
        >
          {operatorOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      );
    },
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
        onClick={() => removeClassSecurityRule(record.id)}
      />
    ),
  },
];


  const storageOptions = (storageLocations || []).map(loc => ({
    value: loc.value,
    label: loc.label,
  }));

 const formValid = className.trim() && 
    !classOptions.includes(className) && 
    fields.length > 0 && 
    fields.every(field => field.name.trim() !== '' && !/\s/.test(field.name)) &&
    securityGroups.some(rule => rule.groupId && hasPermission(rule)) && 
    storagePolicy.storageLocation &&  // ✅ FIXED: Changed from storage.location to storagePolicy.storageLocation
    // NEW: Check Reference Key Configuration
    !(referenceKeyConfig.isReferenceKey === "true" && referenceKeyConfig.referenceKeyCombination.length === 0);

return (
  <div className="class-generation-container">
    <Title level={2} className="main-title">Generate Custom Class</Title>
    <Text className="genclass_subtitle" type="secondary">
      Create a new class with custom fields, security permissions, and storage configuration
    </Text>

    <Divider />

    {!formValid && (
      <Alert
        message="Complete all required sections to generate class"
        description="You need a valid Class Name, at least one field, one group with permissions, and a storage location to generate the class."
        type="info"
        showIcon
        closable
        style={{ marginBottom: "20px" }}
      />
    )}

    {/* ✅ Modern Ant Design Tabs API */}
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      className="generation-tabs"
      items={[
        {
          key: "basic",
          label: "Basic",
          children: (
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
                          if (!value) return Promise.resolve();
                          if (/\s/.test(value)) {
                            return Promise.reject(
                              new Error("Class name must be a single word (no spaces allowed)")
                            );
                          }
                          if (classOptions.includes(value)) {
                            return Promise.reject(new Error("This class name already exists!"));
                          }
                          return Promise.resolve();
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
                      onSelect={(value) => setClassName(value)}
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
          ),
        },
        {
          key: "security",
          label: "Security",
          children: (
            <div className="security-section">
              <Title level={4}>Security Settings</Title>
              <Text>
                Define access permissions for different user groups. At least one group with permissions is required.
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

              <Divider />

              <Title level={4}>Class Security Filters</Title>
              <Text>
                Define additional security rules based on document properties (e.g., only allow specific file types).
              </Text>

              <Divider />

              <Table
                dataSource={classSecurityConfigs}
                pagination={false}
                rowKey="id"
                columns={classSecurityTableColumns}
                className="class-security-table"
                size="middle"
                locale={{ emptyText: "No class security filters defined" }}
              />

              <Button
                type="dashed"
                onClick={addClassSecurityRule}
                icon={<PlusOutlined />}
                style={{ marginTop: "16px" }}
              >
                Add Security Filter
              </Button>
            </div>
          ),
        },
        {
          key: "storage",
          label: "Storage",
          children: (
            <div className="storage-section">
              <Title level={4}>Storage Policy Configuration</Title>

              <Form layout="vertical">
                <Form.Item
                  label="Default Storage Location"
                  required
                  validateStatus={storagePolicy.storageLocation ? "success" : "error"}
                  help={storagePolicy.storageLocation ? "" : "Required"}
                >
                  <Select
                    value={storagePolicy.storageLocation}
                    onChange={(val) =>
                      setStoragePolicy((prev) => ({ ...prev, storageLocation: val }))
                    }
                    placeholder="Select main storage location"
                    style={{ width: 400 }}
                  >
                    {storageLocations.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Divider />

                <Title level={5}>Storage Locations & Rules</Title>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "220px 200px 1fr 120px 60px",
                    fontWeight: 600,
                    background: "#fafafa",
                    border: "1px solid #d9d9d9",
                    borderBottom: "none",
                    borderRadius: "8px 8px 0 0",
                    padding: "15px 12px",
                    marginBottom: -1,
                  }}
                >
                  <div>Storage Location</div>
                  <div>Field</div>
                  <div>Value</div>
                  <div>Operator</div>
                  <div></div>
                </div>

                {storagePolicy.storagePolicyDetails.map((detail) => (
                  <div
                    key={detail.id}
                    style={{
                      border: "1px solid #d9d9d9",
                      borderTop: "none",
                      borderRadius: "0 0 8px 8px",
                      padding: 16,
                      marginBottom: 20,
                      background: "#ffffffff",
                    }}
                  >
                    {detail.rules.map((rule, index) => (
                      <Row gutter={12} align="middle" key={rule.id} style={{ marginBottom: 8 }}>
                        {index === 0 ? (
                          <Col flex="220px">
                            <Select
                              value={detail.storageLocation}
                              onChange={(val) =>
                                updateStoragePolicyDetail(detail.id, "storageLocation", val)
                              }
                              placeholder="Select Storage Location"
                              style={{ width: "100%" }}
                            >
                              {storageLocations.map((opt) => (
                                <Option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </Option>
                              ))}
                            </Select>
                          </Col>
                        ) : (
                          <Col flex="220px" />
                        )}

                        <Col flex="200px">
                          <Select
                            value={rule.field}
                            onChange={(val) => updateRule(detail.id, rule.id, "field", val)}
                            placeholder="Select a field"
                            style={{ width: "100%" }}
                          >
                            {fieldOptions.map((opt) => (
                              <Option key={opt.value} value={opt.value}>
                                {opt.label}
                              </Option>
                            ))}
                          </Select>
                        </Col>

                        <Col flex="auto">
                          {rule.field === "mimeType" ? (
                            <Select
                              mode="multiple"
                              value={rule.values}
                              onChange={(val) =>
                                updateRule(detail.id, rule.id, "values", val)
                              }
                              placeholder="Select MIME Types"
                              style={{ width: "100%" }}
                            >
                              {mimeTypeList.map((opt) => (
                                <Option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </Option>
                              ))}
                            </Select>
                          ) : (
                            <Select
                              mode="tags"
                              value={rule.values}
                              onChange={(val) =>
                                updateRule(detail.id, rule.id, "values", val)
                              }
                              placeholder="Type and press Enter"
                              style={{ width: "100%" }}
                            />
                          )}
                        </Col>

                        <Col flex="120px">
                          {index === detail.rules.length - 1 ? (
                            <span>AND</span>
                          ) : (
                            <Select
                              value={rule.operator}
                              onChange={(val) =>
                                updateRule(detail.id, rule.id, "operator", val)
                              }
                              style={{ width: "100%" }}
                            >
                              <Option value="AND">AND</Option>
                              <Option value="OR">OR</Option>
                            </Select>
                          )}
                        </Col>

                        <Col flex="60px">
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeRule(detail.id, rule.id)}
                          />
                        </Col>
                      </Row>
                    ))}

                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => addRule(detail.id)}
                      style={{ marginTop: 8 }}
                    >
                      Add Field
                    </Button>
                  </div>
                ))}

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addStoragePolicyDetail}
                  style={{ marginTop: 16 }}
                >
                  Add Storage Location
                </Button>
              </Form>
            </div>
          ),
        },
        {
          key: "configuration",
          label: "Configuration",
          children: (
            <div className="configuration-section">
              <Title level={4}>Class Configuration Options</Title>
              <Text>
                Select the behavioral flags for the new class (e.g., versioning, locking).
              </Text>

              <Divider />

              <Row gutter={[16, 16]}>
                {configurationOptions.map((option) => (
                  <Col span={12} key={option.key}>
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Checkbox
                        checked={configuration[option.key]}
                        onChange={(e) =>
                          handleConfigurationChange(option.key, e.target.checked)
                        }
                      >
                        {option.label}
                      </Checkbox>
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </div>
          ),
        },
        {
          key: "referenceKey",
          label: "Reference Key",
          children: (
            <div className="reference-key-section">
              <Title level={4}>Reference Key Configuration</Title>
              <Text>
                Configure the unique identifier combination for documents in this class.
              </Text>

              <Divider />

              <Form layout="vertical">
                <Form.Item label="Is Reference Key">
                  <Select
                    value={referenceKeyConfig.isReferenceKey.toString()}
                    onChange={(val) =>
                      handleReferenceKeyChange("isReferenceKey", val)
                    }
                    style={{ width: 150 }}
                  >
                    <Option value="true">True</Option>
                    <Option value="false">False</Option>
                  </Select>
                </Form.Item>

                {referenceKeyConfig.isReferenceKey === "true" && (
                  <Form.Item
                    label="Reference Key Combination"
                    required
                    validateStatus={
                      referenceKeyConfig.referenceKeyCombination.length > 0
                        ? "success"
                        : "error"
                    }
                    help={
                      referenceKeyConfig.referenceKeyCombination.length > 0
                        ? ""
                        : "Select at least one combination field"
                    }
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select Reference Key Fields"
                      value={referenceKeyConfig.referenceKeyCombination}
                      onChange={(values) =>
                        handleReferenceKeyChange("referenceKeyCombination", values)
                      }
                      style={{ width: "100%", maxWidth: 400 }}
                    >
                      {referenceKeyOptions.map((opt) => (
                        <Option key={opt.key} value={opt.key}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
              </Form>
            </div>
          ),
        },
      ]}
    />

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