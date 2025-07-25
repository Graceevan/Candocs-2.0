import React, { useState } from "react";
import { CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons";
import "../styles/Sidebar.css";

const Sidebar = ({ onSelect }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="sidebar">
      <div className="dropdown-container">
        <div className="dropdown-header" onClick={() => setOpen(!open)}>
          <span>Add Storage</span>
          {open ? <CaretUpOutlined /> : <CaretDownOutlined />}
        </div>

        {open && (
          <div className="dropdown-options">
            <div onClick={() => onSelect("Azure")}>Azure</div>
            <div onClick={() => onSelect("AWS")}>AWS</div>
            <div onClick={() => onSelect("FileManager")}>File Manager</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
