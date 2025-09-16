import React from "react";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";

import AddNew from "./pages/admin/AddNew";
import AzureContent from "./pages/admin/AzureContent";
import AwsContent from "./pages/admin/AwsContent";
import FileManagerContent from "./pages/admin/FileManagerContent";
import AllStorageLocation from "./pages/admin/AllStorageLocation";

import UserManagement from "./pages/admin/UserManagement";
import CreateNewUser from './pages/admin/CreateNewUser';
import CreateNewGroup from './pages/admin/CreateNewGroup';
import LdapConfig from "./pages/admin/LdapConfig";
import CreateLdap from "./pages/admin/CreateLdap";

import GenerateClass from "./pages/admin/GenerateClass";
import FileUpload from "./pages/admin/FileUpload";
import ViewDocuments from "./pages/admin/ViewDocuments";

import useScreenSize from "./Custom Hooks/useScreenSize";
import { AppContext } from "./AppContext";


import Layout from "./components/Layout";
import "./styles/Layout.css";

const App = () => {
    const screenSize = useScreenSize();
     const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <AppContext.Provider value={{ screenSize, sidebarVisible, setSidebarVisible }}>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Layout />}>
           <Route index element={<Navigate to="/admin/addnew" replace />} />

            <Route path="addnew" element={<AddNew />} />
            <Route path="azure" element={<AzureContent />} />
            <Route path="aws" element={<AwsContent />} />
            <Route path="filemanager" element={<FileManagerContent />} />
            <Route path="all-locations" element={<AllStorageLocation />} />
            
            <Route path="usermanagement" element={<UserManagement />} />         
            <Route path="createnewuser" element={<CreateNewUser />} />
            <Route path="createnewgroup" element={<CreateNewGroup />} />
            <Route path="ldapconfig" element={<LdapConfig />} />
            <Route path="createldap" element={<CreateLdap />} />

            <Route path="generateclass" element={<GenerateClass/>}/>
            <Route path="fileupload" element={<FileUpload/>}/>
            <Route path="viewdocuments" element={<ViewDocuments/>}/>
            <Route path="*" element={<Navigate to="all-locations" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
</AppContext.Provider>
  );
};

export default App;