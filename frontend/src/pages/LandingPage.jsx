import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp2-page">
      {/* Small brand pill (top-left) like your screenshot */}
      <div className="lp2-brand">Pawfection</div>

      <div className="lp2-card">
        <h1 className="lp2-title">Welcome to Pawfection</h1>
        <p className="lp2-subtitle">
          Because every pet deserves a little paw-fection 🐾
        </p>

        <div className="lp2-actions">
          <button className="lp2-btn lp2-primary" onClick={() => navigate("/login")}>
            User Login
          </button>

          <button className="lp2-btn lp2-primary-alt" onClick={() => navigate("/login")}>
            Admin Login
          </button>

          <button className="lp2-btn lp2-secondary" onClick={() => navigate("/register")}>
            Register
          </button>
        </div>

        <p className="lp2-tip">Tip: Register first, then verify your email.</p>
      </div>
    </div>
  );
}
