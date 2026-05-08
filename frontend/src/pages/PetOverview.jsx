import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./PetOverview.css";

const TABS = ["Overview", "Health", "Diet", "Behaviour", "Reminders", "Guidance"];

function calculateAge(dob) {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-GB");
}

function getGuidanceTips(pet) {
  const species = (pet?.species || "").toLowerCase();
  const breed = (pet?.breed || "").toLowerCase();

  if (breed.includes("husky")) {
    return [
      "Huskies need regular daily exercise to stay healthy and happy.",
      "Frequent brushing helps manage shedding and keeps the coat healthy.",
      "Mental stimulation is important to reduce boredom and restlessness.",
    ];
  }

  if (breed.includes("persian")) {
    return [
      "Persian cats benefit from regular grooming to prevent matting.",
      "Keep their feeding and care routine consistent to reduce stress.",
      "Check eyes and facial folds regularly as part of care.",
    ];
  }

  if (breed.includes("poodle")) {
    return [
      "Poodles benefit from regular grooming and coat maintenance.",
      "Daily play and mental stimulation help prevent boredom.",
      "Consistent activity keeps them engaged and balanced.",
    ];
  }

  if (breed.includes("golden retriever")) {
    return [
      "Golden Retrievers thrive with daily walks and social interaction.",
      "Regular brushing helps reduce shedding and keeps the coat healthy.",
      "Balanced diet and routine exercise help maintain healthy weight.",
    ];
  }

  if (species === "dog") {
    return [
      "Dogs benefit from daily exercise, fresh water, and regular check-ups.",
      "Consistent routines can help with behaviour and wellbeing.",
      "Interactive play can improve both mood and fitness.",
    ];
  }

  if (species === "cat") {
    return [
      "Cats need a calm environment, fresh water, and regular litter cleaning.",
      "Routine grooming and play can support their health and mood.",
      "A stable feeding and sleeping routine helps reduce stress.",
    ];
  }

  return [
    "Keep your pet profile updated for better care organisation.",
    "Add reminders and health information to improve overall care tracking.",
  ];
}

export default function PetOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const token = localStorage.getItem("pawfection_token");
  const storedUser = localStorage.getItem("pawfection_user");
  const storedAccountType = localStorage.getItem("pawfection_account_type");

  const parsedUser = useMemo(() => {
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }, [storedUser]);

  const accountType = String(
    storedAccountType || parsedUser?.account_type || "basic"
  ).toLowerCase();

  const isPremium = accountType === "premium";

  const [userName, setUserName] = useState("User");
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("Overview");

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name) setUserName(userObj.name);
      }
    } catch {
      setUserName("User");
    }
  }, []);

  const imgSrc = useMemo(() => {
    if (!pet) return null;
    if (pet?.photo_url) return pet.photo_url;
    if (pet?.photo_path) return `http://127.0.0.1:8000/storage/${pet.photo_path}`;
    if (pet?.photo) return `http://127.0.0.1:8000/storage/${pet.photo}`;
    return null;
  }, [pet]);

  const calculatedAge = useMemo(() => calculateAge(pet?.dob), [pet?.dob]);
  const guidanceTips = useMemo(() => getGuidanceTips(pet), [pet]);

  const upcomingReminders = useMemo(() => {
    if (!Array.isArray(pet?.reminders)) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return pet.reminders
      .filter((reminder) => {
        if (!reminder?.reminder_date) return false;
        const reminderDate = new Date(reminder.reminder_date);
        if (Number.isNaN(reminderDate.getTime())) return false;
        return reminderDate >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime()
      )
      .slice(0, 5);
  }, [pet]);

  const profileCompleteness = useMemo(() => {
    if (!pet) return 0;

    const checks = [
      pet.name,
      pet.species,
      pet.breed,
      pet.gender,
      pet.weight,
      pet.dob,
      pet.vaccination_status,
      pet.last_vet_visit,
      pet.diet || pet.food_type,
      pet.activity_level,
      pet.temperament || pet.personality_traits,
      pet.notes || pet.behaviour_notes,
      pet.microchip_number,
      pet.photo || pet.photo_path || pet.photo_url,
    ];

    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [pet]);

  const careScore = useMemo(() => {
    if (!pet) return 0;

    let score = 48;

    if (pet.name) score += 6;
    if (pet.species) score += 4;
    if (pet.breed) score += 4;
    if (pet.gender) score += 3;
    if (pet.weight) score += 5;
    if (pet.dob || calculatedAge !== null) score += 5;
    if (pet.vaccination_status) score += 8;
    if (pet.last_vet_visit) score += 6;
    if (pet.diet || pet.food_type) score += 4;
    if (pet.activity_level) score += 3;
    if (pet.temperament || pet.personality_traits) score += 4;
    if (guidanceTips.length > 0) score += 4;
    if (upcomingReminders.length > 0) score += 6;

    return Math.min(score, 100);
  }, [pet, calculatedAge, guidanceTips.length, upcomingReminders.length]);

  const nextReminder = upcomingReminders[0] || null;

  const dashboardRoute = isPremium ? "/premium-dashboard" : "/dashboard";
  const editPetRoute = isPremium ? `/premium-pets/${id}/edit` : `/pets/${id}/edit`;
  const remindersRoute = isPremium ? "/premium/reminders" : "/reminders";

  useEffect(() => {
    const load = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      setErr("");

      try {
        const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErr(data?.message || "Failed to load pet.");
          setPet(null);
        } else {
          setPet(data);
        }
      } catch {
        setErr("Server error. Is your backend running?");
        setPet(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate, token]);

  return (
    <div className="pf2-shell">
      <aside className="pf2-sidebar">
        <div
          className="pf2-brand"
          onClick={() => navigate(dashboardRoute)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate(dashboardRoute);
          }}
        >
          <img className="pf2-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pf2-brand-text">
            <div className="pf2-brand-title">Pawfection</div>
            <div className="pf2-brand-sub">Dashboard</div>
          </div>
        </div>

        <nav className="pf2-nav">
          <Link className="pf2-nav-item" to={dashboardRoute}>
            Dashboard
          </Link>
          <Link className="pf2-nav-item active" to="/mypets">
            View My Pet
          </Link>
          <Link className="pf2-nav-item" to="/appointments">
            Appointments
          </Link>
          <Link className="pf2-nav-item" to="/reminders">
            Reminders
          </Link>
          <Link className="pf2-nav-item" to="/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pf2-nav-item" to="/community">
            Community
          </Link>
          <Link className="pf2-nav-item" to="/inventory">
            Inventory
          </Link>
        </nav>

        <div className="pf2-sidebar-footer">
          <button
            className="pf2-btn pf2-btn-ghost"
            onClick={() => navigate("/profile")}
          >
            View Profile
          </button>
        </div>
      </aside>

      <div className="pf2-main">
        <header className="pf2-topbar">
          <div className="pf2-search">
            <input value={pet?.name || ""} placeholder="Search pets..." readOnly />
          </div>

          <div className="pf2-topbar-right">
            <div className="pf2-userchip" title={userName}>
              <div className="pf2-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pf2-userchip-text">
                <div className="pf2-userchip-name">{userName}</div>
                <div className="pf2-userchip-sub">
                  {isPremium ? "Premium User" : "User"}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="pf2-content">
          <div className="pov-head">
            <div>
              <h1 className="pov-title">Pet Overview</h1>
              <p className="pov-subtitle">
                View your pet’s information, reminders, health summary, and guidance.
              </p>
            </div>

            <div className="pov-actions">
              <button className="pf2-btn" onClick={() => navigate("/mypets")}>
                Back
              </button>
              <button
                className="pf2-btn pf2-btn-primary"
                onClick={() => navigate(editPetRoute)}
              >
                Edit Pet
              </button>
            </div>
          </div>

          {loading && <div className="pov-empty">Loading pet profile...</div>}
          {!loading && err && <div className="pov-alert">{err}</div>}

          {!loading && !err && pet && (
            <>
              <section className="pf2-stats">
                <div className="pf2-stat pf2-blue">
                  <div className="pf2-stat-top">
                    <div className="pf2-stat-label">Care Score</div>
                    <div className="pf2-stat-icon pf2-icon-blue">🐾</div>
                  </div>
                  <div className="pf2-stat-value">{careScore}%</div>
                  <div className="pf2-stat-sub">Profile strength</div>
                </div>

                <div className="pf2-stat pf2-mint">
                  <div className="pf2-stat-top">
                    <div className="pf2-stat-label">Reminders</div>
                    <div className="pf2-stat-icon pf2-icon-mint">⏰</div>
                  </div>
                  <div className="pf2-stat-value">{upcomingReminders.length}</div>
                  <div className="pf2-stat-sub">Upcoming</div>
                </div>

                <div className="pf2-stat pf2-peach">
                  <div className="pf2-stat-top">
                    <div className="pf2-stat-label">Profile</div>
                    <div className="pf2-stat-icon pf2-icon-peach">📋</div>
                  </div>
                  <div className="pf2-stat-value">{profileCompleteness}%</div>
                  <div className="pf2-stat-sub">Complete</div>
                </div>
              </section>

              <section className="pov-grid">
                <div className="pov-card">
                  <div className="pov-cardhead">
                    <div>
                      <div className="pov-cardtitle">{pet.name || "Pet"}</div>
                      <div className="pov-mini">
                        {pet.species || "Pet"}
                        {pet.breed ? ` • ${pet.breed}` : ""}
                        {calculatedAge !== null ? ` • ${calculatedAge} yrs` : ""}
                        {pet.weight ? ` • ${pet.weight}kg` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="pov-profileblock">
                    <div className="pov-imagebox">
                      {imgSrc ? (
                        <img src={imgSrc} alt={pet.name} className="pov-image" />
                      ) : (
                        <div className="pov-imageplaceholder">🐾</div>
                      )}
                    </div>

                    <div className="pov-infobox">
                      <div className="pov-info-row">
                        <span className="pov-info-label">Date of Birth</span>
                        <span>{formatDate(pet.dob)}</span>
                      </div>
                      <div className="pov-info-row">
                        <span className="pov-info-label">Gender</span>
                        <span>{pet.gender || "-"}</span>
                      </div>
                      <div className="pov-info-row">
                        <span className="pov-info-label">Vaccination Status</span>
                        <span>{pet.vaccination_status || "-"}</span>
                      </div>
                      <div className="pov-info-row">
                        <span className="pov-info-label">Last Vet Visit</span>
                        <span>{formatDate(pet.last_vet_visit)}</span>
                      </div>
                      <div className="pov-info-row">
                        <span className="pov-info-label">Microchip Number</span>
                        <span>{pet.microchip_number || "Not added"}</span>
                      </div>
                      <div className="pov-info-row">
                        <span className="pov-info-label">Activity Level</span>
                        <span>{pet.activity_level || "Not added"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pov-tabs">
                    {TABS.map((t) => (
                      <button
                        key={t}
                        className={`pov-tab ${tab === t ? "active" : ""}`}
                        onClick={() => setTab(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="pov-tabpanel">
                    {tab === "Overview" && (
                      <div className="pov-detail-list">
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Notes</span>
                          <span>{pet.notes?.trim() ? pet.notes : "No notes added"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Species</span>
                          <span>{pet.species || "-"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Breed</span>
                          <span>{pet.breed || "-"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Weight</span>
                          <span>{pet.weight ? `${pet.weight}kg` : "-"}</span>
                        </div>
                      </div>
                    )}

                    {tab === "Health" && (
                      <div className="pov-detail-list">
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Vaccination Status</span>
                          <span>{pet.vaccination_status || "-"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Last Vet Visit</span>
                          <span>{formatDate(pet.last_vet_visit)}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Health Conditions</span>
                          <span>{pet.health_conditions || "None recorded"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Medical Notes</span>
                          <span>{pet.medical_notes || "-"}</span>
                        </div>
                      </div>
                    )}

                    {tab === "Diet" && (
                      <div className="pov-detail-list">
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Food Type</span>
                          <span>{pet.food_type || pet.diet || "-"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Feeding Schedule</span>
                          <span>{pet.feeding_schedule || "Not added"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Diet Notes</span>
                          <span>{pet.diet || "Not added"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Allergies</span>
                          <span>{pet.allergies || "None"}</span>
                        </div>
                      </div>
                    )}

                    {tab === "Behaviour" && (
                      <div className="pov-detail-list">
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Temperament</span>
                          <span>{pet.temperament || pet.personality_traits || "-"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Activity Level</span>
                          <span>{pet.activity_level || "Not added"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Exercise Level</span>
                          <span>{pet.exercise_level || "Not added"}</span>
                        </div>
                        <div className="pov-detail-row">
                          <span className="pov-detail-label">Behaviour Notes</span>
                          <span>{pet.behaviour_notes || pet.notes || "-"}</span>
                        </div>
                      </div>
                    )}

                    {tab === "Reminders" && (
                      <>
                        {upcomingReminders.length > 0 ? (
                          <div className="pov-reminder-list">
                            {upcomingReminders.map((reminder) => (
                              <div key={reminder.id} className="pov-reminder-item">
                                <div className="pov-reminder-title">
                                  {reminder.title || "-"}
                                </div>
                                <div className="pov-reminder-date">
                                  Due: {formatDate(reminder.reminder_date)}
                                </div>
                                <div className="pov-reminder-text">
                                  {reminder.message || "Reminder"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="pov-empty">No upcoming reminders.</div>
                        )}
                      </>
                    )}

                    {tab === "Guidance" && (
                      <div className="pov-guidance-list">
                        {guidanceTips.map((tip, index) => (
                          <div key={index} className="pov-guidance-item">
                            {tip}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pov-sidecard">
                  <div className="pov-cardtitle">Quick summary</div>
                  <div className="pov-mini">Helpful information for this pet profile.</div>

                  <div className="pov-side-list">
                    <div className="pov-side-item">
                      <div className="pov-side-label">Next reminder</div>
                      <div className="pov-side-value">
                        {nextReminder
                          ? `${nextReminder.title} on ${formatDate(nextReminder.reminder_date)}`
                          : "No upcoming reminders"}
                      </div>
                    </div>

                    <div className="pov-side-item">
                      <div className="pov-side-label">Diet</div>
                      <div className="pov-side-value">
                        {pet.diet || pet.food_type || "Not added"}
                      </div>
                    </div>

                    <div className="pov-side-item">
                      <div className="pov-side-label">Vaccination</div>
                      <div className="pov-side-value">
                        {pet.vaccination_status || "Not set"}
                      </div>
                    </div>

                    {isPremium && (
                      <div className="pov-side-item">
                        <div className="pov-side-label">Premium tools</div>
                        <div className="pov-side-value">
                          Smart care tools and premium features are active.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pov-side-actions">
                    <button
                      className="pf2-btn pf2-btn-small pf2-btn-primary"
                      onClick={() => navigate(editPetRoute)}
                    >
                      Edit Profile
                    </button>
                    <button
                      className="pf2-btn pf2-btn-small"
                      onClick={() => navigate(remindersRoute)}
                    >
                      View Reminders
                    </button>
                    <button
                      className="pf2-btn pf2-btn-small"
                      onClick={() => navigate(dashboardRoute)}
                    >
                      Dashboard
                    </button>
                    {isPremium && (
                      <button
                        className="pf2-btn pf2-btn-small"
                        onClick={() => navigate("/vet-chat")}
                      >
                        Vet Chat
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}