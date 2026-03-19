import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const lostSectionRef = useRef(null);

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

  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

  async function fetchJson(url, token, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const rawText = await response.text();

    let data = null;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      throw new Error(
        `Server returned invalid JSON from ${url}. Response was: ${rawText.slice(0, 120)}`
      );
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed: ${response.status}`);
    }

    return data;
  }

  useEffect(() => {
    const token = localStorage.getItem("pawfection_token");
    const savedUser = localStorage.getItem("pawfection_user");
    const savedRole = localStorage.getItem("pawfection_role");

    if (!token || !savedUser) {
      navigate("/login");
      return;
    }

    let parsedUser = null;

    try {
      parsedUser = JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("pawfection_user");
      localStorage.removeItem("pawfection_token");
      localStorage.removeItem("pawfection_role");
      navigate("/login");
      return;
    }

    if (savedRole !== "admin") {
      navigate("/dashboard");
      return;
    }

    setAdminUser(parsedUser);

    async function loadAdminData() {
      try {
        const [dashboardData, reportsData] = await Promise.all([
          fetchJson(`${API_BASE}/admin/dashboard`, token),
          fetchJson(`${API_BASE}/admin/lost-pets`, token),
        ]);

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

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const [dashboardData, reportsData] = await Promise.all([
        fetchJson(`${API_BASE}/admin/dashboard`, token),
        fetchJson(`${API_BASE}/admin/lost-pets`, token),
      ]);

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

    if (!token) {
      navigate("/login");
      return;
    }

    let url = "";

    if (action === "approve") {
      url = `${API_BASE}/admin/lost-pets/${id}/approve`;
    } else if (action === "hide") {
      url = `${API_BASE}/admin/lost-pets/${id}/hide`;
    } else {
      return;
    }

    try {
      setStatus({
        type: "loading",
        message: `Processing ${action} action...`,
      });

      const data = await fetchJson(url, token, {
        method: "PATCH",
      });

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

  function StatCard({ title, value, subtitle, bg, border, titleColor, valueColor, onClick }) {
    return (
      <button
        onClick={onClick}
        style={{
          background: bg,
          borderRadius: 22,
          padding: 26,
          border,
          boxShadow: "0 10px 26px rgba(0,0,0,.03)",
          textAlign: "left",
          cursor: "pointer",
          transition: "0.2s ease",
          width: "100%",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 18,
            color: titleColor,
            fontSize: 26,
          }}
        >
          {title}
        </h2>
        <div
          style={{
            fontSize: 54,
            fontWeight: 900,
            color: valueColor,
            marginBottom: 12,
          }}
        >
          {value}
        </div>
        <p
          style={{
            color: valueColor,
            margin: 0,
            fontSize: 16,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      </button>
    );
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

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "linear-gradient(135deg, #f8fafc 0%, #fdf2f8 35%, #ecfeff 70%, #f0fdf4 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)",
          borderRadius: 28,
          padding: 34,
          boxShadow: "0 18px 50px rgba(0,0,0,.08)",
          border: "1px solid rgba(255,255,255,.8)",
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
                color: "#111827",
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
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minWidth: 220,
            }}
          >
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 20,
                padding: "16px 20px",
                minWidth: 220,
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
              <div style={{ color: "#6b7280", fontSize: 15 }}>Administrator</div>
            </div>

            <button
              onClick={() => navigate("/admin/logs")}
              style={{
                border: "none",
                background: "#111827",
                color: "#fff",
                borderRadius: 12,
                padding: "12px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              View Activity Logs
            </button>
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
          <StatCard
            title="Flagged Posts"
            value={stats.flagged_posts}
            subtitle="Community posts requiring moderation review."
            bg="#fff7ed"
            border="1px solid #fdba74"
            titleColor="#9a3412"
            valueColor="#7c2d12"
            onClick={() => navigate("/admin/moderation")}
          />

          <StatCard
            title="Reported Users"
            value={stats.reported_users}
            subtitle="Users currently banned or marked for admin attention."
            bg="#fdf2f8"
            border="1px solid #f9a8d4"
            titleColor="#9d174d"
            valueColor="#831843"
            onClick={() => navigate("/admin/users")}
          />

          <StatCard
            title="Lost & Found Reports"
            value={stats.lost_reports}
            subtitle="All lost pet reports including hidden ones for admin review."
            bg="#ecfeff"
            border="1px solid #67e8f9"
            titleColor="#155e75"
            valueColor="#164e63"
            onClick={() => navigate("/admin/lost-found")}
          />
        </div>

        <div ref={lostSectionRef}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              marginBottom: 18,
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              Moderate Lost & Found Posts
            </h2>

            <button
              onClick={() => navigate("/admin/lost-found")}
              style={{
                border: "none",
                background: "#111827",
                color: "#fff",
                borderRadius: 12,
                padding: "12px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Open Full Page
            </button>
          </div>

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
              {lostReports.slice(0, 3).map((report) => {
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
                            onClick={() => {
                              setPreviewImage(report.photo);
                              setPreviewTitle(report.pet_name || "Lost pet");
                            }}
                            style={{
                              width: 120,
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 16,
                              border: "1px solid #e5e7eb",
                              flexShrink: 0,
                              cursor: "pointer",
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

                          <p style={{ margin: "8px 0", color: "#334155", fontSize: 17 }}>
                            <strong>Description:</strong>{" "}
                            {report.description || "No description provided."}
                          </p>

                          <p style={{ margin: "8px 0", color: "#334155", fontSize: 17 }}>
                            <strong>Location:</strong> {report.location || "No location"}
                          </p>

                          <p style={{ margin: "8px 0", color: "#334155", fontSize: 17 }}>
                            <strong>Created:</strong>{" "}
                            {report.created_at
                              ? new Date(report.created_at).toLocaleString()
                              : "Unknown"}
                          </p>

                          <p style={{ margin: "10px 0 0 0", color: "#334155", fontSize: 17 }}>
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
                          onClick={() => handleModerationAction(report.id, "approve")}
                          style={{
                            border: "none",
                            borderRadius: 12,
                            padding: "12px 18px",
                            fontWeight: 700,
                            cursor: "pointer",
                            background: "#16a34a",
                            color: "#fff",
                          }}
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => handleModerationAction(report.id, "hide")}
                          style={{
                            border: "none",
                            borderRadius: 12,
                            padding: "12px 18px",
                            fontWeight: 700,
                            cursor: "pointer",
                            background: "#f59e0b",
                            color: "#fff",
                          }}
                        >
                          Hide
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

      {previewImage && (
        <div
          onClick={() => {
            setPreviewImage(null);
            setPreviewTitle("");
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 20,
              maxWidth: "90vw",
              maxHeight: "90vh",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                gap: 16,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                {previewTitle}
              </h3>

              <button
                onClick={() => {
                  setPreviewImage(null);
                  setPreviewTitle("");
                }}
                style={{
                  border: "none",
                  background: "#ef4444",
                  color: "#ffffff",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <img
              src={previewImage}
              alt={previewTitle}
              style={{
                maxWidth: "100%",
                maxHeight: "75vh",
                borderRadius: 16,
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}