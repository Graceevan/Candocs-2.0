import React, { useState } from "react";
import { CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";

const Sidebar = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="sidebar">
      <div className="dropdown-container">
        <div className="nav-links-wrapper">
          {/* ➤ Add Storage Dropdown */}
          <div className="dropdown-header" onClick={() => setOpen(!open)}>
            <span>Add Storage</span>
            {open ? <CaretUpOutlined /> : <CaretDownOutlined />}
          </div>

          {open && (
            <div className="dropdown-options">
              <NavLink
                to="/azure"
                className={({ isActive }) =>
                  isActive ? "dropdown-option active" : "dropdown-option"
                }
              >
                Azure
              </NavLink>
              <NavLink
                to="/aws"
                className={({ isActive }) =>
                  isActive ? "dropdown-option active" : "dropdown-option"
                }
              >
                AWS
              </NavLink>
              <NavLink
                to="/filemanager"
                className={({ isActive }) =>
                  isActive ? "dropdown-option active" : "dropdown-option"
                }
              >
                File Manager
              </NavLink>
            </div>
          )}

          {/* ➤ Create User */}
          <div className="dropdown-header">
            <NavLink to="/signup" className="dropdown-link">
              Create User
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
