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

  const [userName, setUserName] = useState("User");

  const [pet, setPet] = useState(null);
  const [sightings, setSightings] = useState([]);

  const [loading, setLoading] = useState(false);
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
        if (userObj?.name && typeof userObj.name === "string") setUserName(userObj.name);
        return;
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

  const fetchPetFromList = async () => {
    // You don’t have a /lost-pets/{id} endpoint yet, so we fetch list and pick one.
    const res = await fetch(`${apiBase}/lost-pets`, { headers: authHeaders });
    if (res.status === 401) {
      localStorage.removeItem("pawfection_token");
      navigate("/login");
      return null;
    }
    const data = await res.json().catch(() => ({}));
    const list = Array.isArray(data) ? data : data?.data || [];
    return list.find((x) => String(x.id) === String(id)) || null;
  };

  const fetchSightings = async () => {
    const res = await fetch(`${apiBase}/lost-pets/${id}/sightings`, { headers: authHeaders });
    if (res.status === 401) {
      localStorage.removeItem("pawfection_token");
      navigate("/login");
      return [];
    }
    const data = await res.json().catch(() => ([]));
    return Array.isArray(data) ? data : data?.data || [];
  };

  const load = async () => {
    if (!token) return navigate("/login");
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const p = await fetchPetFromList();
      setPet(p);

      const s = await fetchSightings();
      setSightings(s);

      setSuccess("Loaded report details.");
    } catch {
      setError("Failed to load. Is your backend running?");
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
    if (!token) {
      navigate("/login");
      return;
    }
    loadUserName();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="pf2-shell">
      {/* Sidebar */}
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
          <Link className={`pf2-nav-item ${location.pathname.includes("/appointments") ? "active" : ""}`} to="/appointments">
            Appointments
          </Link>
          <Link className="pf2-nav-item" to="/reminders">Reminders</Link>
          <Link className={`pf2-nav-item ${location.pathname.includes("/lostfound") ? "active" : ""}`} to="/lostfound">
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

      {/* Main */}
      <div className="pf2-main">
        <header className="pf2-topbar">
          <div className="pf2-search">
            <input placeholder="Search..." disabled />
          </div>

          <div className="pf2-topbar-right">
            <div className="pf2-userchip" title={userName}>
              <div className="pf2-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pf2-userchip-text">
                <div className="pf2-userchip-name">{userName}</div>
                <div className="pf2-userchip-sub">User</div>
              </div>
            </div>
          </div>
        </header>

        <main className="pf2-content">
          <div className="pfa-head" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h1 className="pfa-title">Lost Report Details</h1>
              <p className="pfa-subtitle">View the report and its sightings (updates).</p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="pf2-btn" onClick={() => navigate("/lostfound")}>Back</button>
              <button
                className="pf2-btn pf2-btn-primary"
                onClick={() => navigate(`/lostfound/${id}/sighting`)}
              >
                + Submit Sighting
              </button>
            </div>
          </div>

          {error && <div className="pfa-alert">{error}</div>}
          {success && <div className="pfa-success">{success}</div>}
          {loading && <div className="pfa-empty">Loading…</div>}

          {!loading && (
            <section className="pfa-grid-one">
              <div className="pfa-card">
                <div className="pfa-cardtop">
                  <div>
                    <div className="pfa-cardtitle">
                      {pet?.pet_name || "Unknown Pet"} •{" "}
                      <span className="pfa-chip">{pet?.status || "Active"}</span>
                    </div>
                    <div className="pfa-mini">{pet?.description || "No description"}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 16, padding: 18 }}>
                  {pet?.photo_url ? (
                    <img
                      src={pet.photo_url}
                      alt={pet.pet_name || "Lost pet"}
                      style={{ width: 120, height: 120, borderRadius: 16, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 120,
                        height: 120,
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

                  <div style={{ flex: 1 }}>
                    <div className="pfa-sub">
                      <strong>Last seen:</strong> {pet?.last_seen_location || "—"}
                    </div>
                    <div className="pfa-sub">
                      <strong>Reported:</strong> {fmt(pet?.reported_lost_at)}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0 18px 18px" }}>
                  <div className="pfa-cardtitle" style={{ marginBottom: 8 }}>
                    Sightings (updates)
                  </div>

                  {sightings.length === 0 ? (
                    <div className="pfa-empty">
                      No sightings yet. Click “Submit Sighting” to add an update.
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
                              <a className="pf2-btn pf2-btn-small" href={s.photo_url} target="_blank" rel="noreferrer">
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