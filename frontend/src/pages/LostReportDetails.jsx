import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./Appointments.css";

export default function LostReportDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("Guest");
  const [pet, setPet] = useState(null);
  const [sightings, setSightings] = useState([]);

  const [loading, setLoading] = useState(false);
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
      setSuccess("Loaded report details.");
    } catch (err) {
      setError(err.message || "Failed to load report details.");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    loadUserName();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="pf2-shell">
      <aside className="pf2-sidebar">
        <div className="pf2-brand" onClick={() => navigate("/dashboard")} role="button">
          <img className="pf2-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pf2-brand-text">
            <div className="pf2-brand-title">Pawfection</div>
            <div className="pf2-brand-sub">Dashboard</div>
          </div>
        </div>

        <nav className="pf2-nav">
          <Link className="pf2-nav-item" to="/dashboard">Dashboard</Link>
          <Link className="pf2-nav-item" to="/mypets">My Pets</Link>
          <Link
            className={`pf2-nav-item ${location.pathname.includes("/appointments") ? "active" : ""}`}
            to="/appointments"
          >
            Appointments
          </Link>
          <Link className="pf2-nav-item" to="/reminders">Reminders</Link>
          <Link
            className={`pf2-nav-item ${location.pathname.includes("/lostfound") ? "active" : ""}`}
            to="/lostfound"
          >
            Lost &amp; Found
          </Link>
          <Link className="pf2-nav-item" to="/community">Community</Link>
          <Link className="pf2-nav-item" to="/inventory">Inventory</Link>
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
            <input placeholder="Search..." disabled />
          </div>

          <div className="pf2-topbar-right">
            <div className="pf2-userchip" title={userName}>
              <div className="pf2-avatar">{(userName?.[0] || "G").toUpperCase()}</div>
              <div className="pf2-userchip-text">
                <div className="pf2-userchip-name">{userName}</div>
                <div className="pf2-userchip-sub">{token ? "User" : "Guest"}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="pf2-content">
          <div className="pfa-head" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h1 className="pfa-title">Lost Report Details</h1>
              <p className="pfa-subtitle">View the report and all sightings submitted by the community.</p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="pf2-btn" onClick={() => navigate("/lostfound")}>Back</button>
              <button
                className="pf2-btn pf2-btn-primary"
                onClick={() => {
                  if (!token) return navigate("/login");
                  navigate(`/lostfound/${id}/sighting`);
                }}
              >
                + Submit Sighting
              </button>
            </div>
          </div>

          {error && <div className="pfa-alert">{error}</div>}
          {success && <div className="pfa-success">{success}</div>}
          {loading && <div className="pfa-empty">Loading…</div>}

          {!loading && pet && (
            <section className="pfa-grid-one">
              <div className="pfa-card">
                <div className="pfa-cardtop">
                  <div>
                    <div className="pfa-cardtitle">
                      {pet.pet_name || "Unknown Pet"} •{" "}
                      <span className="pfa-chip">{pet.status || "Active"}</span>
                    </div>
                    <div className="pfa-mini">{pet.description || "No description"}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 16, padding: 18 }}>
                  {pet.photo_url ? (
                    <img
                      src={pet.photo_url}
                      alt={pet.pet_name || "Lost pet"}
                      style={{ width: 140, height: 140, borderRadius: 16, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 140,
                        height: 140,
                        borderRadius: 16,
                        background: "#f3f4f6",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        color: "#6b7280",
                      }}
                    >
                      No Photo
                    </div>
                  )}

                  <div style={{ flex: 1, display: "grid", gap: 8 }}>
                    <div className="pfa-sub"><strong>Species:</strong> {pet.species || "—"}</div>
                    <div className="pfa-sub"><strong>Breed:</strong> {pet.breed || "—"}</div>
                    <div className="pfa-sub"><strong>Age:</strong> {pet.age || "—"}</div>
                    <div className="pfa-sub"><strong>Gender:</strong> {pet.gender || "—"}</div>
                    <div className="pfa-sub"><strong>Owner:</strong> {pet.owner_name || "—"}</div>
                    <div className="pfa-sub"><strong>Last seen:</strong> {pet.last_seen_location || "—"}</div>
                    <div className="pfa-sub"><strong>Reported:</strong> {fmt(pet.reported_lost_at)}</div>
                  </div>
                </div>

                <div style={{ padding: "0 18px 18px" }}>
                  <div className="pfa-cardtitle" style={{ marginBottom: 8 }}>
                    Sightings (updates)
                  </div>

                  {sightings.length === 0 ? (
                    <div className="pfa-empty">
                      No sightings yet. Use the “Submit Sighting” button to add one.
                    </div>
                  ) : (
                    <div className="pfa-list">
                      {sightings.map((s) => (
                        <div key={s.id} className="pfa-row">
                          <div className="pfa-left">
                            <div className="pfa-name">
                              {s.location} •{" "}
                              <span className="pfa-chip">
                                Owner notified {s.owner_notified_at ? "✓" : ""}
                              </span>
                            </div>
                            <div className="pfa-sub">{s.notes || "No notes"}</div>
                            <div className="pfa-sub2">Submitted: {fmt(s.created_at)}</div>
                          </div>

                          <div className="pfa-right">
                            {s.photo_url ? (
                              <a
                                className="pf2-btn pf2-btn-small"
                                href={s.photo_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View Photo
                              </a>
                            ) : (
                              <span className="pfa-sub2">No photo</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}