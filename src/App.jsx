import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";

import Home from "./storages/Home";
import AzureContent from "./storages/AzureContent";
import AwsContent from "./storages/AwsContent";
import FileManagerContent from "./storages/FileManagerContent";
import Signup from "./components/Signup"; // ✅ Keep if you need it

import "./styles/Layout.css";

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Header />
      <div className="content-layout">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/azure" element={<AzureContent />} />
            <Route path="/aws" element={<AwsContent />} />
            <Route path="/filemanager" element={<FileManagerContent />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Router>
  );
};

export default App;
