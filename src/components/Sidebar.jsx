import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../Features/auth/authSlice";
import "../styles/Sidebar.css";
import storageIcon from "../assets/storageIcon.png";
import customClassIcon from "../assets/customClassIcon.png";
import fileUploadIcon from "../assets/fileUploadIcon.png";
import userDetailsIcon from "../assets/userIcon.png";
import { useContext } from "react";
import { AppContext } from "../AppContext";

const Sidebar = () => {
  const { sidebarVisible, setSidebarVisible, screenSize } = useContext(AppContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

const groups = user?.groups?.map(g => (typeof g === "string" ? g : g.groupName)) || [];
const isAdmin = groups.includes("Administrator");
const hasGroups = groups.length > 0;


  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("authToken");
    localStorage.removeItem("persist:root");
    navigate("/");
    if (screenSize <= 768) setSidebarVisible(false);
  };

  const goTo = (path) => () => {
    navigate(path);
    if (screenSize <= 768) setSidebarVisible(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`sidebar ${screenSize <= 768 && sidebarVisible ? "open" : ""}`}>
      <div className="dropdown-container">
        <div className="nav-links-wrapper">
          {/* Storage Management Section */}
          {isAdmin && (
            <>
              <div className="menu-header">Storage Management</div>

              <div
                className={`dropdown-header ${isActive("/admin/all-locations") ? "active" : ""}`}
                onClick={goTo("/admin/all-locations")}
              >
                <img src={storageIcon} alt="storage" className="sidebar-icon" />
                <span>All Storage Locations</span>
              </div>

              <div
                className={`dropdown-header ${isActive("/admin/addnew") ? "active" : ""}`}
                onClick={goTo("/admin/addnew")}
              >
                <img src={storageIcon} alt="add storage" className="sidebar-icon" />
                <span>Add New</span>
              </div>

              <div className="menu-separator"></div>

              {/* User & System Section */}
              <div className="menu-header">User & System</div>

              <div
                className={`dropdown-header ${isActive("/admin/usermanagement") ? "active" : ""}`}
                onClick={goTo("/admin/usermanagement")}
              >
                <img src={userDetailsIcon} alt="user" className="sidebar-icon" />
                <span>User Management</span>
              </div>

              <div
                className={`dropdown-header ${isActive("/admin/ldapconfig") ? "active" : ""}`}
                onClick={goTo("/admin/ldapconfig")}
              >
                <img src={userDetailsIcon} alt="ldap" className="sidebar-icon" />
                <span>Ldap Configuration</span>
              </div>

              <div
                className={`dropdown-header ${isActive("/admin/generateclass") ? "active" : ""}`}
                onClick={goTo("/admin/generateclass")}
              >
                <img src={customClassIcon} alt="custom class" className="sidebar-icon" />
                <span>Generate Custom Class</span>
              </div>

              <div className="menu-separator"></div>
            </>
          )}

          {/* Documents Section - Only if user has groups */}
          {hasGroups && (
            <>
              <div className="menu-header">Documents</div>

              <div
                className={`dropdown-header ${isActive("/admin/fileupload") ? "active" : ""}`}
                onClick={goTo("/admin/fileupload")}
              >
                <img src={fileUploadIcon} alt="file upload" className="sidebar-icon" />
                <span>File Upload</span>
              </div>

              <div
                className={`dropdown-header ${isActive("/admin/viewdocuments") ? "active" : ""}`}
                onClick={goTo("/admin/viewdocuments")}
              >
                <img src={fileUploadIcon} alt="view docs" className="sidebar-icon" />
                <span>All Files</span>
              </div>
            </>
          )}
        </div>

        {/* Logout Button */}
        {/* <button onClick={handleLogout} className="logout-button">
          Logout
        </button> */}
      </div>
    </nav>
  );
};

export default Sidebar;
