import React from "react";
import { useSelector } from "react-redux";
import "../styles/Header.css";
import "../styles/Layout.css";
import logo from "../assets/canvendor.png";
import dummyProfile from "../assets/usericon.jpg"; 
import { AppContext } from "../AppContext";
import { useContext } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
const Header = () => {
  const { sidebarVisible, setSidebarVisible, screenSize } = useContext(AppContext);
  const username =
    useSelector((state) => state.auth.user?.username) ||
    localStorage.getItem("username");

  // const role =
  //   useSelector((state) => state.auth.user?.role) ||
  //   localStorage.getItem("role");

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

      <div className="header-user-info">
        <div className="header-user-text">
          <span className="username">{username}</span>
          {/* <span className="user-role">{role}</span> */}
        </div>
        <img src={dummyProfile} alt="Profile" className="profile-pic" />
        
      </div>
    </header>
  );
};


export default Header;
