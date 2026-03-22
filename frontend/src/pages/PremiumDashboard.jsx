import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumDashboard.css";

export default function PremiumDashboard() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");
  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [apptsLoading, setApptsLoading] = useState(false);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const fetchPets = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setPetsLoading(true);
    setPetsError("");

    try {
      const res = await fetch(`${apiBase}/pets`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to load pets.";
        setPetsError(msg);
        setPets([]);
      } else {
        setPets(Array.isArray(data) ? data : data?.pets || []);
      }
    } catch {
      setPetsError("Server error. Is your backend running?");
      setPets([]);
    } finally {
      setPetsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setApptsLoading(true);

    try {
      const res = await fetch(`${apiBase}/appointments`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAppointments([]);
      } else {
        const list = data?.data || [];
        setAppointments(Array.isArray(list) ? list : []);
      }
    } catch {
      setAppointments([]);
    } finally {
      setApptsLoading(false);
    }
  };

  const fetchUpcomingReminders = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setRemindersLoading(true);

    try {
      const res = await fetch(`${apiBase}/reminders/upcoming`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ([]));

      if (!res.ok) {
        setUpcomingReminders([]);
      } else {
        setUpcomingReminders(Array.isArray(data) ? data : []);
      }
    } catch {
      setUpcomingReminders([]);
    } finally {
      setRemindersLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("pawfection_token");
    const savedRole = String(localStorage.getItem("pawfection_role") || "").toLowerCase();
    const savedAccountType = String(
      localStorage.getItem("pawfection_account_type") || ""
    ).toLowerCase();

    if (!savedToken) {
      navigate("/login");
      return;
    }

    if (savedRole === "admin") {
      navigate("/admin/dashboard");
      return;
    }

    if (savedAccountType !== "premium") {
      navigate("/dashboard");
      return;
    }

    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name && typeof userObj.name === "string") {
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

    fetchPets();
    fetchAppointments();
    fetchUpcomingReminders();

    const onFocus = () => {
      fetchPets();
      fetchAppointments();
      fetchUpcomingReminders();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const getPetImageSrc = (pet) => {
    if (pet?.photo_url) return pet.photo_url;
    if (pet?.photo_path) return `http://127.0.0.1:8000/storage/${pet.photo_path}`;
    if (pet?.photo) return `http://127.0.0.1:8000/storage/${pet.photo}`;
    return null;
  };

  const deletePet = async (petId, petName) => {
    if (!token) {
      navigate("/login");
      return;
    }

    const ok = window.confirm(`Delete ${petName || "this pet"}? This cannot be undone.`);
    if (!ok) return;

    setDeletingId(petId);
    setPetsError("");

    try {
      const res = await fetch(`${apiBase}/pets/${petId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to delete pet.";
        setPetsError(msg);
        setDeletingId(null);
        return;
      }

      setPets((prev) => prev.filter((p) => p.id !== petId));
    } catch {
      setPetsError("Failed to delete. Is the backend running?");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return (appointments || [])
      .filter((a) => {
        if (!a?.appointment_at) return false;
        const d = new Date(a.appointment_at);
        return !Number.isNaN(d.getTime()) && d >= now;
      })
      .sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at));
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    return upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  }, [upcomingAppointments]);

  const upcomingAppointmentsCount = useMemo(() => {
    return upcomingAppointments.length;
  }, [upcomingAppointments]);

  const activeReminderCount = useMemo(() => {
    return (upcomingReminders || []).filter(
      (r) => (r?.status || "").toLowerCase() !== "completed"
    ).length;
  }, [upcomingReminders]);

  const dueSoonReminderCount = useMemo(() => {
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    return (upcomingReminders || []).filter((r) => {
      if (!r?.reminder_date) return false;
      const d = new Date(r.reminder_date);
      return !Number.isNaN(d.getTime()) && d >= now && d <= threeDaysLater;
    }).length;
  }, [upcomingReminders]);

  const filteredPets = useMemo(() => {
    if (!searchTerm.trim()) return pets;
    const q = searchTerm.toLowerCase();
    return pets.filter((pet) =>
      [pet?.name, pet?.breed, pet?.species]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [pets, searchTerm]);

  const filteredReminders = useMemo(() => {
    if (!searchTerm.trim()) return upcomingReminders;
    const q = searchTerm.toLowerCase();
    return upcomingReminders.filter((r) =>
      [r?.title, r?.message]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [upcomingReminders, searchTerm]);

  const stats = useMemo(() => {
    const petCount = pets?.length || 0;

    return [
      {
        label: "Pets",
        value: String(petCount),
        sub: "Registered profiles",
        tone: "violet",
        icon: "🐾",
      },
      {
        label: "Appointments",
        value: apptsLoading ? "…" : String(upcomingAppointmentsCount),
        sub: "Upcoming visits",
        tone: "blue",
        icon: "📅",
      },
      {
        label: "Reminders",
        value: remindersLoading ? "…" : String(activeReminderCount),
        sub: "Active care tasks",
        tone: "peach",
        icon: "⏰",
      },
      {
        label: "Due Soon",
        value: remindersLoading ? "…" : String(dueSoonReminderCount),
        sub: "Within 3 days",
        tone: "mint",
        icon: "✨",
      },
    ];
  }, [
    pets,
    apptsLoading,
    upcomingAppointmentsCount,
    remindersLoading,
    activeReminderCount,
    dueSoonReminderCount,
  ]);

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  return (
    <div className="pfd-shell">
      <aside className="pfd-sidebar">
        <div className="pfd-brand" onClick={() => navigate("/premium-dashboard")} role="button">
          <img className="pfd-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pfd-brand-text">
            <div className="pfd-brand-title">Pawfection</div>
            <div className="pfd-brand-sub">Premium Dashboard</div>
          </div>
        </div>

        <nav className="pfd-nav">
          <Link className="pfd-nav-item active" to="/premium-dashboard">
            <span>🏠</span>
            <span>Dashboard</span>
          </Link>
          <Link className="pfd-nav-item" to="/mypets">
            <span>🐶</span>
            <span>My Pets</span>
          </Link>
          <Link className="pfd-nav-item" to="/appointments">
            <span>📅</span>
            <span>Appointments</span>
          </Link>
          <Link className="pfd-nav-item" to="/reminders">
            <span>⏰</span>
            <span>Reminders</span>
          </Link>
          <Link className="pfd-nav-item" to="/lostfound">
            <span>📍</span>
            <span>Lost &amp; Found</span>
          </Link>
          <Link className="pfd-nav-item" to="/community">
            <span>💬</span>
            <span>Community</span>
          </Link>
          <Link className="pfd-nav-item" to="/inventory">
            <span>📦</span>
            <span>Inventory</span>
          </Link>
          <Link className="pfd-nav-item" to="/profile">
            <span>👤</span>
            <span>Profile</span>
          </Link>
        </nav>

        <div className="pfd-sidebar-bottom">
          <div className="pfd-premium-badge">
            <div className="pfd-premium-badge-title">Premium Care</div>
            <div className="pfd-premium-badge-text">
              Manage pets, reminders, appointments and more in one place.
            </div>
          </div>
        </div>
      </aside>

      <div className="pfd-main">
        <header className="pfd-topbar">
          <div className="pfd-search">
            <input
              type="text"
              placeholder="Search pets or reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="pfd-topbar-right">
            <div className="pfd-date-pill">{todayText}</div>

            <div className="pfd-userchip" title={userName}>
              <div className="pfd-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pfd-userchip-text">
                <div className="pfd-userchip-name">{userName}</div>
                <div className="pfd-userchip-sub">Premium User</div>
              </div>
            </div>
          </div>
        </header>

        <main className="pfd-content">
          <section className="pfd-hero">
            <div className="pfd-hero-left">
              <div className="pfd-hero-eyebrow">Premium Dashboard</div>
              <h1 className="pfd-hero-title">
                {getGreeting()}, {userName} 👋
              </h1>
              <p className="pfd-hero-subtitle">
                Here is your pet care overview for today. Track pets, appointments,
                reminders and daily activity from one elegant dashboard.
              </p>

              <div className="pfd-hero-summary">
                <div className="pfd-hero-chip">
                  <span>🐾</span>
                  <span>{pets.length} pets registered</span>
                </div>
                <div className="pfd-hero-chip">
                  <span>📅</span>
                  <span>{upcomingAppointmentsCount} upcoming appointments</span>
                </div>
                <div className="pfd-hero-chip">
                  <span>⏰</span>
                  <span>{activeReminderCount} active reminders</span>
                </div>
              </div>
            </div>

            <div className="pfd-hero-actions">
              <button
                className="pfd-btn pfd-btn-primary"
                onClick={() => navigate("/pets/create")}
              >
                + Add Pet
              </button>
              <button className="pfd-btn" onClick={() => navigate("/appointments/book")}>
                Book Appointment
              </button>
              <button className="pfd-btn" onClick={() => navigate("/reminders")}>
                View Reminders
              </button>
              <button className="pfd-btn" onClick={() => navigate("/inventory")}>
                Open Inventory
              </button>
            </div>
          </section>

          <section className="pfd-stats">
            {stats.map((s) => (
              <div key={s.label} className={`pfd-stat pfd-${s.tone}`}>
                <div className="pfd-stat-top">
                  <div className="pfd-stat-label">{s.label}</div>
                  <div className="pfd-stat-icon">{s.icon}</div>
                </div>
                <div className="pfd-stat-value">{s.value}</div>
                <div className="pfd-stat-sub">{s.sub}</div>
              </div>
            ))}
          </section>

          <section className="pfd-grid">
            <div className="pfd-card pfd-span-2">
              <div className="pfd-cardhead">
                <div>
                  <h2>My Pets</h2>
                  <p>Your registered pet profiles</p>
                </div>
                <button className="pfd-btn pfd-btn-small" onClick={() => navigate("/mypets")}>
                  View All
                </button>
              </div>

              {petsLoading && <div className="pfd-empty">Loading pets…</div>}
              {!petsLoading && petsError && <div className="pfd-empty">{petsError}</div>}
              {!petsLoading && !petsError && filteredPets.length === 0 && (
                <div className="pfd-empty">
                  No matching pets found. Add a pet or try a different search.
                </div>
              )}

              {!petsLoading && !petsError && filteredPets.length > 0 && (
                <div className="pfd-petlist">
                  {filteredPets.slice(0, 4).map((pet) => {
                    const imgSrc = getPetImageSrc(pet);

                    return (
                      <div key={pet.id} className="pfd-petrow">
                        <div className="pfd-petleft">
                          <div className="pfd-petimg">
                            {imgSrc ? <img src={imgSrc} alt={pet.name} /> : <span>🐾</span>}
                          </div>

                          <div className="pfd-petmeta">
                            <div className="pfd-petname">{pet.name}</div>
                            <div className="pfd-petdesc">
                              {pet.breed || pet.species || "Pet"}
                              {" • "}
                              {pet.age ? `${pet.age} yrs` : "Age n/a"}
                              {pet.weight ? ` • ${pet.weight}kg` : ""}
                            </div>
                            <div className="pfd-petbadge-row">
                              <span className="pfd-badge">Profile Active</span>
                            </div>
                          </div>
                        </div>

                        <div className="pfd-petactions">
                          <button
                            className="pfd-btn pfd-btn-small"
                            onClick={() => navigate(`/pets/${pet.id}/edit`)}
                          >
                            Edit
                          </button>

                          <button
                            className="pfd-btn pfd-btn-small pfd-btn-danger"
                            disabled={deletingId === pet.id}
                            onClick={() => deletePet(pet.id, pet.name)}
                          >
                            {deletingId === pet.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pfd-card">
              <div className="pfd-cardhead">
                <div>
                  <h2>Next Appointment</h2>
                  <p>Your nearest upcoming booking</p>
                </div>
              </div>

              {apptsLoading && <div className="pfd-empty">Loading appointment…</div>}

              {!apptsLoading && !nextAppointment && (
                <div className="pfd-empty">
                  No upcoming appointment found.
                </div>
              )}

              {!apptsLoading && nextAppointment && (
                <div className="pfd-highlight-block">
                  <div className="pfd-highlight-icon">📅</div>
                  <div className="pfd-highlight-title">
                    {nextAppointment.title || nextAppointment.service || "Upcoming Appointment"}
                  </div>
                  <div className="pfd-highlight-text">
                    {formatDateTime(nextAppointment.appointment_at)}
                  </div>
                  <div className="pfd-highlight-text">
                    Pet: {nextAppointment.pet_name || nextAppointment.pet?.name || "Not specified"}
                  </div>

                  <button
                    className="pfd-btn pfd-btn-primary pfd-btn-full"
                    onClick={() => navigate("/appointments")}
                  >
                    View Appointments
                  </button>
                </div>
              )}
            </div>

            <div className="pfd-card">
              <div className="pfd-cardhead">
                <div>
                  <h2>Upcoming Reminders</h2>
                  <p>Your next care tasks</p>
                </div>
                <button className="pfd-btn pfd-btn-small" onClick={() => navigate("/reminders")}>
                  View All
                </button>
              </div>

              {remindersLoading && <div className="pfd-empty">Loading reminders…</div>}

              {!remindersLoading && filteredReminders.length === 0 && (
                <div className="pfd-empty">No upcoming reminders found.</div>
              )}

              {!remindersLoading && filteredReminders.length > 0 && (
                <div className="pfd-reminderlist">
                  {filteredReminders.slice(0, 5).map((r) => (
                    <div key={r.id} className="pfd-reminderrow">
                      <div className="pfd-remindericon">⏰</div>
                      <div className="pfd-remindermeta">
                        <div className="pfd-remindername">{r.title}</div>
                        <div className="pfd-reminderdesc">{r.message || "Reminder"}</div>
                        <div className="pfd-reminderdate">
                          Due: {formatDate(r.reminder_date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pfd-card">
              <div className="pfd-cardhead">
                <div>
                  <h2>Quick Actions</h2>
                  <p>Jump to common tasks</p>
                </div>
              </div>

              <div className="pfd-quickactions">
                <button className="pfd-quickaction" onClick={() => navigate("/pets/create")}>
                  <span className="pfd-quickicon">🐶</span>
                  <span>Add Pet</span>
                </button>

                <button className="pfd-quickaction" onClick={() => navigate("/appointments/book")}>
                  <span className="pfd-quickicon">📅</span>
                  <span>Book Visit</span>
                </button>

                <button className="pfd-quickaction" onClick={() => navigate("/reminders")}>
                  <span className="pfd-quickicon">⏰</span>
                  <span>Reminders</span>
                </button>

                <button className="pfd-quickaction" onClick={() => navigate("/lostfound")}>
                  <span className="pfd-quickicon">📍</span>
                  <span>Lost &amp; Found</span>
                </button>
              </div>
            </div>

            <div className="pfd-card pfd-span-2 pfd-welcome">
              <div className="pfd-cardhead">
                <div>
                  <h2>Welcome to Pawfection Premium</h2>
                  <p>Smart pet care in one modern platform</p>
                </div>
              </div>

              <div className="pfd-welcome-grid">
                <div className="pfd-welcome-copy">
                  <div className="pfd-welcome-title">
                    Everything your pet needs, all in one place.
                  </div>
                  <div className="pfd-welcome-text">
                    Pawfection helps dog and cat owners in Ireland manage their pets’
                    profiles, reminders, appointments, safety and day-to-day care with
                    a premium and easy-to-use experience.
                  </div>
                </div>

                <div className="pfd-feature-list">
                  <div className="pfd-feature-item">
                    <span>✔</span>
                    <span>Track pets and profiles</span>
                  </div>
                  <div className="pfd-feature-item">
                    <span>✔</span>
                    <span>View upcoming appointments</span>
                  </div>
                  <div className="pfd-feature-item">
                    <span>✔</span>
                    <span>Manage reminders and wellness tasks</span>
                  </div>
                  <div className="pfd-feature-item">
                    <span>✔</span>
                    <span>Access community and lost &amp; found features</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}