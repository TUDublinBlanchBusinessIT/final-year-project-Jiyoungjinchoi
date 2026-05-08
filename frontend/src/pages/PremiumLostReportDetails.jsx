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
  const storageBase = "http://127.0.0.1:8000/storage";

  const fallbackImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f3edff"/>
          <stop offset="55%" stop-color="#e8f9ff"/>
          <stop offset="100%" stop-color="#d9d2ff"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" rx="60" fill="url(#bg)"/>
      <circle cx="345" cy="340" r="90" fill="#ffffff" opacity="0.72"/>
      <circle cx="505" cy="275" r="120" fill="#ffffff" opacity="0.68"/>
      <circle cx="670" cy="350" r="105" fill="#ffffff" opacity="0.62"/>
      <text x="600" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="96" font-weight="700" fill="#7d68f2">🐾</text>
      <text x="600" y="565" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#2b1d57">No photo uploaded</text>
      <text x="600" y="625" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="600" fill="#706b88">Premium Lost & Found report</text>
    </svg>
  `)}`;

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
      } else {
        const savedName =
          localStorage.getItem("pawfection_user_name") ||
          localStorage.getItem("user_name") ||
          localStorage.getItem("name");

        if (savedName) setUserName(savedName);
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

  const getImageUrl = (pathOrUrl) => {
    if (!pathOrUrl) return null;

    const value = String(pathOrUrl);

    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }

    return `${storageBase}/${value.replace(/^\/+/, "")}`;
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

      const incomingSightings = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.sightings)
        ? data.sightings
        : Array.isArray(data)
        ? data
        : [];

      setSightings(incomingSightings);
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
      await loadSightings();
    } catch (err) {
      console.error("Resolve error:", err);
      alert("Something went wrong while marking as resolved.");
    } finally {
      setResolving(false);
    }
  };

  const petName = report?.pet_name || report?.name || "Unknown Pet";

  const ownerName =
    report?.owner_name ||
    report?.user?.name ||
    report?.owner?.name ||
    report?.pet_owner?.name ||
    "N/A";

  const lastSeenLocation =
    report?.location ||
    report?.last_seen_location ||
    report?.area ||
    report?.last_seen_area ||
    "N/A";

  const reportedAt =
    report?.reported_lost_at || report?.reported_at || report?.created_at;

  const description =
    report?.description ||
    report?.lost_description ||
    report?.notes ||
    "No description provided.";

  const petStatus =
    report?.status ||
    report?.report_status ||
    report?.lost_status ||
    (report?.is_lost === false ? "Resolved" : "Missing Pet");

  const isResolved = useMemo(() => {
    const statusValues = [
      report?.status,
      report?.report_status,
      report?.lost_status,
      report?.pet_status,
      report?.resolution_status,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase().trim());

    return (
      statusValues.includes("resolved") ||
      statusValues.includes("found") ||
      statusValues.includes("closed") ||
      report?.is_resolved === true ||
      report?.resolved === true ||
      Boolean(report?.resolved_at) ||
      Boolean(report?.found_at)
    );
  }, [report]);

  const imageUrl = useMemo(() => {
    const images = [
      report?.display_photo_url,
      report?.lost_photo_url,
      report?.photo_url,
      getImageUrl(report?.lost_photo_path),
      getImageUrl(report?.photo_path),
      getImageUrl(report?.photo),
    ].filter(Boolean);

    return images[0] || fallbackImage;
  }, [report]);

  const getSightingPhoto = (sighting) => {
    return (
      sighting?.photo_url ||
      sighting?.display_photo_url ||
      getImageUrl(sighting?.photo_path) ||
      getImageUrl(sighting?.photo)
    );
  };

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const reportActions = useMemo(() => {
    const actions = [
      {
        icon: "←",
        title: "Back to Lost & Found",
        text: "Return to the premium lost and found dashboard.",
        action: "Go back",
        onClick: () => navigate("/premium/lostfound"),
      },
    ];

    if (isOwner) {
      actions.push({
        icon: "👀",
        title: "View Sightings",
        text: `${sightings.length} sighting${
          sightings.length === 1 ? "" : "s"
        } submitted for this report.`,
        action: "Open sightings",
        onClick: () => setShowSightingsModal(true),
      });
    }

    if (!isOwner && !isResolved) {
      actions.push({
        icon: "📍",
        title: "Submit Sighting",
        text: "Seen this pet? Add the location and notes to help the owner.",
        action: "Submit now",
        onClick: () => navigate(`/premium/lostfound/view/${report?.id || id}/sighting`),
      });
    }

    if (isOwner && !isResolved) {
      actions.push({
        icon: "✅",
        title: "Mark Resolved",
        text: "Mark this report as resolved once your pet has been found.",
        action: resolving ? "Resolving..." : "Resolve report",
        onClick: markResolved,
      });
    }

    actions.push({
      icon: "🐾",
      title: "Pet Details",
      text: "Review breed, species, owner, status, and last seen information.",
      action: "View details",
      onClick: () => {
        document
          .querySelector(".pld-details-grid")
          ?.scrollIntoView({ behavior: "smooth" });
      },
    });

    return actions;
  }, [isOwner, isResolved, sightings.length, resolving, navigate, report, id]);

  return (
    <div className="pld-shell">
      <header className="pld-site-header">
        <div
          className="pld-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img className="pld-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pld-brand-copy">
            <div className="pld-brand-title">Pawfection</div>
            <div className="pld-brand-sub">Premium Lost &amp; Found</div>
          </div>
        </div>

        <nav className="pld-topnav">
          <Link className="pld-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pld-topnav-item" to="/premium-mypets">
            My Pet
          </Link>
          <Link className="pld-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="pld-topnav-item" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="pld-topnav-item active" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pld-topnav-item" to="/premium/community">
            Community
          </Link>
          <Link className="pld-topnav-item" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="pld-topnav-item" to="/premium/vet-chat">
            AI Pet Assistant
          </Link>
          <Link className="pld-topnav-item" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="pld-header-side">
          <div className="pld-date-pill">{todayText}</div>
          <div className="pld-userchip">
            <div className="pld-avatar">{(userName?.[0] || "P").toUpperCase()}</div>
            <div>
              <div className="pld-userchip-name">{userName}</div>
              <div className="pld-userchip-sub">Premium User</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pld-main">
        {loading ? (
          <section className="pld-state-card">
            <div className="pld-kicker">Loading</div>
            <h1>Loading report...</h1>
            <p>Please wait while Pawfection loads the lost pet details.</p>
          </section>
        ) : error ? (
          <section className="pld-state-card">
            <div className="pld-kicker">Report error</div>
            <h1>Could not load report</h1>
            <p>{error}</p>
            <button
              type="button"
              className="pld-btn pld-btn-primary"
              onClick={() => navigate("/premium/lostfound")}
            >
              Back to Lost &amp; Found
            </button>
          </section>
        ) : !report ? (
          <section className="pld-state-card">
            <div className="pld-kicker">Not found</div>
            <h1>Report not found</h1>
            <p>This report could not be found.</p>
            <button
              type="button"
              className="pld-btn pld-btn-primary"
              onClick={() => navigate("/premium/lostfound")}
            >
              Back to Lost &amp; Found
            </button>
          </section>
        ) : (
          <>
            <section className="pld-hero">
              <div className="pld-hero-copy">
                <div className="pld-kicker">Pawfection Premium Report View</div>
                <h1 className="pld-hero-title">Lost Report Details</h1>
                <p className="pld-hero-text">
                  View the full report, check sightings, and help reunite{" "}
                  {petName} with their owner through premium lost and found support.
                </p>

                <div className="pld-hero-actions">
                  <button
                    type="button"
                    className="pld-btn"
                    onClick={() => navigate("/premium/lostfound")}
                  >
                    Back
                  </button>

                  {isOwner && (
                    <button
                      type="button"
                      className="pld-btn pld-btn-primary"
                      onClick={() => setShowSightingsModal(true)}
                    >
                      View Sightings ({sightings.length})
                    </button>
                  )}

                  {!isOwner && !isResolved && (
                    <button
                      type="button"
                      className="pld-btn pld-btn-primary"
                      onClick={() =>
                        navigate(`/premium/lostfound/view/${report.id || id}/sighting`)
                      }
                    >
                      Submit Sighting
                    </button>
                  )}

                  {isOwner && !isResolved && (
                    <button
                      type="button"
                      className="pld-btn"
                      onClick={markResolved}
                      disabled={resolving}
                    >
                      {resolving ? "Resolving..." : "Mark Resolved"}
                    </button>
                  )}
                </div>

                <div className="pld-hero-stats">
                  <div className="pld-stat-pill">
                    <strong>{petName}</strong>
                    <span>Pet name</span>
                  </div>
                  <div className="pld-stat-pill">
                    <strong>{report.species || "Pet"}</strong>
                    <span>Species</span>
                  </div>
                  <div className="pld-stat-pill">
                    <strong>{sightings.length}</strong>
                    <span>Sightings</span>
                  </div>
                  <div className="pld-stat-pill">
                    <strong>{isResolved ? "Resolved" : "Active"}</strong>
                    <span>Status</span>
                  </div>
                </div>
              </div>

              <div className="pld-hero-card">
                <div className="pld-hero-image-wrap">
                  <img
                    src={imageUrl}
                    alt={petName}
                    className="pld-hero-image"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImage;
                    }}
                  />

                  <div className="pld-hero-overlay">
                    <span>{isResolved ? "Resolved Report" : "Missing Pet"}</span>
                    <h2>{petName}</h2>
                    <p>
                      {report.species || "Pet"}
                      {report.breed ? ` • ${report.breed}` : ""}
                      {lastSeenLocation !== "N/A" ? ` • ${lastSeenLocation}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="pld-auto-section">
              <div className="pld-auto-head">
                <div>
                  <div className="pld-card-kicker">Premium report shortcuts</div>
                  <h2>Report actions, sliding automatically</h2>
                </div>

                <div className="pld-auto-pill">Auto sliding ✨</div>
              </div>

              <div className="pld-slider-mask">
                <div className="pld-slider-track">
                  {[0, 1].map((groupIndex) => (
                    <div className="pld-slider-group" key={groupIndex}>
                      {reportActions.map((item, index) => (
                        <button
                          key={`${groupIndex}-${index}`}
                          type="button"
                          className="pld-slide-card"
                          onClick={item.onClick}
                          disabled={item.title === "Mark Resolved" && resolving}
                        >
                          <span>{item.icon}</span>
                          <strong>{item.title}</strong>
                          <p>{item.text}</p>
                          <small>{item.action}</small>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pld-slider-dots">
                <span></span>
                <span className="active"></span>
                <span></span>
                <span></span>
              </div>
            </section>

            <section className="pld-details-grid">
              <article className="pld-card pld-card-wide">
                <div className="pld-card-kicker">Full Report</div>
                <h3>Pet Details</h3>
                <p className="pld-card-sub">
                  Report information and last known details for this lost pet.
                </p>

                <div className="pld-info-grid">
                  <div className="pld-info-box">
                    <span>Name</span>
                    <strong>{petName}</strong>
                  </div>

                  <div className="pld-info-box">
                    <span>Species</span>
                    <strong>{report.species || "N/A"}</strong>
                  </div>

                  <div className="pld-info-box">
                    <span>Breed</span>
                    <strong>{report.breed || "N/A"}</strong>
                  </div>

                  <div className="pld-info-box">
                    <span>Owner</span>
                    <strong>{ownerName}</strong>
                  </div>

                  <div className="pld-info-box">
                    <span>Last Seen</span>
                    <strong>{lastSeenLocation}</strong>
                  </div>

                  <div className="pld-info-box">
                    <span>Reported At</span>
                    <strong>{formatDate(reportedAt)}</strong>
                  </div>

                  <div className="pld-info-box">
                    <span>Status</span>
                    <strong
                      className={`pld-status-pill ${
                        isResolved ? "resolved" : "active"
                      }`}
                    >
                      {isResolved ? "Resolved" : petStatus}
                    </strong>
                  </div>

                  <div className="pld-info-box">
                    <span>Priority</span>
                    <strong>{report.priority ? "Priority report" : "Normal report"}</strong>
                  </div>
                </div>
              </article>

              <article className="pld-card">
                <div className="pld-card-kicker">Description</div>
                <h3>Report Notes</h3>
                <p className="pld-description-text">{description}</p>
              </article>

              <article className="pld-card">
                <div className="pld-card-kicker">Owner View</div>
                <h3>Sighting Summary</h3>

                {isOwner ? (
                  <>
                    <div className="pld-sighting-summary">
                      <div>
                        <span>Total sightings</span>
                        <strong>{sightings.length}</strong>
                      </div>
                      <div>
                        <span>Report status</span>
                        <strong>{isResolved ? "Resolved" : "Active"}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="pld-btn pld-btn-primary pld-btn-full"
                      onClick={() => setShowSightingsModal(true)}
                    >
                      View Submitted Sightings
                    </button>
                  </>
                ) : (
                  <>
                    <p className="pld-description-text">
                      You can help the owner by submitting a sighting if you have seen
                      this pet nearby.
                    </p>

                    {!isResolved && (
                      <button
                        type="button"
                        className="pld-btn pld-btn-primary pld-btn-full"
                        onClick={() =>
                          navigate(`/premium/lostfound/view/${report.id || id}/sighting`)
                        }
                      >
                        Submit Sighting
                      </button>
                    )}
                  </>
                )}
              </article>
            </section>

            {showSightingsModal && isOwner && (
              <div
                className="pld-modal-overlay"
                onClick={() => setShowSightingsModal(false)}
              >
                <div className="pld-modal" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="pld-modal-close"
                    onClick={() => setShowSightingsModal(false)}
                  >
                    ×
                  </button>

                  <div className="pld-modal-head">
                    <div className="pld-kicker">Sightings</div>
                    <h3>Submitted Sightings</h3>
                    <p>View all sightings submitted for {petName}.</p>
                  </div>

                  {sightingsLoading ? (
                    <div className="pld-empty">Loading sightings...</div>
                  ) : sightings.length === 0 ? (
                    <div className="pld-empty">No sightings submitted yet.</div>
                  ) : (
                    <div className="pld-sighting-list">
                      {sightings.map((sighting) => {
                        const sightingPhoto = getSightingPhoto(sighting);

                        return (
                          <div key={sighting.id} className="pld-sighting-card">
                            <div className="pld-sighting-info">
                              <div className="pld-sighting-top">
                                <div>
                                  <span>Location</span>
                                  <strong>{sighting.location || "N/A"}</strong>
                                </div>

                                <div>
                                  <span>Submitted</span>
                                  <strong>{formatDate(sighting.created_at)}</strong>
                                </div>
                              </div>

                              {(sighting.lat !== null || sighting.lng !== null) && (
                                <p>
                                  <strong>Coordinates:</strong>{" "}
                                  {sighting.lat ?? "N/A"}, {sighting.lng ?? "N/A"}
                                </p>
                              )}

                              <p>
                                <strong>Notes:</strong>{" "}
                                {sighting.notes || "No notes added."}
                              </p>
                            </div>

                            {sightingPhoto && (
                              <img
                                src={sightingPhoto}
                                alt="Sighting"
                                className="pld-sighting-photo"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}