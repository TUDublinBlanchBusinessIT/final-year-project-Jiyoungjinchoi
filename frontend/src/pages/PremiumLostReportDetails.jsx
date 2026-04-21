import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumLostReportDetails.css";

export default function PremiumReportDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [userName, setUserName] = useState("Premium User");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [report, setReport] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sightingsLoading, setSightingsLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [showSightingsModal, setShowSightingsModal] = useState(false);

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

        setCurrentUserId(
          userObj?.id ??
            userObj?.user_id ??
            userObj?.data?.id ??
            userObj?.user?.id ??
            null
        );
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

  const getOwnerIdFromReport = useCallback((reportData) => {
    if (!reportData) return null;

    return (
      reportData.user_id ??
      reportData.owner_id ??
      reportData.pet_owner_id ??
      reportData.created_by ??
      reportData.user?.id ??
      reportData.owner?.id ??
      reportData.pet_owner?.id ??
      null
    );
  }, []);

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

      const loadedReport = data.data || data.report || data.pet || data;
      setReport(loadedReport);
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
  }, [loadReport]);

  const reportOwnerId = useMemo(
    () => getOwnerIdFromReport(report),
    [report, getOwnerIdFromReport]
  );

  const isOwner = useMemo(() => {
    if (currentUserId == null || reportOwnerId == null) return false;
    return String(currentUserId) === String(reportOwnerId);
  }, [currentUserId, reportOwnerId]);

  useEffect(() => {
    if (!report) return;

    if (isOwner) {
      loadSightings();
    } else {
      setSightings([]);
    }
  }, [report, isOwner, loadSightings]);

  const markResolved = async () => {
    if (!report || resolving || !isOwner) return;

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

                  {!isOwner && !isResolved && (
                    <button
                      className="premium-report-details-btn-primary"
                      onClick={() =>
                        navigate(`/premium/lostfound/view/${report.id}/sighting`)
                      }
                    >
                      Submit Sighting
                    </button>
                  )}

                  {isOwner && hasSightings && (
                    <button
                      className="premium-report-details-btn-primary"
                      onClick={() => setShowSightingsModal(true)}
                    >
                      View Sightings ({sightings.length})
                    </button>
                  )}

                  {isOwner && !isResolved && (
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

          {showSightingsModal && isOwner && (
            <div
              onClick={() => setShowSightingsModal(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(35, 31, 56, 0.38)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                zIndex: 9999,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "min(1100px, 100%)",
                  maxHeight: "85vh",
                  overflowY: "auto",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,245,255,0.94))",
                  border: "1px solid rgba(255,255,255,0.85)",
                  borderRadius: "30px",
                  boxShadow: "0 30px 80px rgba(49, 39, 90, 0.20)",
                  padding: "28px",
                  position: "relative",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowSightingsModal(false)}
                  style={{
                    position: "absolute",
                    top: "18px",
                    right: "18px",
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    background: "rgba(132, 108, 255, 0.14)",
                    color: "#6f5cff",
                    fontSize: "28px",
                    fontWeight: "700",
                  }}
                >
                  ×
                </button>

                <div style={{ marginBottom: "20px", paddingRight: "48px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "8px 14px",
                      borderRadius: "999px",
                      background: "rgba(132, 108, 255, 0.14)",
                      color: "#6f5cff",
                      fontSize: "12px",
                      fontWeight: "700",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}
                  >
                    Sightings
                  </span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "40px",
                      lineHeight: 1.1,
                      color: "#221a45",
                    }}
                  >
                    Submitted Sightings
                  </h3>
                  <p
                    style={{
                      margin: "10px 0 0",
                      color: "#615b74",
                      fontSize: "17px",
                    }}
                  >
                    View all sightings submitted for {petName}.
                  </p>
                </div>

                {sightingsLoading ? (
                  <p>Loading sightings...</p>
                ) : sightings.length === 0 ? (
                  <p>No sightings submitted yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: "18px" }}>
                    {sightings.map((sighting) => (
                      <div
                        key={sighting.id}
                        style={{
                          background: "rgba(255,255,255,0.94)",
                          border: "1px solid rgba(227,222,255,0.95)",
                          borderRadius: "24px",
                          padding: "20px",
                          boxShadow: "0 10px 30px rgba(76, 64, 128, 0.08)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            flexWrap: "wrap",
                            marginBottom: "10px",
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
                              marginTop: "12px",
                              width: "100%",
                              maxWidth: "340px",
                              borderRadius: "18px",
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
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}