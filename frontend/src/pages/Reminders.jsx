import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./Reminders.css";

export default function Reminders() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | upcoming | birthday | vaccine | grooming

  const authHeaders = useMemo(() => {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const loadUserName = () => {
    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name && typeof userObj.name === "string") setUserName(userObj.name);
        return;
      }
      const fallbackName =
        localStorage.getItem("pawfection_user_name") ||
        localStorage.getItem("user_name") ||
        localStorage.getItem("name");
      if (fallbackName) setUserName(fallbackName);
    } catch {
      setUserName("User");
    }
  };

  const fetchReminders = async () => {
    if (!token) return navigate("/login");
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/reminders`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ([]));

      if (!res.ok) {
        setError(data?.message || "Failed to load reminders.");
        setReminders([]);
      } else {
        setReminders(Array.isArray(data) ? data : []);
      }
    } catch {
      setError("Server error. Is your backend running?");
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const generateReminders = async () => {
    if (!token) return navigate("/login");
    setWorking(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/reminders/generate`, {
        method: "POST",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to generate reminders.");
      } else {
        setSuccess(`Reminders generated! Newly created: ${data?.created ?? 0}`);
        await fetchReminders();
      }
    } catch {
      setError("Server error. Is your backend running?");
    } finally {
      setWorking(false);
    }
  };

  const completeReminder = async (id) => {
    if (!token) return navigate("/login");
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/reminders/${id}/complete`, {
        method: "PATCH",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to mark reminder as done.");
      } else {
        setSuccess("Reminder marked as completed!");
        await fetchReminders();
      }
    } catch {
      setError("Server error. Is your backend running?");
    }
  };

  const snoozeReminder = async (id, days) => {
    if (!token) return navigate("/login");
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/reminders/${id}/snooze`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to snooze reminder.");
      } else {
        setSuccess(`Reminder snoozed by ${days} day(s)!`);
        await fetchReminders();
      }
    } catch {
      setError("Server error. Is your backend running?");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IE", { year: "numeric", month: "short", day: "2-digit" });
  };

  const typeLabel = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "birthday") return "Birthday";
    if (t === "vaccine") return "Vaccine";
    if (t === "grooming") return "Grooming";
    return type || "Reminder";
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadUserName();
    fetchReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReminders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let list = (reminders || []).slice().sort((a, b) => new Date(a.reminder_date) - new Date(b.reminder_date));

    if (filter === "upcoming") {
      list = list.filter((r) => {
        if ((r.status || "").toLowerCase() === "completed") return false;
        const d = new Date(r.reminder_date);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      });
    } else if (filter !== "all") {
      list = list.filter((r) => (r.type || "").toLowerCase() === filter);
    }

    if (!q) return list;

    return list.filter((r) => {
      const hay = `${r.title || ""} ${r.message || ""} ${r.type || ""} ${r.status || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [reminders, query, filter]);

  return (
    <div className="pf2-shell">
      {/* Sidebar */}
      <aside className="pf2-sidebar">
        <div className="pf2-brand" onClick={() => navigate("/dashboard")} role="button">
          <img className="pf2-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pf2-brand-text">
            <div className="pf2-brand-title">Pawfection</div>
            <div className="pf2-brand-sub">Dashboard</div>
          </div>
        </div>

        <nav className="pf2-nav">
          <Link className="pf2-nav-item" to="/dashboard">Dashboard</Link>
          <Link className="pf2-nav-item" to="/mypets">My Pets</Link>
          <Link className="pf2-nav-item" to="/appointments">Appointments</Link>
          <Link className={`pf2-nav-item ${location.pathname.includes("/reminders") ? "active" : ""}`} to="/reminders">
            Reminders
          </Link>
          <Link className="pf2-nav-item" to="/lostfound">Lost &amp; Found</Link>
          <Link className="pf2-nav-item" to="/community">Community</Link>
          <Link className="pf2-nav-item" to="/inventory">Inventory</Link>
        </nav>

        <div className="pf2-sidebar-footer">
          <button className="pf2-btn pf2-btn-ghost" onClick={() => navigate("/profile")}>
            View Profile
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="pf2-main">
        {/* Topbar */}
        <header className="pf2-topbar">
          <div className="pf2-search">
            <input
              placeholder="Search reminders..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="pf2-topbar-right">
            <div className="pf2-userchip" title={userName}>
              <div className="pf2-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pf2-userchip-text">
                <div className="pf2-userchip-name">{userName}</div>
                <div className="pf2-userchip-sub">User</div>
              </div>
            </div>
          </div>
        </header>

        <main className="pf2-content">
          <div className="pfa-head">
            <div>
              <h1 className="pfa-title">Reminders</h1>
              <p className="pfa-subtitle">
                Manage reminders by marking them as done, snoozing them, and tracking upcoming pet care tasks.
              </p>
            </div>
          </div>

          {error && <div className="pfa-alert">{error}</div>}
          {success && <div className="pfa-success">{success}</div>}

          <section className="pfa-grid-one">
            <div className="pfa-card">
              <div className="pfa-cardtop">
                <div>
                  <div className="pfa-cardtitle">Your reminders</div>
                  <div className="pfa-mini">Generate, snooze, complete, and review reminders from your pet data.</div>
                </div>

                <div className="pfa-actions-right">
                  <button
                    className="pf2-btn pf2-btn-primary"
                    onClick={generateReminders}
                    disabled={working}
                  >
                    {working ? "Generating..." : "+ Generate Reminders"}
                  </button>

                  <button className="pf2-btn" onClick={fetchReminders} disabled={loading}>
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>

              {/* Filter chips */}
              <div className="pfr-filters">
                <button className={`pfr-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                  All
                </button>
                <button className={`pfr-chip ${filter === "upcoming" ? "active" : ""}`} onClick={() => setFilter("upcoming")}>
                  Upcoming
                </button>
                <button className={`pfr-chip ${filter === "birthday" ? "active" : ""}`} onClick={() => setFilter("birthday")}>
                  🎂 Birthday
                </button>
                <button className={`pfr-chip ${filter === "vaccine" ? "active" : ""}`} onClick={() => setFilter("vaccine")}>
                  💉 Vaccine
                </button>
                <button className={`pfr-chip ${filter === "grooming" ? "active" : ""}`} onClick={() => setFilter("grooming")}>
                  🧼 Grooming
                </button>
              </div>

              {loading && <div className="pfa-empty">Loading reminders…</div>}

              {!loading && filteredReminders.length === 0 && (
                <div className="pfa-empty">
                  No reminders yet. Click <b>Generate Reminders</b>.
                </div>
              )}

              {!loading && filteredReminders.length > 0 && (
                <div className="pfr-list">
                  {filteredReminders.map((r) => (
                    <div key={r.id} className="pfr-row">
                      <div className="pfr-left">
                        <div className="pfr-title">
                          {r.title}{" "}
                          <span className={`pfr-badge pfr-type-${(r.type || "").toLowerCase()}`}>
                            {typeLabel(r.type)}
                          </span>
                        </div>
                        <div className="pfr-sub">{r.message || "—"}</div>
                        <div className="pfr-sub2">Due: {formatDate(r.reminder_date)}</div>
                      </div>

                      <div className="pfr-right">
                        <span className="pfr-badge pfr-status">
                          {r.status || "pending"}
                        </span>

                        {(r.status || "").toLowerCase() !== "completed" && (
                          <>
                            <button
                              className="pf2-btn pf2-btn-small"
                              onClick={() => snoozeReminder(r.id, 1)}
                            >
                              Snooze 1d
                            </button>

                            <button
                              className="pf2-btn pf2-btn-small"
                              onClick={() => snoozeReminder(r.id, 7)}
                            >
                              Snooze 7d
                            </button>

                            <button
                              className="pf2-btn pf2-btn-small pf2-btn-primary"
                              onClick={() => completeReminder(r.id)}
                            >
                              Mark done
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}