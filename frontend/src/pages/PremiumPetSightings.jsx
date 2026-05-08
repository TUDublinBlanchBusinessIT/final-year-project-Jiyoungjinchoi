import { useEffect, useMemo, useState } from "react";
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
  const storageBase = "http://127.0.0.1:8000/storage";
  const token = localStorage.getItem("pawfection_token");

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("pawfection_user");

      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const name =
          parsed?.name ||
          parsed?.full_name ||
          parsed?.username ||
          parsed?.user_name ||
          "Premium User";

        setUserName(name);
      } else {
        const savedName =
          localStorage.getItem("pawfection_user_name") ||
          localStorage.getItem("user_name") ||
          localStorage.getItem("name");

        if (savedName) setUserName(savedName);
      }
    } catch (err) {
      console.error("Failed to parse user:", err);
      setUserName("Premium User");
    }
  }, []);

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-IE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resolveImage = (pathOrUrl) => {
    if (!pathOrUrl) return null;

    const value = String(pathOrUrl);

    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }

    if (value.startsWith("/storage/")) {
      return `http://127.0.0.1:8000${value}`;
    }

    if (value.startsWith("storage/")) {
      return `http://127.0.0.1:8000/${value}`;
    }

    return `${storageBase}/${value.replace(/^\/+/, "")}`;
  };

  const petImageSrc =
    resolveImage(pet?.photo_url) ||
    resolveImage(pet?.image_url) ||
    resolveImage(pet?.photo_path) ||
    resolveImage(pet?.image_path) ||
    null;

  const getSightingImage = (sighting) => {
    return (
      resolveImage(sighting?.photo_url) ||
      resolveImage(sighting?.image_url) ||
      resolveImage(sighting?.photo_path) ||
      resolveImage(sighting?.image_path) ||
      null
    );
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

        const finalPet = petData.data || petData.pet || petData;

        const finalSightings = Array.isArray(sightingsData.data)
          ? sightingsData.data
          : Array.isArray(sightingsData.sightings)
          ? sightingsData.sightings
          : Array.isArray(sightingsData)
          ? sightingsData
          : [];

        setPet(finalPet);
        setSightings(finalSightings);
      } catch (err) {
        console.error("Failed to load sightings page:", err);
        setError("Something went wrong while loading sightings.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [apiBase, navigate, petId, token]);

  return (
    <div className="pps-shell">
      <header className="pps-site-header">
        <div
          className="pps-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/premium-dashboard");
            }
          }}
        >
          <img className="pps-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pps-brand-copy">
            <div className="pps-brand-title">Pawfection</div>
            <div className="pps-brand-sub">Pet Sightings</div>
          </div>
        </div>

        <nav className="pps-topnav">
          <Link className="pps-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pps-topnav-item active" to="/premium-mypets">
            My Pets
          </Link>
          <Link className="pps-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="pps-topnav-item" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="pps-topnav-item" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pps-topnav-item" to="/premium/community">
            Community
          </Link>
          <Link className="pps-topnav-item" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="pps-topnav-item" to="/premium/vet-chat">
            AI Pet Assistant
          </Link>
          <Link className="pps-topnav-item" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="pps-header-side">
          <div className="pps-date-pill">{todayText}</div>
          <div className="pps-userchip" title={userName}>
            <div className="pps-avatar">{userName?.charAt(0)?.toUpperCase() || "P"}</div>
            <div className="pps-userchip-text">
              <div className="pps-userchip-name">{userName}</div>
              <div className="pps-userchip-sub">Premium User</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pps-main">
        <section className="pps-hero">
          <span className="pps-cloud pps-cloud-one" />
          <span className="pps-cloud pps-cloud-two" />
          <span className="pps-cloud pps-cloud-three" />

          <div className="pps-hero-copy">
            <div className="pps-kicker">Owner View</div>
            <h1 className="pps-hero-title">Sightings</h1>
            <p className="pps-hero-text">
              Check any sightings reported for your lost pet. Review locations,
              notes, photos, and possible leads in one calm premium space.
            </p>

            <div className="pps-hero-chips">
              <div className="pps-chip">🐾 Owner sightings</div>
              <div className="pps-chip">📍 Location details</div>
              <div className="pps-chip">💜 Premium tracking</div>
            </div>
          </div>

          <div className="pps-hero-stats">
            <article className="pps-stat-card">
              <div className="pps-stat-label">Sightings</div>
              <div className="pps-stat-value">{sightings.length}</div>
            </article>

            <article className="pps-stat-card">
              <div className="pps-stat-label">Pet</div>
              <div className="pps-stat-value pps-stat-name">
                {pet?.name || "—"}
              </div>
            </article>
          </div>
        </section>

        {loading ? (
          <section className="pps-state-card">
            <div className="pps-state-icon">🐾</div>
            <h2>Loading sightings...</h2>
            <p>Please wait while Pawfection loads this pet’s sighting reports.</p>
          </section>
        ) : error ? (
          <section className="pps-state-card pps-error-card">
            <div className="pps-state-icon">!</div>
            <h2>Could not load sightings</h2>
            <p>{error}</p>
            <button
              className="pps-btn pps-btn-primary"
              type="button"
              onClick={() => navigate("/premium-mypets")}
            >
              Back to My Pets
            </button>
          </section>
        ) : (
          <>
            <section className="pps-pet-card">
              <div className="pps-pet-image-wrap">
                {petImageSrc ? (
                  <img
                    src={petImageSrc}
                    alt={pet?.name || "Pet"}
                    className="pps-pet-image"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="pps-pet-placeholder">🐾</div>
                )}
              </div>

              <div className="pps-pet-content">
                <div className="pps-card-kicker">Lost pet summary</div>
                <h2>{pet?.name || "Unknown Pet"}</h2>
                <p>
                  This page shows the reports submitted by the community for this pet.
                  Use the details below to follow up on possible leads.
                </p>

                <div className="pps-pet-details">
                  <div className="pps-detail-box">
                    <span>Species</span>
                    <strong>{pet?.species || "N/A"}</strong>
                  </div>

                  <div className="pps-detail-box">
                    <span>Breed</span>
                    <strong>{pet?.breed || "N/A"}</strong>
                  </div>

                  <div className="pps-detail-box">
                    <span>Age</span>
                    <strong>{pet?.age || "N/A"}</strong>
                  </div>

                  <div className="pps-detail-box">
                    <span>Total sightings</span>
                    <strong>{sightings.length}</strong>
                  </div>
                </div>

                <div className="pps-actions">
                  <button
                    className="pps-btn pps-btn-primary"
                    type="button"
                    onClick={() => navigate("/premium-mypets")}
                  >
                    Back to My Pets
                  </button>

                  <button
                    className="pps-btn"
                    type="button"
                    onClick={() => navigate("/premium/lostfound")}
                  >
                    Lost &amp; Found
                  </button>
                </div>
              </div>
            </section>

            <section className="pps-list-card">
              <div className="pps-list-head">
                <div>
                  <div className="pps-card-kicker">Community reports</div>
                  <h2>Reported Sightings</h2>
                  <p>Possible leads submitted for your lost pet.</p>
                </div>

                <div className="pps-count-pill">{sightings.length} sighting(s)</div>
              </div>

              {sightings.length === 0 ? (
                <div className="pps-empty">
                  <div className="pps-empty-cloud">
                    <span>🐾</span>
                  </div>
                  <h3>No sightings submitted yet</h3>
                  <p>
                    There are no sightings for this pet right now. Keep checking back
                    and monitor the Lost &amp; Found page for updates.
                  </p>
                </div>
              ) : (
                <div className="pps-sighting-grid">
                  {sightings.map((sighting, index) => {
                    const sightingImage = getSightingImage(sighting);

                    return (
                      <article key={sighting.id || index} className="pps-sighting-card">
                        <div className="pps-sighting-top">
                          <div className="pps-sighting-number">
                            #{String(index + 1).padStart(2, "0")}
                          </div>

                          <div>
                            <h3>{sighting.location || "Unknown location"}</h3>
                            <p>{formatDate(sighting.created_at)}</p>
                          </div>
                        </div>

                        <div className="pps-sighting-info-grid">
                          <div className="pps-sighting-info">
                            <span>Location</span>
                            <strong>{sighting.location || "N/A"}</strong>
                          </div>

                          <div className="pps-sighting-info">
                            <span>Coordinates</span>
                            <strong>
                              {sighting.lat ?? "N/A"}, {sighting.lng ?? "N/A"}
                            </strong>
                          </div>
                        </div>

                        <div className="pps-sighting-notes">
                          <span>Notes</span>
                          <p>{sighting.notes || "No notes added."}</p>
                        </div>

                        {sightingImage && (
                          <div className="pps-sighting-image-wrap">
                            <img
                              src={sightingImage}
                              alt="Sighting"
                              className="pps-sighting-image"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}