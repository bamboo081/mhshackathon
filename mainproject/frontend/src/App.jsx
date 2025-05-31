/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Marketplace from "./pages/Marketplace";
import ChatPage from "./pages/ChatPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OrgDashboard from "./pages/OrgDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [user, setUser] = useState(null);

  return (
      <Routes>
        <Route path="*" element={<ChatPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard/org" element={<OrgDashboard user={user} />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
      </Routes>
  );
}
