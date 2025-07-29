import React, { useState } from "react";
import "../styles/FileManager.css";
import alertService from "../services/alertService";

const FileManagerContent = () => {
  const [formData, setFormData] = useState({ path: "" });
  const [loading, setLoading] = useState(false);
  const [isTestSuccessful, setIsTestSuccessful] = useState(false); // New state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = async () => {
    const { path } = formData;

    if (!path.trim()) {
      alertService.error("Missing Field", "Please enter the path.");
      return;
    }

    setLoading(true);
    setIsTestSuccessful(false); // Reset before re-test

    try {
      const response = await fetch("/candocspro/test-connection?storageType=FS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJwcmF2ZWVuQGV4YW1wbGUuY29tIiwiZW1haWwiOiJwcmF2ZWVuQGV4YW1wbGUuY29tIiwiaWF0IjoxNzUzNzcxMzg5LCJleHAiOjE3NTM3NzQ5ODl9.etxcDW4JsydhAGNmPIkut0ew-8ygIE_PVBPs3VXi6XYtmnMm1QyEJ19iKxxvV07TX-fJNjFIWcGFJP1PymXslw",
        },
        body: JSON.stringify({ path }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alertService.success("Success!", data.message || "File system connection successful.");
        setIsTestSuccessful(true); // Enable Add Storage
      } else {
        alertService.error("Connection Failed", data.message || "Something went wrong.");
      }
    } catch (error) {
      alertService.error("Error", "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStorage = () => {
    alertService.success("Storage Added", "Storage has been successfully added.");
    // Place your storage addition logic here
  };

  return (
    <div className="file-manager-wrapper">
      <div className="file-manager-container">
        <h2>File System Details</h2>
        <form className="file-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <div className="form-column">
              <label htmlFor="path">Path</label>
              <textarea
                id="path"
                name="path"
                value={formData.path}
                onChange={handleChange}
                placeholder="Enter file system path"
              />
            </div>
          </div>

          <div className="fs-button-group">
            <button
              type="button"
              className="test-btn"
              onClick={handleTestConnection}
              disabled={loading}
            >
              {loading ? "Testing..." : "Test Connection"}
            </button>

            <button
              type="button"
              className="fs-add-btn"
              onClick={handleAddStorage}
              disabled={!isTestSuccessful}
            >
              Add Storage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileManagerContent;
