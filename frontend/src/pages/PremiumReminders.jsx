import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
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
  if (t === "medication") return "Medication";
  if (t === "checkup") return "Check-up";
  return type || "Reminder";
}

function typeIcon(type) {
  const t = (type || "").toLowerCase();
  if (t === "birthday") return "🎂";
  if (t === "vaccine") return "💉";
  if (t === "grooming") return "🧼";
  if (t === "medication") return "💊";
  if (t === "checkup") return "🩺";
  return "🐾";
}

function getPriority(reminder) {
  const type = (reminder?.type || "").toLowerCase();
  const status = (reminder?.status || "").toLowerCase();

  if (status === "completed") return "low";
  if (type === "vaccine") return "high";
  if (type === "medication") return "high";
  if (type === "grooming") return "medium";
  if (type === "birthday") return "medium";
  if (type === "checkup") return "medium";
  return "low";
}

function getSuggestionText({ overdue, today, upcoming, completed, mostUrgent }) {
  if (mostUrgent && overdue.length > 0) {
    return `${typeIcon(mostUrgent.type)} ${typeLabel(
      mostUrgent.type
    )} reminder "${mostUrgent.title}" is your most urgent task right now.`;
  }

  if (today.length > 0) {
    return `You have ${today.length} reminder${
      today.length === 1 ? "" : "s"
    } due today. Completing them early will keep your pet care routine smooth.`;
  }

  if (upcoming.length >= 3) {
    return "Your upcoming care schedule is getting busy. Planning ahead now will help you stay organised this week.";
  }

  if (completed.length > 0) {
    return `Great progress — you’ve already completed ${completed.length} reminder${
      completed.length === 1 ? "" : "s"
    }.`;
  }

  return "Everything looks calm right now. Generate reminders to keep your premium care plan up to date.";
}

export default function PremiumReminders() {
  const navigate = useNavigate();

  const token = localStorage.getItem("pawfection_token");
  const role = String(localStorage.getItem("pawfection_role") || "").toLowerCase();
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authHeaders = useMemo(() => {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (role === "admin") {
      navigate("/admin-dashboard");
      return;
    }

    localStorage.setItem("pawfection_account_type", "premium");

    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name) {
          setUserName(userObj.name);
        }
      } else {
        const fallbackName =
          localStorage.getItem("pawfection_user_name") ||
          localStorage.getItem("user_name") ||
          localStorage.getItem("name");

        if (fallbackName) setUserName(fallbackName);
      }
    } catch {
      setUserName("User");
    }

    fetchReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, token, role]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

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
        return;
      }

      const list = Array.isArray(data) ? data : data?.data || data?.reminders || [];
      setReminders(Array.isArray(list) ? list : []);
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
        return;
      }

      setSuccess(`Reminders generated! Newly created: ${data?.created ?? 0}`);
      await fetchReminders();
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

    setBusyId(id);
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
        return;
      }

      setSuccess("Reminder marked as completed!");
      await fetchReminders();
    } catch {
      setError("Server error. Is your backend running?");
    } finally {
      setBusyId(null);
    }
  };

  const snoozeReminder = async (id, days) => {
    if (!token) {
      navigate("/login");
      return;
    }

    setBusyId(id);
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
        return;
      }

      setSuccess(`Reminder snoozed by ${days} day(s)!`);
      await fetchReminders();
    } catch {
      setError("Server error. Is your backend running?");
    } finally {
      setBusyId(null);
    }
  };

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
    if (groupedReminders.overdue.length > 0) return groupedReminders.overdue[0];
    if (groupedReminders.today.length > 0) return groupedReminders.today[0];
    if (groupedReminders.upcoming.length > 0) return groupedReminders.upcoming[0];
    return null;
  }, [groupedReminders]);

  const searchedGroupedReminders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return groupedReminders;

    const matchesSearch = (r) => {
      const hay = `${r?.title || ""} ${r?.message || ""} ${r?.type || ""} ${
        r?.status || ""
      } ${formatDate(r?.reminder_date)}`.toLowerCase();

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
      total: reminders.length,
    };
  }, [groupedReminders, reminders]);

  const filteredCount = useMemo(() => {
    return (
      searchedGroupedReminders.overdue.length +
      searchedGroupedReminders.today.length +
      searchedGroupedReminders.upcoming.length +
      searchedGroupedReminders.completed.length
    );
  }, [searchedGroupedReminders]);

  const insightText = getSuggestionText({
    ...groupedReminders,
    mostUrgent: mostUrgentReminder,
  });

  const reminderSliderItems = useMemo(() => {
    return [
      {
        icon: "✨",
        title: "Generate Reminders",
        text: "Create automatic care reminders based on your pet details and premium care plan.",
        action: working ? "Generating" : "Generate now",
        onClick: generateReminders,
      },
      {
        icon: "📅",
        title: "Due Today",
        text:
          heroStats.today > 0
            ? `${heroStats.today} reminder${heroStats.today === 1 ? "" : "s"} due today.`
            : "No reminders due today. Your routine looks calm.",
        action: "View today",
        onClick: () => {
          setFilter("Today");
          document.querySelector(".pfr-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        icon: "⚠️",
        title: "Overdue Care",
        text:
          heroStats.overdue > 0
            ? `${heroStats.overdue} overdue reminder${
                heroStats.overdue === 1 ? "" : "s"
              } need attention.`
            : "No overdue reminders right now.",
        action: "Check overdue",
        onClick: () => {
          setFilter("Overdue");
          document.querySelector(".pfr-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        icon: "🗓️",
        title: "Upcoming Plan",
        text:
          heroStats.upcoming > 0
            ? `${heroStats.upcoming} upcoming reminder${
                heroStats.upcoming === 1 ? "" : "s"
              } planned.`
            : "No upcoming reminders yet.",
        action: "View upcoming",
        onClick: () => {
          setFilter("Upcoming");
          document.querySelector(".pfr-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        icon: "✅",
        title: "Completed Tasks",
        text:
          heroStats.completed > 0
            ? `${heroStats.completed} completed reminder${
                heroStats.completed === 1 ? "" : "s"
              }.`
            : "Completed reminders will appear here.",
        action: "View completed",
        onClick: () => {
          setFilter("Completed");
          document.querySelector(".pfr-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        icon: "🔎",
        title: "Smart Search",
        text: "Search reminders by title, type, status, date, or message to find tasks faster.",
        action: "Search",
        onClick: () => {
          document.querySelector(".pfr-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroStats, working]);

  return (
    <div className="pfr-shell">
      <header className="pfr-site-header">
        <div
          className="pfr-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img className="pfr-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pfr-brand-copy">
            <div className="pfr-brand-title">Pawfection</div>
            <div className="pfr-brand-sub">Premium Reminders</div>
          </div>
        </div>

        <nav className="pfr-topnav">
          <Link className="pfr-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pfr-topnav-item" to="/premium-mypets">
            My Pet
          </Link>
          <Link className="pfr-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="pfr-topnav-item active" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="pfr-topnav-item" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pfr-topnav-item" to="/premium/community">
            Community
          </Link>
          <Link className="pfr-topnav-item" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="pfr-topnav-item" to="/premium/vet-chat">
            AI Pet Assistant
          </Link>
          <Link className="pfr-topnav-item" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="pfr-header-side">
          <div className="pfr-date-pill">{todayText}</div>
          <div className="pfr-userchip">
            <div className="pfr-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
            <div>
              <div className="pfr-userchip-name">{userName}</div>
              <div className="pfr-userchip-sub">Premium User</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pfr-main">
        <section className="pfr-hero">
          <div className="pfr-hero-copy">
            <div className="pfr-kicker">Pawfection Premium Care</div>
            <h1 className="pfr-hero-title">
              {getGreeting()}, {userName}
            </h1>
            <p className="pfr-hero-text">
              Manage pet care reminders in a polished premium space. Track overdue,
              today, upcoming, and completed tasks with smart reminders for vaccines,
              grooming, birthdays, check-ups, and medication.
            </p>

            <div className="pfr-selector-wrap">
              <label htmlFor="reminderFocusSelect" className="pfr-selector-label">
                Reminder Focus
              </label>
              <select
                id="reminderFocusSelect"
                className="pfr-selector"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {FILTERS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="pfr-hero-actions">
              <button
                className="pfr-btn pfr-btn-primary"
                type="button"
                onClick={generateReminders}
                disabled={working}
              >
                {working ? "Generating..." : "Generate Reminders"}
              </button>

              <button
                className="pfr-btn"
                type="button"
                onClick={fetchReminders}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Reminders"}
              </button>

              <button
                className="pfr-btn"
                type="button"
                onClick={() => navigate("/premium-dashboard")}
              >
                Back to Dashboard
              </button>
            </div>

            {error && <div className="pfr-form-message pfr-form-error">{error}</div>}
            {success && <div className="pfr-form-message pfr-form-success">{success}</div>}
          </div>

          <div className="pfr-hero-card">
            <div className="pfr-hero-card-top">
              <div className="pfr-premium-badge">Premium Active</div>
              <h2>Care Reminders</h2>
              <p>Smart planning for your pet care routine</p>
            </div>

            <div className="pfr-stat-row">
              <div className="pfr-stat-pill">Total: {heroStats.total}</div>
              <div className="pfr-stat-pill">Today: {heroStats.today}</div>
              <div className="pfr-stat-pill">Upcoming: {heroStats.upcoming}</div>
              <div className="pfr-stat-pill">Overdue: {heroStats.overdue}</div>
            </div>

            <div className="pfr-quick-box">
              <strong>SMART INSIGHT</strong>
              <span>{insightText}</span>
            </div>

            <div className="pfr-quick-box">
              <strong>MOST URGENT</strong>
              <span>
                {mostUrgentReminder
                  ? `${typeIcon(mostUrgentReminder.type)} ${
                      mostUrgentReminder.title || "Reminder"
                    } • Due ${formatDate(mostUrgentReminder.reminder_date)}`
                  : "No urgent reminders right now"}
              </span>
            </div>

            <div className="pfr-quick-box">
              <strong>PREMIUM BENEFIT</strong>
              <span>
                Automatic reminder generation, cleaner care tracking, and better visibility.
              </span>
            </div>
          </div>
        </section>

        <section className="pfr-auto-section">
          <div className="pfr-auto-head">
            <div>
              <div className="pfr-card-kicker">Premium reminder shortcuts</div>
              <h2>Your pet care tasks sliding automatically</h2>
            </div>

            <div className="pfr-auto-pill">Auto sliding ✨</div>
          </div>

          <div className="pfr-slider-mask">
            <div className="pfr-slider-track">
              {[0, 1].map((groupIndex) => (
                <div className="pfr-slider-group" key={groupIndex}>
                  {reminderSliderItems.map((item, index) => (
                    <button
                      key={`${groupIndex}-${index}`}
                      type="button"
                      className="pfr-slide-card"
                      onClick={item.onClick}
                      disabled={item.title === "Generate Reminders" && working}
                    >
                      <span>{item.icon}</span>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                      <small>{item.action}</small>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="pfr-slider-dots">
            <span></span>
            <span className="active"></span>
            <span></span>
            <span></span>
          </div>
        </section>

        <section className="pfr-grid">
          <article className="pfr-card">
            <div className="pfr-card-kicker">Premium Search</div>
            <h3>Find Your Reminder Fast</h3>

            <div className="pfr-field" style={{ marginTop: "14px" }}>
              <label>Search</label>
              <input
                type="text"
                placeholder="Search by title, type, status, date, message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="pfr-filter-pills">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`pfr-filter-pill ${filter === item ? "active" : ""}`}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="pfr-search-meta">
              {!searchTerm.trim() ? (
                <span>
                  Showing reminders: <strong>{heroStats.total}</strong>
                </span>
              ) : (
                <span>
                  Results for "<strong>{searchTerm}</strong>":{" "}
                  <strong>{filteredCount}</strong>
                </span>
              )}
            </div>

            {searchTerm.trim() && (
              <>
                <div style={{ marginTop: "12px" }}>
                  <button
                    type="button"
                    className="pfr-btn pfr-btn-small"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </button>
                </div>

                <div className="pfr-search-results">
                  {filteredCount === 0 ? (
                    <div className="pfr-empty" style={{ marginTop: "14px" }}>
                      No reminders match "{searchTerm}".
                    </div>
                  ) : (
                    Object.entries(searchedGroupedReminders).flatMap(([groupName, items]) =>
                      items.map((r) => (
                        <div key={`search-${groupName}-${r.id}`} className="pfr-search-card">
                          <div className="pfr-search-card-head">
                            <div className="pfr-search-card-title">
                              {typeIcon(r.type)} {r.title || "Reminder"}
                            </div>

                            <div className="pfr-chip-wrap">
                              <span className="pfr-chip">{typeLabel(r.type)}</span>
                              <span className="pfr-chip">{formatDate(r.reminder_date)}</span>
                            </div>
                          </div>

                          <div className="pfr-search-detail-grid">
                            <div>
                              <strong>Status:</strong> {r.status || "pending"}
                            </div>
                            <div>
                              <strong>Group:</strong> {groupName}
                            </div>
                            <div>
                              <strong>Message:</strong>{" "}
                              {r.message || "No extra details provided."}
                            </div>
                          </div>

                          {(r?.status || "").toLowerCase() !== "completed" && (
                            <div className="pfr-timeline-actions">
                              <button
                                className="pfr-btn pfr-btn-small"
                                type="button"
                                onClick={() => snoozeReminder(r.id, 1)}
                                disabled={busyId === r.id}
                              >
                                Snooze 1d
                              </button>

                              <button
                                className="pfr-btn pfr-btn-small"
                                type="button"
                                onClick={() => snoozeReminder(r.id, 7)}
                                disabled={busyId === r.id}
                              >
                                Snooze 7d
                              </button>

                              <button
                                className="pfr-btn pfr-btn-primary pfr-btn-small"
                                type="button"
                                onClick={() => completeReminder(r.id)}
                                disabled={busyId === r.id}
                              >
                                Mark done
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )
                  )}
                </div>
              </>
            )}
          </article>

          <article className="pfr-card">
            <div className="pfr-card-kicker">Reminder Snapshot</div>
            <h3>Quick Summary</h3>

            <div className="pfr-analytics-grid">
              <div className="pfr-analytics-box">
                <span>Total</span>
                <strong>{heroStats.total}</strong>
              </div>
              <div className="pfr-analytics-box">
                <span>Today</span>
                <strong>{heroStats.today}</strong>
              </div>
              <div className="pfr-analytics-box">
                <span>Upcoming</span>
                <strong>{heroStats.upcoming}</strong>
              </div>
              <div className="pfr-analytics-box">
                <span>Completed</span>
                <strong>{heroStats.completed}</strong>
              </div>
            </div>
          </article>

          <article className="pfr-card pfr-card-wide">
            <div className="pfr-card-kicker">Reminder Timeline</div>
            <h3>Your Premium Reminders</h3>

            {loading ? (
              <div className="pfr-empty">Loading reminders...</div>
            ) : reminders.length === 0 ? (
              <div className="pfr-empty">
                No reminders yet. Click <b>Generate Reminders</b> to create them from your
                pet data.
              </div>
            ) : (
              <div className="pfr-sections">
                {visibleSections.map((section) => (
                  <div className="pfr-section-block" key={section.title}>
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
                      <div className="pfr-timeline">
                        {section.items.map((r, index) => {
                          const priority = getPriority(r);
                          const isCompleted =
                            (r?.status || "").toLowerCase() === "completed";

                          return (
                            <div key={r.id || index} className="pfr-timeline-item">
                              <div className="pfr-timeline-dot" />

                              <div className="pfr-timeline-content">
                                <div className="pfr-timeline-top">
                                  <div>
                                    <div className="pfr-timeline-title">
                                      {typeIcon(r.type)} {r.title || "Reminder"}
                                    </div>
                                    <div className="pfr-timeline-text">
                                      {r.message || "No extra details provided."}
                                    </div>
                                    <div className="pfr-timeline-sub">
                                      Due: {formatDate(r.reminder_date)}
                                    </div>
                                  </div>

                                  <div className="pfr-chip-wrap">
                                    <span
                                      className={`pfr-type-badge pfr-type-${(
                                        r.type || ""
                                      ).toLowerCase()}`}
                                    >
                                      {typeLabel(r.type)}
                                    </span>
                                    <span className="pfr-chip">
                                      {r.status || "pending"}
                                    </span>
                                    <span className={`pfr-priority-badge ${priority}`}>
                                      {priority} priority
                                    </span>
                                  </div>
                                </div>

                                {!isCompleted && (
                                  <div className="pfr-timeline-actions">
                                    <button
                                      className="pfr-btn pfr-btn-small"
                                      type="button"
                                      onClick={() => snoozeReminder(r.id, 1)}
                                      disabled={busyId === r.id}
                                    >
                                      Snooze 1d
                                    </button>

                                    <button
                                      className="pfr-btn pfr-btn-small"
                                      type="button"
                                      onClick={() => snoozeReminder(r.id, 7)}
                                      disabled={busyId === r.id}
                                    >
                                      Snooze 7d
                                    </button>

                                    <button
                                      className="pfr-btn pfr-btn-primary pfr-btn-small"
                                      type="button"
                                      onClick={() => completeReminder(r.id)}
                                      disabled={busyId === r.id}
                                    >
                                      {busyId === r.id ? "Saving..." : "Mark done"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}