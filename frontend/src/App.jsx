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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/premium-dashboard" element={<PremiumDashboard />} />
        <Route path="/premium-mypets" element={<PremiumMyPet />} />
        <Route path="/premium/vet-chat" element={<PremiumVetChat />} />
        <Route path="/premium/appointments" element={<PremiumAppointments />} />

        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/moderation" element={<AdminModeration />} />
        <Route path="/admin/lostfound" element={<AdminLostFound />} />
        <Route path="/admin/users" element={<AdminUsers />} />

        <Route path="/pets/create" element={<CreatePet />} />
        <Route path="/pets/:id/edit" element={<EditPet />} />
        <Route path="/mypets" element={<MyPets />} />
        <Route path="/pets/:id" element={<PetOverview />} />

        <Route path="/community" element={<Community />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/profile" element={<ViewProfile />} />
        <Route path="/upgrade-premium" element={<UpgradePremium />} />

        <Route path="/premium/community" element={<PremiumCommunity />} />
        <Route path="/premium/inventory" element={<Inventory />} />
        <Route path="/premium/reminders" element={<PremiumReminders />} />
        <Route path="/premium/profile" element={<PremiumProfile />} />

        <Route path="/lostfound" element={<LostFound />} />
        <Route path="/lostfound/report" element={<ReportLostPet />} />
        <Route path="/lostfound/view/:id" element={<LostReportDetails />} />
        <Route
          path="/lostfound/view/:id/sighting"
          element={<SubmitSighting />}
        />

        <Route path="/premium/lostfound" element={<PremiumLostFound />} />
        <Route
          path="/premium/lostfound/report"
          element={<PremiumReportLostPet />}
        />
        <Route
          path="/premium/lostfound/view/:id"
          element={<PremiumLostReportDetails />}
        />
        <Route
          path="/premium/lostfound/view/:id/sighting"
          element={<PremiumSubmitSighting />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;