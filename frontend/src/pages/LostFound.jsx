import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./Appointments.css"; // reuse same layout + card styles

export default function LostFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
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

  const fetchLostPets = async () => {
    if (!token) return navigate("/login");
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/lost-pets`, {
        method: "GET",
        headers: authHeaders,
      });

      if (res.status === 401) {
        localStorage.removeItem("pawfection_token");
        navigate("/login");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to load lost pets.");
        setItems([]);
      } else {
        const list = Array.isArray(data) ? data : data?.data || [];
        setItems(Array.isArray(list) ? list : []);
        setSuccess("Loaded successfully.");
      }
    } catch {
      setError("Server error. Is your backend running?");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const markResolved = async (id) => {
    if (!token) return navigate("/login");

    const ok = window.confirm("Mark this lost pet report as Resolved? This will archive it.");
    if (!ok) return;

    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/lost-pets/${id}/resolve`, {
        method: "PATCH",
        headers: authHeaders,
      });

      if (res.status === 401) {
        localStorage.removeItem("pawfection_token");
        navigate("/login");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to mark as resolved.");
        return;
      }

      // Archived: remove from Active list
      setItems((prev) => prev.filter((x) => x.id !== id));
      setSuccess(data?.message || "Marked as Resolved.");
    } catch {
      setError("Failed to update. Is your backend running?");
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadUserName();
    fetchLostPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional: basic search box like Appointments
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return (items || []).filter((p) => {
      const name = (p.pet_name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const loc = (p.last_seen_location || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || loc.includes(q);
    });
  }, [items, query]);

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

      {/* Main */}
      <div className="pf2-main">
        {/* Topbar */}
        <header className="pf2-topbar">
          <div className="pf2-search">
            <input
              placeholder="Search lost pets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
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
          <div className="pfa-head">
            <div>
              <h1 className="pfa-title">Lost &amp; Found</h1>
              <p className="pfa-subtitle">
                Report a lost pet, submit sightings, and mark reports as resolved.
              </p>
            </div>
          </div>

          {error && <div className="pfa-alert">{error}</div>}
          {success && <div className="pfa-success">{success}</div>}

          <section className="pfa-grid-one">
            <div className="pfa-card">
              <div className="pfa-cardtop">
                <div>
                  <div className="pfa-cardtitle">Active lost reports</div>
                  <div className="pfa-mini">Click a report to view updates (sightings).</div>
                </div>

                <div className="pfa-actions-right">
                  <button
                    className="pf2-btn pf2-btn-primary"
                    onClick={() => navigate("/lostfound/report")}
                  >
                    + Report Lost Pet
                  </button>

                  <button className="pf2-btn" onClick={fetchLostPets} disabled={loading}>
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>

              {loading && <div className="pfa-empty">Loading lost pets…</div>}

              {!loading && filtered.length === 0 && (
                <div className="pfa-empty">No active lost pet reports yet.</div>
              )}

              {!loading && filtered.length > 0 && (
                <div className="pfa-list">
                  {filtered.map((p) => {
                    const name = p.pet_name || "Unnamed Pet";
                    const status = p.status || "Active";

                    return (
                      <div key={p.id} className="pfa-row">
                        <div
                          className="pfa-left"
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/lostfound/${p.id}`)}
                          title="View report details"
                        >
                          <div className="pfa-name">
                            {name} • <span className="pfa-chip">{status}</span>
                          </div>

                          <div className="pfa-sub">{p.description || "No description"}</div>
                          <div className="pfa-sub">{p.last_seen_location ? `Last seen: ${p.last_seen_location}` : "—"}</div>
                        </div>

                        <div className="pfa-right">
                          <button
                            className="pf2-btn pf2-btn-small"
                            onClick={() => navigate(`/lostfound/${p.id}/sighting`)}
                          >
                            Submit Sighting
                          </button>

                          {status !== "Resolved" && (
                            <button
                              className="pf2-btn pf2-btn-small pfa-deletebtn"
                              onClick={() => markResolved(p.id)}
                              disabled={busyId === p.id}
                            >
                              {busyId === p.id ? "..." : "Mark Resolved"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}