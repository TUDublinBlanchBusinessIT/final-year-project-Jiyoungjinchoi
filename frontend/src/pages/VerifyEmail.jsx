import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [email, setEmail] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("pawfection_user_email");
    if (!savedEmail) {
      navigate("/register");
      return;
    }
    setEmail(savedEmail);
  }, [navigate]);

  async function resendEmail() {
    setStatus({ type: "loading", message: "Resending verification email..." });

    try {
      const token = localStorage.getItem("pawfection_token");

      // If user is not logged in, we can still try using the email-based route
      // (ONLY if backend supports it). Otherwise you need the token.
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      // ✅ Add token if it exists (fixes most "Failed to fetch" + 401 issues)
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/email/verification-notification",
        {
          method: "POST",
          headers,
          body: JSON.stringify({ email }),
        }
      );

      // In case Laravel returns HTML error page, protect JSON parsing
      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        // Not JSON
      }

      if (!response.ok) {
        const msg =
          data?.message ||
          `Request failed (${response.status}). Check backend route/auth/CORS.`;
        throw new Error(msg);
      }

      setStatus({
        type: "success",
        message: data.message || "Verification email sent!",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Failed to fetch",
      });
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
            onClick={() => navigate("/register")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#2563eb",
              textDecoration: "underline",
              fontWeight: 700,
            }}
          >
            Back to Register
          </button>
        </div>
      </div>
    </div>
  );
}
