import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");

  // Pets state
  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem("pawfection_token");

  const fetchPets = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setPetsLoading(true);
    setPetsError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/pets", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

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
    } catch (e) {
      setPetsError("Server error. Is your backend running?");
      setPets([]);
    } finally {
      setPetsLoading(false);
    }
  };

  useEffect(() => {
    // Load user name
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
      const res = await fetch(`http://127.0.0.1:8000/api/pets/${petId}`, {
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

      // Remove instantly from UI
      setPets((prev) => prev.filter((p) => p.id !== petId));
    } catch (e) {
      setPetsError("Failed to delete. Is the backend running?");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pf-page">
      {/* Header */}
      <header className="pf-header">
        <div className="pf-header-left">
          <img className="pf-logo" src={PawfectionLogo} alt="Pawfection Logo" />
          <div className="pf-brand">Pawfection</div>
        </div>

        <nav className="pf-nav">
          <Link className="pf-nav-link" to="/mypets">My pets</Link>
          <Link className="pf-nav-link" to="/lostfound">Lost&Found</Link>
          <Link className="pf-nav-link" to="/community">Community</Link>
          <Link className="pf-nav-link" to="/inventory">Inventory</Link>
          <Link className="pf-nav-link" to="/appointments">Appointments</Link>
          <Link className="pf-nav-link" to="/reminders">Reminders</Link>
        </nav>
      </header>

      <div className="pf-divider" />

      {/* Main */}
      <main className="pf-container">
        <h1 className="pf-title">My Dashboard</h1>

        {/* Welcome Card */}
        <div className="pf-card pf-welcome">
          <div className="pf-welcome-text">Welcome, {userName}!</div>
          <button className="pf-btn pf-btn-outline" onClick={() => navigate("/profile")}>
            View Profile
          </button>
        </div>

        {/* Quick Actions */}
        <div className="pf-actions">
          <button className="pf-btn pf-btn-primary" onClick={() => navigate("/pets/create")}>
            Add Pet
          </button>

          <button className="pf-btn pf-btn-primary" onClick={() => navigate("/reminders/add")}>
            Add Reminder
          </button>

          <button className="pf-btn pf-btn-primary" onClick={() => navigate("/appointments/book")}>
            Book Appointment
          </button>
        </div>

        {/* My Pets */}
        <section className="pf-section">
          <h2 className="pf-section-title">My Pets</h2>

          {petsLoading && (
            <div className="pf-card pf-reminders" style={{ padding: 14 }}>
              Loading pets...
            </div>
          )}

          {!petsLoading && petsError && (
            <div className="pf-card pf-reminders" style={{ padding: 14 }}>
              {petsError}
            </div>
          )}

          {!petsLoading && !petsError && pets.length === 0 && (
            <div className="pf-card pf-reminders" style={{ padding: 14 }}>
              No pets yet. Click <b>Add Pet</b> to create one.
            </div>
          )}

          {!petsLoading && !petsError && pets.length > 0 && (
            <div className="pf-grid-3" style={{ flexDirection: "column", gap: 12 }}>
              {pets.map((pet) => {
                const imgSrc = getPetImageSrc(pet);

                return (
                  <div
                    key={pet.id}
                    className="pf-card pf-pet-card"
                    style={{
                      maxWidth: 520,
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Left: image + text */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div className="pf-img-box" style={{ overflow: "hidden" }}>
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={pet.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          "img"
                        )}
                      </div>

                      <div>
                        <div style={{ fontWeight: 900, fontSize: 18 }}>{pet.name}</div>
                        <div style={{ fontWeight: 700 }}>{pet.breed || pet.species || "Pet"}</div>
                        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600 }}>
                          {pet.age ? `${pet.age} years old` : "Age not set"}
                          {pet.weight ? ` • ${pet.weight}kg` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button
                        className="pf-btn"
                        type="button"
                        onClick={() => navigate(`/pets/${pet.id}/edit`)}
                      >
                        Edit
                      </button>

                      <button
                        className="pf-btn"
                        type="button"
                        disabled={deletingId === pet.id}
                        onClick={() => deletePet(pet.id, pet.name)}
                        style={{
                          borderColor: "rgba(220,38,38,0.35)",
                          color: "#991b1b",
                        }}
                      >
                        {deletingId === pet.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Reminders */}
        <section className="pf-section">
          <h2 className="pf-section-title">Upcoming Reminders</h2>

          <div className="pf-card pf-reminders">
            <div className="pf-reminder-row">
              <div className="pf-reminder-text">Description of reminder</div>
              <div className="pf-reminder-date">05/01/2025</div>
            </div>
            <div className="pf-reminder-row">
              <div className="pf-reminder-text">Description of reminder</div>
              <div className="pf-reminder-date">21/04/2026</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
