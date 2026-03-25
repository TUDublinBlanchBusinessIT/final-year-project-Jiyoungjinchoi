import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumDashboard.css";
import "./LostFoundPremium.css";

export default function LostReportDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const accountType = String(
    localStorage.getItem("pawfection_account_type") || "basic"
  ).toLowerCase();
  const isPremiumUser = accountType === "premium";

  const [userName, setUserName] = useState("Guest");
  const [pet, setPet] = useState(null);
  const [sightings, setSightings] = useState([]);

  const [loading, setLoading] = useState(false);
  const [busyResolve, setBusyResolve] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authHeaders = useMemo(() => {
    return token
      ? {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        }
      : {
          Accept: "application/json",
        };
  }, [token]);

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const loadUserName = () => {
    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name && typeof userObj.name === "string") {
          setUserName(userObj.name);
          return;
        }
      }

      const fallbackName =
        localStorage.getItem("pawfection_user_name") ||
        localStorage.getItem("user_name") ||
        localStorage.getItem("name");

      setUserName(fallbackName || "Guest");
    } catch {
      setUserName("Guest");
    }
  };

  const fetchPet = async () => {
    const res = await fetch(`${apiBase}/lost-pets/${id}`, { headers: authHeaders });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "Failed to load lost report.");
    }

    return data;
  };

  const fetchSightings = async () => {
    const res = await fetch(`${apiBase}/lost-pets/${id}/sightings`, { headers: authHeaders });
    const data = await res.json().catch(() => ([]));

    if (!res.ok) {
      return [];
    }

    return Array.isArray(data) ? data : data?.data || [];
  };

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [p, s] = await Promise.all([fetchPet(), fetchSightings()]);
      setPet(p);
      setSightings(s);
    } catch (err) {
      setError(err.message || "Failed to load report details.");
    } finally {
      setLoading(false);
    }
  };

  const markResolved = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    const ok = window.confirm("Mark this lost pet report as Resolved? This will archive it.");
    if (!ok) return;

    setBusyResolve(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/lost-pets/${id}/resolve`, {
        method: "PATCH",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to mark report as resolved.");
      }

      setSuccess(data?.message || "Lost pet report marked as Resolved.");
      await load();
    } catch (err) {
      setError(err.message || "Failed to update report.");
    } finally {
      setBusyResolve(false);
    }
  };

  const fmt = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const latestSighting = useMemo(() => {
    return sightings?.length ? sightings[0] : null;
  }, [sightings]);

  useEffect(() => {
    loadUserName();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="pfd-shell">
      <header className="pfd-site-header">
        <div
          className="pfd-brand"
          onClick={() => navigate(isPremiumUser ? "/premium-dashboard" : "/dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate(isPremiumUser ? "/premium-dashboard" : "/dashboard");
            }
          }}
        >
          <img className="pfd-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pfd-brand-copy">
            <div className="pfd-brand-title">Pawfection</div>
            <div className="pfd-brand-sub">Lost Report Details</div>
          </div>
        </div>

        <nav className="pfd-topnav">
          <Link className="pfd-topnav-item" to={isPremiumUser ? "/premium-dashboard" : "/dashboard"}>
            {isPremiumUser ? "Premium My Pet" : "Dashboard"}
          </Link>
          <Link className="pfd-topnav-item" to="/mypets">
            My Pets
          </Link>
          <Link className="pfd-topnav-item" to="/appointments">
            Appointments
          </Link>
          <Link className="pfd-topnav-item" to="/reminders">
            Reminders
          </Link>
          <Link className="pfd-topnav-item active" to="/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pfd-topnav-item" to="/community">
            Community
          </Link>
          <Link className="pfd-topnav-item" to="/inventory">
            Inventory
          </Link>
          <Link className="pfd-topnav-item" to="/profile">
            Profile
          </Link>
        </nav>

        <div className="pfd-header-side">
          <div className="pfd-header-meta">
            <div className="pfd-date-pill">{todayText}</div>

            <div className="pfd-userchip" title={userName}>
              <div className="pfd-avatar">{(userName?.[0] || "G").toUpperCase()}</div>
              <div className="pfd-userchip-text">
                <div className="pfd-userchip-name">{userName}</div>
                <div className="pfd-userchip-sub">
                  {token ? (isPremiumUser ? "Premium User" : "Standard User") : "Guest"}
                </div>
              </div>
            </div>
          </div>

          <div className="pfd-search">
            <input placeholder="Lost report details..." disabled />
          </div>
        </div>
      </header>

      <main className="pfd-main">
        <section className="pfd-hero plf-hero">
          <span className="pfd-doodle pfd-doodle-paw-1">🐾</span>
          <span className="pfd-doodle pfd-doodle-paw-2">🐾</span>
          <span className="pfd-doodle pfd-doodle-bone">📍</span>
          <span className="pfd-doodle pfd-doodle-cat">👀</span>

          <div className="pfd-hero-copy">
            <div className="pfd-kicker">
              {pet?.is_priority ? "Priority lost report" : "Lost pet report"}
            </div>

            <h1 className="pfd-hero-title">
              {pet?.pet_name || "Lost Report"}
            </h1>

            <p className="pfd-hero-text">
              View the report, track sightings, and respond quickly with community help. Premium
              reports are more visible and easier to spot.
            </p>

            <div className="pfd-hero-chips">
              <div className="pfd-chip">📍 {pet?.last_seen_location || "No location"}</div>
              <div className="pfd-chip">👀 {sightings.length} sightings</div>
              <div className="pfd-chip">🕒 {fmt(pet?.reported_lost_at)}</div>
              {pet?.is_priority && <div className="pfd-chip">🚨 Priority Alert</div>}
            </div>

            <div className="pfd-hero-actions">
              <button className="pfd-btn pfd-btn-primary" onClick={() => navigate("/lostfound")}>
                Back to Lost &amp; Found
              </button>

              <button
                className="pfd-btn"
                onClick={() => {
                  if (!token) return navigate("/login");
                  navigate(`/lostfound/${id}/sighting`);
                }}
              >
                Submit Sighting
              </button>

              {token && (
                <button className="pfd-btn" onClick={markResolved} disabled={busyResolve}>
                  {busyResolve ? "Updating..." : "Mark Resolved"}
                </button>
              )}
            </div>
          </div>

          <div className="pfd-hero-visual">
            <div className="pfd-speech pfd-speech-left">
              <div className="pfd-speech-title">Owner</div>
              <div className="pfd-speech-text">{pet?.owner_name || "Unknown owner"}</div>
            </div>

            <article className="pfd-hero-photo-card">
              {pet?.photo_url ? (
                <img src={pet.photo_url} alt={pet.pet_name || "Lost pet"} />
              ) : (
                <div className="pfd-photo-empty">
                  <div className="pfd-photo-empty-icon">🐾</div>
                  <div className="pfd-photo-empty-title">No report photo</div>
                  <div className="pfd-photo-empty-text">
                    A recent photo helps the community identify the pet faster.
                  </div>
                </div>
              )}

              <div className="pfd-hero-photo-overlay">
                <div className="pfd-card-kicker pfd-card-kicker-light">
                  {pet?.is_priority ? "Priority report" : "Active report"}
                </div>
                <div className="pfd-hero-photo-name">{pet?.pet_name || "Unknown Pet"}</div>
                <div className="pfd-hero-photo-meta">
                  {pet
                    ? `${pet.species || "Pet"}${pet.breed ? ` • ${pet.breed}` : ""}${
                        pet.age ? ` • Age ${pet.age}` : ""
                      }`
                    : "Waiting for report details"}
                </div>
              </div>
            </article>

            <div className="pfd-speech pfd-speech-right">
              <div className="pfd-speech-title">Latest update</div>
              <div className="pfd-speech-text">
                {latestSighting?.location
                  ? `Seen near ${latestSighting.location}`
                  : "No sightings submitted yet."}
              </div>
            </div>
          </div>
        </section>

        {error && <div className="plf-alert">{error}</div>}
        {success && <div className="plf-success">{success}</div>}
        {loading && <div className="pfd-empty" style={{ marginTop: 16 }}>Loading report details…</div>}

        {!loading && pet && (
          <section className="pfd-collage">
            <article className="pfd-card pfd-span-2 plf-card-soft">
              <div className="pfd-card-head">
                <div>
                  <div className="pfd-card-kicker">Report profile</div>
                  <h2>Lost Pet Details</h2>
                  <p>Main report information, status, and owner-facing summary.</p>
                </div>
                <button
                  className="pfd-btn pfd-btn-small"
                  onClick={() => navigate(`/lostfound/${id}/sighting`)}
                >
                  Add Sighting
                </button>
              </div>

              <div className="pfd-mini-list">
                <div className="pfd-mini-item">
                  <div className="pfd-mini-item-icon">🐶</div>
                  <div className="pfd-mini-item-body">
                    <div className="pfd-mini-item-title">
                      {pet.pet_name || "Unknown Pet"}
                    </div>
                    <div className="pfd-mini-item-text">
                      {pet.description || "No description"}
                    </div>
                    <div className="pfd-mini-item-sub">Status: {pet.status || "Active"}</div>
                  </div>
                </div>

                <div className="pfd-mini-item">
                  <div className="pfd-mini-item-icon">📍</div>
                  <div className="pfd-mini-item-body">
                    <div className="pfd-mini-item-title">Last Seen</div>
                    <div className="pfd-mini-item-text">
                      {pet.last_seen_location || "No location provided"}
                    </div>
                    <div className="pfd-mini-item-sub">
                      Reported: {fmt(pet.reported_lost_at)}
                    </div>
                  </div>
                </div>

                <div className="pfd-mini-item">
                  <div className="pfd-mini-item-icon">🧬</div>
                  <div className="pfd-mini-item-body">
                    <div className="pfd-mini-item-title">Pet Profile</div>
                    <div className="pfd-mini-item-text">
                      {pet.species || "—"}
                      {pet.breed ? ` • ${pet.breed}` : ""}
                      {pet.age ? ` • Age ${pet.age}` : ""}
                      {pet.gender ? ` • ${pet.gender}` : ""}
                    </div>
                    <div className="pfd-mini-item-sub">Owner: {pet.owner_name || "—"}</div>
                  </div>
                </div>

                <div className="pfd-mini-item">
                  <div className="pfd-mini-item-icon">⭐</div>
                  <div className="pfd-mini-item-body">
                    <div className="pfd-mini-item-title">Visibility</div>
                    <div className="pfd-mini-item-text">
                      {pet.is_priority
                        ? "This report has Priority Alert visibility."
                        : "This report is a standard visibility report."}
                    </div>
                    <div className="pfd-mini-item-sub">
                      {pet.owner_account_type === "premium" ? "Premium account" : "Standard account"}
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="pfd-card pfd-card-care">
              <div className="pfd-card-kicker">Care board</div>

              <div className="pfd-care-ring">
                <div className="pfd-care-ring-value">{sightings.length}</div>
                <div className="pfd-care-ring-text">sightings</div>
              </div>

              <div className="pfd-care-block">
                <div className="pfd-care-label">Report type</div>
                <div className="pfd-care-main">
                  {pet.is_priority ? "Priority" : "Standard"}
                </div>
                <div className="pfd-care-sub">
                  {pet.is_priority
                    ? "Boosted visibility is active for this report."
                    : "No priority boost is currently active."}
                </div>
              </div>

              <div className="pfd-care-divider" />

              <div className="pfd-care-block">
                <div className="pfd-care-label">Latest sighting</div>
                <div className="pfd-care-main">
                  {latestSighting?.location || "No sightings"}
                </div>
                <div className="pfd-care-sub">
                  {latestSighting ? fmt(latestSighting.created_at) : "Waiting for updates"}
                </div>
              </div>

              <div className="pfd-care-actions">
                <button className="pfd-btn pfd-btn-small" onClick={() => navigate("/lostfound")}>
                  Back
                </button>
                <button
                  className="pfd-btn pfd-btn-small"
                  onClick={() => {
                    if (!token) return navigate("/login");
                    navigate(`/lostfound/${id}/sighting`);
                  }}
                >
                  Submit Sighting
                </button>
              </div>
            </article>

            <article className="pfd-card pfd-card-gallery pfd-span-2">
              <div className="pfd-card-head">
                <div>
                  <div className="pfd-card-kicker">Community updates</div>
                  <h2>Sightings</h2>
                  <p>Recent community-submitted sightings related to this lost pet.</p>
                </div>
                <button
                  className="pfd-btn pfd-btn-small"
                  onClick={() => {
                    if (!token) return navigate("/login");
                    navigate(`/lostfound/${id}/sighting`);
                  }}
                >
                  + Submit
                </button>
              </div>

              {sightings.length === 0 ? (
                <div className="pfd-empty">
                  No sightings yet. Use the “Submit Sighting” button to add one.
                </div>
              ) : (
                <div className="plf-report-list">
                  {sightings.map((s) => (
                    <div key={s.id} className="plf-report-row">
                      <div className="plf-report-left">
                        <div className="plf-report-head">
                          <div className="plf-report-name">{s.location || "Unknown location"}</div>
                          <div className="plf-report-badges">
                            <span className="plf-badge plf-badge-soft">
                              {s.owner_notified_at ? "Owner notified" : "Pending"}
                            </span>
                          </div>
                        </div>

                        <div className="plf-report-text">{s.notes || "No notes"}</div>
                        <div className="plf-report-meta">Submitted: {fmt(s.created_at)}</div>
                      </div>

                      <div className="plf-report-actions">
                        {s.photo_url ? (
                          <a
                            className="pfd-btn pfd-btn-small"
                            href={s.photo_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Photo
                          </a>
                        ) : (
                          <span className="pfd-empty" style={{ padding: 0 }}>No photo</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="pfd-card pfd-card-arch">
              <div className="pfd-card-kicker">Report spotlight</div>
              <div className="pfd-arch-frame">
                {pet.photo_url ? (
                  <img src={pet.photo_url} alt={pet.pet_name || "Lost pet"} />
                ) : (
                  <div className="pfd-arch-empty">📍</div>
                )}
              </div>
              <div className="pfd-arch-name">{pet.pet_name || "Lost Pet"}</div>
              <div className="pfd-arch-meta">
                {pet.last_seen_location || "Last seen location unavailable"}
              </div>
            </article>

            <article className="pfd-banner pfd-span-3">
              <span className="pfd-banner-paw pfd-banner-paw-1">🐾</span>
              <span className="pfd-banner-paw pfd-banner-paw-2">🐾</span>
              <span className="pfd-banner-bone">📍</span>

              <div className="pfd-banner-copy">
                <div className="pfd-card-kicker pfd-card-kicker-light">Lost report actions</div>
                <h2>
                  {pet.is_priority
                    ? "Priority Alert is active on this report."
                    : "Keep this report visible and gather nearby sightings quickly."}
                </h2>
                <div className="pfd-banner-divider">
                  report, track, sight, update 🐾
                </div>
              </div>

              <div className="pfd-banner-actions">
                <button className="pfd-quickaction" onClick={() => navigate("/lostfound")}>
                  <span className="pfd-quickicon">↩️</span>
                  <span>Back to Feed</span>
                </button>

                <button
                  className="pfd-quickaction"
                  onClick={() => {
                    if (!token) return navigate("/login");
                    navigate(`/lostfound/${id}/sighting`);
                  }}
                >
                  <span className="pfd-quickicon">👀</span>
                  <span>Submit Sighting</span>
                </button>

                <button className="pfd-quickaction" onClick={load}>
                  <span className="pfd-quickicon">🔄</span>
                  <span>Refresh Details</span>
                </button>

                {token && (
                  <button className="pfd-quickaction" onClick={markResolved} disabled={busyResolve}>
                    <span className="pfd-quickicon">✅</span>
                    <span>{busyResolve ? "Updating..." : "Mark Resolved"}</span>
                  </button>
                )}
              </div>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}