import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ViewProfile.css";

export default function ViewPet() {
  const navigate = useNavigate();
  const { id } = useParams();

  const token = localStorage.getItem("pawfection_token");
  const accountType = String(
    localStorage.getItem("pawfection_account_type") || ""
  ).toLowerCase();
  const isPremium = accountType === "premium";

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pet, setPet] = useState({
    id: "",
    name: "",
    type: "",
    breed: "",
    age: "",
    weight: "",
    gender: "",
    dob: "",
    notes: "",
    photo: "",
    health_notes: "",
    diet_notes: "",
    behaviour_notes: "",
    reminders: [],
    guidance: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchPet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPet = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`http://127.0.0.1:8000/api/pets/${id}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load pet details.");
      }

      const petData = data.data || data;

      setPet({
        id: petData.id || "",
        name: petData.name || "Unnamed Pet",
        type: petData.type || petData.species || "Pet",
        breed: petData.breed || "Unknown Breed",
        age: petData.age || "0 yrs",
        weight: petData.weight || "0.0kg",
        gender: petData.gender || "Unknown",
        dob: petData.dob || petData.date_of_birth || "",
        notes: petData.notes || "",
        photo: petData.photo_url || petData.photo || petData.image || "",
        health_notes: petData.health_notes || "No health notes added yet.",
        diet_notes: petData.diet_notes || "No diet notes added yet.",
        behaviour_notes:
          petData.behaviour_notes || "No behaviour notes added yet.",
        reminders: Array.isArray(petData.reminders) ? petData.reminders : [],
        guidance:
          petData.guidance ||
          "Keep routine check-ups up to date and maintain a balanced care schedule.",
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const photoSrc = useMemo(() => {
    if (!pet.photo) return "";
    if (pet.photo.startsWith("http")) return pet.photo;
    if (pet.photo.startsWith("/storage")) {
      return `http://127.0.0.1:8000${pet.photo}`;
    }
    return pet.photo;
  }, [pet.photo]);

  const premiumStats = useMemo(() => {
    return [
      {
        title: "Health Score",
        value: "9.2/10",
        subtext: "Stable overall condition",
      },
      {
        title: "Next Reminder",
        value:
          pet.reminders.length > 0
            ? pet.reminders[0]?.title || "Reminder set"
            : "No reminder",
        subtext: "Latest scheduled care task",
      },
      {
        title: "Diet Status",
        value: "On Track",
        subtext: "Routine looks consistent",
      },
      {
        title: "Behaviour",
        value: "Calm",
        subtext: "No unusual activity logged",
      },
    ];
  }, [pet.reminders]);

  const premiumTimeline = [
    "Weight updated 2 days ago",
    "Reminder added 5 days ago",
    "Diet note updated 1 week ago",
    "Health profile reviewed 2 weeks ago",
  ];

  const formatDob = (value) => {
    if (!value) return "Not added";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="pet-section-card">
            <div className="info-row">
              <span className="info-label">Notes</span>
              <span className="info-value">
                {pet.notes || "No notes added"}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Date of Birth</span>
              <span className="info-value">{formatDob(pet.dob)}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Gender</span>
              <span className="info-value">{pet.gender || "Not added"}</span>
            </div>
          </div>
        );

      case "health":
        return (
          <div className="pet-section-card">
            <h3>Health</h3>
            <p>{pet.health_notes}</p>

            {isPremium && (
              <div className="premium-insights-card">
                <h4>Premium Health Insights</h4>
                <p>
                  Your pet profile suggests a stable care routine. Continue
                  tracking weight, vaccinations, and check-up reminders to keep
                  records complete.
                </p>
              </div>
            )}
          </div>
        );

      case "diet":
        return (
          <div className="pet-section-card">
            <h3>Diet</h3>
            <p>{pet.diet_notes}</p>

            {isPremium && (
              <div className="premium-insights-card">
                <h4>Premium Diet Insights</h4>
                <p>
                  Feeding consistency appears on track. Premium users can review
                  diet trends and schedule meal reminders more effectively.
                </p>
              </div>
            )}
          </div>
        );

      case "behaviour":
        return (
          <div className="pet-section-card">
            <h3>Behaviour</h3>
            <p>{pet.behaviour_notes}</p>

            {isPremium && (
              <div className="premium-insights-card">
                <h4>Premium Behaviour Insights</h4>
                <p>
                  Behaviour logs suggest a calm pattern. Continue recording
                  changes to help identify stress triggers or routine shifts.
                </p>
              </div>
            )}
          </div>
        );

      case "reminders":
        return (
          <div className="pet-section-card">
            <h3>Reminders</h3>

            {pet.reminders.length === 0 ? (
              <p>No reminders added yet.</p>
            ) : (
              <div className="reminder-list">
                {pet.reminders.map((reminder, index) => (
                  <div className="reminder-item" key={reminder.id || index}>
                    <strong>{reminder.title || "Reminder"}</strong>
                    <span>{reminder.date || reminder.time || "Scheduled"}</span>
                  </div>
                ))}
              </div>
            )}

            {isPremium && (
              <div className="premium-insights-card">
                <h4>Premium Reminder Insights</h4>
                <p>
                  Keep vaccination, feeding, and grooming reminders in one place
                  with better scheduling visibility.
                </p>
              </div>
            )}
          </div>
        );

      case "guidance":
        return (
          <div className="pet-section-card">
            <h3>Guidance</h3>
            <p>{pet.guidance}</p>

            {isPremium && (
              <div className="premium-insights-card">
                <h4>Premium Care Guidance</h4>
                <p>
                  Based on this pet profile, regular routine tracking and timely
                  reminders can improve long-term care organisation.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="view-pet-page">
        <div className="view-pet-shell">
          <div className="loading-card">Loading pet profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-pet-page">
        <div className="view-pet-shell">
          <div className="error-card">
            <p>{error}</p>
            <button onClick={() => navigate("/my-pets")}>Back to My Pets</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-pet-page">
      <div className="view-pet-shell">
        <button className="back-btn" onClick={() => navigate("/my-pets")}>
          ← Back to My Pets
        </button>

        <div className="pet-profile-card">
          <div className="pet-header">
            <div className="pet-header-left">
              <div className="pet-photo-wrap">
                {photoSrc ? (
                  <img src={photoSrc} alt={pet.name} className="pet-photo" />
                ) : (
                  <div className="pet-photo placeholder">🐾</div>
                )}
              </div>

              <div className="pet-main-info">
                <div className="pet-name-row">
                  <h1>{pet.name}</h1>
                  {isPremium && <span className="premium-badge">Premium</span>}
                </div>

                <p className="pet-subtitle">
                  {pet.type} • {pet.breed} • {pet.age} • {pet.weight}
                </p>

                <div className="pet-meta-pills">
                  <span className="meta-pill">{pet.gender || "Unknown"}</span>
                  <span className="meta-pill">
                    DOB: {formatDob(pet.dob)}
                  </span>
                </div>
              </div>
            </div>

            <button
              className="edit-btn"
              onClick={() => navigate(`/pets/${pet.id}/edit`)}
            >
              Edit
            </button>
          </div>

          {isPremium ? (
            <div className="premium-stats-grid">
              {premiumStats.map((stat, index) => (
                <div className="premium-stat-card" key={index}>
                  <span>{stat.title}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.subtext}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="locked-premium-card">
              <div>
                <h3>Unlock Premium Pet Insights</h3>
                <p>
                  View smart health summaries, care tracking, behaviour insights,
                  and premium pet guidance.
                </p>
              </div>

              <button
                className="upgrade-btn"
                onClick={() => navigate("/upgrade")}
              >
                Upgrade to Premium
              </button>
            </div>
          )}

          <div className="pet-tabs">
            <button
              className={activeTab === "overview" ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>

            <button
              className={activeTab === "health" ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab("health")}
            >
              Health
            </button>

            <button
              className={activeTab === "diet" ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab("diet")}
            >
              Diet
            </button>

            <button
              className={activeTab === "behaviour" ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab("behaviour")}
            >
              Behaviour
            </button>

            <button
              className={activeTab === "reminders" ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab("reminders")}
            >
              Reminders
            </button>

            <button
              className={activeTab === "guidance" ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab("guidance")}
            >
              Guidance
            </button>
          </div>

          <div className="tab-content-area">{renderTabContent()}</div>

          {isPremium && (
            <div className="premium-lower-grid">
              <div className="premium-panel">
                <h3>Premium Insights</h3>
                <p>
                  {pet.name}’s profile looks organised and up to date. Keep
                  tracking care logs and reminders to get the most value from
                  premium tools.
                </p>
              </div>

              <div className="premium-panel">
                <h3>Recent Activity</h3>
                <div className="timeline-list">
                  {premiumTimeline.map((item, index) => (
                    <div className="timeline-item" key={index}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}