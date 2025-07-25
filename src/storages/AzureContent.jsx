import React, { useState } from "react";
import "../styles/Azure.css";
import { AiOutlineBell } from "react-icons/ai"; // 🔔 bell icon

const AzureContent = () => {
  const [formData, setFormData] = useState({
    accountName: "",
    accountKey: "",
    container: "",
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [notifications, setNotifications] = useState(3); // Sample notification count

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = () => {
    const { accountName, accountKey, container } = formData;
    if (!accountName || !accountKey || !container) {
      alert("Please fill in all fields");
      return;
    }
    setShowConfirm(true);
  };

  const handleSubmit = () => {
    setShowConfirm(false);
    setShowResult(true);
    setNotifications((n) => n + 1); // Just as a sample
  };

  const handleClose = () => {
    setShowResult(false);
  };

  return (
    <div className="azure-container-wrapper">
      <div className="notification-wrapper">
        <button className="notification-btn">
          <AiOutlineBell size={24} />
          {notifications > 0 && <span className="notification-count">{notifications}</span>}
        </button>
      </div>

      <div className="azure-container">
        <h2>Azure Storage Details</h2>
        <form className="azure-form" onSubmit={(e) => e.preventDefault()}>
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

          <label htmlFor="container">Container</label>
          <input
            type="text"
            id="container"
            name="container"
            value={formData.container}
            onChange={handleChange}
            placeholder="Enter container name"
          />

          <button type="button" className="test-btn" onClick={handleTestConnection}>
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
            <p>Container: <strong>{formData.container}</strong></p>
            <p>Connection Successful ✅</p>
            <button className="submit-btn" onClick={handleClose}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AzureContent;
