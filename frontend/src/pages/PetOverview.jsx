import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("Overview");

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

  const backToPetsRoute = isPremium ? "/premium-dashboard" : "/mypets";
  const editPetRoute = isPremium ? `/premium/pets/${id}/edit` : `/pets/${id}/edit`;
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

        const data = await res.json();

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
    <div className="po-page">
      <div className="po-shell">
        <div className="po-topbar">
          <button className="po-back-btn" onClick={() => navigate(backToPetsRoute)}>
            ← Back to My Pet
          </button>

          <div className="po-topbar-actions">
            <button className="po-btn" onClick={() => navigate(backToPetsRoute)}>
              {isPremium ? "Premium My Pet" : "All Pets"}
            </button>
            <button className="po-btn po-btn-primary" onClick={() => navigate(editPetRoute)}>
              Edit Pet
            </button>
          </div>
        </div>

        <div className="po-card">
          {loading && <div className="po-empty">Loading pet profile...</div>}
          {!loading && err && <div className="po-empty">{err}</div>}

          {!loading && !err && pet && (
            <>
              <section className="po-hero">
                <div className="po-hero-main">
                  <div className="po-photo-card">
                    {imgSrc ? (
                      <img src={imgSrc} alt={pet.name} className="po-photo" />
                    ) : (
                      <div className="po-photo-placeholder">🐾</div>
                    )}

                    <div className="po-photo-overlay">
                      <div className="po-kicker">
                        {isPremium ? "Premium Pet Profile" : "Pet Profile"}
                      </div>

                      <div className="po-title-row">
                        <h1>{pet.name}</h1>
                        {isPremium && <span className="po-premium-badge">Premium</span>}
                      </div>

                      <p className="po-meta">
                        {pet.species || "Pet"}
                        {pet.breed ? ` • ${pet.breed}` : ""}
                        {calculatedAge !== null ? ` • ${calculatedAge} yrs` : ""}
                        {pet.weight ? ` • ${pet.weight}kg` : ""}
                      </p>

                      <div className="po-chip-row">
                        <span className="po-chip">Care Score {careScore}%</span>
                        <span className="po-chip">
                          {profileCompleteness}% Profile Complete
                        </span>
                        <span className="po-chip">
                          {upcomingReminders.length} Reminder
                          {upcomingReminders.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="po-action-row">
                        <button
                          className="po-btn po-btn-primary"
                          onClick={() => navigate(editPetRoute)}
                        >
                          Edit Profile
                        </button>

                        <button
                          className="po-btn"
                          onClick={() => navigate(remindersRoute)}
                        >
                          View Reminders
                        </button>

                        {isPremium && (
                          <button
                            className="po-btn"
                            onClick={() => navigate("/vet-chat")}
                          >
                            Ask Vet Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="po-hero-side">
                  <div className="po-mini-card">
                    <div className="po-mini-label">Health Snapshot</div>
                    <div className="po-mini-main">
                      {pet.vaccination_status || "No status added"}
                    </div>
                    <div className="po-mini-sub">
                      Last vet visit: {formatDate(pet.last_vet_visit)}
                    </div>
                  </div>

                  <div className="po-mini-card">
                    <div className="po-mini-label">Next Care Focus</div>
                    <div className="po-mini-main">
                      {nextReminder?.title || "No reminder due"}
                    </div>
                    <div className="po-mini-sub">
                      {nextReminder
                        ? `Due ${formatDate(nextReminder.reminder_date)}`
                        : "Everything looks calm right now."}
                    </div>
                  </div>

                  <div className="po-mini-card">
                    <div className="po-mini-label">Lifestyle Summary</div>
                    <div className="po-mini-main">
                      {pet.activity_level || "Activity not set"}
                    </div>
                    <div className="po-mini-sub">
                      Diet: {pet.diet || pet.food_type || "Not added"}
                    </div>
                  </div>

                  {isPremium && (
                    <div className="po-mini-card po-mini-card-highlight">
                      <div className="po-mini-label">Premium Guidance</div>
                      <div className="po-mini-main">Smart care tools active</div>
                      <div className="po-mini-sub">
                        Personalised guidance and premium support are enabled for this pet.
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="po-insight-strip">
                <div className="po-strip-card">
                  <div className="po-strip-label">Profile Completeness</div>
                  <div className="po-strip-value">{profileCompleteness}%</div>
                </div>

                <div className="po-strip-card">
                  <div className="po-strip-label">Reminders Due</div>
                  <div className="po-strip-value">{upcomingReminders.length}</div>
                </div>

                <div className="po-strip-card">
                  <div className="po-strip-label">Vaccination</div>
                  <div className="po-strip-value-small">
                    {pet.vaccination_status || "Not set"}
                  </div>
                </div>

                <div className="po-strip-card">
                  <div className="po-strip-label">Microchip</div>
                  <div className="po-strip-value-small">
                    {pet.microchip_number || "Not added"}
                  </div>
                </div>
              </section>

              <div className="po-tabs">
                {TABS.map((t) => (
                  <button
                    key={t}
                    className={`po-tab-btn ${tab === t ? "active" : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <section className="po-content-grid">
                <div className="po-main-panel">
                  <div className="po-section-card">
                    {tab === "Overview" && (
                      <div className="po-detail-list">
                        <div className="po-detail-row">
                          <span className="po-detail-label">Notes</span>
                          <span>{pet.notes?.trim() ? pet.notes : "No notes added"}</span>
                        </div>
                        <div className="po-detail-row">
                          <span className="po-detail-label">Date of Birth</span>
                          <span>{formatDate(pet.dob)}</span>
                        </div>
                        <div className="po-detail-row">
                          <span className="po-detail-label">Gender</span>
                          <span>{pet.gender || "-"}</span>
                        </div>
                        <div className="po-detail-row">
                          <span className="po-detail-label">Species</span>
                          <span>{pet.species || "-"}</span>
                        </div>
                        <div className="po-detail-row">
                          <span className="po-detail-label">Breed</span>
                          <span>{pet.breed || "-"}</span>
                        </div>
                        <div className="po-detail-row">
                          <span className="po-detail-label">Weight</span>
                          <span>{pet.weight ? `${pet.weight}kg` : "-"}</span>
                        </div>
                      </div>
                    )}

                    {tab === "Health" && (
                      <>
                        {pet.vaccination_status ||
                        pet.last_vet_visit ||
                        pet.medical_notes ||
                        pet.health_conditions ? (
                          <div className="po-detail-list">
                            <div className="po-detail-row">
                              <span className="po-detail-label">Vaccination Status</span>
                              <span>{pet.vaccination_status || "-"}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Last Vet Visit</span>
                              <span>{formatDate(pet.last_vet_visit)}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Health Conditions</span>
                              <span>{pet.health_conditions || "None recorded"}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Medical Notes</span>
                              <span>{pet.medical_notes || "-"}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Allergies</span>
                              <span>{pet.allergies || "None"}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Microchip Number</span>
                              <span>{pet.microchip_number || "Not added"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="po-empty">No health records available.</div>
                        )}
                      </>
                    )}

                    {tab === "Diet" && (
                      <>
                        {pet.food_type || pet.diet || pet.feeding_schedule || pet.allergies ? (
                          <div className="po-detail-list">
                            <div className="po-detail-row">
                              <span className="po-detail-label">Food Type</span>
                              <span>{pet.food_type || pet.diet || "-"}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Feeding Schedule</span>
                              <span>{pet.feeding_schedule || "Not added"}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Diet Notes</span>
                              <span>{pet.diet || "Not added"}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Allergies</span>
                              <span>{pet.allergies || "None"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="po-empty">No diet information added.</div>
                        )}
                      </>
                    )}

                    {tab === "Behaviour" && (
                      <>
                        {pet.temperament ||
                        pet.personality_traits ||
                        pet.behaviour_notes ||
                        pet.activity_level ? (
                          <div className="po-detail-list">
                            <div className="po-detail-row">
                              <span className="po-detail-label">Temperament</span>
                              <span>{pet.temperament || pet.personality_traits || "-"}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Activity Level</span>
                              <span>{pet.activity_level || "Not added"}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Exercise Level</span>
                              <span>{pet.exercise_level || "Not added"}</span>
                            </div>
                            <div className="po-detail-row">
                              <span className="po-detail-label">Behaviour Notes</span>
                              <span>{pet.behaviour_notes || pet.notes || "-"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="po-empty">No behaviour information added.</div>
                        )}
                      </>
                    )}

                    {tab === "Reminders" && (
                      <>
                        {upcomingReminders.length > 0 ? (
                          <div className="po-reminder-list">
                            {upcomingReminders.map((reminder) => (
                              <div key={reminder.id} className="po-reminder-item">
                                <div className="po-reminder-title">
                                  {reminder.title || "-"}
                                </div>
                                <div className="po-reminder-date">
                                  Due: {formatDate(reminder.reminder_date)}
                                </div>
                                <div className="po-reminder-text">
                                  {reminder.message || "Reminder"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="po-empty">No upcoming reminders.</div>
                        )}
                      </>
                    )}

                    {tab === "Guidance" && (
                      <div className="po-guidance-list">
                        {guidanceTips.map((tip, index) => (
                          <div key={index} className="po-guidance-item">
                            {tip}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="po-side-panel">
                  <div className="po-side-card">
                    <div className="po-side-title">Care Score</div>
                    <div className="po-score-ring">{careScore}%</div>
                    <div className="po-side-text">
                      Based on profile strength, reminders, and care information.
                    </div>
                  </div>

                  <div className="po-side-card">
                    <div className="po-side-title">Upcoming Reminders</div>
                    {upcomingReminders.length > 0 ? (
                      <div className="po-side-list">
                        {upcomingReminders.slice(0, 3).map((reminder) => (
                          <div key={reminder.id} className="po-side-list-item">
                            <strong>{reminder.title}</strong>
                            <span>{formatDate(reminder.reminder_date)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="po-side-text">No upcoming reminders.</div>
                    )}
                  </div>

                  <div className="po-side-card">
                    <div className="po-side-title">Quick Summary</div>
                    <div className="po-side-text">
                      {nextReminder
                        ? `${pet.name}'s next care task is "${nextReminder.title}".`
                        : `${pet.name} currently has no upcoming reminders.`}
                    </div>
                  </div>

                  {isPremium && (
                    <div className="po-side-card po-premium-panel">
                      <div className="po-side-title">Premium Tools</div>
                      <div className="po-side-text">
                        Use smarter care features and premium support for {pet.name}.
                      </div>

                      <div className="po-side-actions">
                        <button
                          className="po-btn po-btn-primary"
                          onClick={() => navigate("/vet-chat")}
                        >
                          Open Vet Chat
                        </button>
                        <button
                          className="po-btn"
                          onClick={() => navigate("/premium-dashboard")}
                        >
                          Premium Dashboard
                        </button>
                        <button
                          className="po-btn"
                          onClick={() => navigate("/premium/reminders")}
                        >
                          Manage Reminders
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}