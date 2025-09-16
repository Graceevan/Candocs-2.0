import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../../api/axiosInstance";
import alertService from "../../services/alertService"; // Re-using existing alert service
import { DatePicker, Typography, Select } from "antd"; // Using antd DatePicker for a better UX
import moment from "moment";
import "../../styles/FileUpload.css"; // Ensure you have this CSS file

const FileUpload = () => {
  // State management
  const [documentTitle, setDocumentTitle] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [formData, setFormData] = useState({});
  const [classStructures, setClassStructures] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [selectedClassFields, setSelectedClassFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [selectedStorageLocation, setSelectedStorageLocation] = useState("");
  const { Title, Paragraph } = Typography;
  const authToken =
    useSelector((state) => state.auth.user?.authToken) ||
    localStorage.getItem("authToken");
  const authState = useSelector((state) => state.auth.user);
  const userId = authState?.userId;
  const fileInputRef = useRef(null);

  // Function to fetch class structures from the API
  useEffect(() => {
    if (!authToken) return;

    const fetchClassNames = async () => {
      try {
        const { data } = await api.get(`/candocspro/load-class/${userId}`);
        setClassStructures(data);

        const filteredNames = data
          .map((item) => item.className.split(".").pop())
          .filter((name) => name !== "Structure");
        setClassOptions(filteredNames);
      } catch (err) {
        console.error("Error fetching class names:", err);
        alertService.error("Error", "Could not load class names");
      }
    };
    fetchClassNames();
  }, [authToken]);

  // Validation logic
  useEffect(() => {
    validateForm();
  }, [selectedClass, documentTitle, file, formData]);

  const validateForm = () => {
    let formIsValid = true;
    const newErrors = {};

    if (!selectedClass) {
      newErrors.selectedClass = "Please select a class";
      formIsValid = false;
    }

    if (!documentTitle.trim()) {
      newErrors.documentTitle = "Document title is required";
      formIsValid = false;
    }

    if (!selectedStorageLocation) {
      newErrors.storageAreaId = "A storage location is required";
      formIsValid = false;
    }

    if (!file) {
      newErrors.file = "Please select a file";
      formIsValid = false;
    }

    selectedClassFields.forEach((fieldName) => {
      const selectedClassData = classStructures.find(
        (cls) => cls.className.split(".").pop() === selectedClass
      );
      const field = selectedClassData?.fields[fieldName];

      if (
        field?.mandatory &&
        (!formData[fieldName] || formData[fieldName].toString().trim() === "")
      ) {
        newErrors[fieldName] = `${fieldName} is required`;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    setIsFormValid(formIsValid);
    return formIsValid;
  };

  // Handle class selection change
  const handleClassChange = (e) => {
    const className = e.target.value;
    setSelectedClass(className);
    setErrors({});
    setIsAccordionOpen(!!className);

    const selectedClassData = classStructures.find(
      (c) => c.className.split(".").pop() === className
    );

    if (selectedClassData) {
      const fields = Object.keys(selectedClassData.fields).filter(
        (field) => field !== "id" && field !== "guid" && field !== "storageAreaId"
      );
      setSelectedClassFields(fields);

      const initialData = {};
      fields.forEach((field) => {
        initialData[field] = selectedClassData.fields[field]?.defaultValue || "";
      });
      setFormData(initialData);

      // Automatically set storage location from class definition
      const storageField = selectedClassData.fields["storageAreaId"];
      if (storageField?.value) {
        setSelectedStorageLocation(storageField.value);
      } else {
        setSelectedStorageLocation("");
      }
    } else {
      setSelectedClassFields([]);
      setFormData({});
      setSelectedStorageLocation("");
    }
  };

  // Handle input changes for dynamic fields
  const handleInputChange = (fieldName, value) => {
    const updatedFormData = {
      ...formData,
      [fieldName]: value,
    };
    setFormData(updatedFormData);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alertService.error(
        "Validation Error",
        "Please fill in all required fields correctly."
      );
      return;
    }

    if (!authToken) {
      alertService.error(
        "Error",
        "Authentication token missing. Please log in again."
      );
      return;
    }
    setUploading(true); // Start uploading state
    try {
      const selectedClassStructure = classStructures.find(
        (cls) => cls.className.split(".").pop() === selectedClass
      );

      const data = new FormData();

      // Document Object (corrected to match API body)
      const documentObject = {
        documentTitle: documentTitle,
      };

      const documentBlob = new Blob([JSON.stringify(documentObject)], {
        type: "application/json",
      });
      data.append("document", documentBlob);

      // Custom Data Object (corrected to match API body)
      const customDataObject = {};
      Object.keys(formData).forEach((fieldName) => {
        customDataObject[fieldName] = formData[fieldName];
      });

      console.log("customDataObject", customDataObject);

      const customDataBlob = new Blob([JSON.stringify(customDataObject)], {
        type: "application/json",
      });
      data.append("customData", customDataBlob);

      // Add the other required parts
      data.append("file", file);
      data.append("className", selectedClassStructure.className);
      data.append("documentVersionId", "1");
      // Debug: print FormData payload before sending

      const { data: responseData } = await api.post("/candocspro/upload-file", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("Upload successful:", responseData);
      console.log("Document GUID:", responseData.Guid);

      alertService.success("Success", "Document uploaded successfully!");

      // Reset form on success
      setSelectedClass("");
      setDocumentTitle("");
      setFile(null);
      setFileName("");
      setFormData({});
      setSelectedClassFields([]);
      setErrors({});
      setIsFormValid(false);
      setIsAccordionOpen(false);
      setSelectedStorageLocation("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      alertService.error("Error", "Failed to upload document. Please try again.");
    }finally {
    setUploading(false); // End uploading state
  }
  };

  // Function to render dynamic fields with appropriate types
  const renderField = (field) => {
    const fieldData = classStructures.find(
      (cls) => cls.className.split(".").pop() === selectedClass
    )?.fields[field];

    if (!fieldData) return null;

    switch (fieldData.type) {
      case "LocalDate":
        return (
          <DatePicker
            value={formData[field] ? moment(formData[field], "YYYY-MM-DD") : null}
            onChange={(date, dateString) => handleInputChange(field, dateString)}
            format="YYYY-MM-DD"
            placeholder={`Enter ${field}`}
            className={errors[field] ? "error" : ""}
          />
        );
      case "LocalDateTime":
        return (
          <DatePicker
            showTime={{ format: "HH:mm:ss" }}
            value={
              formData[field]
                ? moment(formData[field], "YYYY-MM-DDTHH:mm:ss.SSS")
                : null
            }
            onChange={(date, dateString) =>
              handleInputChange(
                field,
                date ? date.format("YYYY-MM-DDTHH:mm:ss.SSS") : ""
              )
            }
            format="YYYY-MM-DD HH:mm:ss"
            placeholder={`Enter ${field}`}
            className={errors[field] ? "error" : ""}
          />
        );
      case "Boolean":
        return (
          <input
            type="checkbox"
            name={field}
            checked={formData[field] === "true"}
            onChange={(e) =>
              handleInputChange(field, e.target.checked ? "true" : "false")
            }
            className={errors[field] ? "error" : ""}
          />
        );
      case "Integer":
      case "Long":
      case "Double":
        return (
          <input
            type="number"
            step={fieldData.type === "Double" ? "any" : "1"}
            value={formData[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={`Enter ${field}`}
            className={errors[field] ? "error" : ""}
          />
        );
      case "String":
      default:
        return (
          <input
            type="text"
            value={formData[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={`Enter ${field}`}
            className={errors[field] ? "error" : ""}
          />
        );
    }
  };

  return (
    <div className="file-upload-container">
      <div className="header">
        <Title className="file-page-title" level={2}>
          Upload Document
        </Title>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="class-select">
              Select Class <span className="required">*</span>
            </label>
            <select
              id="class-select"
              value={selectedClass}
              onChange={handleClassChange}
              className={errors.selectedClass ? "error" : ""}
              style={{ width: 380 }} // Set the width here
              dropdownStyle={{ maxHeight: 200, overflow: "auto" }}
            >
              <option value="">Select a class</option>
              {classOptions.map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errors.selectedClass && (
              <span className="error-message">{errors.selectedClass}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="document-title">
              Document Title <span className="required">*</span>
            </label>
            <input
              id="document-title"
              type="text"
              placeholder="Enter the Document Title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className={errors.documentTitle ? "error" : ""}
            />
            {errors.documentTitle && (
              <span className="error-message">{errors.documentTitle}</span>
            )}
          </div>
        </div>

        {selectedClass && (
          <div className="form-details">
            <h3>
              {selectedClass} Details
              <span
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                className="accordion-toggle"
              >
                {isAccordionOpen ? "▲" : "▼"}
              </span>
            </h3>

            {isAccordionOpen && (
              <div className="fields-container">
                {selectedClassFields.map((field, index) => (
                  <div key={index} className="form-group">
                    <label htmlFor={`field-${field}`}>
                      {field}
                      {classStructures.find(
                        (cls) => cls.className.split(".").pop() === selectedClass
                      )?.fields[field]?.mandatory && <span className="required">*</span>}
                    </label>
                    {renderField(field)}
                    {errors[field] && (
                      <span className="error-message">{errors[field]}</span>
                    )}
                  </div>
                ))}

                <div className="form-group">
                  <label htmlFor="storageAreaId">
                    Storage Area ID <span className="required">*</span>
                  </label>
                  <input
                    id="storageAreaId"
                    type="text"
                    value={selectedStorageLocation}
                    readOnly
                    className={errors.storageAreaId ? "error" : ""}
                    placeholder="Storage ID will be auto-populated"
                  />
                  {errors.storageAreaId && (
                    <span className="error-message">{errors.storageAreaId}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="file-upload-section">
          <div className="form-group">
            <label htmlFor="file-upload">
              File Upload <span className="required">*</span>
            </label>
            <div className="file-input-container">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                ref={fileInputRef}
                className={errors.file ? "error" : ""}
              />
              <div className="file-display">
                <span className="file-icon">📄</span>
                <span className="file-name">{fileName || "Choose a file..."}</span>
                <button type="button" className="browse-button">
                  Browse
                </button>
              </div>
            </div>
            {errors.file && (
              <span className="error-message">{errors.file}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button">
            Cancel
          </button>
          <button
            type="submit"
            className={`file-upload-button ${!isFormValid || uploading ? "disabled" : ""}`}
            disabled={!isFormValid || uploading}
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FileUpload;