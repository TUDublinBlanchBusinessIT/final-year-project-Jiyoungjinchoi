import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumLostReportDetails.css";

export default function PremiumReportDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [userName, setUserName] = useState("Premium User");
  const [report, setReport] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sightingsLoading, setSightingsLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  const apiBase = "http://127.0.0.1:8000/api";
  const fallbackImage =
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80";

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name) {
          setUserName(userObj.name);
        }
      }
    } catch (err) {
      console.error("Failed to read user from localStorage:", err);
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

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("pawfection_token");

      if (!token) {
        setError("You are not logged in.");
        setReport(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiBase}/premium/lost-found/${id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Failed to load report.");
        setReport(null);
        return;
      }

      setReport(data.data || data.report || data.pet || data);
    } catch (err) {
      console.error("Error loading report:", err);
      setError("Something went wrong while loading the report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [apiBase, id]);

  const loadSightings = useCallback(async () => {
    setSightingsLoading(true);

    try {
      const token = localStorage.getItem("pawfection_token");

      if (!token) {
        setSightings([]);
        return;
      }

      const response = await fetch(`${apiBase}/lost-pets/${id}/sightings`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Failed to load sightings:", data);
        setSightings([]);
        return;
      }

      setSightings(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error("Error loading sightings:", err);
      setSightings([]);
    } finally {
      setSightingsLoading(false);
    }
  }, [apiBase, id]);

  useEffect(() => {
    loadReport();
    loadSightings();
  }, [loadReport, loadSightings]);

  const markResolved = async () => {
    if (!report || resolving) return;

    setResolving(true);

    try {
      const token = localStorage.getItem("pawfection_token");

      const response = await fetch(`${apiBase}/premium/lost-found/${id}/resolve`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.message || "Failed to mark report as resolved.");
        return;
      }

      await loadReport();
    } catch (err) {
      console.error("Resolve error:", err);
      alert("Something went wrong while marking as resolved.");
    } finally {
      setResolving(false);
    }
  };

  const imageUrl = useMemo(() => {
    return (
      report?.display_photo_url ||
      report?.lost_photo_url ||
      report?.photo_url ||
      fallbackImage
    );
  }, [report]);

  const petName = report?.pet_name || report?.name || "Unknown Pet";
  const petStatus =
    report?.status ||
    report?.lost_status ||
    (report?.is_lost ? "Active" : "Resolved") ||
    "Missing Pet";

  const isResolved = String(petStatus).toLowerCase() === "resolved";
  const hasSightings = sightings.length > 0;

  return (
    <div className="premium-report-details-page">
      <div className="premium-lf-topbar">
        <div className="premium-lf-brand-card">
          <img src={PawfectionLogo} alt="Pawfection" className="premium-lf-logo" />
          <div className="premium-lf-brand-text">
            <h1>Pawfection</h1>
            <p>Premium Lost &amp; Found</p>
          </div>
        </div>

        <nav className="premium-lf-nav-shell">
          <div className="premium-lf-nav">
            <Link to="/premium-dashboard">Premium Dashboard</Link>
            <Link to="/mypets">My Pets</Link>
            <Link to="/appointments">Appointments</Link>
            <Link to="/reminders">Reminders</Link>
            <Link to="/premium/lostfound" className="active">
              Lost &amp; Found
            </Link>
            <Link to="/community">Community</Link>
            <Link to="/inventory">Inventory</Link>
            <Link to="/premium">AI Pet Assistant</Link>
            <Link to="/profile">Profile</Link>
          </div>
        </nav>

        <div className="premium-lf-rightpanel">
          <div className="premium-lf-datechip">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>

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

      <section className="premium-report-details-hero">
        <span className="premium-report-details-badge">PREMIUM REPORT VIEW</span>
        <h2>Lost Report Details</h2>
        <p>
          View the full report, submit sightings, and help reunite the pet with
          its owner.
        </p>
      </section>

      {loading ? (
        <div className="premium-report-details-state">
          <p>Loading report...</p>
        </div>
      ) : error ? (
        <div className="premium-report-details-state">
          <p>{error}</p>
          <button
            className="premium-report-details-btn"
            onClick={() => navigate("/premium/lostfound")}
          >
            Back to Lost &amp; Found
          </button>
        </div>
      ) : !report ? (
        <div className="premium-report-details-state">
          <p>Report not found.</p>
        </div>
      ) : (
        <>
          <div className="premium-report-details-grid">
            <div className="premium-report-details-left">
              <div className="premium-report-details-head">
                <div>
                  <h3>Pet Details</h3>
                  <p>Report information and last known details.</p>
                </div>

                <div className="premium-report-details-actions">
                  <button
                    className="premium-report-details-btn"
                    onClick={() => navigate("/premium/lostfound")}
                  >
                    Back
                  </button>

                  {!isResolved && (
                    <button
                      className="premium-report-details-btn-primary"
                      onClick={() =>
                        navigate(`/premium/lostfound/view/${report.id}/sighting`)
                      }
                    >
                      Submit Sighting
                    </button>
                  )}

                  {hasSightings && (
                    <button
                      className="premium-report-details-btn-primary"
                      onClick={() =>
                        document
                          .getElementById("submitted-sightings-section")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      View Sightings ({sightings.length})
                    </button>
                  )}

                  {!isResolved && (
                    <button
                      className="premium-report-details-btn"
                      onClick={markResolved}
                      disabled={resolving}
                    >
                      {resolving ? "Resolving..." : "Mark Resolved"}
                    </button>
                  )}
                </div>
              </div>

              <div className="premium-report-details-list">
                <div className="premium-report-details-item">
                  <strong>Name</strong>
                  <span>{petName}</span>
                </div>

                <div className="premium-report-details-item">
                  <strong>Species</strong>
                  <span>{report.species || "N/A"}</span>
                </div>

                <div className="premium-report-details-item">
                  <strong>Breed</strong>
                  <span>{report.breed || "N/A"}</span>
                </div>

                <div className="premium-report-details-item">
                  <strong>Owner</strong>
                  <span>{report.owner_name || "N/A"}</span>
                </div>

                <div className="premium-report-details-item">
                  <strong>Last Seen</strong>
                  <span>{report.location || report.last_seen_location || "N/A"}</span>
                </div>

                <div className="premium-report-details-item">
                  <strong>Reported At</strong>
                  <span>
                    {formatDate(
                      report.reported_lost_at || report.reported_at || report.created_at
                    )}
                  </span>
                </div>

                <div className="premium-report-details-item">
                  <strong>Status</strong>
                  <span
                    className={
                      isResolved
                        ? "premium-report-details-status resolved"
                        : "premium-report-details-status active"
                    }
                  >
                    {petStatus}
                  </span>
                </div>

                <div className="premium-report-details-item">
                  <strong>Description</strong>
                  <p>
                    {report.description ||
                      report.lost_description ||
                      "No description provided."}
                  </p>
                </div>
              </div>
            </div>

            <div className="premium-report-details-right">
              <div className="premium-report-details-image-wrap">
                <img
                  src={imageUrl}
                  alt={petName}
                  className="premium-report-details-image"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage;
                  }}
                />

                <div className="premium-report-details-overlay">
                  <span className="premium-report-details-tag">
                    {isResolved ? "RESOLVED" : "MISSING PET"}
                  </span>
                  <h4>{petName}</h4>
                  <p>
                    {report.species || "Pet"}
                    {report.breed ? ` • ${report.breed}` : ""}
                    {report.location || report.last_seen_location
                      ? ` • ${report.location || report.last_seen_location}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section
            id="submitted-sightings-section"
            style={{
              marginTop: "24px",
              background: "rgba(255,255,255,0.72)",
              border: "1px solid rgba(255,255,255,0.82)",
              borderRadius: "24px",
              boxShadow: "0 12px 30px rgba(58,69,112,0.08)",
              padding: "22px",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>Submitted Sightings</h3>
              <p style={{ margin: "6px 0 0", color: "#615b74" }}>
                Sightings submitted for this lost pet appear here for the owner.
              </p>
            </div>

            {sightingsLoading ? (
              <p>Loading sightings...</p>
            ) : sightings.length === 0 ? (
              <p>No sightings submitted yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {sightings.map((sighting) => (
                  <div
                    key={sighting.id}
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(227,222,255,0.9)",
                      borderRadius: "18px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginBottom: "8px",
                      }}
                    >
                      <div>
                        <strong>Location:</strong> {sighting.location || "N/A"}
                      </div>
                      <div>
                        <strong>Submitted:</strong> {formatDate(sighting.created_at)}
                      </div>
                    </div>

                    {(sighting.lat !== null || sighting.lng !== null) && (
                      <p style={{ margin: "8px 0" }}>
                        <strong>Coordinates:</strong> {sighting.lat ?? "N/A"},{" "}
                        {sighting.lng ?? "N/A"}
                      </p>
                    )}

                    <p style={{ margin: "8px 0" }}>
                      <strong>Notes:</strong> {sighting.notes || "No notes added."}
                    </p>

                    {sighting.photo_url && (
                      <img
                        src={sighting.photo_url}
                        alt="Sighting"
                        style={{
                          marginTop: "10px",
                          width: "100%",
                          maxWidth: "320px",
                          borderRadius: "14px",
                          objectFit: "cover",
                        }}
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