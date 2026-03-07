import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Dashboard.css";

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
    ];
  }

  if (breed.includes("persian")) {
    return [
      "Persian cats benefit from regular grooming to prevent matting.",
      "Keep their feeding and care routine consistent to reduce stress.",
    ];
  }

  if (breed.includes("poodle")) {
    return [
      "Poodles benefit from regular grooming and coat maintenance.",
      "Daily play and mental stimulation help prevent boredom.",
    ];
  }

  if (species === "dog") {
    return [
      "Dogs benefit from daily exercise, fresh water, and regular check-ups.",
      "Consistent routines can help with behaviour and wellbeing.",
    ];
  }

  if (species === "cat") {
    return [
      "Cats need a calm environment, fresh water, and regular litter cleaning.",
      "Routine grooming and play can support their health and mood.",
    ];
  }

  return [];
}

const detailRowStyle = {
  padding: "10px 0",
  borderBottom: "1px solid #ececec",
};

const sectionCardStyle = {
  marginTop: 18,
  minHeight: 160,
  background: "#fafafa",
  border: "1px solid #eeeeee",
  borderRadius: 14,
  padding: 18,
};

export default function PetOverview() {
  const navigate = useNavigate();
  const { id } = useParams();

  const token = localStorage.getItem("pawfection_token");

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
      .slice(0, 5);
  }, [pet]);

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
    <div style={{ padding: 24 }}>
      <button className="pf2-btn pf2-btn-small" onClick={() => navigate("/mypets")}>
        ← Back to My Pets
      </button>

      <div style={{ marginTop: 16 }} className="pf2-card">
        {loading && (
          <div className="pf2-empty" style={{ padding: "24px 0", opacity: 0.75 }}>
            Loading...
          </div>
        )}

        {!loading && err && (
          <div className="pf2-empty" style={{ padding: "24px 0", opacity: 0.75 }}>
            {err}
          </div>
        )}

        {!loading && !err && pet && (
          <>
            <div
              style={{
                display: "flex",
                gap: 20,
                alignItems: "center",
                flexWrap: "wrap",
                paddingBottom: 18,
                borderBottom: "1px solid #ececec",
              }}
            >
              <div
                className="pf2-petimg"
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 20,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {imgSrc ? <img src={imgSrc} alt={pet.name} /> : <span>🐾</span>}
              </div>

              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "2.2rem",
                    lineHeight: 1.1,
                    fontWeight: 800,
                  }}
                >
                  {pet.name}
                </h1>

                <div
                  style={{
                    opacity: 0.8,
                    marginTop: 8,
                    fontSize: "1.05rem",
                  }}
                >
                  {pet.species || "Pet"}
                  {pet.breed ? ` • ${pet.breed}` : ""}
                  {calculatedAge !== null ? ` • ${calculatedAge} yrs` : ""}
                  {pet.weight ? ` • ${pet.weight}kg` : ""}
                </div>
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <button className="pf2-btn" onClick={() => navigate(`/pets/${pet.id}/edit`)}>
                  Edit
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 20,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              {TABS.map((t) => (
                <button
                  key={t}
                  className={`pf2-btn pf2-btn-small ${tab === t ? "pf2-btn-primary" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={sectionCardStyle}>
              {tab === "Overview" && (
                <div>
                  <div style={detailRowStyle}>
                    <b>Notes:</b> {pet.notes?.trim() ? pet.notes : "No notes added"}
                  </div>
                  <div style={detailRowStyle}>
                    <b>Date of Birth:</b> {formatDate(pet.dob)}
                  </div>
                  <div style={{ paddingTop: 10 }}>
                    <b>Gender:</b> {pet.gender || "-"}
                  </div>
                </div>
              )}

              {tab === "Health" && (
                <div>
                  {pet.vaccination_status || pet.last_vet_visit || pet.medical_notes ? (
                    <>
                      <div style={detailRowStyle}>
                        <b>Vaccination Status:</b> {pet.vaccination_status || "-"}
                      </div>
                      <div style={detailRowStyle}>
                        <b>Last Vet Visit:</b> {formatDate(pet.last_vet_visit)}
                      </div>
                      <div style={{ paddingTop: 10 }}>
                        <b>Medical Notes:</b> {pet.medical_notes || "-"}
                      </div>
                    </>
                  ) : (
                    <div className="pf2-empty" style={{ padding: "20px 0", opacity: 0.72 }}>
                      No health records available.
                    </div>
                  )}
                </div>
              )}

              {tab === "Diet" && (
                <div>
                  {pet.food_type || pet.feeding_schedule || pet.allergies ? (
                    <>
                      <div style={detailRowStyle}>
                        <b>Food Type:</b> {pet.food_type || "-"}
                      </div>
                      <div style={detailRowStyle}>
                        <b>Feeding Schedule:</b> {pet.feeding_schedule || "-"}
                      </div>
                      <div style={{ paddingTop: 10 }}>
                        <b>Allergies:</b> {pet.allergies || "None"}
                      </div>
                    </>
                  ) : (
                    <div className="pf2-empty" style={{ padding: "20px 0", opacity: 0.72 }}>
                      No diet information added.
                    </div>
                  )}
                </div>
              )}

              {tab === "Behaviour" && (
                <div>
                  {pet.temperament || pet.behaviour_notes ? (
                    <>
                      <div style={detailRowStyle}>
                        <b>Temperament:</b> {pet.temperament || "-"}
                      </div>
                      <div style={{ paddingTop: 10 }}>
                        <b>Behaviour Notes:</b> {pet.behaviour_notes || "-"}
                      </div>
                    </>
                  ) : (
                    <div className="pf2-empty" style={{ padding: "20px 0", opacity: 0.72 }}>
                      No behaviour information added.
                    </div>
                  )}
                </div>
              )}

              {tab === "Reminders" && (
                <div>
                  {upcomingReminders.length > 0 ? (
                    upcomingReminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        style={{
                          marginBottom: 12,
                          padding: 12,
                          background: "#ffffff",
                          border: "1px solid #ececec",
                          borderRadius: 12,
                        }}
                      >
                        <div>
                          <b>Title:</b> {reminder.title || "-"}
                        </div>
                        <div style={{ marginTop: 6, opacity: 0.85 }}>
                          <b>Date:</b> {formatDate(reminder.reminder_date)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pf2-empty" style={{ padding: "20px 0", opacity: 0.72 }}>
                      No upcoming reminders.
                    </div>
                  )}
                </div>
              )}

              {tab === "Guidance" && (
                <div>
                  {guidanceTips.length > 0 ? (
                    <div style={{ display: "grid", gap: 12 }}>
                      {guidanceTips.map((tip, index) => (
                        <div
                          key={index}
                          style={{
                            padding: 14,
                            background: "#ffffff",
                            border: "1px solid #ececec",
                            borderRadius: 12,
                            lineHeight: 1.5,
                          }}
                        >
                          • {tip}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pf2-empty" style={{ padding: "20px 0", opacity: 0.72 }}>
                      No guidance available.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}