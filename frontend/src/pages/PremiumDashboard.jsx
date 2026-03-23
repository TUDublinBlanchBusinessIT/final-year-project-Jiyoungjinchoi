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

  const sidePet = visiblePets[1] || pets[1] || heroPet || null;
  const sidePetImage = sidePet ? getPetImageSrc(sidePet) : null;

  const tallPet = visiblePets[2] || pets[2] || sidePet || heroPet || null;
  const tallPetImage = tallPet ? getPetImageSrc(tallPet) : null;

  const heroReminder = filteredReminders[0] || upcomingReminders[0] || null;

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
            Dashboard
          </Link>
          <Link className="pfd-topnav-item" to="/mypets">
            My Pets
          </Link>
          <Link className="pfd-topnav-item" to="/appointments">
            Appointments
          </Link>
          <Link className="pfd-topnav-item" to="/reminders">
            Reminders
          </Link>
          <Link className="pfd-topnav-item" to="/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pfd-topnav-item" to="/community">
            Community
          </Link>
          <Link className="pfd-topnav-item" to="/inventory">
            Inventory
          </Link>
          <Link className="pfd-topnav-item" to="/profile">
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
          <span className="pfd-doodle pfd-doodle-cat">🐱</span>

          <div className="pfd-hero-copy">
            <div className="pfd-kicker">Pawfection Premium</div>
            <h1 className="pfd-hero-title">
              {getGreeting()}, {userName}
            </h1>
            <p className="pfd-hero-text">
              A softer, more playful dashboard inspired by premium pet-brand websites.
              Your uploaded pet photos lead the design while all your real features stay fully usable.
            </p>

            <div className="pfd-hero-chips">
              <div className="pfd-chip">🐾 {pets.length} pets</div>
              <div className="pfd-chip">📅 {upcomingAppointmentsCount} visits</div>
              <div className="pfd-chip">⏰ {activeReminderCount} reminders</div>
            </div>

            <div className="pfd-hero-actions">
              <button
                className="pfd-btn pfd-btn-primary"
                onClick={() => navigate("/pets/create")}
              >
                Add Pet
              </button>
              <button className="pfd-btn" onClick={() => navigate("/appointments/book")}>
                Book Appointment
              </button>
              <button className="pfd-btn" onClick={() => navigate("/reminders")}>
                View Reminders
              </button>
            </div>
          </div>

          <div className="pfd-hero-visual">
            <div className="pfd-speech pfd-speech-left">
              <div className="pfd-speech-title">Premium care</div>
              <div className="pfd-speech-text">made for every wag, purr, and pawprint</div>
            </div>

            <article className="pfd-hero-photo-card">
              {heroPetImage ? (
                <img src={heroPetImage} alt={heroPet?.name || "Pet"} />
              ) : (
                <div className="pfd-photo-empty">
                  <div className="pfd-photo-empty-icon">🐶</div>
                  <div className="pfd-photo-empty-title">Your pet photo appears here</div>
                  <div className="pfd-photo-empty-text">
                    Add or edit a pet profile with a photo to build this look.
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
          <article className="pfd-card pfd-card-poster">
            <span className="pfd-card-sticker">🐾</span>
            <div className="pfd-card-kicker">Pet moments</div>
            <h2>The little details make every pet story special.</h2>
            <p>
              Keep profiles, care notes, reminders and visits organised in one warm premium space.
            </p>
            <button className="pfd-btn pfd-btn-small" onClick={() => navigate("/profile")}>
              Open Profile
            </button>
          </article>

          <article className="pfd-card pfd-card-arch">
            <div className="pfd-card-kicker">Pet spotlight</div>
            <div className="pfd-arch-frame">
              {sidePetImage ? (
                <img src={sidePetImage} alt={sidePet?.name || "Pet"} />
              ) : (
                <div className="pfd-arch-empty">🐾</div>
              )}
            </div>
            <div className="pfd-arch-name">{sidePet?.name || "Your Pet"}</div>
            <div className="pfd-arch-meta">
              {sidePet ? getPetSummary(sidePet) : "Premium pet spotlight"}
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
              <button className="pfd-btn pfd-btn-small" onClick={() => navigate("/appointments")}>
                Appointments
              </button>
              <button className="pfd-btn pfd-btn-small" onClick={() => navigate("/reminders")}>
                Reminders
              </button>
            </div>
          </article>

          <article className="pfd-card pfd-card-gallery pfd-span-2">
            <div className="pfd-card-head">
              <div>
                <div className="pfd-card-kicker">Pet gallery</div>
                <h2>My Pets</h2>
                <p>Your uploaded photos arranged in a playful premium board.</p>
              </div>
              <button className="pfd-btn pfd-btn-small" onClick={() => navigate("/mypets")}>
                View All
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
                  <button className="pfd-btn pfd-btn-small" onClick={() => navigate("/appointments")}>
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
                  <button className="pfd-btn pfd-btn-small" onClick={() => navigate("/reminders")}>
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

          <article className="pfd-banner pfd-span-3">
            <span className="pfd-banner-paw pfd-banner-paw-1">🐾</span>
            <span className="pfd-banner-paw pfd-banner-paw-2">🐾</span>
            <span className="pfd-banner-bone">🦴</span>

            <div className="pfd-banner-copy">
              <div className="pfd-card-kicker pfd-card-kicker-light">Premium story</div>
              <h2>Everything your pet needs, in one warm playful dashboard.</h2>
              <div className="pfd-banner-divider">
                pawfectly organised, lovingly designed 🐾
              </div>
             
            </div>

            <div className="pfd-banner-actions">
              <button className="pfd-quickaction" onClick={() => navigate("/pets/create")}>
                <span className="pfd-quickicon">🐶</span>
                <span>Add Pet</span>
              </button>
              <button className="pfd-quickaction" onClick={() => navigate("/inventory")}>
                <span className="pfd-quickicon">📦</span>
                <span>Inventory</span>
              </button>
              <button className="pfd-quickaction" onClick={() => navigate("/lostfound")}>
                <span className="pfd-quickicon">📍</span>
                <span>Lost &amp; Found</span>
              </button>
              <button className="pfd-quickaction" onClick={() => navigate("/community")}>
                <span className="pfd-quickicon">💬</span>
                <span>Community</span>
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}