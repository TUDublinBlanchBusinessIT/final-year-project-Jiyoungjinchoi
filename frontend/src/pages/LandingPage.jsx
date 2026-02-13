import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 10% 10%, rgba(255,228,230,.6), transparent 40%)," +
          "radial-gradient(circle at 90% 20%, rgba(219,234,254,.6), transparent 45%)," +
          "radial-gradient(circle at 50% 90%, rgba(220,252,231,.6), transparent 45%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          borderRadius: 22,
          padding: 28,
          boxShadow: "0 12px 35px rgba(0,0,0,.07)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 34, margin: 0, fontWeight: 900 }}>
          Welcome to Pawfection
        </h1>

        <p style={{ marginTop: 12, color: "#555", fontSize: 16 }}>
          Because every pet deserves a little paw-fection 🐾
        </p>

        <div style={{ marginTop: 28, display: "grid", gap: 12 }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              fontWeight: 800,
              color: "#fff",
              cursor: "pointer",
              background: "linear-gradient(90deg,#fb7185,#60a5fa)",
            }}
          >
            Admin Login
          </button>

          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              fontWeight: 800,
              color: "#fff",
              cursor: "pointer",
              background: "linear-gradient(90deg,#60a5fa,#34d399)",
            }}
          >
            User Login
          </button>

          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              fontWeight: 800,
              cursor: "pointer",
              background: "#fff",
            }}
          >
            Register
          </button>
        </div>

        <p style={{ marginTop: 18, color: "#888", fontSize: 13 }}>
          Tip: New here? Register first, then verify your email.
        </p>
      </div>
    </div>
  );
}
