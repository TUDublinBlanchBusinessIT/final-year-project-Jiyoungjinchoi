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
  const [lostReports, setLostReports] = useState([]);
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

    async function loadAdminData() {
      try {
        const [dashboardResponse, reportsResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/admin/dashboard", {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://127.0.0.1:8000/api/admin/lost-pets", {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const dashboardData = await dashboardResponse.json();
        const reportsData = await reportsResponse.json();

        if (!dashboardResponse.ok) {
          throw new Error(
            dashboardData.message || "Failed to load admin dashboard."
          );
        }

        if (!reportsResponse.ok) {
          throw new Error(
            reportsData.message || "Failed to load lost pet reports."
          );
        }

        setStats({
          flagged_posts: dashboardData.flagged_posts ?? 0,
          reported_users: dashboardData.reported_users ?? 0,
          lost_reports: dashboardData.lost_reports ?? 0,
        });

        setLostReports(Array.isArray(reportsData) ? reportsData : []);

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

    loadAdminData();
  }, [navigate]);

  async function refreshAdminData() {
    const token = localStorage.getItem("pawfection_token");

    try {
      const [dashboardResponse, reportsResponse] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/admin/dashboard", {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("http://127.0.0.1:8000/api/admin/lost-pets", {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const dashboardData = await dashboardResponse.json();
      const reportsData = await reportsResponse.json();

      if (!dashboardResponse.ok) {
        throw new Error(
          dashboardData.message || "Failed to refresh dashboard."
        );
      }

      if (!reportsResponse.ok) {
        throw new Error(reportsData.message || "Failed to refresh reports.");
      }

      setStats({
        flagged_posts: dashboardData.flagged_posts ?? 0,
        reported_users: dashboardData.reported_users ?? 0,
        lost_reports: dashboardData.lost_reports ?? 0,
      });

      setLostReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Failed to refresh admin data.",
      });
    }
  }

  async function handleModerationAction(id, action) {
    const token = localStorage.getItem("pawfection_token");

    let url = "";
    let method = "PATCH";

    if (action === "approve") {
      url = `http://127.0.0.1:8000/api/admin/lost-pets/${id}/approve`;
    } else if (action === "hide") {
      url = `http://127.0.0.1:8000/api/admin/lost-pets/${id}/hide`;
    } else if (action === "delete") {
      const confirmed = window.confirm(
        "Are you sure you want to delete this lost pet report?"
      );
      if (!confirmed) return;

      url = `http://127.0.0.1:8000/api/admin/lost-pets/${id}`;
      method = "DELETE";
    }

    try {
      setStatus({
        type: "loading",
        message: `Processing ${action} action...`,
      });

      const response = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} report.`);
      }

      setStatus({
        type: "success",
        message: data.message || `Report ${action}d successfully.`,
      });

      await refreshAdminData();
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || `Failed to ${action} report.`,
      });
    }
  }

  const statusBg =
    status.type === "success"
      ? "#ecfdf5"
      : status.type === "loading"
      ? "#eff6ff"
      : "#fff7ed";

  const statusBorder =
    status.type === "success"
      ? "1px solid #bbf7d0"
      : status.type === "loading"
      ? "1px solid #bfdbfe"
      : "1px solid #fed7aa";

  const buttonBase = {
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
    minWidth: 130,
    transition: "0.2s ease",
  };

  const approveStyle = {
    ...buttonBase,
    background: "#16a34a",
    color: "#ffffff",
  };

  const hideStyle = {
    ...buttonBase,
    background: "#f59e0b",
    color: "#ffffff",
  };

  const deleteStyle = {
    ...buttonBase,
    background: "#dc2626",
    color: "#ffffff",
  };

  function getBadgeStyle(reportStatus) {
    if (reportStatus === "approved") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (reportStatus === "hidden") {
      return {
        background: "#e5e7eb",
        color: "#374151",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
    };
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
          maxWidth: 1420,
          margin: "0 auto",
          background: "#ffffffd9",
          backdropFilter: "blur(10px)",
          borderRadius: 28,
          padding: 34,
          boxShadow: "0 18px 50px rgba(0,0,0,.08)",
          border: "1px solid rgba(255,255,255,.7)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
            marginBottom: 26,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 58,
                lineHeight: 1.05,
                color: "#1f2937",
                fontWeight: 900,
              }}
            >
              Admin Dashboard
            </h1>
            <p
              style={{
                marginTop: 12,
                marginBottom: 0,
                color: "#64748b",
                fontSize: 22,
              }}
            >
              Manage Pawfection moderation and platform controls.
            </p>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              padding: "16px 20px",
              minWidth: 220,
              boxShadow: "0 8px 24px rgba(0,0,0,.03)",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: 20,
                color: "#111827",
                marginBottom: 4,
              }}
            >
              {adminUser?.name || "Admin"}
            </div>
            <div style={{ color: "#6b7280", fontSize: 15 }}>
              Administrator
            </div>
          </div>
        </div>

        <div
          style={{
            marginBottom: 28,
            padding: "16px 18px",
            borderRadius: 16,
            background: statusBg,
            border: statusBorder,
            color: "#374151",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {status.message}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              background: "#fff7ed",
              borderRadius: 22,
              padding: 26,
              border: "1px solid #fdba74",
              boxShadow: "0 10px 26px rgba(0,0,0,.03)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 18,
                color: "#9a3412",
                fontSize: 26,
              }}
            >
              Flagged Posts
            </h2>
            <div
              style={{
                fontSize: 54,
                fontWeight: 900,
                color: "#7c2d12",
                marginBottom: 12,
              }}
            >
              {stats.flagged_posts}
            </div>
            <p
              style={{
                color: "#7c2d12",
                margin: 0,
                fontSize: 16,
                lineHeight: 1.5,
              }}
            >
              Community posts requiring moderation review.
            </p>
          </div>

          <div
            style={{
              background: "#fdf2f8",
              borderRadius: 22,
              padding: 26,
              border: "1px solid #f9a8d4",
              boxShadow: "0 10px 26px rgba(0,0,0,.03)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 18,
                color: "#9d174d",
                fontSize: 26,
              }}
            >
              Reported Users
            </h2>
            <div
              style={{
                fontSize: 54,
                fontWeight: 900,
                color: "#831843",
                marginBottom: 12,
              }}
            >
              {stats.reported_users}
            </div>
            <p
              style={{
                color: "#831843",
                margin: 0,
                fontSize: 16,
                lineHeight: 1.5,
              }}
            >
              Users currently banned or marked for admin attention.
            </p>
          </div>

          <div
            style={{
              background: "#ecfeff",
              borderRadius: 22,
              padding: 26,
              border: "1px solid #67e8f9",
              boxShadow: "0 10px 26px rgba(0,0,0,.03)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 18,
                color: "#155e75",
                fontSize: 26,
              }}
            >
              Lost &amp; Found Reports
            </h2>
            <div
              style={{
                fontSize: 54,
                fontWeight: 900,
                color: "#164e63",
                marginBottom: 12,
              }}
            >
              {stats.lost_reports}
            </div>
            <p
              style={{
                color: "#164e63",
                margin: 0,
                fontSize: 16,
                lineHeight: 1.5,
              }}
            >
              Total lost pet reports currently in the system.
            </p>
          </div>
        </div>

        <div>
          <h2
            style={{
              marginTop: 0,
              marginBottom: 18,
              color: "#0f172a",
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            Moderate Lost &amp; Found Posts
          </h2>

          {lostReports.length === 0 ? (
            <div
              style={{
                padding: 24,
                borderRadius: 18,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                color: "#6b7280",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              No lost pet reports found.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 22 }}>
              {lostReports.map((report) => {
                const badgeStyle = getBadgeStyle(report.status);

                return (
                  <div
                    key={report.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 22,
                      padding: 24,
                      background: "#ffffff",
                      boxShadow: "0 10px 26px rgba(0,0,0,.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 24,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 18,
                          alignItems: "flex-start",
                          flex: 1,
                          minWidth: 260,
                        }}
                      >
                        {report.photo ? (
                          <img
                            src={report.photo}
                            alt={report.pet_name || "Lost pet"}
                            style={{
                              width: 120,
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 16,
                              border: "1px solid #e5e7eb",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 120,
                              height: 120,
                              borderRadius: 16,
                              border: "1px dashed #cbd5e1",
                              background: "#f8fafc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#94a3b8",
                              fontWeight: 700,
                              fontSize: 14,
                              textAlign: "center",
                              padding: 10,
                              flexShrink: 0,
                            }}
                          >
                            No Photo
                          </div>
                        )}

                        <div style={{ flex: 1 }}>
                          <h3
                            style={{
                              marginTop: 0,
                              marginBottom: 10,
                              color: "#0f172a",
                              fontSize: 22,
                              fontWeight: 900,
                            }}
                          >
                            {report.pet_name || "Unnamed Pet"}
                          </h3>

                          <p
                            style={{
                              margin: "8px 0",
                              color: "#334155",
                              fontSize: 17,
                            }}
                          >
                            <strong>Description:</strong>{" "}
                            {report.description || "No description provided."}
                          </p>

                          <p
                            style={{
                              margin: "8px 0",
                              color: "#334155",
                              fontSize: 17,
                            }}
                          >
                            <strong>Location:</strong>{" "}
                            {report.location || "No location"}
                          </p>

                          <p
                            style={{
                              margin: "10px 0 0 0",
                              color: "#334155",
                              fontSize: 17,
                            }}
                          >
                            <strong>Status:</strong>{" "}
                            <span
                              style={{
                                display: "inline-block",
                                padding: "6px 12px",
                                borderRadius: 999,
                                fontSize: 14,
                                fontWeight: 800,
                                background: badgeStyle.background,
                                color: badgeStyle.color,
                              }}
                            >
                              {report.status || "pending"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                          minWidth: 180,
                        }}
                      >
                        <button
                          onClick={() =>
                            handleModerationAction(report.id, "approve")
                          }
                          style={approveStyle}
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            handleModerationAction(report.id, "hide")
                          }
                          style={hideStyle}
                        >
                          Hide
                        </button>

                        <button
                          onClick={() =>
                            handleModerationAction(report.id, "delete")
                          }
                          style={deleteStyle}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}