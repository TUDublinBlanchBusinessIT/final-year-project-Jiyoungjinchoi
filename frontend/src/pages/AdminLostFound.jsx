import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function AdminLostFound() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("all");
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
      const response = await fetch(`${API_BASE}/admin/lost-pets`, {
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
        message: Array.isArray(data) && data.length ? "" : "No lost pet reports found.",
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

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} report.`);
      }

      await fetchReports();

      setStatus({
        type: "success",
        message: data.message || `Report ${action}d successfully.`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Action failed.",
      });
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

  function getStatusLabel(reportStatus) {
    if (reportStatus === "approved") return "Approved";
    if (reportStatus === "hidden") return "Hidden";
    return "Pending Review";
  }

  const filteredReports = useMemo(() => {
    if (filter === "all") return reports;
    return reports.filter((report) => (report.status || "pending") === filter);
  }, [reports, filter]);

  const counts = useMemo(() => {
    const pending = reports.filter((report) => (report.status || "pending") === "pending").length;
    const approved = reports.filter((report) => report.status === "approved").length;
    const hidden = reports.filter((report) => report.status === "hidden").length;

    return {
      all: reports.length,
      pending,
      approved,
      hidden,
    };
  }, [reports]);

  function FilterButton({ value, label, count }) {
    const active = filter === value;

    return (
      <button
        onClick={() => setFilter(value)}
        style={{
          border: active ? "1px solid #111827" : "1px solid #e5e7eb",
          background: active ? "#111827" : "#ffffff",
          color: active ? "#ffffff" : "#111827",
          borderRadius: 999,
          padding: "10px 16px",
          fontWeight: 800,
          fontSize: 14,
          cursor: "pointer",
          transition: "0.2s ease",
        }}
      >
        {label} ({count})
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
        background: "linear-gradient(135deg, #f8fafc, #fdf2f8, #ecfeff)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
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
              Review, approve, and hide reported lost pet cases.
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

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <FilterButton value="all" label="All" count={counts.all} />
          <FilterButton value="pending" label="Pending" count={counts.pending} />
          <FilterButton value="approved" label="Approved" count={counts.approved} />
          <FilterButton value="hidden" label="Hidden" count={counts.hidden} />
        </div>

        {status.message && (
          <div
            style={{
              background: statusBg,
              border: statusBorder,
              color: "#374151",
              padding: 16,
              borderRadius: 16,
              marginBottom: 20,
              fontWeight: 700,
            }}
          >
            {status.message}
          </div>
        )}

        {filteredReports.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              padding: 28,
              boxShadow: "0 10px 24px rgba(0,0,0,.05)",
              color: "#6b7280",
              fontWeight: 700,
            }}
          >
            No reports found in this section.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {filteredReports.map((report) => {
              const badgeStyle = getBadgeStyle(report.status);
              const currentStatus = report.status || "pending";

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
                          border: "1px solid #e5e7eb",
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flexWrap: "wrap",
                          marginBottom: 10,
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 24,
                            color: "#111827",
                            fontWeight: 900,
                          }}
                        >
                          {report.pet_name || "Unnamed Pet"}
                        </h3>

                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontWeight: 800,
                            fontSize: 13,
                            background: badgeStyle.background,
                            color: badgeStyle.color,
                          }}
                        >
                          {getStatusLabel(currentStatus)}
                        </span>
                      </div>

                      <p style={{ margin: "6px 0", color: "#334155", lineHeight: 1.5 }}>
                        <strong>Description:</strong> {report.description || "No description provided."}
                      </p>

                      <p style={{ margin: "6px 0", color: "#334155", lineHeight: 1.5 }}>
                        <strong>Location:</strong> {report.location || "No location provided."}
                      </p>

                      <p style={{ margin: "6px 0", color: "#334155", lineHeight: 1.5 }}>
                        <strong>Created:</strong>{" "}
                        {report.created_at
                          ? new Date(report.created_at).toLocaleString()
                          : "Unknown"}
                      </p>

                      {currentStatus === "hidden" && (
                        <p
                          style={{
                            margin: "10px 0 0 0",
                            color: "#6b7280",
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          This report is hidden from normal users but still visible to administrators.
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 140 }}>
                      <button
                        onClick={() => handleAction(report.id, "approve")}
                        disabled={currentStatus === "approved"}
                        style={{
                          border: "none",
                          background: currentStatus === "approved" ? "#86efac" : "#16a34a",
                          color: "#fff",
                          borderRadius: 12,
                          padding: "10px 16px",
                          fontWeight: 700,
                          cursor: currentStatus === "approved" ? "not-allowed" : "pointer",
                          opacity: currentStatus === "approved" ? 0.75 : 1,
                        }}
                      >
                        {currentStatus === "approved" ? "Approved" : "Approve"}
                      </button>

                      <button
                        onClick={() => handleAction(report.id, "hide")}
                        disabled={currentStatus === "hidden"}
                        style={{
                          border: "none",
                          background: currentStatus === "hidden" ? "#fcd34d" : "#f59e0b",
                          color: "#fff",
                          borderRadius: 12,
                          padding: "10px 16px",
                          fontWeight: 700,
                          cursor: currentStatus === "hidden" ? "not-allowed" : "pointer",
                          opacity: currentStatus === "hidden" ? 0.75 : 1,
                        }}
                      >
                        {currentStatus === "hidden" ? "Hidden" : "Hide"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
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
                display: "block",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}