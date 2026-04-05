import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumDashboard.css";
import "./PremiumReminders.css";

const FILTERS = ["All", "Today", "Upcoming", "Overdue", "Completed"];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function isSameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function typeLabel(type) {
  const t = (type || "").toLowerCase();
  if (t === "birthday") return "Birthday";
  if (t === "vaccine") return "Vaccination";
  if (t === "grooming") return "Grooming";
  return type || "Reminder";
}

function typeIcon(type) {
  const t = (type || "").toLowerCase();
  if (t === "birthday") return "🎂";
  if (t === "vaccine") return "💉";
  if (t === "grooming") return "🧼";
  return "🐾";
}

function getPriority(reminder) {
  const type = (reminder?.type || "").toLowerCase();
  const status = (reminder?.status || "").toLowerCase();

  if (status === "completed") return "low";
  if (type === "vaccine") return "high";
  if (type === "grooming") return "medium";
  if (type === "birthday") return "medium";
  return "low";
}

function getSuggestionText({ overdue, today, upcoming, completed, mostUrgent }) {
  if (mostUrgent && overdue.length > 0) {
    return `${typeIcon(mostUrgent.type)} ${typeLabel(
      mostUrgent.type
    )} reminder "${mostUrgent.title}" is your most urgent task right now.`;
  }

  if (today.length > 0) {
    const firstToday = today[0];
    return `${typeIcon(firstToday?.type)} You have ${today.length} reminder${
      today.length > 1 ? "s" : ""
    } due today. Completing them early will keep your pet care routine smooth.`;
  }

  if (upcoming.length >= 3) {
    return `Your upcoming care schedule is getting busy. Planning ahead now will help you stay organised this week.`;
  }

  if (completed.length > 0) {
    return `Great progress — you’ve already completed ${completed.length} reminder${
      completed.length > 1 ? "s" : ""
    }.`;
  }

  return "Everything looks calm right now. Generate reminders to keep your premium care plan up to date.";
}

export default function PremiumReminders() {
  const navigate = useNavigate();

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        if (userObj?.name && typeof userObj.name === "string") {
          setUserName(userObj.name);
          return;
        }
      }

      const fallbackName =
        localStorage.getItem("pawfection_user_name") ||
        localStorage.getItem("user_name") ||
        localStorage.getItem("name");

      if (fallbackName) {
        setUserName(fallbackName);
      }
    } catch {
      setUserName("User");
    }
  };

  const fetchReminders = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/reminders`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => []);

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
    if (!token) {
      navigate("/login");
      return;
    }

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
    if (!token) {
      navigate("/login");
      return;
    }

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
    if (!token) {
      navigate("/login");
      return;
    }

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

  useEffect(() => {
    const savedToken = localStorage.getItem("pawfection_token");
    const savedRole = String(
      localStorage.getItem("pawfection_role") || ""
    ).toLowerCase();

    if (!savedToken) {
      navigate("/login");
      return;
    }

    if (savedRole === "admin") {
      navigate("/admin-dashboard");
      return;
    }

    localStorage.setItem("pawfection_account_type", "premium");
    loadUserName();
    fetchReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedReminders = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const overdue = [];
    const today = [];
    const upcoming = [];
    const completed = [];

    (reminders || []).forEach((r) => {
      const status = (r?.status || "").toLowerCase();
      const d = r?.reminder_date ? new Date(r.reminder_date) : null;

      if (status === "completed") {
        completed.push(r);
        return;
      }

      if (!d || Number.isNaN(d.getTime())) {
        upcoming.push(r);
        return;
      }

      d.setHours(0, 0, 0, 0);

      if (d < todayDate) {
        overdue.push(r);
      } else if (isSameDay(d, todayDate)) {
        today.push(r);
      } else {
        upcoming.push(r);
      }
    });

    const sortByDate = (a, b) => {
      const dateA = a?.reminder_date ? new Date(a.reminder_date).getTime() : Infinity;
      const dateB = b?.reminder_date ? new Date(b.reminder_date).getTime() : Infinity;
      return dateA - dateB;
    };

    overdue.sort(sortByDate);
    today.sort(sortByDate);
    upcoming.sort(sortByDate);
    completed.sort(sortByDate);

    return { overdue, today, upcoming, completed };
  }, [reminders]);

  const mostUrgentReminder = useMemo(() => {
    if (groupedReminders.overdue.length > 0) {
      return groupedReminders.overdue[0];
    }

    if (groupedReminders.today.length > 0) {
      return groupedReminders.today[0];
    }

    if (groupedReminders.upcoming.length > 0) {
      return groupedReminders.upcoming[0];
    }

    return null;
  }, [groupedReminders]);

  const searchedGroupedReminders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return groupedReminders;

    const matchesSearch = (r) => {
      const hay =
        `${r?.title || ""} ${r?.message || ""} ${r?.type || ""} ${r?.status || ""}`.toLowerCase();
      return hay.includes(q);
    };

    return {
      overdue: groupedReminders.overdue.filter(matchesSearch),
      today: groupedReminders.today.filter(matchesSearch),
      upcoming: groupedReminders.upcoming.filter(matchesSearch),
      completed: groupedReminders.completed.filter(matchesSearch),
    };
  }, [groupedReminders, searchTerm]);

  const visibleSections = useMemo(() => {
    if (filter === "Today") {
      return [{ title: "Today", items: searchedGroupedReminders.today }];
    }

    if (filter === "Upcoming") {
      return [{ title: "Upcoming", items: searchedGroupedReminders.upcoming }];
    }

    if (filter === "Overdue") {
      return [{ title: "Overdue", items: searchedGroupedReminders.overdue }];
    }

    if (filter === "Completed") {
      return [{ title: "Completed", items: searchedGroupedReminders.completed }];
    }

    return [
      { title: "Overdue", items: searchedGroupedReminders.overdue },
      { title: "Today", items: searchedGroupedReminders.today },
      { title: "Upcoming", items: searchedGroupedReminders.upcoming },
      { title: "Completed", items: searchedGroupedReminders.completed },
    ];
  }, [filter, searchedGroupedReminders]);

  const heroStats = useMemo(() => {
    return {
      today: groupedReminders.today.length,
      upcoming: groupedReminders.upcoming.length,
      overdue: groupedReminders.overdue.length,
      completed: groupedReminders.completed.length,
    };
  }, [groupedReminders]);

  const insightText = getSuggestionText({
    ...groupedReminders,
    mostUrgent: mostUrgentReminder,
  });

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  return (
    <div className="pfd-shell pfr-premium-shell">
      <header className="pfd-site-header">
        <div
          className="pfd-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img className="pfd-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pfd-brand-copy">
            <div className="pfd-brand-title">Pawfection</div>
            <div className="pfd-brand-sub">Premium Reminders</div>
          </div>
        </div>

        <nav className="pfd-topnav">
          <Link className="pfd-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pfd-topnav-item" to="/premium-mypets">
            My Pets
          </Link>
          <Link className="pfd-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="pfd-topnav-item active" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="pfd-topnav-item" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pfd-topnav-item" to="/premium/community">
            Community
          </Link>
          <Link className="pfd-topnav-item" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="pfd-topnav-item" to="/premium/vet-chat">
            AI Pet Assistant
          </Link>
          <Link className="pfd-topnav-item" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="pfd-header-side">
          <div className="pfd-header-meta">
            <div className="pfd-date-pill">{todayText}</div>

            <div className="pfd-userchip" title={userName}>
              <div className="pfd-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pfd-userchip-text">
                <div className="pfd-userchip-name">{userName}</div>
                <div className="pfd-userchip-sub">Premium User</div>
              </div>
            </div>
          </div>

          <div className="pfd-search">
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="pfd-main">
        <section className="pfr-hero-card">
          <div className="pfr-hero-copy">
            <div className="pfr-kicker">Premium Reminders</div>
            <h1 className="pfr-title">Smart pet care planning</h1>
            <p className="pfr-subtitle">
              View overdue, today, upcoming, and completed reminders in one organised premium space.
            </p>

            <div className="pfr-hero-actions">
              <button
                className="pfd-btn pfd-btn-primary"
                onClick={generateReminders}
                disabled={working}
              >
                {working ? "Generating..." : "+ Generate Reminders"}
              </button>

              <button
                className="pfd-btn"
                onClick={fetchReminders}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="pfr-insight-card">
            <div className="pfr-insight-label">Smart Insight</div>
            <div className="pfr-insight-text">{insightText}</div>
          </div>
        </section>

        {mostUrgentReminder && (
          <section className="pfr-urgent-card">
            <div className="pfr-urgent-left">
              <div className="pfr-urgent-kicker">Most Urgent Reminder</div>
              <h2 className="pfr-urgent-title">
                {typeIcon(mostUrgentReminder.type)} {mostUrgentReminder.title}
              </h2>
              <p className="pfr-urgent-text">
                {mostUrgentReminder.message || "This reminder needs your attention first."}
              </p>

              <div className="pfr-urgent-meta">
                <span className={`pfr-type-badge pfr-type-${(mostUrgentReminder.type || "").toLowerCase()}`}>
                  {typeLabel(mostUrgentReminder.type)}
                </span>
                <span className="pfr-status-badge">
                  {mostUrgentReminder.status || "pending"}
                </span>
                <span className="pfr-urgent-date">
                  Due: {formatDate(mostUrgentReminder.reminder_date)}
                </span>
              </div>
            </div>

            <div className="pfr-urgent-actions">
              <button
                className="pfd-btn pfd-btn-small"
                onClick={() => snoozeReminder(mostUrgentReminder.id, 1)}
              >
                Snooze 1d
              </button>
              <button
                className="pfd-btn pfd-btn-small"
                onClick={() => snoozeReminder(mostUrgentReminder.id, 7)}
              >
                Snooze 7d
              </button>
              <button
                className="pfd-btn pfd-btn-small pfd-btn-primary"
                onClick={() => completeReminder(mostUrgentReminder.id)}
              >
                Mark done
              </button>
            </div>
          </section>
        )}

        {error && <div className="pfr-alert pfr-alert-error">{error}</div>}
        {success && <div className="pfr-alert pfr-alert-success">{success}</div>}

        <section className="pfr-summary-grid">
          <article className="pfr-summary-card">
            <div className="pfr-summary-label">Today</div>
            <div className="pfr-summary-value">{heroStats.today}</div>
          </article>

          <article className="pfr-summary-card">
            <div className="pfr-summary-label">Upcoming</div>
            <div className="pfr-summary-value">{heroStats.upcoming}</div>
          </article>

          <article className="pfr-summary-card pfr-summary-card-overdue">
            <div className="pfr-summary-label">Overdue</div>
            <div className="pfr-summary-value">{heroStats.overdue}</div>
          </article>

          <article className="pfr-summary-card pfr-summary-card-completed">
            <div className="pfr-summary-label">Completed</div>
            <div className="pfr-summary-value">{heroStats.completed}</div>
          </article>
        </section>

        <section className="pfr-filter-row">
          {FILTERS.map((item) => (
            <button
              key={item}
              className={`pfr-filter-pill ${filter === item ? "active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </section>

        {loading && <div className="pfr-empty">Loading reminders…</div>}

        {!loading && reminders.length === 0 && (
          <div className="pfr-empty">
            No reminders yet. Click <b>Generate Reminders</b> to create them from your pet data.
          </div>
        )}

        {!loading && reminders.length > 0 && (
          <section className="pfr-sections">
            {visibleSections.map((section) => (
              <article className="pfr-section-card" key={section.title}>
                <div className="pfr-section-head">
                  <div>
                    <div className="pfr-section-kicker">Reminder Group</div>
                    <h2>{section.title}</h2>
                  </div>
                  <span className="pfr-section-count">{section.items.length}</span>
                </div>

                {section.items.length === 0 ? (
                  <div className="pfr-empty-inline">No reminders in this section.</div>
                ) : (
                  <div className="pfr-reminder-list">
                    {section.items.map((r) => {
                      const priority = getPriority(r);
                      const isCompleted =
                        (r?.status || "").toLowerCase() === "completed";

                      return (
                        <div key={r.id} className="pfr-reminder-card">
                          <div className="pfr-reminder-top">
                            <div>
                              <div className="pfr-reminder-title-row">
                                <h3>
                                  <span className="pfr-inline-icon">{typeIcon(r.type)}</span>{" "}
                                  {r.title || "Reminder"}
                                </h3>
                                <span className={`pfr-type-badge pfr-type-${(r.type || "").toLowerCase()}`}>
                                  {typeLabel(r.type)}
                                </span>
                              </div>

                              <p className="pfr-reminder-message">
                                {r.message || "No extra details provided."}
                              </p>
                            </div>

                            <div className={`pfr-priority-badge ${priority}`}>
                              {priority} priority
                            </div>
                          </div>

                          <div className="pfr-reminder-bottom">
                            <div className="pfr-reminder-meta">
                              <span>Due: {formatDate(r.reminder_date)}</span>
                              <span className="pfr-status-badge">
                                {r.status || "pending"}
                              </span>
                            </div>

                            {!isCompleted && (
                              <div className="pfr-reminder-actions">
                                <button
                                  className="pfd-btn pfd-btn-small"
                                  onClick={() => snoozeReminder(r.id, 1)}
                                >
                                  Snooze 1d
                                </button>

                                <button
                                  className="pfd-btn pfd-btn-small"
                                  onClick={() => snoozeReminder(r.id, 7)}
                                >
                                  Snooze 7d
                                </button>

                                <button
                                  className="pfd-btn pfd-btn-small pfd-btn-primary"
                                  onClick={() => completeReminder(r.id)}
                                >
                                  Mark done
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}