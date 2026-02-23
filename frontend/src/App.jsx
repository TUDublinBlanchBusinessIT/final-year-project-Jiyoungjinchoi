import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";

import Dashboard from "./pages/Dashboard";
import CreatePet from "./pages/CreatePet";
import EditPet from "./pages/EditPet";
import MyPets from "./pages/MyPets";
import PetOverview from "./pages/PetOverview";
import Community from "./pages/Community";
import Inventory from "./pages/Inventory";
import Appointments from "./pages/Appointments";

// Temporary placeholder pages (until you build them properly)
function Placeholder({ title }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>{title}</h1>
      <p>This page is coming soon.</p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Pets */}
        <Route path="/pets/create" element={<CreatePet />} />
        <Route path="/pets/:id/edit" element={<EditPet />} />
        <Route path="/pets/:id" element={<PetOverview />} />

        {/* Sidebar pages */}
        <Route path="/mypets" element={<MyPets />} />
        <Route path="/community" element={<Community />} />
        <Route path="/inventory" element={<Inventory />} />

        {/* ✅ Appointments (NOW REAL PAGES) */}
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/book" element={<Appointments />} />

        {/* Still placeholders for now */}
        <Route path="/reminders" element={<Placeholder title="Reminders" />} />
        <Route path="/reminders/add" element={<Placeholder title="Add Reminder" />} />
        <Route path="/lostfound" element={<Placeholder title="Lost & Found" />} />
        <Route path="/profile" element={<Placeholder title="Profile" />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}