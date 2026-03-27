import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";

import Dashboard from "./pages/Dashboard";
import PremiumDashboard from "./pages/PremiumDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminModeration from "./pages/AdminModeration";
import AdminLostFound from "./pages/AdminLostFound";
import AdminUsers from "./pages/AdminUsers";

import CreatePet from "./pages/CreatePet";
import EditPet from "./pages/EditPet";
import MyPets from "./pages/MyPets";
import PetOverview from "./pages/PetOverview";
import Community from "./pages/Community";
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
import LostReportDetails from "./pages/LostReportDetails";

function Placeholder({ title }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>{title}</h1>
      <p>This page is coming soon.</p>
    </div>
  );
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem("pawfection_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getUserRole() {
  const user = getStoredUser();
  return String(
    user?.role || localStorage.getItem("pawfection_role") || ""
  ).toLowerCase();
}

function getAccountType() {
  const user = getStoredUser();
  return String(
    user?.account_type ||
      user?.plan ||
      localStorage.getItem("pawfection_account_type") ||
      "standard"
  ).toLowerCase();
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("pawfection_token");
  return token ? children : <Navigate to="/login" replace />;
}

function PremiumPageRoute({ children }) {
  const token = localStorage.getItem("pawfection_token");
  const role = getUserRole();
  const accountType = getAccountType();

  if (!token) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (accountType !== "premium") return <Navigate to="/dashboard" replace />;

  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("pawfection_token");
  const role = getUserRole();

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
}

function LostFoundRoute() {
  const token = localStorage.getItem("pawfection_token");
  const role = getUserRole();
  const accountType = getAccountType();

  if (!token) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin/lost-found" replace />;

  return accountType === "premium" ? <PremiumLostFound /> : <LostFound />;
}

function ReportLostPetRoute() {
  const token = localStorage.getItem("pawfection_token");
  const role = getUserRole();

  if (!token) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin/lost-found" replace />;

  return <ReportLostPet />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/premium-dashboard"
          element={
            <PremiumPageRoute>
              <PremiumDashboard />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/pets/create"
          element={
            <ProtectedRoute>
              <CreatePet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pets/:id/edit"
          element={
            <ProtectedRoute>
              <EditPet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pets/:id"
          element={
            <ProtectedRoute>
              <PetOverview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/premium-pets/:id"
          element={
            <PremiumPageRoute>
              <PetOverview />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/premium-pets/:id/edit"
          element={
            <PremiumPageRoute>
              <EditPet />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/mypets"
          element={
            <ProtectedRoute>
              <MyPets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/premium-mypets"
          element={
            <PremiumPageRoute>
              <MyPets />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments/book"
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <Reminders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reminders/add"
          element={
            <ProtectedRoute>
              <Placeholder title="Add Reminder" />
            </ProtectedRoute>
          }
        />

        <Route path="/lostfound" element={<LostFoundRoute />} />
        <Route path="/lostfound/report" element={<ReportLostPetRoute />} />

        <Route
          path="/premium/lostfound"
          element={
            <PremiumPageRoute>
              <PremiumLostFound />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/premium/lostfound/report"
          element={
            <PremiumPageRoute>
              <PremiumReportLostPet />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/lostfound/:id"
          element={
            <ProtectedRoute>
              <LostReportDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lostfound/:id/sighting"
          element={
            <ProtectedRoute>
              <SubmitSighting />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ViewProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/premium/appointments"
          element={
            <PremiumPageRoute>
              <Appointments />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/premium/reminders"
          element={
            <PremiumPageRoute>
              <Reminders />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/premium/community"
          element={
            <PremiumPageRoute>
              <Community />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/premium/inventory"
          element={
            <PremiumPageRoute>
              <Inventory />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/premium/profile"
          element={
            <PremiumPageRoute>
              <ViewProfile />
            </PremiumPageRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/moderation"
          element={
            <AdminRoute>
              <AdminModeration />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/lost-found"
          element={
            <AdminRoute>
              <AdminLostFound />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />

        <Route
          path="/upgrade-premium"
          element={
            <ProtectedRoute>
              <UpgradePremium />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vet-chat"
          element={
            <ProtectedRoute>
              <Placeholder title="Vet Chat" />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}