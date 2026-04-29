import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumDashboard.css";

export default function PremiumDashboard() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");
  const [accountType, setAccountType] = useState("premium");

  const [pets, setPets] = useState([]);
  const [activePetIndex, setActivePetIndex] = useState(0);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [apptsLoading, setApptsLoading] = useState(false);

  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);

  const [ownerReportsWithSightings, setOwnerReportsWithSightings] = useState([]);
  const [lostReportsLoading, setLostReportsLoading] = useState(false);

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const isPremium = accountType === "premium";

  const getStoredUser = () => {
    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (!savedUser) return null;
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  };

  const getStoredUserId = () => {
    const userObj = getStoredUser();
    return (
      userObj?.id ??
      userObj?.user_id ??
      userObj?.data?.id ??
      userObj?.user?.id ??
      null
    );
  };

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
        setActivePetIndex(0);
      } else {
        const petList = Array.isArray(data)
          ? data
          : Array.isArray(data?.pets)
          ? data.pets
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setPets(petList);
        setActivePetIndex((prev) => {
          if (!petList.length) return 0;
          return prev >= petList.length ? 0 : prev;
        });
      }
    } catch {
      setPetsError("Server error. Is your backend running?");
      setPets([]);
      setActivePetIndex(0);
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

      const data = await res.json().catch(() => []);

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

  const fetchOwnerReportsWithSightings = async (resolvedUserId) => {
    if (!token || !resolvedUserId) {
      setOwnerReportsWithSightings([]);
      return;
    }

    setLostReportsLoading(true);

    try {
      const reportsRes = await fetch(`${apiBase}/premium/lost-found`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const reportsData = await reportsRes.json().catch(() => ({}));

      if (!reportsRes.ok) {
        setOwnerReportsWithSightings([]);
        return;
      }

      const rawReports = Array.isArray(reportsData)
        ? reportsData
        : Array.isArray(reportsData?.data)
        ? reportsData.data
        : Array.isArray(reportsData?.reports)
        ? reportsData.reports
        : Array.isArray(reportsData?.lost_reports)
        ? reportsData.lost_reports
        : [];

      const lostItems = rawReports.filter(
        (item) => String(item?.type || "").toLowerCase() === "lost"
      );

      const sightingItems = rawReports.filter(
        (item) => String(item?.type || "").toLowerCase() === "sighting"
      );

      const ownedLostReports = [];

      for (const lostReport of lostItems) {
        try {
          const detailRes = await fetch(
            `${apiBase}/premium/lost-found/${lostReport.id}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const detailData = await detailRes.json().catch(() => ({}));

          if (!detailRes.ok) continue;

          const fullReport =
            detailData?.data || detailData?.report || detailData?.pet || detailData;

          const ownerId =
            lostReport?.user_id ??
            lostReport?.owner_id ??
            lostReport?.pet_owner_id ??
            lostReport?.created_by ??
            lostReport?.user?.id ??
            lostReport?.owner?.id ??
            lostReport?.pet_owner?.id ??
            fullReport?.user_id ??
            fullReport?.owner_id ??
            fullReport?.pet_owner_id ??
            fullReport?.created_by ??
            fullReport?.user?.id ??
            fullReport?.owner?.id ??
            fullReport?.pet_owner?.id ??
            null;

          const ownerName = String(
            lostReport?.owner_name ??
              lostReport?.user_name ??
              lostReport?.user?.name ??
              lostReport?.owner?.name ??
              fullReport?.owner_name ??
              fullReport?.user_name ??
              fullReport?.user?.name ??
              fullReport?.owner?.name ??
              ""
          )
            .trim()
            .toLowerCase();

          const currentName = String(userName || "").trim().toLowerCase();

          const isOwner =
            (ownerId != null && String(ownerId) === String(resolvedUserId)) ||
            (ownerName && currentName && ownerName === currentName);

          const relatedSightings = sightingItems.filter((sighting) => {
            const parentId =
              sighting?.pet_id ??
              sighting?.lost_pet_id ??
              sighting?.report_id ??
              sighting?.parent_report_id ??
              sighting?.lost_report_id ??
              null;

            return parentId != null && String(parentId) === String(lostReport.id);
          });

          if (isOwner && relatedSightings.length > 0) {
            ownedLostReports.push({
              ...fullReport,
              ...lostReport,
              sightings_count: relatedSightings.length,
            });
          }
        } catch (err) {
          console.error("Error checking owned lost report:", err);
        }
      }

      setOwnerReportsWithSightings(
        ownedLostReports.sort(
          (a, b) => Number(b?.sightings_count || 0) - Number(a?.sightings_count || 0)
        )
      );
    } catch (err) {
      console.error("Error loading owner reports with sightings:", err);
      setOwnerReportsWithSightings([]);
    } finally {
      setLostReportsLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("pawfection_token");
    const savedRole = String(localStorage.getItem("pawfection_role") || "").toLowerCase();

    if (!savedToken) {
      navigate("/login");
      return;
    }

    if (savedRole === "admin") {
      navigate("/admin-dashboard");
      return;
    }

    setAccountType("premium");
    localStorage.setItem("pawfection_account_type", "premium");

    const resolvedUser = getStoredUser();

    try {
      if (resolvedUser?.name && typeof resolvedUser.name === "string") {
        setUserName(resolvedUser.name);
      } else if (resolvedUser?.username && typeof resolvedUser.username === "string") {
        setUserName(resolvedUser.username);
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
      localStorage.setItem("pawfection_account_type", "premium");
      fetchPets();
      fetchAppointments();
      fetchUpcomingReminders();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    const resolvedUserId = getStoredUserId();
    if (resolvedUserId && userName) {
      fetchOwnerReportsWithSightings(resolvedUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  useEffect(() => {
    if (pets.length <= 1) return;

    const timer = setInterval(() => {
      setActivePetIndex((prev) => (prev + 1) % pets.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [pets.length]);

  const getPetImageSrc = (pet) => {
    if (!pet) return null;
    if (pet?.display_photo_url) return pet.display_photo_url;
    if (pet?.lost_photo_url) return pet.lost_photo_url;
    if (pet?.photo_url) return pet.photo_url;
    if (pet?.image_url) return pet.image_url;
    if (pet?.image) return pet.image;
    if (pet?.photo_path) return `http://127.0.0.1:8000/storage/${pet.photo_path}`;
    if (pet?.photo) return `http://127.0.0.1:8000/storage/${pet.photo}`;
    return null;
  };

  const getPetSummary = (pet) => {
    if (!pet) return "Pet profile";

    const parts = [];
    if (pet?.breed) parts.push(pet.breed);
    else if (pet?.species) parts.push(pet.species);
    if (pet?.age) parts.push(`${pet.age} yrs`);
    if (pet?.weight) parts.push(`${pet.weight}kg`);

    return parts.length ? parts.join(" • ") : "Pet profile";
  };

  const handleVetChat = () => {
    if (isPremium) {
      navigate("/premium/vet-chat");
    } else {
      navigate("/upgrade-premium");
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

  const activeReminders = useMemo(() => {
    return (upcomingReminders || [])
      .filter((r) => String(r?.status || "").toLowerCase() !== "completed")
      .sort((a, b) => new Date(a.reminder_date || 0) - new Date(b.reminder_date || 0));
  }, [upcomingReminders]);

  const nextReminder = useMemo(() => {
    return activeReminders.length > 0 ? activeReminders[0] : null;
  }, [activeReminders]);

  const dueSoonReminderCount = useMemo(() => {
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    return activeReminders.filter((r) => {
      if (!r?.reminder_date) return false;
      const d = new Date(r.reminder_date);
      return !Number.isNaN(d.getTime()) && d >= now && d <= threeDaysLater;
    }).length;
  }, [activeReminders]);

  const totalSightings = useMemo(() => {
    return ownerReportsWithSightings.reduce(
      (sum, report) => sum + Number(report?.sightings_count || 0),
      0
    );
  }, [ownerReportsWithSightings]);

  const firstReportWithSightings = useMemo(() => {
    return ownerReportsWithSightings.length > 0 ? ownerReportsWithSightings[0] : null;
  }, [ownerReportsWithSightings]);

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const activePet = useMemo(() => {
    if (!pets.length) return null;
    return pets[activePetIndex] || pets[0] || null;
  }, [pets, activePetIndex]);

  const activePetImage = activePet ? getPetImageSrc(activePet) : null;

  const getSightingRoute = (report) => {
    const petId =
      report?.pet_id ||
      report?.lost_pet_id ||
      report?.pet?.id ||
      report?.animal_id ||
      report?.id;

    return petId ? `/premium/pets/${petId}/sightings` : "/premium/lostfound";
  };

  const sliderCards = [
    {
      icon: "💬",
      title: "AI Pet Assistant",
      text: "Premium support when you need quick pet-care guidance.",
      action: "Open",
      onClick: handleVetChat,
    },
    {
      icon: "🐾",
      title: "My Pets",
      text: `${pets.length} pet profile${pets.length === 1 ? "" : "s"} organised in one place.`,
      action: "View",
      onClick: () => navigate("/premium-mypets"),
    },
    {
      icon: "⏰",
      title: "Reminders",
      text:
        activeReminders.length > 0
          ? `${activeReminders.length} active reminder${activeReminders.length === 1 ? "" : "s"}.`
          : "No urgent reminders right now.",
      action: "Open",
      onClick: () => navigate("/premium/reminders"),
    },
    {
      icon: "📅",
      title: "Appointments",
      text:
        upcomingAppointments.length > 0
          ? `${upcomingAppointments.length} upcoming visit${upcomingAppointments.length === 1 ? "" : "s"}.`
          : "No appointment booked yet.",
      action: "Book",
      onClick: () => navigate("/premium/appointments"),
    },
    {
      icon: "👀",
      title: "Sightings",
      text:
        totalSightings > 0
          ? `${totalSightings} sighting${totalSightings === 1 ? "" : "s"} on your lost reports.`
          : "No sightings on your reports yet.",
      action: "Check",
      onClick: () =>
        firstReportWithSightings
          ? navigate(getSightingRoute(firstReportWithSightings))
          : navigate("/premium/lostfound"),
    },
    {
      icon: "📦",
      title: "Inventory",
      text: "Track food, medicine, and supplies without clutter.",
      action: "Open",
      onClick: () => navigate("/premium/inventory"),
    },
    {
      icon: "💗",
      title: "Community",
      text: "Share advice and connect with other pet owners.",
      action: "Visit",
      onClick: () => navigate("/premium/community"),
    },
  ];

  return (
    <div className="pfd-shell">
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
            <div className="pfd-brand-sub">Premium Dashboard</div>
          </div>
        </div>

        <nav className="pfd-topnav">
          <Link className="pfd-topnav-item active" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pfd-topnav-item" to="/premium-mypets">
            My Pet
          </Link>
          <Link className="pfd-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="pfd-topnav-item" to="/premium/reminders">
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

      <main className="pfd-main">
        <section className="pfd-hero">
          <div className="pfd-hero-copy">
            <div className="pfd-kicker">Pawfection Premium</div>

            <h1 className="pfd-hero-title">
              {getGreeting()}, {userName} ✨
            </h1>

            <p className="pfd-hero-text">
              A cleaner space for your pets, reminders, appointments, and premium care tools.
            </p>

            <div className="pfd-stats-row">
              <div className="pfd-stat-card">
                <span>🐾</span>
                <strong>{pets.length}</strong>
                <small>Pets</small>
              </div>

              <div className="pfd-stat-card">
                <span>⏰</span>
                <strong>{activeReminders.length}</strong>
                <small>Reminders</small>
              </div>

              <div className="pfd-stat-card">
                <span>👀</span>
                <strong>{totalSightings}</strong>
                <small>Sightings</small>
              </div>
            </div>

            <div className="pfd-quick-grid">
              <button className="pfd-quick-card primary" onClick={handleVetChat}>
                <span>💬</span>
                <div>
                  <strong>AI Pet Assistant</strong>
                  <small>Premium support</small>
                </div>
              </button>

              <button className="pfd-quick-card" onClick={() => navigate("/premium-mypets")}>
                <span>🐶</span>
                <div>
                  <strong>My Pets</strong>
                  <small>View profiles</small>
                </div>
              </button>

              <button
                className="pfd-quick-card"
                onClick={() => navigate("/premium/appointments")}
              >
                <span>📅</span>
                <div>
                  <strong>Book Visit</strong>
                  <small>Appointments</small>
                </div>
              </button>

              <button
                className="pfd-quick-card"
                onClick={() => navigate("/premium/lostfound")}
              >
                <span>📍</span>
                <div>
                  <strong>Lost &amp; Found</strong>
                  <small>Reports &amp; sightings</small>
                </div>
              </button>
            </div>
          </div>

          <div className="pfd-hero-feature">
            <div className="pfd-feature-badge">
              <span>⭐</span>
              <div>
                <strong>Premium Active</strong>
                <small>All premium tools unlocked</small>
              </div>
            </div>

            <div className="pfd-feature-photo" key={activePet?.id || "empty-feature-pet"}>
              {activePetImage ? (
                <img src={activePetImage} alt={activePet?.name || "Pet"} />
              ) : (
                <div className="pfd-photo-empty">
                  <span>🐾</span>
                  <strong>Add a pet photo</strong>
                  <small>Your featured pet will appear here.</small>
                </div>
              )}

              <div className="pfd-feature-overlay">
                <small>Featured Pet</small>
                <strong>{activePet?.name || "Your Pet"}</strong>
                <span>{activePet ? getPetSummary(activePet) : "Pet profile spotlight"}</span>
              </div>

              {pets.length > 1 && (
                <div className="pfd-pet-dots">
                  {pets.map((pet, index) => (
                    <button
                      key={pet.id}
                      type="button"
                      className={index === activePetIndex ? "active" : ""}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePetIndex(index);
                      }}
                      aria-label={`Show ${pet.name}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="pfd-overview-grid">
          <article className="pfd-panel">
            <div className="pfd-panel-head">
              <div>
                <span className="pfd-kicker">Care Summary</span>
                <h2>Next Care Task</h2>
              </div>
              <button className="pfd-small-btn" onClick={() => navigate("/premium/reminders")}>
                Open
              </button>
            </div>

            <div className="pfd-summary-list">
              <div className="pfd-summary-row">
                <div className="pfd-summary-icon">⏰</div>
                <div>
                  <strong>
                    {remindersLoading ? "Loading..." : nextReminder?.title || "No reminder due"}
                  </strong>
                  <p>
                    {remindersLoading
                      ? "Please wait..."
                      : nextReminder?.message || "Everything looks calm right now."}
                  </p>
                  {nextReminder?.reminder_date && (
                    <small>Due: {formatDate(nextReminder.reminder_date)}</small>
                  )}
                </div>
              </div>

              <div className="pfd-summary-row">
                <div className="pfd-summary-icon">📅</div>
                <div>
                  <strong>
                    {apptsLoading
                      ? "Loading..."
                      : nextAppointment?.title ||
                        nextAppointment?.service ||
                        "No appointment booked"}
                  </strong>
                  <p>
                    {apptsLoading
                      ? "Please wait..."
                      : nextAppointment
                      ? formatDateTime(nextAppointment.appointment_at)
                      : "Book one when your pet needs care."}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="pfd-panel">
            <div className="pfd-panel-head">
              <div>
                <span className="pfd-kicker">Pet Profile</span>
                <h2>My Pet</h2>
              </div>
              <button className="pfd-small-btn" onClick={() => navigate("/premium-mypets")}>
                View
              </button>
            </div>

            {petsLoading && <div className="pfd-empty">Loading pets…</div>}
            {!petsLoading && petsError && <div className="pfd-empty">{petsError}</div>}

            {!petsLoading && !petsError && activePet && (
              <div className="pfd-small-pet" key={activePet.id}>
                <div className="pfd-small-pet-img">
                  {activePetImage ? (
                    <img src={activePetImage} alt={activePet.name} />
                  ) : (
                    <span>🐾</span>
                  )}
                </div>

                <div className="pfd-small-pet-content">
                  <strong>{activePet.name}</strong>
                  <p>{getPetSummary(activePet)}</p>

                  <div className="pfd-inline-actions">
                    <button
                      className="pfd-small-btn"
                      onClick={() => navigate("/premium-mypets")}
                    >
                      View
                    </button>

                    <button
                      className="pfd-small-btn"
                      onClick={() => navigate(`/premium/pets/${activePet.id}/edit`)}
                    >
                      Edit
                    </button>
                  </div>

                  {pets.length > 1 && (
                    <div className="pfd-small-pet-dots">
                      {pets.map((pet, index) => (
                        <button
                          key={pet.id}
                          type="button"
                          className={index === activePetIndex ? "active" : ""}
                          onClick={() => setActivePetIndex(index)}
                          aria-label={`Show ${pet.name}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!petsLoading && !petsError && !activePet && (
              <div className="pfd-empty">No pets yet. Add a pet to personalise your dashboard.</div>
            )}
          </article>

          <article className="pfd-panel">
            <div className="pfd-panel-head">
              <div>
                <span className="pfd-kicker">Lost &amp; Found</span>
                <h2>Sightings</h2>
              </div>
              <button className="pfd-small-btn" onClick={() => navigate("/premium/lostfound")}>
                Open
              </button>
            </div>

            {lostReportsLoading && <div className="pfd-empty">Loading sightings…</div>}

            {!lostReportsLoading && !firstReportWithSightings && (
              <div className="pfd-empty">No sightings on your reports yet.</div>
            )}

            {!lostReportsLoading && firstReportWithSightings && (
              <div className="pfd-sighting-card">
                <div className="pfd-summary-icon">👀</div>
                <div>
                  <strong>
                    {firstReportWithSightings.pet_name ||
                      firstReportWithSightings.name ||
                      "Lost pet report"}
                  </strong>
                  <p>
                    {firstReportWithSightings.location ||
                      firstReportWithSightings.last_seen_location ||
                      "Location not available"}
                  </p>
                  <small>
                    {firstReportWithSightings.sightings_count} sighting
                    {firstReportWithSightings.sightings_count === 1 ? "" : "s"}
                  </small>
                  <button
                    className="pfd-small-btn"
                    onClick={() => navigate(getSightingRoute(firstReportWithSightings))}
                  >
                    View Sightings
                  </button>
                </div>
              </div>
            )}
          </article>
        </section>

        <section className="pfd-auto-section">
          <div className="pfd-auto-head">
            <div>
              <span className="pfd-kicker">Premium Tools</span>
              <h2>Everything your pet needs, sliding automatically</h2>
            </div>
            <span className="pfd-auto-pill">{dueSoonReminderCount} due soon</span>
          </div>

          <div className="pfd-slider-mask">
            <div className="pfd-slider-track">
              {[0, 1].map((groupIndex) => (
                <div className="pfd-slider-group" key={groupIndex}>
                  {sliderCards.map((card, index) => (
                    <button
                      key={`${groupIndex}-${index}`}
                      className="pfd-slide-card"
                      onClick={card.onClick}
                      type="button"
                    >
                      <span>{card.icon}</span>
                      <strong>{card.title}</strong>
                      <p>{card.text}</p>
                      <small>{card.action}</small>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="pfd-slider-dots">
            <span></span>
            <span className="active"></span>
            <span></span>
            <span></span>
          </div>
        </section>
      </main>
    </div>
  );
}