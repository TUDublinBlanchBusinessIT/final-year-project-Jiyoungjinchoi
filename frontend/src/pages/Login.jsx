import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setStatus({ type: "loading", message: "Logging in..." });

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      const userRole = String(data?.user?.role || "").toLowerCase();
      const legacyAccountType = String(data?.user?.account_type || "").toLowerCase();

      const role =
        userRole === "admin" || legacyAccountType === "admin"
          ? "admin"
          : "user";

      localStorage.setItem("pawfection_token", data.token);
      localStorage.setItem("pawfection_user", JSON.stringify(data.user));
      localStorage.setItem("pawfection_user_email", data.user.email);
      localStorage.setItem("pawfection_role", role);

      setStatus({ type: "success", message: "Login successful 🎉" });

      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 700);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Failed to fetch",
      });
    }
  }

  const statusBg =
    status.type === "success"
      ? "#f0fdf4"
      : status.type === "loading"
      ? "#eff6ff"
      : "#fff7ed";

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
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
          maxWidth: 480,
          background: "#fff",
          borderRadius: 22,
          padding: 28,
          boxShadow: "0 12px 35px rgba(0,0,0,.07)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 26, margin: 0 }}>Login to Pawfection</h1>
        <p style={{ marginTop: 10, marginBottom: 0, color: "#555" }}>
          Enter your email and password to access your account.
        </p>

        {status.type !== "idle" && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 14,
              background: statusBg,
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
            <div style={{ marginTop: 4 }}>{status.message}</div>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ marginTop: 18, textAlign: "left" }}>
          <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              marginBottom: 14,
              boxSizing: "border-box",
            }}
          />

          <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={status.type === "loading"}
            style={{
              marginTop: 18,
              width: "100%",
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
            Login
          </button>
        </form>

        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => navigate("/register")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#2563eb",
              textDecoration: "underline",
              fontWeight: 700,
              padding: 0,
            }}
          >
            Go to Register
          </button>
        </div>
      </div>
    </div>
  );
}