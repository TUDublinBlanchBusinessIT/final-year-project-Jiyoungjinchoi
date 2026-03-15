import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState(null);
  const [stats, setStats] = useState({
    flagged_posts: 0,
    reported_users: 0,
    lost_reports: 0,
  });
  const [status, setStatus] = useState({
    type: "loading",
    message: "Loading admin dashboard...",
  });

  useEffect(() => {
    const token = localStorage.getItem("pawfection_token");
    const savedUser = localStorage.getItem("pawfection_user");
    const savedRole = localStorage.getItem("pawfection_role");

    if (!token || !savedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);

    if (savedRole !== "admin") {
      navigate("/dashboard");
      return;
    }

    setAdminUser(parsedUser);

    async function loadAdminStats() {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/admin/dashboard", {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log("ADMIN DASHBOARD RESPONSE:", data);

        if (!response.ok) {
          throw new Error(data.message || "Failed to load admin dashboard.");
        }

        setStats({
          flagged_posts: data.flagged_posts ?? 0,
          reported_users: data.reported_users ?? 0,
          lost_reports: data.lost_reports ?? 0,
        });

        setStatus({
          type: "success",
          message: "Admin dashboard loaded successfully.",
        });
      } catch (error) {
        setStatus({
          type: "error",
          message: error.message || "Failed to load dashboard data.",
        });
      }
    }

    loadAdminStats();
  }, [navigate]);

  const statusBg =
    status.type === "success"
      ? "#f0fdf4"
      : status.type === "loading"
      ? "#eff6ff"
      : "#fff7ed";

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
          maxWidth: 1200,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 12px 35px rgba(0,0,0,.07)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 36, color: "#1f2937" }}>
              Admin Dashboard
            </h1>
            <p style={{ marginTop: 8, color: "#6b7280" }}>
              Manage Pawfection moderation and platform controls.
            </p>
          </div>

          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: "12px 16px",
              minWidth: 180,
            }}
          >
            <div style={{ fontWeight: 800, color: "#111827" }}>
              {adminUser?.name || "Admin"}
            </div>
            <div style={{ color: "#6b7280", fontSize: 14 }}>Administrator</div>
          </div>
        </div>

        <div
          style={{
            marginBottom: 20,
            padding: "12px 14px",
            borderRadius: 14,
            background: statusBg,
            color: "#374151",
            fontWeight: 600,
          }}
        >
          {status.message}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          <div
            style={{
              background: "#fff7ed",
              borderRadius: 20,
              padding: 22,
              border: "1px solid #fed7aa",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#9a3412" }}>Flagged Posts</h2>
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: "#7c2d12",
                marginBottom: 8,
              }}
            >
              {stats.flagged_posts}
            </div>
            <p style={{ color: "#7c2d12", margin: 0 }}>
              Community posts requiring moderation review.
            </p>
          </div>

          <div
            style={{
              background: "#fdf2f8",
              borderRadius: 20,
              padding: 22,
              border: "1px solid #fbcfe8",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#9d174d" }}>Reported Users</h2>
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: "#831843",
                marginBottom: 8,
              }}
            >
              {stats.reported_users}
            </div>
            <p style={{ color: "#831843", margin: 0 }}>
              Users currently banned or marked for admin attention.
            </p>
          </div>

          <div
            style={{
              background: "#ecfeff",
              borderRadius: 20,
              padding: 22,
              border: "1px solid #a5f3fc",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#155e75" }}>Lost &amp; Found Reports</h2>
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: "#164e63",
                marginBottom: 8,
              }}
            >
              {stats.lost_reports}
            </div>
            <p style={{ color: "#164e63", margin: 0 }}>
              Total lost pet reports currently in the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}