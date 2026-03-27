import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./LostFoundBasic.css";

export default function LostFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loadingLost, setLoadingLost] = useState(false);
  const [loadingFound, setLoadingFound] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [breedFilter, setBreedFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [activeTab, setActiveTab] = useState("lost");

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

  const getUserCoords = () => {
    try {
      const raw = localStorage.getItem("pawfection_user");
      if (!raw) return { lat: "", lng: "" };

      const user = JSON.parse(raw);
      return {
        lat: user?.latitude || user?.lat || "",
        lng: user?.longitude || user?.lng || "",
      };
    } catch {
      return { lat: "", lng: "" };
    }
  };

  const fetchLostPets = async () => {
    if (!token) return navigate("/login");

    setLoadingLost(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (speciesFilter.trim()) params.append("species", speciesFilter.trim());
      if (breedFilter.trim()) params.append("breed", breedFilter.trim());
      if (locationFilter.trim()) params.append("location", locationFilter.trim());
      if (sortBy) params.append("sort", sortBy);

      const { lat, lng } = getUserCoords();
      if (radiusKm.trim() && lat && lng) {
        params.append("radius_km", radiusKm.trim());
        params.append("lat", lat);
        params.append("lng", lng);
      }

      const url = params.toString()
        ? `${apiBase}/lost-pets?${params.toString()}`
        : `${apiBase}/lost-pets`;

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
      setError("Server error. Is your backend running?");
      setLostItems([]);
    } finally {
      setLoadingLost(false);
    }
  };

  const fetchFoundReports = async () => {
    if (!token) return navigate("/login");

    setLoadingFound(true);

    try {
      const res = await fetch(`${apiBase}/found-reports`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFoundItems([]);
      } else {
        const list = Array.isArray(data) ? data : data?.data || [];
        setFoundItems(Array.isArray(list) ? list : []);
      }
    } catch {
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

  const clearFilters = () => {
    setSearchQuery("");
    setSpeciesFilter("");
    setBreedFilter("");
    setLocationFilter("");
    setRadiusKm("");
    setSortBy("date");
    setError("");
    setSuccess("");
    setActiveTab("lost");
  };

  const markResolved = async (reportId) => {
    if (!token) return navigate("/login");

    const ok = window.confirm("Mark this lost pet report as resolved?");
    if (!ok) return;

    setBusyId(reportId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/lost-pets/${reportId}/resolve`, {
        method: "PATCH",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to mark report as resolved.");
        return;
      }

      setLostItems((prev) => prev.filter((item) => item.id !== reportId));
      setSuccess(data?.message || "Report marked as resolved.");
    } catch {
      setError("Failed to update report. Is the backend running?");
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
    fetchFoundReports();
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchLostPets();
  }, [speciesFilter, breedFilter, locationFilter, radiusKm, sortBy]);

  const filteredLost = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return lostItems;

    return (lostItems || []).filter((item) =>
      [
        item.pet_name,
        item.description,
        item.last_seen_location,
        item.breed,
        item.species,
        item.owner_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [lostItems, searchQuery]);

  const filteredFound = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return foundItems;

    return (foundItems || []).filter((item) =>
      [
        item.species,
        item.breed,
        item.colour,
        item.description,
        item.location_found,
        item.reporter_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [foundItems, searchQuery]);

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
            <input
              placeholder="Search lost and found reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
          <div className="lf2-head">
            <div>
              <h1 className="lf2-title">Lost &amp; Found</h1>
              <p className="lf2-subtitle">
                Report lost pets, submit sightings, search reports, and help reunite pets with their owners.
              </p>
            </div>
          </div>

          {error && <div className="lf2-alert">{error}</div>}
          {success && <div className="lf2-success">{success}</div>}

          <section className="lf2-summary-grid">
            <button
              type="button"
              className={`lf2-stat-card lf2-stat-blue lf2-tab-card ${activeTab === "lost" ? "active" : ""}`}
              onClick={() => setActiveTab("lost")}
            >
              <div className="lf2-stat-label">Lost reports</div>
              <div className="lf2-stat-number">{lostItems.length}</div>
              <div className="lf2-stat-sub">Active</div>
            </button>

            <button
              type="button"
              className={`lf2-stat-card lf2-stat-yellow lf2-tab-card ${activeTab === "search" ? "active" : ""}`}
              onClick={() => setActiveTab("search")}
            >
              <div className="lf2-stat-label">Search results</div>
              <div className="lf2-stat-number">{filteredLost.length}</div>
              <div className="lf2-stat-sub">Matching lost pets</div>
            </button>

            <button
              type="button"
              className={`lf2-stat-card lf2-stat-pink lf2-tab-card ${activeTab === "found" ? "active" : ""}`}
              onClick={() => setActiveTab("found")}
            >
              <div className="lf2-stat-label">Found reports</div>
              <div className="lf2-stat-number">{foundItems.length}</div>
              <div className="lf2-stat-sub">Community</div>
            </button>
          </section>

          <section className="lf2-grid-top">
            <div className="lf2-card">
              <div className="lf2-cardtop">
                <div>
                  <div className="lf2-cardtitle">Lost &amp; Found actions</div>
                  <div className="lf2-mini">
                    Create reports, refresh the feed, and search by species, breed, location, and radius.
                  </div>
                </div>

                <div className="lf2-actions-right">
                  <button
                    className="pf2-btn pf2-btn-primary"
                    onClick={() => navigate("/lostfound/report")}
                  >
                    + Report Lost Pet
                  </button>

                  <button className="pf2-btn" onClick={reloadAll} disabled={loadingLost || loadingFound}>
                    {loadingLost || loadingFound ? "Refreshing..." : "Refresh"}
                  </button>

                  <button className="pf2-btn" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </div>
              </div>

              <div className="lf2-filters">
                <div className="lf2-filter-field">
                  <label>Species</label>
                  <input
                    value={speciesFilter}
                    onChange={(e) => setSpeciesFilter(e.target.value)}
                    placeholder="e.g. Dog"
                  />
                </div>

                <div className="lf2-filter-field">
                  <label>Breed</label>
                  <input
                    value={breedFilter}
                    onChange={(e) => setBreedFilter(e.target.value)}
                    placeholder="e.g. Husky"
                  />
                </div>

                <div className="lf2-filter-field">
                  <label>Location</label>
                  <input
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="e.g. Dublin 15"
                  />
                </div>

                <div className="lf2-filter-field">
                  <label>Radius (km)</label>
                  <input
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </div>

                <div className="lf2-filter-field">
                  <label>Sort by</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="date">Newest</option>
                    <option value="proximity">Proximity</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="lf2-card">
              <div className="lf2-cardtitle">Search help</div>
              <div className="lf2-mini">Use the filters to narrow down lost pet reports.</div>

              <div className="lf2-guide-list">
                <div className="lf2-guide-item">
                  <div className="lf2-guide-label">Species</div>
                  <div className="lf2-guide-text">Search by pet type like dog or cat.</div>
                </div>

                <div className="lf2-guide-item">
                  <div className="lf2-guide-label">Breed</div>
                  <div className="lf2-guide-text">Enter a breed name to narrow your results.</div>
                </div>

                <div className="lf2-guide-item">
                  <div className="lf2-guide-label">Radius</div>
                  <div className="lf2-guide-text">
                    Radius works best when your saved profile includes coordinates.
                  </div>
                </div>

                <div className="lf2-guide-item">
                  <div className="lf2-guide-label">Search</div>
                  <div className="lf2-guide-text">
                    The top search box filters both lost and found results instantly.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="lf2-grid-bottom">
            {(activeTab === "lost" || activeTab === "search") && (
              <div className="lf2-card lf2-span-full">
                <div className="lf2-cardtop">
                  <div>
                    <div className="lf2-cardtitle">
                      {activeTab === "search" ? "Search Results" : "Lost Reports"}
                    </div>
                    <div className="lf2-mini">Submit sightings or mark resolved when reunited.</div>
                  </div>
                  <div className="lf2-count">{filteredLost.length} results</div>
                </div>

                {loadingLost && <div className="lf2-empty">Loading lost reports...</div>}

                {!loadingLost && filteredLost.length === 0 && (
                  <div className="lf2-empty">No matching lost reports found.</div>
                )}

                {!loadingLost && filteredLost.length > 0 && (
                  <div className="lf2-list">
                    {filteredLost.map((item) => (
                      <div key={item.id} className="lf2-row">
                        <div className="lf2-left" onClick={() => navigate(`/lostfound/${item.id}`)}>
                          <div className="lf2-name">{item.pet_name || "Unnamed Pet"}</div>

                          <div className="lf2-badgerow">
                            <span className="lf2-chip">{item.status || "Active"}</span>
                          </div>

                          <div className="lf2-sub">
                            {[item.species, item.breed].filter(Boolean).join(" • ") || "No extra details"}
                          </div>

                          <div className="lf2-sub">Last seen: {item.last_seen_location || "—"}</div>
                          <div className="lf2-sub">Reported by: {item.owner_name || "Unknown owner"}</div>

                          {item.distance_km !== null && item.distance_km !== undefined && (
                            <div className="lf2-sub">Distance: {item.distance_km} km</div>
                          )}

                          <div className="lf2-sub2">
                            {item.description || "No description provided."}
                          </div>
                        </div>

                        <div className="lf2-right">
                          <button
                            className="pf2-btn pf2-btn-small"
                            onClick={() => navigate(`/lostfound/${item.id}/sighting`)}
                          >
                            Submit Sighting
                          </button>

                          <button
                            className="pf2-btn pf2-btn-small lf2-deletebtn"
                            onClick={() => markResolved(item.id)}
                            disabled={busyId === item.id}
                          >
                            {busyId === item.id ? "..." : "Mark Resolved"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "found" && (
              <div className="lf2-card lf2-span-full">
                <div className="lf2-cardtop">
                  <div>
                    <div className="lf2-cardtitle">Found Reports</div>
                    <div className="lf2-mini">Community found or sighting updates.</div>
                  </div>
                  <div className="lf2-count">{filteredFound.length} results</div>
                </div>

                {loadingFound && <div className="lf2-empty">Loading found reports...</div>}

                {!loadingFound && filteredFound.length === 0 && (
                  <div className="lf2-empty">No found reports yet.</div>
                )}

                {!loadingFound && filteredFound.length > 0 && (
                  <div className="lf2-list">
                    {filteredFound.map((item) => (
                      <div key={item.id} className="lf2-row">
                        <div className="lf2-left">
                          <div className="lf2-name">Found Report #{item.id}</div>

                          <div className="lf2-sub">
                            {[item.species, item.breed, item.colour].filter(Boolean).join(" • ") ||
                              "Pet details not specified"}
                          </div>

                          <div className="lf2-sub">Location: {item.location_found || "—"}</div>
                          <div className="lf2-sub">
                            Reported by: {item.reporter_name || "Community Member"}
                          </div>

                          <div className="lf2-sub2">
                            {item.description || "No description provided."}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}