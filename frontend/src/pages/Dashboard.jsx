import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  // Default to "User" until we load the real name
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    try {
      // ✅ 1) Most important: read from the stored user object
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);

        if (userObj?.name && typeof userObj.name === "string") {
          setUserName(userObj.name);
          return;
        }
      }

      // ✅ 2) Fallback: read from a saved name key (if you use one)
      const fallbackName =
        localStorage.getItem("pawfection_user_name") ||
        localStorage.getItem("user_name") ||
        localStorage.getItem("name");

      if (fallbackName) {
        setUserName(fallbackName);
      }
    } catch (err) {
      // If JSON parse fails, just keep "User"
      setUserName("User");
    }
  }, []);

  return (
    <div className="pf-page">
      {/* Header */}
      <header className="pf-header">
        <div className="pf-header-left">
          <img className="pf-logo" src={PawfectionLogo} alt="Pawfection Logo" />
          <div className="pf-brand">Pawfection</div>
        </div>

        <nav className="pf-nav">
          <Link className="pf-nav-link" to="/mypets">My pets</Link>
          <Link className="pf-nav-link" to="/lostfound">Lost&Found</Link>
          <Link className="pf-nav-link" to="/community">Community</Link>
          <Link className="pf-nav-link" to="/inventory">Inventory</Link>
          <Link className="pf-nav-link" to="/appointments">Appointments</Link>
          <Link className="pf-nav-link" to="/reminders">Reminders</Link>
        </nav>
      </header>

      <div className="pf-divider" />

      {/* Main */}
      <main className="pf-container">
        <h1 className="pf-title">My Dashboard</h1>

        {/* Welcome Card */}
        <div className="pf-card pf-welcome">
          <div className="pf-welcome-text">Welcome, {userName}!</div>
          <button
            className="pf-btn pf-btn-outline"
            onClick={() => navigate("/profile")}
          >
            View Profile
          </button>
        </div>

        {/* Quick Actions */}
        <div className="pf-actions">
          <button
            className="pf-btn pf-btn-primary"
            onClick={() => navigate("/pets/add")}
          >
            Add Pet
          </button>
          <button
            className="pf-btn pf-btn-primary"
            onClick={() => navigate("/reminders/add")}
          >
            Add Reminder
          </button>
          <button
            className="pf-btn pf-btn-primary"
            onClick={() => navigate("/appointments/book")}
          >
            Book Appointment
          </button>
        </div>

        {/* My Pets */}
        <section className="pf-section">
          <h2 className="pf-section-title">My Pets</h2>

          {/* ✅ Single Pet Card */}
          <div className="pf-grid-3">
            <div className="pf-card pf-pet-card">
              <div className="pf-img-box">img</div>

              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Mars</div>
                <div style={{ fontWeight: 700 }}>Labrador Retriever</div>
                <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600 }}>
                  4 years old • 30kg
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Reminders */}
        <section className="pf-section">
          <h2 className="pf-section-title">Upcoming Reminders</h2>

          <div className="pf-card pf-reminders">
            <div className="pf-reminder-row">
              <div className="pf-reminder-text">Description of reminder</div>
              <div className="pf-reminder-date">05/01/2025</div>
            </div>
            <div className="pf-reminder-row">
              <div className="pf-reminder-text">Description of reminder</div>
              <div className="pf-reminder-date">21/04/2026</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
