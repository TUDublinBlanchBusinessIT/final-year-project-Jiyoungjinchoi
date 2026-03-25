import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumDashboard.css";
import "./LostFoundPremium.css";

export default function LostFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const accountType = String(
    localStorage.getItem("pawfection_account_type") || "basic"
  ).toLowerCase();
  const isPremiumUser = accountType === "premium";

  const [userName, setUserName] = useState("Guest");

  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);

  const [loadingLost, setLoadingLost] = useState(false);
  const [loadingFound, setLoadingFound] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [query, setQuery] = useState(
    () => localStorage.getItem("pawfection_lf_query") || ""
  );

  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem("pawfection_lf_filters");
      return saved
        ? JSON.parse(saved)
        : {
            species: "",
            breed: "",
            location: "",
            radius_km: "",
            sort: "date",
            lat: "",
            lng: "",
          };
    } catch {
      return {
        species: "",
        breed: "",
        location: "",
        radius_km: "",
        sort: "date",
        lat: "",
        lng: "",
      };
    }
  });

  const [priorityOnly, setPriorityOnly] = useState(
    () => localStorage.getItem("pawfection_lf_priority_only") === "1"
  );
  const [areaAlertsEnabled, setAreaAlertsEnabled] = useState(
    () => localStorage.getItem("pawfection_lf_area_alerts") === "1"
  );

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
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(117, 70, 46, 0.12)",
    padding: "0 14px",
    outline: "none",
    background: "rgba(255, 251, 248, 0.96)",
    color: "#6f402c",
    fontWeight: 700,
    boxShadow: "var(--pfd-shadow-sm)",
  };

  const textareaStyle = {
    width: "100%",
    borderRadius: 16,
    border: "1px solid rgba(117, 70, 46, 0.12)",
    padding: 12,
    resize: "vertical",
    boxSizing: "border-box",
    background: "rgba(255, 251, 248, 0.96)",
    color: "#6f402c",
    fontWeight: 700,
    boxShadow: "var(--pfd-shadow-sm)",
  };

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

  const saveCurrentSearch = () => {
    localStorage.setItem("pawfection_lf_query", query);
    localStorage.setItem("pawfection_lf_filters", JSON.stringify(filters));
    localStorage.setItem("pawfection_lf_priority_only", priorityOnly ? "1" : "0");
    setSuccess("Lost & Found search preferences saved on this device.");
  };

  const toggleAreaAlerts = () => {
    const next = !areaAlertsEnabled;
    setAreaAlertsEnabled(next);
    localStorage.setItem("pawfection_lf_area_alerts", next ? "1" : "0");
    setSuccess(
      next
        ? "Local Lost & Found alerts enabled on this device."
        : "Local Lost & Found alerts turned off."
    );
  };

  useEffect(() => {
    loadUserName();
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLost = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = [...(lostItems || [])];

    if (q) {
      list = list.filter((p) => {
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
    }

    if (priorityOnly) {
      list = list.filter((p) => p.is_priority);
    }

    return list;
  }, [lostItems, query, priorityOnly]);

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

  const priorityCount = useMemo(
    () => (lostItems || []).filter((item) => item.is_priority).length,
    [lostItems]
  );

  const featuredLost = useMemo(() => {
    return filteredLost.find((item) => item.is_priority) || filteredLost[0] || null;
  }, [filteredLost]);

  const featuredLostImage = featuredLost?.photo_url || null;

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
            <div className="pfd-brand-sub">
              {isPremiumUser ? "Premium Lost & Found" : "Lost & Found"}
            </div>
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
            <input
              placeholder="Search lost and found reports..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="pfd-main">
        <section className="pfd-hero plf-hero">
          <span className="pfd-doodle pfd-doodle-paw-1">🐾</span>
          <span className="pfd-doodle pfd-doodle-paw-2">🐾</span>
          <span className="pfd-doodle pfd-doodle-bone">📍</span>
          <span className="pfd-doodle pfd-doodle-cat">🔔</span>

          <div className="pfd-hero-copy">
            <div className="pfd-kicker">
              {isPremiumUser ? "Pawfection Premium Safety" : "Pawfection Lost & Found"}
            </div>
            <h1 className="pfd-hero-title">Lost &amp; Found</h1>
            <p className="pfd-hero-text">
              Fast, localised lost-pet reporting with community sightings, smart filters, and
              nearby search support. Premium users can boost visibility with Priority Alerts and
              local alert preferences.
            </p>

            <div className="pfd-hero-chips">
              <div className="pfd-chip">📍 {lostItems.length} active lost reports</div>
              <div className="pfd-chip">🚨 {priorityCount} priority alerts</div>
              <div className="pfd-chip">👀 {foundItems.length} found reports</div>
              <div className="pfd-chip">
                {areaAlertsEnabled ? "🔔 area alerts on" : "🔕 area alerts off"}
              </div>
            </div>

            <div className="pfd-hero-actions">
              <button
                className="pfd-btn pfd-btn-primary"
                onClick={() => {
                  if (!token) return navigate("/login");
                  navigate("/lostfound/report");
                }}
              >
                + Report Lost Pet
              </button>
              <button className="pfd-btn" onClick={useMyLocation}>
                Use My Location
              </button>
              <button
                className="pfd-btn"
                onClick={() => setPriorityOnly((prev) => !prev)}
              >
                {priorityOnly ? "Show All Reports" : "Priority Only"}
              </button>
              <button className="pfd-btn" onClick={reloadAll}>
                Refresh Feed
              </button>
            </div>
          </div>

          <div className="pfd-hero-visual">
            <div className="pfd-speech pfd-speech-left">
              <div className="pfd-speech-title">Status</div>
              <div className="pfd-speech-text">
                {isPremiumUser
                  ? "Priority alerts and local alert preferences are available."
                  : "Upgrade to premium for boosted lost-pet visibility."}
              </div>
            </div>

            <article className="pfd-hero-photo-card">
              {featuredLostImage ? (
                <img
                  src={featuredLostImage}
                  alt={featuredLost?.pet_name || "Lost pet"}
                />
              ) : (
                <div className="pfd-photo-empty">
                  <div className="pfd-photo-empty-icon">🐾</div>
                  <div className="pfd-photo-empty-title">Lost &amp; Found spotlight</div>
                  <div className="pfd-photo-empty-text">
                    Report a lost pet to feature it here and help nearby users recognise it quickly.
                  </div>
                </div>
              )}

              <div className="pfd-hero-photo-overlay">
                <div className="pfd-card-kicker pfd-card-kicker-light">
                  {featuredLost?.is_priority ? "Priority report" : "Featured report"}
                </div>
                <div className="pfd-hero-photo-name">
                  {featuredLost?.pet_name || "No active report"}
                </div>
                <div className="pfd-hero-photo-meta">
                  {featuredLost
                    ? `${featuredLost.species || "Pet"}${featuredLost.breed ? ` • ${featuredLost.breed}` : ""}${
                        featuredLost.last_seen_location
                          ? ` • ${featuredLost.last_seen_location}`
                          : ""
                      }`
                    : "Create or browse reports to see a featured lost pet here."}
                </div>
              </div>
            </article>

            <div className="pfd-speech pfd-speech-right">
              <div className="pfd-speech-title">Up next</div>
              <div className="pfd-speech-text">
                {featuredLost?.pet_name
                  ? `${featuredLost.pet_name} needs local sightings.`
                  : "No priority report selected."}
              </div>
            </div>
          </div>
        </section>

        {error && <div className="plf-alert">{error}</div>}
        {success && <div className="plf-success">{success}</div>}

        <section className="pfd-collage">
          <article className="pfd-card pfd-span-2 plf-card-soft">
            <div className="pfd-card-head">
              <div>
                <div className="pfd-card-kicker">Premium tools</div>
                <h2>Alerts & Search Controls</h2>
                <p>
                  Manage search filters, local area alerts, and premium report visibility from one
                  place.
                </p>
              </div>
              <button className="pfd-btn pfd-btn-small" onClick={saveCurrentSearch}>
                Save Search
              </button>
            </div>

            <div className="plf-filter-grid">
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

            <div className="plf-action-row">
              <button className="pfd-btn" onClick={useMyLocation}>
                Use My Location
              </button>
              <button className="pfd-btn pfd-btn-primary" onClick={fetchLostPets}>
                Apply Filters
              </button>
              <button
                className="pfd-btn"
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
                  setPriorityOnly(false);
                  setQuery("");
                  setSuccess("Filters reset.");
                  fetchLostPets();
                }}
              >
                Reset
              </button>
              <button className="pfd-btn" onClick={toggleAreaAlerts}>
                {areaAlertsEnabled ? "Disable Area Alerts" : "Enable Area Alerts"}
              </button>
            </div>

            <div className="pfd-mini-list" style={{ marginTop: 16 }}>
              <div className="pfd-mini-item">
                <div className="pfd-mini-item-icon">🚨</div>
                <div className="pfd-mini-item-body">
                  <div className="pfd-mini-item-title">Priority Alerts</div>
                  <div className="pfd-mini-item-text">
                    {isPremiumUser
                      ? "Priority lost reports are highlighted and boosted in your premium view."
                      : "Upgrade to premium to boost your lost report visibility."}
                  </div>
                </div>
              </div>

              <div className="pfd-mini-item">
                <div className="pfd-mini-item-icon">📍</div>
                <div className="pfd-mini-item-body">
                  <div className="pfd-mini-item-title">Nearby Search</div>
                  <div className="pfd-mini-item-text">
                    {filters.lat && filters.lng
                      ? "Coordinates detected. Radius and proximity filters are ready to use."
                      : "Use your location to search and rank reports by distance."}
                  </div>
                </div>
              </div>

              <div className="pfd-mini-item">
                <div className="pfd-mini-item-icon">🔔</div>
                <div className="pfd-mini-item-body">
                  <div className="pfd-mini-item-title">Local Area Alerts</div>
                  <div className="pfd-mini-item-text">
                    {areaAlertsEnabled
                      ? "Area alerts are enabled on this device."
                      : "Turn on area alerts to surface nearby Lost & Found activity."}
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="pfd-card pfd-card-care">
            <div className="pfd-card-kicker">Safety board</div>

            <div className="pfd-care-ring">
              <div className="pfd-care-ring-value">{priorityCount}</div>
              <div className="pfd-care-ring-text">priority alerts</div>
            </div>

            <div className="pfd-care-block">
              <div className="pfd-care-label">Featured lost pet</div>
              <div className="pfd-care-main">
                {featuredLost?.pet_name || "No active report"}
              </div>
              <div className="pfd-care-sub">
                {featuredLost?.last_seen_location || "Report a lost pet to create live alerts."}
              </div>
            </div>

            <div className="pfd-care-divider" />

            <div className="pfd-care-block">
              <div className="pfd-care-label">Found reports</div>
              <div className="pfd-care-main">{foundItems.length}</div>
              <div className="pfd-care-sub">
                Community submissions and comment activity.
              </div>
            </div>

            <div className="pfd-care-actions">
              <button
                className="pfd-btn pfd-btn-small"
                onClick={() => {
                  if (!token) return navigate("/login");
                  navigate("/lostfound/report");
                }}
              >
                Report Lost Pet
              </button>
              <button
                className="pfd-btn pfd-btn-small"
                onClick={() => setShowFoundForm((prev) => !prev)}
              >
                {showFoundForm ? "Close Found Form" : "Report Found Pet"}
              </button>
            </div>
          </article>

          <article className="pfd-card pfd-card-gallery pfd-span-2">
            <div className="pfd-card-head">
              <div>
                <div className="pfd-card-kicker">Community alerts</div>
                <h2>Lost Reports</h2>
                <p>
                  Search by species, breed, location, radius, and priority. Premium priority alerts
                  stay highlighted.
                </p>
              </div>
              <button className="pfd-btn pfd-btn-small" onClick={reloadAll}>
                Refresh
              </button>
            </div>

            {loadingLost && <div className="pfd-empty">Loading lost reports…</div>}

            {!loadingLost && filteredLost.length === 0 && (
              <div className="pfd-empty">No matching lost reports found.</div>
            )}

            {!loadingLost && filteredLost.length > 0 && (
              <div className="plf-report-list">
                {filteredLost.map((p) => {
                  const name = p.pet_name || "Unnamed Pet";
                  const status = p.status || "Active";

                  return (
                    <div
                      key={p.id}
                      className={`plf-report-row ${p.is_priority ? "plf-report-row-priority" : ""}`}
                    >
                      <div
                        className="plf-report-left"
                        onClick={() => navigate(`/lostfound/${p.id}`)}
                        title="View report details"
                      >
                        <div className="plf-report-head">
                          <div className="plf-report-name">{name}</div>
                          <div className="plf-report-badges">
                            <span className="plf-badge plf-badge-soft">{status}</span>
                            {p.is_priority && (
                              <span className="plf-badge plf-badge-priority">
                                Priority Alert
                              </span>
                            )}
                            {p.owner_account_type === "premium" && (
                              <span className="plf-badge plf-badge-dark">Premium</span>
                            )}
                          </div>
                        </div>

                        <div className="plf-report-meta">
                          {p.species ? `${p.species}` : "—"}
                          {p.breed ? ` • ${p.breed}` : ""}
                          {p.age ? ` • Age ${p.age}` : ""}
                          {p.distance_km != null ? ` • ${p.distance_km} km away` : ""}
                        </div>

                        <div className="plf-report-text">{p.description || "No description"}</div>
                        <div className="plf-report-meta">
                          {p.last_seen_location
                            ? `Last seen: ${p.last_seen_location}`
                            : "Last seen: —"}
                        </div>
                        <div className="plf-report-meta">
                          Reported by: {p.owner_name || "Unknown owner"}
                        </div>
                      </div>

                      <div className="plf-report-actions">
                        <button
                          className="pfd-btn pfd-btn-small"
                          onClick={() => navigate(`/lostfound/${p.id}/sighting`)}
                        >
                          Submit Sighting
                        </button>

                        {token && (
                          <button
                            className="pfd-btn pfd-btn-small pfd-btn-danger"
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
          </article>

          <article className="pfd-card pfd-card-arch">
            <div className="pfd-card-kicker">Priority spotlight</div>
            <div className="pfd-arch-frame">
              {featuredLostImage ? (
                <img src={featuredLostImage} alt={featuredLost?.pet_name || "Featured lost pet"} />
              ) : (
                <div className="pfd-arch-empty">📍</div>
              )}
            </div>
            <div className="pfd-arch-name">{featuredLost?.pet_name || "No Report"}</div>
            <div className="pfd-arch-meta">
              {featuredLost?.last_seen_location || "Priority alerts will be featured here."}
            </div>
          </article>

          <article className="pfd-card pfd-card-board pfd-span-3">
            <div className="pfd-card-head">
              <div>
                <div className="pfd-card-kicker">Community support</div>
                <h2>Found Reports</h2>
                <p>Report sightings, add comments, and help reunite pets with their owners.</p>
              </div>
              <button
                className="pfd-btn pfd-btn-small"
                onClick={() => {
                  if (!token) return navigate("/login");
                  setShowFoundForm((prev) => !prev);
                }}
              >
                {showFoundForm ? "Close Form" : "+ Report Found Pet"}
              </button>
            </div>

            {showFoundForm && (
              <div className="plf-found-form">
                <form onSubmit={submitFoundReport} style={{ display: "grid", gap: 12 }}>
                  <div className="plf-found-grid-3">
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
                    style={textareaStyle}
                  />

                  <div className="plf-found-grid-2">
                    <input
                      style={fieldStyle}
                      placeholder="Location found"
                      value={foundForm.location_found}
                      onChange={(e) =>
                        setFoundForm((p) => ({ ...p, location_found: e.target.value }))
                      }
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
                    style={textareaStyle}
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFoundForm((p) => ({ ...p, photo: e.target.files?.[0] || null }))
                    }
                  />

                  <button className="pfd-btn pfd-btn-primary" type="submit">
                    Submit Found Report
                  </button>
                </form>
              </div>
            )}

            {loadingFound && <div className="pfd-empty">Loading found reports…</div>}

            {!loadingFound && filteredFound.length === 0 && (
              <div className="pfd-empty">No found reports yet.</div>
            )}

            {!loadingFound && filteredFound.length > 0 && (
              <div className="plf-found-list">
                {filteredFound.map((item) => (
                  <div key={item.id} className="plf-found-row">
                    <div className="plf-found-main">
                      <div className="plf-report-head">
                        <div className="plf-report-name">Found Report #{item.id}</div>
                        <div className="plf-report-badges">
                          <span className="plf-badge plf-badge-soft">Found</span>
                        </div>
                      </div>

                      <div className="plf-report-meta">
                        {[item.species, item.breed, item.colour].filter(Boolean).join(" • ") ||
                          "Pet details not specified"}
                      </div>

                      <div className="plf-report-text">{item.description}</div>

                      <div className="plf-report-meta">
                        {item.location_found ? `Location: ${item.location_found}` : "Location: —"}
                      </div>

                      <div className="plf-report-meta">
                        Found at: {fmt(item.found_at)} • Reported by:{" "}
                        {item.reporter_name || "Community Member"}
                      </div>

                      {item.notes && <div className="plf-report-meta">Notes: {item.notes}</div>}

                      {(item.comments || []).length > 0 && (
                        <div className="plf-comments-block">
                          {(item.comments || []).map((comment) => (
                            <div key={comment.id} className="plf-comment">
                              <div className="plf-comment-name">{comment.commenter_name}</div>
                              <div className="plf-comment-text">{comment.comment}</div>
                              <div className="plf-comment-date">{fmt(comment.created_at)}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(item.comments || []).length === 0 && (
                        <div className="pfd-empty" style={{ paddingTop: 0 }}>
                          No comments yet.
                        </div>
                      )}

                      <div className="plf-comment-form">
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
                          style={fieldStyle}
                        />
                        <button
                          className="pfd-btn pfd-btn-small"
                          onClick={() => submitComment(item.id)}
                          disabled={!token}
                          type="button"
                        >
                          Post
                        </button>
                      </div>
                    </div>

                    {item.photo_url && (
                      <div className="plf-found-photo">
                        <img src={item.photo_url} alt="Found report" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="pfd-banner pfd-span-3">
            <span className="pfd-banner-paw pfd-banner-paw-1">🐾</span>
            <span className="pfd-banner-paw pfd-banner-paw-2">🐾</span>
            <span className="pfd-banner-bone">📍</span>

            <div className="pfd-banner-copy">
              <div className="pfd-card-kicker pfd-card-kicker-light">Safety network</div>
              <h2>
                {isPremiumUser
                  ? "Priority alerts, saved searches, and nearby reporting in one premium safety hub."
                  : "Lost & Found helps nearby users respond quickly when a pet goes missing."}
              </h2>
              <div className="pfd-banner-divider">
                fast alerts, nearby search, community support 🐾
              </div>
            </div>

            <div className="pfd-banner-actions">
              <button
                className="pfd-quickaction"
                onClick={() => {
                  if (!token) return navigate("/login");
                  navigate("/lostfound/report");
                }}
              >
                <span className="pfd-quickicon">📍</span>
                <span>Report Lost Pet</span>
              </button>

              <button className="pfd-quickaction" onClick={useMyLocation}>
                <span className="pfd-quickicon">🧭</span>
                <span>Use My Location</span>
              </button>

              <button className="pfd-quickaction" onClick={saveCurrentSearch}>
                <span className="pfd-quickicon">💾</span>
                <span>Save Search</span>
              </button>

              <button className="pfd-quickaction" onClick={toggleAreaAlerts}>
                <span className="pfd-quickicon">🔔</span>
                <span>{areaAlertsEnabled ? "Area Alerts On" : "Enable Alerts"}</span>
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}