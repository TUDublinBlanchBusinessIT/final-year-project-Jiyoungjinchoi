import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import CreatePet from "./pages/CreatePet"; // ✅ NEW

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page (NEW DEFAULT PAGE) */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* ✅ Pets */}
        <Route path="/pets/create" element={<CreatePet />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
