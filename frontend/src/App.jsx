import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";

import Dashboard from "./pages/Dashboard";
import PremiumDashboard from "./pages/PremiumDashboard";
import PremiumMyPet from "./pages/PremiumMyPet";
import PremiumVetChat from "./pages/PremiumVetChat";
import PremiumAppointments from "./pages/PremiumAppointments";

import AdminDashboard from "./pages/AdminDashboard";
import AdminModeration from "./pages/AdminModeration";
import AdminLostFound from "./pages/AdminLostFound";
import AdminUsers from "./pages/AdminUsers";

import CreatePet from "./pages/CreatePet";
import EditPet from "./pages/EditPet";
import PremiumCreatePet from "./pages/PremiumCreatePet";
import PremiumEditPet from "./pages/PremiumEditPet";

import MyPets from "./pages/MyPets";
import PetOverview from "./pages/PetOverview";
import Community from "./pages/Community";
import PremiumCommunity from "./pages/PremiumCommunity";
import Inventory from "./pages/Inventory";
import Appointments from "./pages/Appointments";
import Reminders from "./pages/Reminders";
import ViewProfile from "./pages/ViewProfile";
import UpgradePremium from "./pages/UpgradePremium";

import LostFound from "./pages/LostFound";
import PremiumLostFound from "./pages/PremiumLostFound";
import ReportLostPet from "./pages/ReportLostPet";
import PremiumReportLostPet from "./pages/PremiumReportLostPet";
import SubmitSighting from "./pages/SubmitSighting";
import PremiumSubmitSighting from "./pages/PremiumSubmitSighting";
import LostReportDetails from "./pages/LostReportDetails";
import PremiumLostReportDetails from "./pages/PremiumLostReportDetails";
import PremiumProfile from "./pages/PremiumProfile";
import PremiumReminders from "./pages/PremiumReminders";
import PremiumInventory from "./pages/PremiumInventory";
import PremiumPetSightings from "./pages/PremiumPetSightings";
import PremiumReportSighting from "./pages/PremiumReportSighting";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Basic user routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mypets" element={<MyPets />} />
        <Route path="/pets/create" element={<CreatePet />} />
        <Route path="/pets/:id/edit" element={<EditPet />} />
        <Route path="/pets/:id" element={<PetOverview />} />

        <Route path="/community" element={<Community />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/profile" element={<ViewProfile />} />
        <Route path="/upgrade-premium" element={<UpgradePremium />} />

        {/* Premium routes */}
        <Route path="/premium-dashboard" element={<PremiumDashboard />} />
        <Route path="/premium-mypets" element={<PremiumMyPet />} />
        <Route path="/premium/vet-chat" element={<PremiumVetChat />} />
        <Route path="/premium/appointments" element={<PremiumAppointments />} />
        <Route path="/premium/community" element={<PremiumCommunity />} />
        <Route path="/premium/inventory" element={<PremiumInventory />} />
        <Route path="/premium/reminders" element={<PremiumReminders />} />
        <Route path="/premium/profile" element={<PremiumProfile />} />

        <Route path="/premium/pets/create" element={<PremiumCreatePet />} />
        <Route path="/premium/pets/:id/edit" element={<PremiumEditPet />} />
        <Route path="/premium/pets/:petId/sightings" element={<PremiumPetSightings />} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/moderation" element={<AdminModeration />} />
        <Route path="/admin/lostfound" element={<AdminLostFound />} />
        <Route path="/admin/users" element={<AdminUsers />} />

        {/* Safety redirect for old admin dashboard route */}
        <Route
          path="/admin-dashboard"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        {/* Basic Lost & Found routes */}
        <Route path="/lostfound" element={<LostFound />} />
        <Route path="/lostfound/report" element={<ReportLostPet />} />
        <Route path="/lostfound/view/:id" element={<LostReportDetails />} />
        <Route path="/lostfound/view/:id/sighting" element={<SubmitSighting />} />

        {/* Premium Lost & Found routes */}
        <Route path="/premium/lostfound" element={<PremiumLostFound />} />
        <Route path="/premium/lostfound/report" element={<PremiumReportLostPet />} />
        <Route
          path="/premium/lostfound/report-sighting"
          element={<PremiumReportSighting />}
        />
        <Route
          path="/premium/lostfound/view/:id"
          element={<PremiumLostReportDetails />}
        />
        <Route
          path="/premium/lostfound/view/:id/sighting"
          element={<PremiumSubmitSighting />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;