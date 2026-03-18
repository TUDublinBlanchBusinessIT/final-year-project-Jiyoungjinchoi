import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState({
    type: "loading",
    message: "Loading users...",
  });
  const [loadingAction, setLoadingAction] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("pawfection_admin_dark_mode");
    if (savedTheme === "true") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pawfection_admin_dark_mode", darkMode ? "true" : "false");
  }, [darkMode]);

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

    fetchUsers();
  }, [navigate]);

  async function fetchUsers() {
    const token = localStorage.getItem("pawfection_token");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load users.");
      }

      setUsers(Array.isArray(data) ? data : []);
      setStatus({
        type: "success",
        message: data.length === 0 ? "No users found." : "",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong.",
      });
    }
  }

  async function toggleBan(userId, isBanned) {
    const token = localStorage.getItem("pawfection_token");

    setLoadingAction((prev) => ({ ...prev, [`ban-${userId}`]: true }));

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/users/${userId}/${isBanned ? "unban" : "ban"}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Action failed.");
      }

      await fetchUsers();
    } catch (error) {
      alert(error.message || "Something went wrong.");
    } finally {
      setLoadingAction((prev) => ({ ...prev, [`ban-${userId}`]: false }));
    }
  }

  async function toggleSuspend(userId, isSuspended) {
    const token = localStorage.getItem("pawfection_token");

    setLoadingAction((prev) => ({ ...prev, [`suspend-${userId}`]: true }));

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/users/${userId}/${isSuspended ? "unsuspend" : "suspend"}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Action failed.");
      }

      await fetchUsers();
    } catch (error) {
      alert(error.message || "Something went wrong.");
    } finally {
      setLoadingAction((prev) => ({ ...prev, [`suspend-${userId}`]: false }));
    }
  }

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (user) =>
          user.name?.toLowerCase().includes(q) ||
          user.email?.toLowerCase().includes(q)
      );
    }

    if (filter === "active") {
      result = result.filter((user) => !user.is_banned && !user.is_suspended);
    }

    if (filter === "banned") {
      result = result.filter((user) => !!user.is_banned);
    }

    if (filter === "suspended") {
      result = result.filter((user) => !!user.is_suspended && !user.is_banned);
    }

    return result;
  }, [users, search, filter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => !u.is_banned && !u.is_suspended).length,
      suspended: users.filter((u) => !!u.is_suspended && !u.is_banned).length,
      banned: users.filter((u) => !!u.is_banned).length,
    };
  }, [users]);

  function getStatusBadge(user) {
    if (user.is_banned) {
      return {
        text: "Banned",
        bg: darkMode ? "#3b0d0d" : "#fee2e2",
        color: darkMode ? "#fca5a5" : "#991b1b",
      };
    }

    if (user.is_suspended) {
      return {
        text: "Suspended",
        bg: darkMode ? "#3a2a05" : "#fef3c7",
        color: darkMode ? "#fde68a" : "#92400e",
      };
    }

    return {
      text: "Active",
      bg: darkMode ? "#0f2e1b" : "#dcfce7",
      color: darkMode ? "#86efac" : "#166534",
    };
  }

  const theme = {
    pageBg: darkMode
      ? "linear-gradient(135deg, #0f172a, #111827, #1f2937)"
      : "linear-gradient(135deg, #f8fafc, #fdf2f8)",
    cardBg: darkMode ? "#111827" : "#ffffff",
    border: darkMode ? "#374151" : "#e5e7eb",
    text: darkMode ? "#f9fafb" : "#111827",
    subtext: darkMode ? "#94a3b8" : "#64748b",
    softBg: darkMode ? "#0b1220" : "#f8fafc",
    tableHeadBg: darkMode ? "#0b1220" : "#f9fafb",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.pageBg,
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
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, color: theme.text }}>
              User Management
            </h1>
            <p style={{ marginTop: 10, color: theme.subtext, fontSize: 18 }}>
              Search, filter, suspend, and manage user accounts.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              style={{
                border: `1px solid ${theme.border}`,
                background: theme.cardBg,
                color: theme.text,
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

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
              Back
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <StatCard title="Total Users" value={stats.total} darkMode={darkMode} />
          <StatCard title="Active Users" value={stats.active} darkMode={darkMode} />
          <StatCard title="Suspended Users" value={stats.suspended} darkMode={darkMode} />
          <StatCard title="Banned Users" value={stats.banned} darkMode={darkMode} />
        </div>

        <div
          style={{
            background: theme.cardBg,
            borderRadius: 24,
            padding: 20,
            border: `1px solid ${theme.border}`,
            boxShadow: darkMode
              ? "0 12px 28px rgba(0,0,0,.35)"
              : "0 12px 30px rgba(0,0,0,.05)",
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
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 240,
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                background: theme.softBg,
                color: theme.text,
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
                border: `1px solid ${theme.border}`,
                background: theme.softBg,
                color: theme.text,
                fontSize: 15,
              }}
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="banned">Banned Only</option>
            </select>
          </div>
        </div>

        {status.type === "error" && (
          <div
            style={{
              background: darkMode ? "#2b1414" : "#fff7ed",
              border: darkMode ? "1px solid #7f1d1d" : "1px solid #fed7aa",
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
              fontWeight: 600,
              color: darkMode ? "#fca5a5" : "#9a3412",
            }}
          >
            {status.message}
          </div>
        )}

        {status.type === "success" && filteredUsers.length === 0 && (
          <div
            style={{
              background: darkMode ? "#0f1d36" : "#eff6ff",
              border: darkMode ? "1px solid #1d4ed8" : "1px solid #bfdbfe",
              padding: 16,
              borderRadius: 12,
              fontWeight: 600,
              color: darkMode ? "#93c5fd" : "#1d4ed8",
            }}
          >
            No matching users found.
          </div>
        )}

        {filteredUsers.length > 0 && (
          <div
            style={{
              background: theme.cardBg,
              borderRadius: 24,
              border: `1px solid ${theme.border}`,
              overflow: "hidden",
              boxShadow: darkMode
                ? "0 12px 28px rgba(0,0,0,.35)"
                : "0 12px 30px rgba(0,0,0,.05)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: theme.tableHeadBg }}>
                <tr>
                  <th style={{ ...thStyle, color: theme.subtext }}>Name</th>
                  <th style={{ ...thStyle, color: theme.subtext }}>Email</th>
                  <th style={{ ...thStyle, color: theme.subtext }}>Joined</th>
                  <th style={{ ...thStyle, color: theme.subtext }}>Status</th>
                  <th style={{ ...thStyle, color: theme.subtext }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const badge = getStatusBadge(user);

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderTop: `1px solid ${theme.border}`,
                      }}
                    >
                      <td style={{ ...tdStyle, color: theme.text, fontWeight: 700 }}>
                        {user.name}
                      </td>

                      <td style={{ ...tdStyle, color: theme.text }}>
                        {user.email}
                      </td>

                      <td style={{ ...tdStyle, color: theme.text }}>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString("en-IE")
                          : "-"}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontWeight: 700,
                            fontSize: 13,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.text}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={() => toggleSuspend(user.id, user.is_suspended)}
                            disabled={loadingAction[`suspend-${user.id}`] || user.is_banned}
                            style={{
                              border: "none",
                              borderRadius: 10,
                              padding: "9px 14px",
                              fontWeight: 700,
                              cursor: user.is_banned ? "not-allowed" : "pointer",
                              background: user.is_suspended ? "#2563eb" : "#f59e0b",
                              color: "#fff",
                              opacity:
                                loadingAction[`suspend-${user.id}`] || user.is_banned ? 0.7 : 1,
                            }}
                          >
                            {loadingAction[`suspend-${user.id}`]
                              ? "Working..."
                              : user.is_banned
                              ? "Banned"
                              : user.is_suspended
                              ? "Unsuspend"
                              : "Suspend"}
                          </button>

                          <button
                            onClick={() => toggleBan(user.id, user.is_banned)}
                            disabled={loadingAction[`ban-${user.id}`]}
                            style={{
                              border: "none",
                              borderRadius: 10,
                              padding: "9px 14px",
                              fontWeight: 700,
                              cursor: "pointer",
                              background: user.is_banned ? "#16a34a" : "#dc2626",
                              color: "#fff",
                              opacity: loadingAction[`ban-${user.id}`] ? 0.7 : 1,
                            }}
                          >
                            {loadingAction[`ban-${user.id}`]
                              ? "Working..."
                              : user.is_banned
                              ? "Unban"
                              : "Ban"}
                          </button>
                        </div>
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

function StatCard({ title, value, darkMode }) {
  return (
    <div
      style={{
        background: darkMode ? "#111827" : "#ffffff",
        border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 20,
        boxShadow: darkMode
          ? "0 12px 28px rgba(0,0,0,.35)"
          : "0 12px 28px rgba(0,0,0,.04)",
      }}
    >
      <div
        style={{
          color: darkMode ? "#94a3b8" : "#6b7280",
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: darkMode ? "#f9fafb" : "#111827",
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
};

const tdStyle = {
  padding: "14px 16px",
  fontSize: 15,
};