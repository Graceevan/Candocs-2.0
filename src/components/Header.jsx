import React from 'react';
import '../styles/Header.css';
import '../styles/Layout.css';
import logo from '../assets/candocs2.png'; // Adjust if needed

const Header = () => {
  return (
    <header className="site-header">
      <img src={logo} alt="Canvendor Logo" className="logo-img" />

    </header>
  );
};

export default Header;
