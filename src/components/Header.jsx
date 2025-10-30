import React, { useContext, useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";
import "../styles/Layout.css";
import logo from "../assets/canvendor.png";
import dummyProfile from "../assets/usericon.jpg"; 
import { AppContext } from "../AppContext";
import { GiHamburgerMenu } from "react-icons/gi";
import { FiLogOut, FiMail } from "react-icons/fi";
import { logout } from "../Features/auth/authSlice"; // ✅ same import path as Sidebar

const Header = () => {
  const { sidebarVisible, setSidebarVisible, screenSize } = useContext(AppContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const username =
    useSelector((state) => state.auth.user?.username) ||
    localStorage.getItem("username");

  const userEmail =
    useSelector((state) => state.auth.user?.email) ||
    localStorage.getItem("userEmail");

  // ✅ same logout logic as Sidebar
  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("authToken");
    localStorage.removeItem("persist:root");
    navigate("/");
    if (screenSize <= 768) setSidebarVisible(false);
  };

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="site-header">
      {screenSize <= 768 && (
        <GiHamburgerMenu
          className="hamburger-icon"
          onClick={() => setSidebarVisible(!sidebarVisible)}
        />
      )}
      <img src={logo} alt="Canvendor Logo" className="logo-img" />

      <div className="header-spacer" />

      {/* Profile + Dropdown */}
      <div className="header-user-info" ref={dropdownRef}>
        <div
          className="profile-wrapper"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className="username">{username}</span>
          <img src={dummyProfile} alt="Profile" className="profile-pic" />
        </div>

        {dropdownOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-item email">
              <FiMail style={{ marginRight: "8px" }} />
              {userEmail || "No Email"}
            </div>
            <hr />
            <button onClick={handleLogout} className="dropdown-item logout">
              <FiLogOut style={{ marginRight: "8px" }} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
