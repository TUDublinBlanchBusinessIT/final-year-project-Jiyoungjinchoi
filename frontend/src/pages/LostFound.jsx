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

  const [userName, setUserName] = useState("Guest");

  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);

  const [loadingLost, setLoadingLost] = useState(false);
  const [loadingFound, setLoadingFound] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [query, setQuery] = useState("");

  const [filters, setFilters] = useState({
    species: "",
    breed: "",
    location: "",
    radius_km: "",
    sort: "date",
    lat: "",
    lng: "",
  });

  const [showFoundForm, setShowFoundForm] = useState(false);
  const [foundForm, setFoundForm] = useState({
    species: "",
    breed: "",
    colour: "",
    description: "",
    location_found: "",
    found_at: "",
    notes: "",
    photo: null,
  });

  const [commentText, setCommentText] = useState({});

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
    setLoadingLost(true);

    try {
      const qs = buildQuery();
      const url = qs ? `${apiBase}/lost-pets?${qs}` : `${apiBase}/lost-pets`;

      const res = await fetch(url, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to load lost reports.");
        setLostItems([]);
      } else {
        const list = Array.isArray(data) ? data : data?.data || [];
        setLostItems(Array.isArray(list) ? list : []);
      }
    } catch {
      setError("Server error while loading lost reports.");
      setLostItems([]);
    } finally {
      setLoadingLost(false);
    }
  };

  const fetchFoundReports = async () => {
    setLoadingFound(true);

    try {
      const res = await fetch(`${apiBase}/found-reports`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to load found reports.");
        setFoundItems([]);
      } else {
        const list = Array.isArray(data) ? data : data?.data || [];
        setFoundItems(Array.isArray(list) ? list : []);
      }
    } catch {
      setError("Server error while loading found reports.");
      setFoundItems([]);
    } finally {
      setLoadingFound(false);
    }
  };

  const reloadAll = async () => {
    setError("");
    setSuccess("");
    await Promise.all([fetchLostPets(), fetchFoundReports()]);
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
        setSuccess("Location detected. You can now use radius and sort by proximity.");
      },
      () => setError("Location permission denied.")
    );
  };

  const markResolved = async (id) => {
    if (!token) {
      navigate("/login");
      return;
    }

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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to mark as resolved.");
        return;
      }

      setLostItems((prev) => prev.filter((x) => x.id !== id));
      setSuccess(data?.message || "Marked as resolved.");
    } catch {
      setError("Failed to update report.");
    } finally {
      setBusyId(null);
    }
  };

  const submitFoundReport = async (e) => {
    e.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!foundForm.description.trim() || !foundForm.location_found.trim()) {
      setError("Found report description and location are required.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const form = new FormData();
      form.append("species", foundForm.species);
      form.append("breed", foundForm.breed);
      form.append("colour", foundForm.colour);
      form.append("description", foundForm.description);
      form.append("location_found", foundForm.location_found);
      if (foundForm.found_at) form.append("found_at", foundForm.found_at);
      if (foundForm.notes) form.append("notes", foundForm.notes);
      if (foundForm.photo) form.append("photo", foundForm.photo);

      const res = await fetch(`${apiBase}/found-reports`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const firstError =
          data?.message ||
          (data?.errors && Object.values(data.errors)?.[0]?.[0]) ||
          "Failed to submit found report.";
        throw new Error(firstError);
      }

      setSuccess(data?.message || "Found report submitted successfully.");
      setFoundForm({
        species: "",
        breed: "",
        colour: "",
        description: "",
        location_found: "",
        found_at: "",
        notes: "",
        photo: null,
      });
      setShowFoundForm(false);
      fetchFoundReports();
    } catch (err) {
      setError(err.message || "Failed to submit found report.");
    }
  };

  const submitComment = async (reportId) => {
    if (!token) {
      navigate("/login");
      return;
    }

    const text = (commentText[reportId] || "").trim();
    if (!text) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/found-reports/${reportId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: text }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to add comment.");
      }

      setCommentText((prev) => ({ ...prev, [reportId]: "" }));
      setSuccess(data?.message || "Comment added successfully.");
      fetchFoundReports();
    } catch (err) {
      setError(err.message || "Failed to add comment.");
    }
  };

  useEffect(() => {
    loadUserName();
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLost = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lostItems;

    return (lostItems || []).filter((p) => {
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
  }, [lostItems, query]);

  const filteredFound = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foundItems;

    return (foundItems || []).filter((item) => {
      const species = (item.species || "").toLowerCase();
      const breed = (item.breed || "").toLowerCase();
      const colour = (item.colour || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const loc = (item.location_found || "").toLowerCase();

      return (
        species.includes(q) ||
        breed.includes(q) ||
        colour.includes(q) ||
        desc.includes(q) ||
        loc.includes(q)
      );
    });
  }, [foundItems, query]);

  const fmt = (value) => {
    if (!value) return "—";
    const d = new Date(value);
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
            <input
              placeholder="Search lost and found reports..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
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
          <div className="pfa-head">
            <div>
              <h1 className="pfa-title">Lost &amp; Found</h1>
              <p className="pfa-subtitle">
                Community reports for lost pets and found pets in one place.
              </p>
            </div>
          </div>

          {error && <div className="pfa-alert">{error}</div>}
          {success && <div className="pfa-success">{success}</div>}

          <section className="pfa-grid-one">
            <div className="pfa-card">
              <div className="pfa-cardtop">
                <div>
                  <div className="pfa-cardtitle">Lost Reports</div>
                  <div className="pfa-mini">
                    Registered users can choose one of their pets and report it as lost.
                  </div>
                </div>

                <div className="pfa-actions-right">
                  <button
                    className="pf2-btn pf2-btn-primary"
                    onClick={() => {
                      if (!token) return navigate("/login");
                      navigate("/lostfound/report");
                    }}
                  >
                    + Report Lost Pet
                  </button>

                  <button className="pf2-btn" onClick={reloadAll} disabled={loadingLost || loadingFound}>
                    Refresh
                  </button>
                </div>
              </div>

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
                  </div>

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
                          No coords
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {loadingLost && <div className="pfa-empty">Loading lost reports…</div>}

              {!loadingLost && filteredLost.length === 0 && (
                <div className="pfa-empty">No matching lost reports found.</div>
              )}

              {!loadingLost && filteredLost.length > 0 && (
                <div className="pfa-list">
                  {filteredLost.map((p) => {
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
                            {p.age ? ` • Age ${p.age}` : ""}
                          </div>

                          <div className="pfa-sub">{p.description || "No description"}</div>
                          <div className="pfa-sub">
                            {p.last_seen_location ? `Last seen: ${p.last_seen_location}` : "—"}
                          </div>
                          <div className="pfa-sub2">
                            Reported by: {p.owner_name || "Unknown owner"}
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

                          {token && (
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

          <section className="pfa-grid-one" style={{ marginTop: 22 }}>
            <div className="pfa-card">
              <div className="pfa-cardtop">
                <div>
                  <div className="pfa-cardtitle">Found Reports</div>
                  <div className="pfa-mini">
                    Community members can report pets they have seen and help each other through comments.
                  </div>
                </div>

                <div className="pfa-actions-right">
                  <button
                    className="pf2-btn pf2-btn-primary"
                    onClick={() => {
                      if (!token) return navigate("/login");
                      setShowFoundForm((prev) => !prev);
                    }}
                  >
                    {showFoundForm ? "Close Form" : "+ Report Found Pet"}
                  </button>
                </div>
              </div>

              {showFoundForm && (
                <div style={{ padding: "0 18px 18px" }}>
                  <form
                    onSubmit={submitFoundReport}
                    style={{
                      border: "1px solid #eef0f4",
                      borderRadius: 16,
                      padding: 16,
                      background: "#fff",
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <input
                        style={fieldStyle}
                        placeholder="Species"
                        value={foundForm.species}
                        onChange={(e) => setFoundForm((p) => ({ ...p, species: e.target.value }))}
                      />
                      <input
                        style={fieldStyle}
                        placeholder="Breed"
                        value={foundForm.breed}
                        onChange={(e) => setFoundForm((p) => ({ ...p, breed: e.target.value }))}
                      />
                      <input
                        style={fieldStyle}
                        placeholder="Colour"
                        value={foundForm.colour}
                        onChange={(e) => setFoundForm((p) => ({ ...p, colour: e.target.value }))}
                      />
                    </div>

                    <textarea
                      placeholder="Description"
                      value={foundForm.description}
                      onChange={(e) => setFoundForm((p) => ({ ...p, description: e.target.value }))}
                      rows={4}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        padding: 12,
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <input
                        style={fieldStyle}
                        placeholder="Location found"
                        value={foundForm.location_found}
                        onChange={(e) => setFoundForm((p) => ({ ...p, location_found: e.target.value }))}
                      />
                      <input
                        style={fieldStyle}
                        type="datetime-local"
                        value={foundForm.found_at}
                        onChange={(e) => setFoundForm((p) => ({ ...p, found_at: e.target.value }))}
                      />
                    </div>

                    <textarea
                      placeholder="Additional notes (optional)"
                      value={foundForm.notes}
                      onChange={(e) => setFoundForm((p) => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        padding: 12,
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFoundForm((p) => ({ ...p, photo: e.target.files?.[0] || null }))}
                    />

                    <button className="pf2-btn pf2-btn-primary" type="submit">
                      Submit Found Report
                    </button>
                  </form>
                </div>
              )}

              {loadingFound && <div className="pfa-empty">Loading found reports…</div>}

              {!loadingFound && filteredFound.length === 0 && (
                <div className="pfa-empty">No found reports yet.</div>
              )}

              {!loadingFound && filteredFound.length > 0 && (
                <div className="pfa-list">
                  {filteredFound.map((item) => (
                    <div key={item.id} className="pfa-row" style={{ alignItems: "flex-start" }}>
                      <div className="pfa-left" style={{ width: "100%" }}>
                        <div className="pfa-name">
                          Found Report #{item.id} • <span className="pfa-chip">Found</span>
                        </div>

                        <div className="pfa-sub">
                          {[item.species, item.breed, item.colour].filter(Boolean).join(" • ") || "Pet details not specified"}
                        </div>

                        <div className="pfa-sub">{item.description}</div>
                        <div className="pfa-sub">
                          {item.location_found ? `Location: ${item.location_found}` : "—"}
                        </div>
                        <div className="pfa-sub2">
                          Found at: {fmt(item.found_at)} • Reported by: {item.reporter_name || "Community Member"}
                        </div>

                        {item.notes && <div className="pfa-sub2">Notes: {item.notes}</div>}

                        {item.photo_url && (
                          <div style={{ marginTop: 12 }}>
                            <img
                              src={item.photo_url}
                              alt="Found report"
                              style={{
                                width: 140,
                                height: 140,
                                objectFit: "cover",
                                borderRadius: 14,
                                border: "1px solid #e5e7eb",
                              }}
                            />
                          </div>
                        )}

                        <div
                          style={{
                            marginTop: 14,
                            borderTop: "1px solid #eef0f4",
                            paddingTop: 14,
                          }}
                        >
                          <div style={{ fontWeight: 800, marginBottom: 8 }}>Comments</div>

                          {(item.comments || []).length === 0 ? (
                            <div className="pfa-sub2">No comments yet.</div>
                          ) : (
                            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                              {item.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  style={{
                                    border: "1px solid #eef0f4",
                                    borderRadius: 12,
                                    padding: 10,
                                    background: "#fafafa",
                                  }}
                                >
                                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                                    {comment.commenter_name}
                                  </div>
                                  <div style={{ marginTop: 4 }}>{comment.comment}</div>
                                  <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                                    {fmt(comment.created_at)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <input
                              value={commentText[item.id] || ""}
                              onChange={(e) =>
                                setCommentText((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder={token ? "Write a comment..." : "Log in to comment"}
                              disabled={!token}
                              style={{
                                flex: 1,
                                height: 42,
                                borderRadius: 12,
                                border: "1px solid #e5e7eb",
                                padding: "0 12px",
                                outline: "none",
                                background: "#fff",
                              }}
                            />
                            <button
                              className="pf2-btn pf2-btn-small"
                              onClick={() => submitComment(item.id)}
                              disabled={!token}
                              type="button"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}