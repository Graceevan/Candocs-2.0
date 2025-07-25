import React, { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import Home from "./storages/Home";
import AzureContent from "./storages/AzureContent";
import AwsContent from "./storages/AwsContent";
import FileManagerContent from "./storages/FileManagerContent";
import "./styles/Layout.css";

const App = () => {
  const [activePage, setActivePage] = useState("Home");

  const renderContent = () => {
    switch (activePage) {
      case "Azure":
        return <AzureContent />;
      case "AWS":
        return <AwsContent />;
      case "FileManager":
        return <FileManagerContent />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="app-layout">
      <Header />
      <div className="content-layout">
        <Sidebar onSelect={setActivePage} />
        <div className="main-content">{renderContent()}</div>
      </div>
      <Footer />
    </div>
  );
};

export default App;
