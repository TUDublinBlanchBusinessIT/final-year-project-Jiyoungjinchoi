import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumPetSightings.css";

export default function PremiumPetSightings() {
  const navigate = useNavigate();
  const { petId } = useParams();

  const [userName, setUserName] = useState("Premium User");
  const [pet, setPet] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiBase = "http://127.0.0.1:8000/api";
  const token = localStorage.getItem("pawfection_token");

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.name) setUserName(parsed.name);
      }
    } catch (err) {
      console.error("Failed to parse user:", err);
    }
  }, []);

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [petRes, sightingsRes] = await Promise.all([
          fetch(`${apiBase}/pets/${petId}`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${apiBase}/lost-pets/${petId}/sightings`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const petData = await petRes.json().catch(() => ({}));
        const sightingsData = await sightingsRes.json().catch(() => ({}));

        if (!petRes.ok) {
          setError(petData.message || "Failed to load pet details.");
          setLoading(false);
          return;
        }

        if (!sightingsRes.ok) {
          setError(sightingsData.message || "Failed to load sightings.");
          setLoading(false);
          return;
        }

        setPet(petData.data || petData.pet || petData);
        setSightings(Array.isArray(sightingsData.data) ? sightingsData.data : []);
      } catch (err) {
        console.error("Failed to load sightings page:", err);
        setError("Something went wrong while loading sightings.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [apiBase, navigate, petId, token]);

  const imageSrc =
    pet?.photo_url ||
    (pet?.photo_path ? `http://127.0.0.1:8000/storage/${pet.photo_path}` : null);

  return (
    <div className="premium-pet-sightings-page">
      <div className="premium-lf-topbar">
        <div className="premium-lf-brand-card">
          <img src={PawfectionLogo} alt="Pawfection" className="premium-lf-logo" />
          <div className="premium-lf-brand-text">
            <h1>Pawfection</h1>
            <p>Pet Sightings</p>
          </div>
        </div>

        <nav className="premium-lf-nav-shell">
          <div className="premium-lf-nav">
            <Link to="/premium-dashboard">Premium Dashboard</Link>
            <Link to="/premium-mypets" className="active">
              My Pets
            </Link>
            <Link to="/premium/lostfound">Lost &amp; Found</Link>
            <Link to="/premium/profile">Profile</Link>
          </div>
        </nav>

        <div className="premium-lf-rightpanel">
          <div className="premium-lf-userchip">
            <div className="premium-lf-avatar">
              {userName?.charAt(0)?.toUpperCase() || "P"}
            </div>
            <div>
              <strong>{userName}</strong>
              <span>Premium User</span>
            </div>
          </div>
        </div>
      </div>

      <section className="pet-sightings-hero">
        <span className="pet-sightings-badge">OWNER VIEW</span>
        <h2>Sightings</h2>
        <p>Check any sightings reported for your lost pet.</p>
      </section>

      {loading ? (
        <div className="pet-sightings-state">
          <p>Loading sightings...</p>
        </div>
      ) : error ? (
        <div className="pet-sightings-state">
          <p>{error}</p>
          <button
            className="pet-sightings-btn"
            onClick={() => navigate("/premium-mypets")}
          >
            Back to My Pets
          </button>
        </div>
      ) : (
        <>
          <section className="pet-sightings-pet-card">
            <div className="pet-sightings-pet-left">
              <div className="pet-sightings-pet-image-wrap">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={pet?.name || "Pet"}
                    className="pet-sightings-pet-image"
                  />
                ) : (
                  <div className="pet-sightings-pet-placeholder">🐾</div>
                )}
              </div>
            </div>

            <div className="pet-sightings-pet-right">
              <h3>{pet?.name || "Unknown Pet"}</h3>
              <p><strong>Species:</strong> {pet?.species || "N/A"}</p>
              <p><strong>Breed:</strong> {pet?.breed || "N/A"}</p>
              <p><strong>Age:</strong> {pet?.age || "N/A"}</p>
              <button
                className="pet-sightings-btn"
                onClick={() => navigate("/premium-mypets")}
              >
                Back to My Pets
              </button>
            </div>
          </section>

          <section className="pet-sightings-list-card">
            <div className="pet-sightings-list-head">
              <h3>Reported Sightings</h3>
              <p>{sightings.length} sighting(s)</p>
            </div>

            {sightings.length === 0 ? (
              <p className="pet-sightings-empty">No sightings submitted yet.</p>
            ) : (
              <div className="pet-sightings-list">
                {sightings.map((sighting) => (
                  <div key={sighting.id} className="pet-sightings-item">
                    <div className="pet-sightings-item-top">
                      <div>
                        <strong>Location:</strong> {sighting.location || "N/A"}
                      </div>
                      <div>
                        <strong>Submitted:</strong> {formatDate(sighting.created_at)}
                      </div>
                    </div>

                    {(sighting.lat !== null || sighting.lng !== null) && (
                      <p>
                        <strong>Coordinates:</strong> {sighting.lat ?? "N/A"},{" "}
                        {sighting.lng ?? "N/A"}
                      </p>
                    )}

                    <p>
                      <strong>Notes:</strong> {sighting.notes || "No notes added."}
                    </p>

                    {sighting.photo_url && (
                      <img
                        src={sighting.photo_url}
                        alt="Sighting"
                        className="pet-sightings-image"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}