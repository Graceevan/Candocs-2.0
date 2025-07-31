import React, { useState } from "react";
import "../styles/Aws.css";
import alertService from "../services/alertService";

const AwsContent = () => {
  const [formData, setFormData] = useState({
    accessKey: "",
    secretKey: "",
    path: "",
    bucket: "",
  });

  const [loading, setLoading] = useState(false);
  const [isTestSuccessful, setIsTestSuccessful] = useState(false); // ✅ new state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = async () => {
    const { accessKey, secretKey, path, bucket } = formData;

    if (!accessKey || !secretKey || !path || !bucket) {
      alertService.error("Missing Fields", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    setIsTestSuccessful(false); // reset

    try {
      const response = await fetch('/candocspro/test-connection?storageType=S3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJwcmF2ZWVuQGV4YW1wbGUuY29tIiwiZW1haWwiOiJwcmF2ZWVuQGV4YW1wbGUuY29tIiwiaWF0IjoxNzUzOTUyODc3LCJleHAiOjE3NTM5NTY0Nzd9.B_5aRydXkB_-1eIBDQ8n9YjUEL43D7M28nC9imdRjzUem5ZVEBr6ixTmr_dOb5YZFMKE9lvLvRH1ahcyCwMWAg', // trimmed for clarity
        },
        body: JSON.stringify({ accessKey, secretKey, path, bucket }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alertService.success("Success!", "S3 connection successful and bucket exists in region.");
        setIsTestSuccessful(true); // ✅ enable "Add Storage"
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
    alertService.success("Storage Added", "AWS S3 storage has been added.");
    // ⬅️ Add your storage save logic here
  };

  return (
    <div className="aws-container-wrapper">
      <div className="aws-container">
        <h2>AWS Storage Details</h2>
        <form className="aws-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <div className="form-column">
              <label htmlFor="accessKey">Access Key</label>
              <input
                type="text"
                id="accessKey"
                name="accessKey"
                value={formData.accessKey}
                onChange={handleChange}
                placeholder="Enter access key"
              />

              <label htmlFor="secretKey">Secret Key</label>
              <textarea
                id="secretKey"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
                placeholder="Enter secret key"
              />
            </div>

            <div className="form-column">
              <label htmlFor="path">Path</label>
              <input
                type="text"
                id="path"
                name="path"
                value={formData.path}
                onChange={handleChange}
                placeholder="Enter path"
              />

              <label htmlFor="bucket">Bucket</label>
              <input
                type="text"
                id="bucket"
                name="bucket"
                value={formData.bucket}
                onChange={handleChange}
                placeholder="Enter bucket name"
              />
            </div>
          </div>

          <div className="aws-button-group">
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
              className="aws-add-btn"
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

export default AwsContent;
