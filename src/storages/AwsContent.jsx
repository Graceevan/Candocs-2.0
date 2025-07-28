import React, { useState } from "react";
import "../styles/Aws.css";
import { AiOutlineBell } from "react-icons/ai"; // 🔔 bell icon
const AwsContent = () => {
  const [formData, setFormData] = useState({
    accessKey: "",
    secretKey: "",
    path: "",
    bucket: "",
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState(false);
const [notifications, setNotifications] = useState(3); // Sample notification count
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = () => {
    const { accessKey, secretKey, path, bucket } = formData;
    if (!accessKey || !secretKey || !path || !bucket) {
      alert("Please fill in all fields");
      return;
    }
    setShowConfirm(true);
  };

  const handleSubmit = () => {
    setShowConfirm(false);
    setShowResult(true);
  };

  const handleClose = () => {
    setShowResult(false);
  };

 return (
  <div className="aws-container-wrapper">
    <div className="notification-wrapper">
      <button className="notification-btn">
        <AiOutlineBell size={24} />
        {notifications > 0 && (
          <span className="notification-count">{notifications}</span>
        )}
      </button>
    </div>

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

        <button
          type="button"
          className="test-btn"
          onClick={handleTestConnection}
        >
          Test Connection
        </button>
      </form>
    </div>

    {showConfirm && (
      <div className="modal-overlay">
        <div className="modal">
          <p>Proceed with Connection?</p>
          <button className="submit-btn" onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    )}

    {showResult && (
      <div className="modal-overlay">
        <div className="modal">
          <p>Entered Path: <strong>{formData.path}</strong></p>
          <p>Connection Successful ✅</p>
          <button className="submit-btn" onClick={handleClose}>OK</button>
        </div>
      </div>
    )}
  </div>
);

};

export default AwsContent;
