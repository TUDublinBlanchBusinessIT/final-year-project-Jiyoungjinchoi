import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("pawfection_token");
    const userRaw = localStorage.getItem("pawfection_user");

    // ✅ Only redirect if NOT logged in
    if (!token || !userRaw) {
      navigate("/login");
    }
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem("pawfection_user") || "{}");
  const isVerified = !!user.email_verified_at;

  function logout() {
    localStorage.removeItem("pawfection_token");
    localStorage.removeItem("pawfection_user");
    localStorage.removeItem("pawfection_user_email");
    navigate("/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
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
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 22,
          padding: 28,
          boxShadow: "0 12px 35px rgba(0,0,0,.07)",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Dashboard 🐾</h1>

        <p style={{ color: "#555", marginTop: 6 }}>
          Welcome <strong>{user?.name || "User"}</strong>
        </p>

        {/* ✅ Unverified message (NO redirect) */}
        {!isVerified && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 14,
              background: "#fff7ed",
            }}
          >
            <strong>Attention:</strong> Your email is not verified yet.
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => navigate("/verify-email")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  fontWeight: 800,
                  color: "#fff",
                  cursor: "pointer",
                  background: "linear-gradient(90deg,#fb7185,#60a5fa)",
                }}
              >
                Go to Verify Email
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 14,
            background: "#eff6ff",
          }}
        >
          <div>
            <strong>Email:</strong> {user?.email || "-"}
          </div>
          <div style={{ marginTop: 6 }}>
            <strong>Verified:</strong> {isVerified ? "Yes ✅" : "No ❌"}
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            marginTop: 22,
            padding: "12px 18px",
            borderRadius: 12,
            border: "none",
            fontWeight: 800,
            color: "#fff",
            cursor: "pointer",
            background: "linear-gradient(90deg,#fb7185,#60a5fa)",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
