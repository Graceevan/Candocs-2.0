// Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

const Layout = () => (
  <div className="app-layout">
    <Header />
    <div className="content-layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
    {/* <Footer /> */}
  </div>
);

export default Layout;
