import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLostFound() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState({
    type: "loading",
    message: "Loading lost and found moderation...",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("pawfection_token");
    const role = localStorage.getItem("pawfection_role");

    if (!token) {
      navigate("/login");
      return;
    }

    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }

    fetchReports();
  }, [navigate]);

  async function fetchReports() {
    const token = localStorage.getItem("pawfection_token");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/lost-pets", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load lost pet reports.");
      }

      setReports(Array.isArray(data) ? data : []);
      setStatus({
        type: "success",
        message: data.length ? "" : "No lost pet reports found.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong.",
      });
    }
  }

  async function handleAction(id, action) {
    const token = localStorage.getItem("pawfection_token");

    let url = "";
    let method = "PATCH";

    if (action === "approve") {
      url = `http://127.0.0.1:8000/api/admin/lost-pets/${id}/approve`;
    } else if (action === "hide") {
      url = `http://127.0.0.1:8000/api/admin/lost-pets/${id}/hide`;
    } else if (action === "delete") {
      const confirmed = window.confirm("Delete this report?");
      if (!confirmed) return;
      url = `http://127.0.0.1:8000/api/admin/lost-pets/${id}`;
      method = "DELETE";
    }

    try {
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

      fetchReports();
    } catch (error) {
      alert(error.message || "Action failed.");
    }
  }

  function getBadgeStyle(reportStatus) {
    if (reportStatus === "approved") {
      return { background: "#dcfce7", color: "#166534" };
    }
    if (reportStatus === "hidden") {
      return { background: "#e5e7eb", color: "#374151" };
    }
    return { background: "#fef3c7", color: "#92400e" };
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc, #fdf2f8, #ecfeff)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, color: "#111827" }}>
              Lost & Found Moderation
            </h1>
            <p style={{ marginTop: 10, color: "#64748b", fontSize: 18 }}>
              Review and manage reported lost pet cases.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/dashboard")}
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
            Back to Dashboard
          </button>
        </div>

        {status.type === "error" && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#9a3412",
              padding: 16,
              borderRadius: 16,
              marginBottom: 20,
              fontWeight: 700,
            }}
          >
            {status.message}
          </div>
        )}

        <div style={{ display: "grid", gap: 18 }}>
          {reports.map((report) => {
            const badgeStyle = getBadgeStyle(report.status);

            return (
              <div
                key={report.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: "0 10px 24px rgba(0,0,0,.05)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr auto",
                    gap: 18,
                    alignItems: "start",
                  }}
                >
                  {report.photo ? (
                    <img
                      src={report.photo}
                      alt={report.pet_name}
                      onClick={() => {
                        setPreviewImage(report.photo);
                        setPreviewTitle(report.pet_name || "Lost pet");
                      }}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 16,
                        cursor: "pointer",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 16,
                        background: "#f8fafc",
                        border: "1px dashed #cbd5e1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        fontWeight: 700,
                      }}
                    >
                      No Photo
                    </div>
                  )}

                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 24, color: "#111827" }}>
                      {report.pet_name}
                    </h3>

                    <p style={{ margin: "6px 0", color: "#334155" }}>
                      <strong>Description:</strong> {report.description}
                    </p>

                    <p style={{ margin: "6px 0", color: "#334155" }}>
                      <strong>Location:</strong> {report.location}
                    </p>

                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 8,
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontWeight: 800,
                        fontSize: 14,
                        background: badgeStyle.background,
                        color: badgeStyle.color,
                      }}
                    >
                      {report.status || "pending"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      onClick={() => handleAction(report.id, "approve")}
                      style={{
                        border: "none",
                        background: "#16a34a",
                        color: "#fff",
                        borderRadius: 12,
                        padding: "10px 16px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "hide")}
                      style={{
                        border: "none",
                        background: "#f59e0b",
                        color: "#fff",
                        borderRadius: 12,
                        padding: "10px 16px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "delete")}
                      style={{
                        border: "none",
                        background: "#dc2626",
                        color: "#fff",
                        borderRadius: 12,
                        padding: "10px 16px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
              background: "#fff",
              borderRadius: 20,
              padding: 20,
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                gap: 12,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{previewTitle}</h3>
              <button
                onClick={() => {
                  setPreviewImage(null);
                  setPreviewTitle("");
                }}
                style={{
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
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
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}