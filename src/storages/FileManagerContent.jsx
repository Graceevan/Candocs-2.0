import React, { useState } from "react";
import "../styles/FileManager.css";
import { AiOutlineBell } from "react-icons/ai"; // 🔔 bell icon
const FileManagerContent = () => {
  const [path, setPath] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [notifications, setNotifications] = useState(3); // Sample notification count
  const handleTestConnection = () => {
    if (path.trim() === "") return alert("Please enter a path");
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
  <div className="file-manager-wrapper">
    <div className="notification-wrapper">
      <button className="notification-btn">
        <AiOutlineBell size={24} />
        {notifications > 0 && (
          <span className="notification-count">{notifications}</span>
        )}
      </button>
    </div>

    <div className="file-manager-container">
      <h2>File System</h2>
      <form className="file-form" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="path">Path</label>
        <textarea
          id="path"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="Enter file path"
        />
        <button
          type="button"
          className="test-btn"
          onClick={handleTestConnection}
        >
          Test Connection
        </button>
      </form>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Proceed with Connection?</p>
            <button onClick={handleSubmit} className="submit-btn">
              Ok
            </button>
          </div>
        </div>
      )}

      {showResult && (
        <div className="modal-overlay">
          <div className="modal">
            <p>
              Entered Path: <strong>{path}</strong>
            </p>
            <p>Connection Successful ✅</p>
            <button onClick={handleClose} className="submit-btn">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

};

export default FileManagerContent;
