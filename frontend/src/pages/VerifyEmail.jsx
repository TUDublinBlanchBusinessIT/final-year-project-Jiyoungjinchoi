import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [email, setEmail] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("pawfection_user_email");

    // ✅ If user opened this page without coming from register, send them to login
    if (!savedEmail) {
      navigate("/login");
      return;
    }
    setEmail(savedEmail);

    // ✅ If redirected here after clicking verification link, show success + send to login
    const params = new URLSearchParams(location.search);
    const verified = params.get("verified");

    if (verified === "1") {
      setStatus({
        type: "success",
        message: "Email verified successfully. Redirecting to login…",
      });

      // optional: clear email after verification
      // localStorage.removeItem("pawfection_user_email");

      setTimeout(() => navigate("/login"), 1200);
    }
  }, [navigate, location.search]);

  async function resendEmail() {
    setStatus({ type: "loading", message: "Resending verification email..." });

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/email/verification-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend email.");
      }

      setStatus({ type: "success", message: data.message || "Email sent!" });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to fetch" });
    }
  }

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
          padding: 24,
          boxShadow: "0 12px 35px rgba(0,0,0,.07)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 26, margin: 0 }}>Please verify your email</h1>
        <p style={{ marginTop: 10, color: "#555" }}>
          We sent a verification link to: <strong>{email}</strong>
        </p>

        {status.type !== "idle" && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 14,
              background:
                status.type === "success"
                  ? "#f0fdf4"
                  : status.type === "loading"
                  ? "#eff6ff"
                  : "#fff7ed",
            }}
          >
            <strong>
              {status.type === "success"
                ? "Success"
                : status.type === "loading"
                ? "Please wait"
                : "Attention"}
            </strong>
            <div>{status.message}</div>
          </div>
        )}

        <button
          onClick={resendEmail}
          disabled={status.type === "loading"}
          style={{
            marginTop: 18,
            padding: "12px 18px",
            borderRadius: 12,
            border: "none",
            fontWeight: 800,
            color: "#fff",
            cursor: "pointer",
            background: "linear-gradient(90deg,#fb7185,#60a5fa)",
            opacity: status.type === "loading" ? 0.6 : 1,
          }}
        >
          Resend verification email
        </button>

        <div style={{ marginTop: 18 }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#2563eb",
              textDecoration: "underline",
              fontWeight: 700,
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
