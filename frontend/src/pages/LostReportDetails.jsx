import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./LostReportDetails.css";

export default function LostReportDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");
  const [report, setReport] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loadingReport, setLoadingReport] = useState(true);
  const [loadingSightings, setLoadingSightings] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authHeaders = useMemo(() => {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

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

      if (fallbackName) setUserName(fallbackName);
    } catch {
      setUserName("User");
    }
  };

  const fetchReport = async () => {
    setLoadingReport(true);
    setError("");

    try {
      const res = await fetch(`${apiBase}/lost-pets/${id}`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to load report details.");
        setReport(null);
      } else {
        setReport(data || null);
      }
    } catch {
      setError("Failed to load report details. Is the backend running?");
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchSightings = async () => {
    setLoadingSightings(true);

    try {
      const res = await fetch(`${apiBase}/lost-pets/${id}/sightings`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSightings([]);
      } else {
        const list = Array.isArray(data) ? data : data?.data || [];
        setSightings(Array.isArray(list) ? list : []);
      }
    } catch {
      setSightings([]);
    } finally {
      setLoadingSightings(false);
    }
  };

  const markResolved = async () => {
    if (!token) return navigate("/login");

    const ok = window.confirm("Mark this lost pet report as resolved?");
    if (!ok) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/lost-pets/${id}/resolve`, {
        method: "PATCH",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to mark report as resolved.");
        return;
      }

      setSuccess(data?.message || "Report marked as resolved.");
      setTimeout(() => navigate("/lostfound"), 900);
    } catch {
      setError("Failed to update report. Is the backend running?");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadUserName();
    fetchReport();
    fetchSightings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="pf2-shell">
      <aside className="pf2-sidebar">
        <div className="pf2-brand" onClick={() => navigate("/dashboard")} role="button">
          <img className="pf2-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pf2-brand-text">
            <div className="pf2-brand-title">Pawfection</div>
            <div className="pf2-brand-sub">Lost Report Details</div>
          </div>
        </div>

        <nav className="pf2-nav">
          <Link className="pf2-nav-item" to="/dashboard">Dashboard</Link>
          <Link className="pf2-nav-item" to="/mypets">My Pets</Link>
          <Link className="pf2-nav-item" to="/appointments">Appointments</Link>
          <Link className="pf2-nav-item" to="/reminders">Reminders</Link>
          <Link
            className={`pf2-nav-item ${location.pathname.includes("/lostfound") ? "active" : ""}`}
            to="/lostfound"
          >
            Lost &amp; Found
          </Link>
          <Link className="pf2-nav-item" to="/community">Community</Link>
          <Link className="pf2-nav-item" to="/inventory">Inventory</Link>
          <Link className="pf2-nav-item" to="/upgrade-premium">Premium My Pet</Link>
        </nav>

        <div className="pf2-sidebar-footer">
          <button className="pf2-btn pf2-btn-ghost" onClick={() => navigate("/profile")}>
            View Profile
          </button>
        </div>
      </aside>

      <div className="pf2-main">
        <header className="pf2-topbar">
          <div className="pf2-search">
            <input placeholder="Viewing lost report..." disabled />
          </div>

          <div className="pf2-topbar-right">
            <div className="pf2-userchip" title={userName}>
              <div className="pf2-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pf2-userchip-text">
                <div className="pf2-userchip-name">{userName}</div>
                <div className="pf2-userchip-sub">Basic User</div>
              </div>
            </div>
          </div>
        </header>

        <main className="pf2-content">
          <div className="lrd-head">
            <div>
              <h1 className="lrd-title">Lost Report Details</h1>
              <p className="lrd-subtitle">
                View the full report, see sightings, and help reunite the pet with its owner.
              </p>
            </div>

            <div className="lrd-head-actions">
              <button className="pf2-btn" onClick={() => navigate("/lostfound")}>
                Back
              </button>

              <button
                className="pf2-btn pf2-btn-primary"
                onClick={() => navigate(`/lostfound/${id}/sighting`)}
              >
                Submit Sighting
              </button>

              <button
                className="pf2-btn lrd-resolve-btn"
                onClick={markResolved}
                disabled={busy || !report}
              >
                {busy ? "Updating..." : "Mark Resolved"}
              </button>
            </div>
          </div>

          {error && <div className="lrd-alert">{error}</div>}
          {success && <div className="lrd-success">{success}</div>}

          {loadingReport && <div className="lrd-empty">Loading report details...</div>}

          {!loadingReport && !report && (
            <div className="lrd-empty">Report not found.</div>
          )}

          {!loadingReport && report && (
            <>
              <section className="lrd-grid">
                <div className="lrd-card">
                  <div className="lrd-cardtitle">Pet details</div>

                  <div className="lrd-name">{report.pet_name || "Unnamed Pet"}</div>

                  <div className="lrd-badgerow">
                    <span className="lrd-chip">{report.status || "Active"}</span>
                  </div>

                  <div className="lrd-sub">
                    {[report.species, report.breed].filter(Boolean).join(" • ") || "No extra details"}
                  </div>

                  <div className="lrd-sub">Owner: {report.owner_name || "Unknown owner"}</div>
                  <div className="lrd-sub">Last seen: {report.last_seen_location || "—"}</div>

                  {report.distance_km !== null && report.distance_km !== undefined && (
                    <div className="lrd-sub">Distance: {report.distance_km} km</div>
                  )}

                  <div className="lrd-description">
                    {report.description || "No description provided."}
                  </div>
                </div>

                <div className="lrd-card">
                  <div className="lrd-cardtitle">Photo</div>

                  {report.photo_url ? (
                    <img
                      src={report.photo_url}
                      alt={report.pet_name || "Lost pet"}
                      className="lrd-photo"
                    />
                  ) : (
                    <div className="lrd-empty">No photo available.</div>
                  )}
                </div>
              </section>

              <section className="lrd-card">
                <div className="lrd-cardtop">
                  <div>
                    <div className="lrd-cardtitle">Sightings</div>
                    <div className="lrd-mini">Community updates related to this report.</div>
                  </div>
                  <div className="lrd-count">{sightings.length} updates</div>
                </div>

                {loadingSightings && <div className="lrd-empty">Loading sightings...</div>}

                {!loadingSightings && sightings.length === 0 && (
                  <div className="lrd-empty">No sightings submitted yet.</div>
                )}

                {!loadingSightings && sightings.length > 0 && (
                  <div className="lrd-list">
                    {sightings.map((item) => (
                      <div key={item.id} className="lrd-row">
                        <div className="lrd-row-title">{item.location || "Unknown location"}</div>
                        <div className="lrd-row-sub">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : "Time unavailable"}
                        </div>
                        <div className="lrd-row-text">{item.notes || "No extra notes provided."}</div>

                        {item.photo_url && (
                          <img src={item.photo_url} alt="Sighting" className="lrd-sighting-photo" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}