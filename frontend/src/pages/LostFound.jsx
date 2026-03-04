import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./Appointments.css";

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

  // top search
  const [query, setQuery] = useState("");

  // ✅ Sprint 1514 filters
  const [filters, setFilters] = useState({
    species: "",
    breed: "",
    location: "",
    radius_km: "",
    sort: "date",
    lat: "",
    lng: "",
  });

  const authHeaders = useMemo(() => {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const fieldStyle = {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: "0 12px",
    outline: "none",
    background: "#fff",
  };

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

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.species) params.set("species", filters.species);
    if (filters.breed) params.set("breed", filters.breed);
    if (filters.location) params.set("location", filters.location);
    if (filters.radius_km) params.set("radius_km", filters.radius_km);
    if (filters.sort) params.set("sort", filters.sort);

    if (filters.lat && filters.lng) {
      params.set("lat", filters.lat);
      params.set("lng", filters.lng);
    }

    return params.toString();
  };

  const fetchLostPets = async () => {
    if (!token) return navigate("/login");
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const qs = buildQuery();
      const url = qs ? `${apiBase}/lost-pets?${qs}` : `${apiBase}/lost-pets`;

      const res = await fetch(url, {
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

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported in this browser.");
      return;
    }

    setSuccess("");
    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFilters((p) => ({
          ...p,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude),
        }));
        setSuccess("Location detected ✅ Now you can use radius and sort by proximity.");
      },
      () => setError("Location permission denied.")
    );
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

  // local search on already-loaded results
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return (items || []).filter((p) => {
      const name = (p.pet_name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const loc = (p.last_seen_location || "").toLowerCase();
      const breed = (p.breed || "").toLowerCase();
      const species = (p.species || "").toLowerCase();
      return (
        name.includes(q) ||
        desc.includes(q) ||
        loc.includes(q) ||
        breed.includes(q) ||
        species.includes(q)
      );
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
          <Link className="pf2-nav-item" to="/dashboard">
            Dashboard
          </Link>
          <Link className="pf2-nav-item" to="/mypets">
            My Pets
          </Link>

          <Link
            className={`pf2-nav-item ${location.pathname.includes("/appointments") ? "active" : ""}`}
            to="/appointments"
          >
            Appointments
          </Link>

          <Link className="pf2-nav-item" to="/reminders">
            Reminders
          </Link>

          <Link
            className={`pf2-nav-item ${location.pathname.includes("/lostfound") ? "active" : ""}`}
            to="/lostfound"
          >
            Lost &amp; Found
          </Link>

          <Link className="pf2-nav-item" to="/community">
            Community
          </Link>
          <Link className="pf2-nav-item" to="/inventory">
            Inventory
          </Link>
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
                Search and filter lost reports by species, breed, location and radius.
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
                  <div className="pfa-mini">Apply filters, then click a report to view sightings updates.</div>
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

              {/* ✅ Sprint 1514 filter UI (neat layout) */}
              <div style={{ padding: "0 18px 18px" }}>
                <div
                  style={{
                    marginTop: 12,
                    background: "#fff",
                    border: "1px solid #eef0f4",
                    borderRadius: 16,
                    padding: 14,
                    boxShadow: "0 10px 25px rgba(0,0,0,.04)",
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 10, color: "#111827" }}>
                    Filters
                    <span style={{ fontWeight: 600, color: "#6b7280", marginLeft: 8 }}>
                      (species, breed, location, radius, sort)
                    </span>
                  </div>

                  {/* Row 1 */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1.2fr 1.2fr 160px 160px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <select
                      value={filters.species}
                      onChange={(e) => setFilters((p) => ({ ...p, species: e.target.value }))}
                      style={fieldStyle}
                    >
                      <option value="">All species</option>
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                      <option value="Other">Other</option>
                    </select>

                    <input
                      placeholder="Breed contains..."
                      value={filters.breed}
                      onChange={(e) => setFilters((p) => ({ ...p, breed: e.target.value }))}
                      style={fieldStyle}
                    />

                    <input
                      placeholder="Location contains..."
                      value={filters.location}
                      onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
                      style={fieldStyle}
                    />

                    <select
                      value={filters.radius_km}
                      onChange={(e) => setFilters((p) => ({ ...p, radius_km: e.target.value }))}
                      style={fieldStyle}
                    >
                      <option value="">Radius (any)</option>
                      <option value="1">1 km</option>
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="25">25 km</option>
                    </select>

                    <select
                      value={filters.sort}
                      onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
                      style={fieldStyle}
                    >
                      <option value="date">Sort: newest</option>
                      <option value="proximity">Sort: nearest</option>
                    </select>
                  </div>

                  {/* Row 2 */}
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 12,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button className="pf2-btn" type="button" onClick={useMyLocation}>
                        Use my location
                      </button>

                      <button
                        className="pf2-btn pf2-btn-primary"
                        type="button"
                        onClick={fetchLostPets}
                      >
                        Apply filters
                      </button>

                      <button
                        className="pf2-btn"
                        type="button"
                        onClick={() => {
                          setFilters({
                            species: "",
                            breed: "",
                            location: "",
                            radius_km: "",
                            sort: "date",
                            lat: "",
                            lng: "",
                          });
                          fetchLostPets();
                        }}
                      >
                        Reset
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {filters.lat && filters.lng ? (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#16a34a",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            padding: "6px 10px",
                            borderRadius: 999,
                          }}
                        >
                          Using coords ✓
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#6b7280",
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            padding: "6px 10px",
                            borderRadius: 999,
                          }}
                        >
                          No coords (radius/proximity off)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {loading && <div className="pfa-empty">Loading lost pets…</div>}

              {!loading && filtered.length === 0 && (
                <div className="pfa-empty">No matching lost reports found.</div>
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

                          <div className="pfa-sub">
                            {p.species ? `${p.species}` : "—"}
                            {p.breed ? ` • ${p.breed}` : ""}
                          </div>

                          <div className="pfa-sub">{p.description || "No description"}</div>
                          <div className="pfa-sub">
                            {p.last_seen_location ? `Last seen: ${p.last_seen_location}` : "—"}
                          </div>

                          {p.distance_km != null && (
                            <div className="pfa-sub2">Distance: {p.distance_km} km</div>
                          )}
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