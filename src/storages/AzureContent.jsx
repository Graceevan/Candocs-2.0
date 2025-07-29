import React, { useState } from "react";
import "../styles/Azure.css";
import alertService from "../services/alertService";

const AzureContent = () => {
  const [formData, setFormData] = useState({
    accountName: "",
    accountKey: "",
    container: "",
  });

  const [loading, setLoading] = useState(false);
  const [isTestSuccessful, setIsTestSuccessful] = useState(false); // New state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = async () => {
    const { accountName, accountKey, container } = formData;

    if (!accountName || !accountKey || !container) {
      alertService.error("Missing Fields", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    setIsTestSuccessful(false); // Reset before retry

    try {
      const response = await fetch("/candocspro/test-connection?storageType=AZURE", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJwcmF2ZWVuQGV4YW1wbGUuY29tIiwiZW1haWwiOiJwcmF2ZWVuQGV4YW1wbGUuY29tIiwiaWF0IjoxNzUzNzcxMzg5LCJleHAiOjE3NTM3NzQ5ODl9.etxcDW4JsydhAGNmPIkut0ew-8ygIE_PVBPs3VXi6XYtmnMm1QyEJ19iKxxvV07TX-fJNjFIWcGFJP1PymXslw",
        },
        body: JSON.stringify({ accountName, accountKey, container }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alertService.success("Success!", data.message || "Azure Blob Storage connection successful.");
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
    // Add your actual storage addition logic here
  };

  return (
    <div className="azure-container-wrapper">
      <div className="azure-container">
        <h2>Azure Storage Details</h2>
        <form className="azure-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <div className="form-column">
              <label htmlFor="accountName">Account Name</label>
              <input
                type="text"
                id="accountName"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                placeholder="Enter account name"
              />

              <label htmlFor="accountKey">Account Key</label>
              <textarea
                id="accountKey"
                name="accountKey"
                value={formData.accountKey}
                onChange={handleChange}
                placeholder="Enter account key"
              />
            </div>

            <div className="form-column">
              <label htmlFor="container">Container</label>
              <input
                type="text"
                id="container"
                name="container"
                value={formData.container}
                onChange={handleChange}
                placeholder="Enter container name"
              />
            </div>
          </div>

          <div className="button-group">
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
              className="add-btn"
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

export default AzureContent;
