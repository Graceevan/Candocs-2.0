import React from 'react';
import '../styles/Footer.css';
import "../styles/layout.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <p>© {new Date().getFullYear()} Candocs 2.0. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
