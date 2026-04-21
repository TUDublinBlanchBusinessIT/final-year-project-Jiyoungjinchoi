import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import PremiumPetInsights from "../components/PremiumPetInsights";
import "./PremiumDashboard.css";

export default function PremiumDashboard() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");
  const [accountType, setAccountType] = useState("premium");

  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [appointments, setAppointments] = useState([]);
  const [apptsLoading, setApptsLoading] = useState(false);

  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);

  const [ownerReportsWithSightings, setOwnerReportsWithSightings] = useState([]);
  const [lostReportsLoading, setLostReportsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const isPremium = accountType === "premium";

  const premiumBenefits = [
    "Access to AI Pet Assistant",
    "Priority pet-care support",
    "Premium-only pet tools",
    "Enhanced reminders and guidance",
  ];

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

          const ownerName =
            String(
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
              sightings_count: relatedSightings.length,
            });
          }
        } catch (err) {
          console.error("Error checking owned lost report:", err);
        }
      }

      setOwnerReportsWithSightings(
        ownedLostReports.sort(
          (a, b) => (b?.sightings_count || 0) - (a?.sightings_count || 0)
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

    setAccountType("premium");
    localStorage.setItem("pawfection_account_type", "premium");

    const resolvedUser = getStoredUser();

    try {
      if (resolvedUser?.name && typeof resolvedUser.name === "string") {
        setUserName(resolvedUser.name);
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
  }, [navigate]);

  useEffect(() => {
    const resolvedUserId = getStoredUserId();
    if (resolvedUserId && userName) {
      fetchOwnerReportsWithSightings(resolvedUserId);
    }
  }, [userName]);

  const getPetImageSrc = (pet) => {
    if (pet?.photo_url) return pet.photo_url;
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

  const handleVetChat = () => {
    if (isPremium) {
      navigate("/premium/vet-chat");
    } else {
      navigate("/upgrade-premium");
    }
  };

  const handleViewMyPet = () => {
    navigate("/premium-mypets");
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

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const visiblePets = filteredPets.length ? filteredPets : pets;
  const galleryPets = visiblePets.slice(0, 4);

  const heroPet = visiblePets[0] || pets[0] || null;
  const heroPetImage = heroPet ? getPetImageSrc(heroPet) : null;

  const tallPet = visiblePets[2] || pets[2] || heroPet || null;
  const tallPetImage = tallPet ? getPetImageSrc(tallPet) : null;

  const heroReminder = filteredReminders[0] || upcomingReminders[0] || null;

  const firstReportWithSightings = useMemo(() => {
    return ownerReportsWithSightings.length > 0 ? ownerReportsWithSightings[0] : null;
  }, [ownerReportsWithSightings]);

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
            My Pets
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
          <div className="pfd-header-meta">
            <div className="pfd-date-pill">{todayText}</div>

            <div className="pfd-userchip" title={userName}>
              <div className="pfd-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pfd-userchip-text">
                <div className="pfd-userchip-name">{userName}</div>
                <div className="pfd-userchip-sub">
                  {isPremium ? "Premium User" : "Standard User"}
                </div>
              </div>
            </div>
          </div>

          <div className="pfd-search">
            <input
              type="text"
              placeholder="Search pets or reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="pfd-main">
        <section className="pfd-hero">
          <span className="pfd-doodle pfd-doodle-paw-1">🐾</span>
          <span className="pfd-doodle pfd-doodle-paw-2">🐾</span>
          <span className="pfd-doodle pfd-doodle-bone">🦴</span>
          <span className="pfd-doodle pfd-doodle-heart">💗</span>

          <div className="pfd-hero-copy">
            <div className="pfd-kicker">
              {isPremium ? "Pawfection Premium Dashboard" : "Pawfection Dashboard"}
            </div>
            <h1 className="pfd-hero-title">
              {getGreeting()}, {userName}
            </h1>
            <p className="pfd-hero-text">
              Keep your pets, reminders, appointments, and premium support tools in one
              beautifully organised space.
            </p>

            <div className="pfd-hero-chips">
              <div className="pfd-chip">
                {isPremium ? "⭐ Premium Active" : "🔒 Standard Plan"}
              </div>
              <div className="pfd-chip">🐾 {pets.length} pets</div>
              <div className="pfd-chip">📅 {upcomingAppointmentsCount} visits</div>
              <div className="pfd-chip">⏰ {activeReminderCount} reminders</div>
            </div>

            <div className="pfd-hero-actions">
              <button className="pfd-btn pfd-btn-primary" onClick={handleVetChat}>
                {isPremium ? "Open Vet Chat" : "Upgrade for Vet Chat"}
              </button>

              <button className="pfd-btn" onClick={handleViewMyPet}>
                View My Pets
              </button>

              <button
                className="pfd-btn"
                onClick={() => navigate("/premium/appointments")}
              >
                Book Appointment
              </button>

              <button
                className="pfd-btn"
                onClick={() => navigate("/premium/lostfound")}
              >
                Open Lost &amp; Found
              </button>

              {firstReportWithSightings && (
                <button
                  className="pfd-btn"
                  onClick={() =>
                    navigate(`/premium/lostfound/view/${firstReportWithSightings.id}`)
                  }
                >
                  View Sightings ({firstReportWithSightings.sightings_count})
                </button>
              )}
            </div>
          </div>

          <div className="pfd-hero-visual">
            <div className="pfd-speech pfd-speech-left">
              <div className="pfd-speech-title">Membership</div>
              <div className="pfd-speech-text">
                {isPremium ? "Premium access is active." : "Upgrade to unlock Vet Chat."}
              </div>
            </div>

            <article className="pfd-hero-photo-card">
              {heroPetImage ? (
                <img src={heroPetImage} alt={heroPet?.name || "Pet"} />
              ) : (
                <div className="pfd-photo-empty">
                  <div className="pfd-photo-empty-icon">🐶</div>
                  <div className="pfd-photo-empty-title">Your featured pet appears here</div>
                  <div className="pfd-photo-empty-text">
                    Add or edit a pet profile with a photo to personalise your premium dashboard.
                  </div>
                </div>
              )}

              <div className="pfd-hero-photo-overlay">
                <div className="pfd-card-kicker pfd-card-kicker-light">Featured pet</div>
                <div className="pfd-hero-photo-name">{heroPet?.name || "Your Pet"}</div>
                <div className="pfd-hero-photo-meta">
                  {heroPet ? getPetSummary(heroPet) : "Pet profile spotlight"}
                </div>
              </div>
            </article>

            <div className="pfd-speech pfd-speech-right">
              <div className="pfd-speech-title">Up next</div>
              <div className="pfd-speech-text">{heroReminder?.title || "No reminder due"}</div>
            </div>
          </div>
        </section>

        <section className="pfd-collage">
          <article className="pfd-card pfd-span-2">
            <div className="pfd-card-head">
              <div>
                <div className="pfd-card-kicker">Membership</div>
                <h2>Premium Status</h2>
                <p>Check your access level and available premium benefits.</p>
              </div>
              {!isPremium && (
                <button
                  className="pfd-btn pfd-btn-small"
                  onClick={() => navigate("/upgrade-premium")}
                >
                  Upgrade
                </button>
              )}
            </div>

            <div className="pfd-mini-list">
              <div className="pfd-mini-item">
                <div className="pfd-mini-item-icon">{isPremium ? "⭐" : "🔒"}</div>
                <div className="pfd-mini-item-body">
                  <div className="pfd-mini-item-title">
                    {isPremium ? "Premium User" : "Standard User"}
                  </div>
                  <div className="pfd-mini-item-text">
                    {isPremium
                      ? "You can access premium-only features including Vet Chat."
                      : "Upgrade to Premium to unlock Vet Chat and other premium benefits."}
                  </div>
                </div>
              </div>

              {premiumBenefits.map((benefit, index) => (
                <div key={index} className="pfd-mini-item">
                  <div className="pfd-mini-item-icon">🐾</div>
                  <div className="pfd-mini-item-body">
                    <div className="pfd-mini-item-title">{benefit}</div>
                    <div className="pfd-mini-item-text">
                      {isPremium ? "Available on your plan." : "Locked until upgrade."}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pfd-care-actions" style={{ marginTop: "16px" }}>
              <button className="pfd-btn pfd-btn-small" onClick={handleVetChat}>
                {isPremium ? "Launch Vet Chat" : "Unlock Vet Chat"}
              </button>
              {!isPremium && (
                <button
                  className="pfd-btn pfd-btn-small"
                  onClick={() => navigate("/upgrade-premium")}
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          </article>

          <article className="pfd-card pfd-card-care">
            <div className="pfd-card-kicker">Care board</div>

            <div className="pfd-care-ring">
              <div className="pfd-care-ring-value">{dueSoonReminderCount}</div>
              <div className="pfd-care-ring-text">due soon</div>
            </div>

            <div className="pfd-care-block">
              <div className="pfd-care-label">Next appointment</div>
              <div className="pfd-care-main">
                {apptsLoading
                  ? "Loading..."
                  : nextAppointment?.title ||
                    nextAppointment?.service ||
                    "No upcoming appointment"}
              </div>
              <div className="pfd-care-sub">
                {apptsLoading
                  ? "Please wait..."
                  : nextAppointment
                  ? formatDateTime(nextAppointment.appointment_at)
                  : "Book a visit to stay organised."}
              </div>
            </div>

            <div className="pfd-care-divider" />

            <div className="pfd-care-block">
              <div className="pfd-care-label">Upcoming reminder</div>
              <div className="pfd-care-main">
                {remindersLoading ? "Loading..." : heroReminder?.title || "No reminder due"}
              </div>
              <div className="pfd-care-sub">
                {remindersLoading
                  ? "Please wait..."
                  : heroReminder?.message || "Everything looks calm for now."}
              </div>
            </div>

            <div className="pfd-care-actions">
              <button
                className="pfd-btn pfd-btn-small"
                onClick={() => navigate("/premium/appointments")}
              >
                Appointments
              </button>
              <button
                className="pfd-btn pfd-btn-small"
                onClick={() => navigate("/premium/reminders")}
              >
                Reminders
              </button>
            </div>
          </article>

          <article className="pfd-card pfd-span-2">
            <div className="pfd-card-head">
              <div>
                <div className="pfd-card-kicker">Lost &amp; Found</div>
                <h2>Lost &amp; Found Sightings</h2>
                <p>Only your own lost reports with sightings appear here.</p>
              </div>
              <button
                className="pfd-btn pfd-btn-small"
                onClick={() => navigate("/premium/lostfound")}
              >
                Open Lost &amp; Found
              </button>
            </div>

            {lostReportsLoading && <div className="pfd-empty">Loading sightings…</div>}

            {!lostReportsLoading && ownerReportsWithSightings.length === 0 && (
              <div className="pfd-empty">No sightings on your reports yet.</div>
            )}

            {!lostReportsLoading && ownerReportsWithSightings.length > 0 && (
              <div className="pfd-mini-list">
                {ownerReportsWithSightings.slice(0, 4).map((report) => (
                  <div key={report.id} className="pfd-mini-item">
                    <div className="pfd-mini-item-icon">👀</div>
                    <div className="pfd-mini-item-body">
                      <div className="pfd-mini-item-title">
                        {report.pet_name || report.name || "Lost pet report"}
                      </div>
                      <div className="pfd-mini-item-text">
                        {report.location || report.last_seen_location || "Location not available"}
                      </div>
                      <div className="pfd-mini-item-sub">
                        {report.sightings_count} sighting
                        {report.sightings_count === 1 ? "" : "s"} • Reported{" "}
                        {formatDate(
                          report.reported_lost_at || report.reported_at || report.created_at
                        )}
                      </div>

                      <div style={{ marginTop: "10px" }}>
                        <button
                          className="pfd-btn pfd-btn-small"
                          onClick={() => navigate(`/premium/lostfound/view/${report.id}`)}
                        >
                          View Sightings ({report.sightings_count})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="pfd-card pfd-card-gallery pfd-span-2">
            <div className="pfd-card-head">
              <div>
                <div className="pfd-card-kicker">Pet gallery</div>
                <h2>My Pets</h2>
                <p>Your uploaded photos arranged in a clean premium board.</p>
              </div>
              <button className="pfd-btn pfd-btn-small" onClick={handleViewMyPet}>
                Open Pets
              </button>
            </div>

            {petsLoading && <div className="pfd-empty">Loading pets…</div>}
            {!petsLoading && petsError && <div className="pfd-empty">{petsError}</div>}
            {!petsLoading && !petsError && visiblePets.length === 0 && (
              <div className="pfd-empty">
                No pets found yet. Add a pet with a photo to build the dashboard visuals.
              </div>
            )}

            {!petsLoading && !petsError && visiblePets.length > 0 && (
              <div className="pfd-pet-gallery">
                {galleryPets.map((pet) => {
                  const imgSrc = getPetImageSrc(pet);

                  return (
                    <div key={pet.id} className="pfd-pet-tile">
                      <div className="pfd-pet-tile-photo">
                        {imgSrc ? (
                          <img src={imgSrc} alt={pet.name} />
                        ) : (
                          <div className="pfd-pet-tile-placeholder">🐾</div>
                        )}
                      </div>

                      <div className="pfd-pet-tile-body">
                        <div className="pfd-pet-tile-name">{pet.name}</div>
                        <div className="pfd-pet-tile-meta">{getPetSummary(pet)}</div>

                        <div className="pfd-pet-tile-actions">
                          <button
                            className="pfd-btn pfd-btn-small"
                            onClick={() => navigate(`/premium-pets/${pet.id}`)}
                          >
                            View
                          </button>
                          <button
                            className="pfd-btn pfd-btn-small"
                            onClick={() => navigate(`/premium-pets/${pet.id}/edit`)}
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
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="pfd-card pfd-card-tallphoto">
            <span className="pfd-tallphoto-paw pfd-tallphoto-paw-1">🐾</span>
            <span className="pfd-tallphoto-paw pfd-tallphoto-paw-2">🐾</span>

            {tallPetImage ? (
              <div className="pfd-tallphoto-wrap">
                <img src={tallPetImage} alt={tallPet?.name || "Pet"} />
                <div className="pfd-tallphoto-overlay">
                  <div className="pfd-card-kicker pfd-card-kicker-light">Happy face</div>
                  <div className="pfd-tallphoto-name">{tallPet?.name || "Pet"}</div>
                </div>
              </div>
            ) : (
              <div className="pfd-tallphoto-empty">
                <div className="pfd-tallphoto-empty-icon">🐶</div>
                <div className="pfd-tallphoto-empty-title">More photo magic here</div>
              </div>
            )}
          </article>

          <article className="pfd-card pfd-card-board pfd-span-2">
            <div className="pfd-board-columns">
              <div className="pfd-board-column">
                <div className="pfd-card-head">
                  <div>
                    <div className="pfd-card-kicker">Schedule</div>
                    <h2>Upcoming Appointments</h2>
                    <p>Your nearest booked visits.</p>
                  </div>
                  <button
                    className="pfd-btn pfd-btn-small"
                    onClick={() => navigate("/premium/appointments")}
                  >
                    Open
                  </button>
                </div>

                {apptsLoading && <div className="pfd-empty">Loading appointments…</div>}

                {!apptsLoading && upcomingAppointments.length === 0 && (
                  <div className="pfd-empty">No upcoming appointments found.</div>
                )}

                {!apptsLoading && upcomingAppointments.length > 0 && (
                  <div className="pfd-mini-list">
                    {upcomingAppointments.slice(0, 4).map((appt) => (
                      <div key={appt.id} className="pfd-mini-item">
                        <div className="pfd-mini-item-icon">📅</div>
                        <div className="pfd-mini-item-body">
                          <div className="pfd-mini-item-title">
                            {appt.title || appt.service || "Appointment"}
                          </div>
                          <div className="pfd-mini-item-text">
                            {formatDateTime(appt.appointment_at)}
                          </div>
                          <div className="pfd-mini-item-sub">
                            Pet: {appt.pet_name || appt.pet?.name || "Not specified"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pfd-board-column">
                <div className="pfd-card-head">
                  <div>
                    <div className="pfd-card-kicker">Care tasks</div>
                    <h2>Upcoming Reminders</h2>
                    <p>Your next pet-care tasks at a glance.</p>
                  </div>
                  <button
                    className="pfd-btn pfd-btn-small"
                    onClick={() => navigate("/premium/reminders")}
                  >
                    View All
                  </button>
                </div>

                {remindersLoading && <div className="pfd-empty">Loading reminders…</div>}

                {!remindersLoading && filteredReminders.length === 0 && (
                  <div className="pfd-empty">No upcoming reminders found.</div>
                )}

                {!remindersLoading && filteredReminders.length > 0 && (
                  <div className="pfd-reminder-list">
                    {filteredReminders.slice(0, 4).map((r) => (
                      <div key={r.id} className="pfd-reminder-row">
                        <div className="pfd-reminder-icon">🐾</div>
                        <div className="pfd-reminder-meta">
                          <div className="pfd-reminder-name">{r.title}</div>
                          <div className="pfd-reminder-desc">{r.message || "Reminder"}</div>
                          <div className="pfd-reminder-date">
                            Due: {formatDate(r.reminder_date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>

          <PremiumPetInsights
            pets={pets}
            upcomingReminders={upcomingReminders}
            appointments={appointments}
            isPremium={isPremium}
          />

          <article className="pfd-banner pfd-span-3">
            <span className="pfd-banner-paw pfd-banner-paw-1">🐾</span>
            <span className="pfd-banner-paw pfd-banner-paw-2">🐾</span>
            <span className="pfd-banner-bone">🦴</span>

            <div className="pfd-banner-copy">
              <div className="pfd-card-kicker pfd-card-kicker-light">Premium care</div>
              <h2>
                {isPremium
                  ? "Everything your pet needs, with premium support beautifully organised."
                  : "Upgrade to Premium for extra pet-care support and Vet Chat."}
              </h2>
              <div className="pfd-banner-divider">
                pawfectly organised, lovingly designed 🐾
              </div>
            </div>

            <div className="pfd-banner-actions">
              <button className="pfd-quickaction" onClick={() => navigate("/pets/create")}>
                <span className="pfd-quickicon">🐶</span>
                <span>Add Pet</span>
              </button>
              <button className="pfd-quickaction" onClick={handleVetChat}>
                <span className="pfd-quickicon">💬</span>
                <span>{isPremium ? "Vet Chat" : "Unlock Vet Chat"}</span>
              </button>
              <button
                className="pfd-quickaction"
                onClick={() => navigate("/premium/inventory")}
              >
                <span className="pfd-quickicon">📦</span>
                <span>Inventory</span>
              </button>
              <button
                className="pfd-quickaction"
                onClick={() => navigate("/premium/community")}
              >
                <span className="pfd-quickicon">💗</span>
                <span>Community</span>
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}