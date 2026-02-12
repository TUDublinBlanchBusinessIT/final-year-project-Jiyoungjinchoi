import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [email, setEmail] = useState("");

  // Read query param: verified=1 or verified=0
  const verifiedParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("verified"); // "1", "0", or null
  }, [location.search]);

  // Load saved email (used for resend)
  useEffect(() => {
    const savedEmail = localStorage.getItem("pawfection_user_email") || "";
    setEmail(savedEmail);
  }, []);

  // ✅ If verification completed, show message and redirect to login
  useEffect(() => {
    if (verifiedParam === "1") {
      setStatus({
        type: "success",
        message: "Verification Completed ✅ You can now log in.",
      });

      const timer = setTimeout(() => {
        navigate("/login");
      }, 2000);

      return () => clearTimeout(timer);
    }

    if (verifiedParam === "0") {
      setStatus({
        type: "error",
        message:
          "Invalid or expired verification link. Please resend the verification email.",
      });
    }
  }, [verifiedParam, navigate]);

  async function resendEmail() {
    // If email is missing, send user back to register
    if (!email) {
      navigate("/register");
      return;
    }

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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend email.");
      }

      setStatus({
        type: "success",
        message: data.message || "Verification email sent! Please check again.",
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to fetch" });
    }
  }

  const cardBg =
    status.type === "success"
      ? "#f0fdf4"
      : status.type === "loading"
      ? "#eff6ff"
      : status.type === "error"
      ? "#fff1f2"
      : "#ffffff";

  const statusBg =
    status.type === "success"
      ? "#f0fdf4"
      : status.type === "loading"
      ? "#eff6ff"
      : status.type === "error"
      ? "#fff1f2"
      : "#fff7ed";

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
          background: cardBg,
          borderRadius: 22,
          padding: 28,
          boxShadow: "0 12px 35px rgba(0,0,0,.07)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 26, margin: 0 }}>
          {verifiedParam === "1"
            ? "Email Verified"
            : verifiedParam === "0"
            ? "Verification Failed"
            : "Please verify your email"}
        </h1>

        {verifiedParam !== "1" && (
          <p style={{ marginTop: 10, color: "#555" }}>
            We sent a verification link to:{" "}
            <strong>{email ? email : "your email address"}</strong>
          </p>
        )}

        {status.type !== "idle" && (
          <div
            style={{
              marginTop: 20,
              padding: "12px 16px",
              borderRadius: 14,
              background: statusBg,
              border:
                status.type === "error"
                  ? "1px solid #fecdd3"
                  : status.type === "success"
                  ? "1px solid #bbf7d0"
                  : "1px solid #bfdbfe",
              textAlign: "left",
            }}
          >
            <strong>
              {status.type === "success"
                ? "Success"
                : status.type === "loading"
                ? "Please wait"
                : "Attention"}
            </strong>
            <div style={{ marginTop: 6 }}>{status.message}</div>
            {verifiedParam === "1" && (
              <div style={{ marginTop: 6 }}>Redirecting to login…</div>
            )}
          </div>
        )}

        {/* ✅ Success state: allow manual navigation too */}
        {verifiedParam === "1" && (
          <button
            onClick={() => navigate("/login")}
            style={{
              marginTop: 18,
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              fontWeight: 800,
              color: "#fff",
              cursor: "pointer",
              background: "linear-gradient(90deg,#22c55e,#60a5fa)",
            }}
          >
            Go to Login
          </button>
        )}

        {/* ❌ Normal/failed state: allow resend */}
        {verifiedParam !== "1" && (
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
        )}

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
