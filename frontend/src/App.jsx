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
import Reminders from "./pages/Reminders";
import ViewProfile from "./pages/ViewProfile";

// ✅ Lost & Found
import LostFound from "./pages/LostFound";
import ReportLostPet from "./pages/ReportLostPet";
import SubmitSighting from "./pages/SubmitSighting";
import LostReportDetails from "./pages/LostReportDetails";

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

        {/* ✅ Appointments */}
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/book" element={<Appointments />} />

        {/* Reminders */}
        <Route path="/reminders" element={<Reminders />} />
        <Route
          path="/reminders/add"
          element={<Placeholder title="Add Reminder" />}
        />

        {/* ✅ Lost & Found */}
        <Route path="/lostfound" element={<LostFound />} />
        <Route path="/lostfound/report" element={<ReportLostPet />} />

        {/* ✅ Lost report details (shows sightings updates) */}
        <Route path="/lostfound/:id" element={<LostReportDetails />} />

        {/* ✅ Sprint 1513 submit sighting */}
        <Route path="/lostfound/:id/sighting" element={<SubmitSighting />} />

        {/* ✅ Profile */}
        <Route path="/profile" element={<ViewProfile />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}