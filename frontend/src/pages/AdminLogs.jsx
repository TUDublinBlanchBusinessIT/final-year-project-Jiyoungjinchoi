import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function AdminLogs() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({
    type: "loading",
    message: "Loading admin activity logs...",
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

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

    fetchLogs();
  }, [navigate]);

  async function fetchLogs() {
    const token = localStorage.getItem("pawfection_token");

    try {
      const response = await fetch(`${API_BASE}/admin/logs`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load admin logs.");
      }

      setLogs(Array.isArray(data) ? data : []);
      setStatus({
        type: "success",
        message: Array.isArray(data) && data.length ? "" : "No admin activity found yet.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong while loading admin logs.",
      });
    }
  }

  function formatAction(action) {
    if (!action) return "Unknown";

    return action
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function formatTargetType(type) {
    if (!type) return "Unknown";

    if (type === "lost_pet") return "Lost Pet";
    if (type === "post") return "Post";
    if (type === "user") return "User";

    return type.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function getBadgeStyle(action) {
    const normalized = (action || "").toLowerCase();

    if (["approved", "unbanned", "unsuspended"].includes(normalized)) {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (["hidden", "removed", "deleted"].includes(normalized)) {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    if (["banned", "suspended"].includes(normalized)) {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    return {
      background: "#e0f2fe",
      color: "#075985",
    };
  }

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (filter !== "all") {
      result = result.filter((log) => log.target_type === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter((log) => {
        const adminName = log.admin?.name?.toLowerCase() || "";
        const action = log.action?.toLowerCase() || "";
        const targetType = log.target_type?.toLowerCase() || "";
        const targetId = String(log.target_id || "");

        return (
          adminName.includes(q) ||
          action.includes(q) ||
          targetType.includes(q) ||
          targetId.includes(q)
        );
      });
    }

    return result;
  }, [logs, search, filter]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      users: logs.filter((log) => log.target_type === "user").length,
      posts: logs.filter((log) => log.target_type === "post").length,
      lostPets: logs.filter((log) => log.target_type === "lost_pet").length,
    };
  }, [logs]);

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
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, color: "#111827" }}>
              Admin Activity Logs
            </h1>
            <p style={{ marginTop: 10, color: "#64748b", fontSize: 18 }}>
              Review recent moderation and admin actions across the platform.
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
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <StatCard title="Total Logs" value={stats.total} />
          <StatCard title="User Actions" value={stats.users} />
          <StatCard title="Post Actions" value={stats.posts} />
          <StatCard title="Lost Pet Actions" value={stats.lostPets} />
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 24,
            padding: 20,
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(0,0,0,.05)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Search by admin, action, target type, or target ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 240,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                color: "#111827",
                outline: "none",
                fontSize: 15,
              }}
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                color: "#111827",
                fontSize: 15,
              }}
            >
              <option value="all">All Targets</option>
              <option value="user">Users</option>
              <option value="post">Posts</option>
              <option value="lost_pet">Lost Pets</option>
            </select>
          </div>
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

        {filteredLogs.length > 0 && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 24,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              boxShadow: "0 12px 30px rgba(0,0,0,.05)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={thStyle}>Admin</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Target Type</th>
                  <th style={thStyle}>Target ID</th>
                  <th style={thStyle}>Time</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => {
                  const badge = getBadgeStyle(log.action);

                  return (
                    <tr key={log.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={tdStyle}>{log.admin?.name || `Admin #${log.admin_id}`}</td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontWeight: 700,
                            fontSize: 13,
                            background: badge.background,
                            color: badge.color,
                          }}
                        >
                          {formatAction(log.action)}
                        </span>
                      </td>

                      <td style={tdStyle}>{formatTargetType(log.target_type)}</td>

                      <td style={tdStyle}>#{log.target_id}</td>

                      <td style={tdStyle}>
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("en-IE")
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 12px 28px rgba(0,0,0,.04)",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: "#111827",
          fontSize: 34,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "14px 16px",
  fontSize: 14,
  color: "#64748b",
};

const tdStyle = {
  padding: "14px 16px",
  fontSize: 15,
  color: "#111827",
};