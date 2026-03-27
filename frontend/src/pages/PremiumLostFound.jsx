import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./LostFoundPremium.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const lostIcon = new L.DivIcon({
  className: "custom-map-marker lost-marker",
  html: `<div class="marker-pin marker-lost">🐾</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -30],
});

const foundIcon = new L.DivIcon({
  className: "custom-map-marker found-marker",
  html: `<div class="marker-pin marker-found">🐾</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -30],
});

const sightingIcon = new L.DivIcon({
  className: "custom-map-marker sighting-marker",
  html: `<div class="marker-pin marker-sighting">👁</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -30],
});

function FlyToLocation({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.2 });
    }
  }, [center, map]);

  return null;
}

export default function PremiumLostFound() {
  const navigate = useNavigate();
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("Premium User");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [useRadius, setUseRadius] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedSpotlightIndex, setSelectedSpotlightIndex] = useState(0);

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState("");

  console.log("PremiumLostFound loaded");
  console.log("reports state:", reports);

  useEffect(() => {
    const savedName = localStorage.getItem("pawfection_user_name");
    if (savedName) setUserName(savedName);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        setReportsError("");

        const res = await fetch(`${apiBase}/premium/lost-found`, {
          headers: {
            Accept: "application/json",
          },
        });

        const data = await res.json();
        console.log("API response data:", data);

        if (!res.ok) {
          throw new Error(data.message || "Failed to load reports");
        }

        setReports(data.reports || []);
      } catch (error) {
        console.error("Failed to fetch premium lost & found reports:", error);
        setReportsError("Unable to load lost and found reports right now.");
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [apiBase]);

  useEffect(() => {
    const spotlightItems = reports.filter((item) => item.type === "lost");
    if (!spotlightItems.length) return;

    const interval = setInterval(() => {
      setSelectedSpotlightIndex((prev) =>
        prev === spotlightItems.length - 1 ? 0 : prev + 1
      );
    }, 4500);

    return () => clearInterval(interval);
  }, [reports]);

  const filteredReports = useMemo(() => {
    let items = [...reports];

    if (activeFilter !== "all") {
      items = items.filter((item) => item.type === activeFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          String(item.name || "").toLowerCase().includes(q) ||
          String(item.breed || "").toLowerCase().includes(q) ||
          String(item.area || "").toLowerCase().includes(q) ||
          String(item.species || "").toLowerCase().includes(q)
      );
    }

    return items;
  }, [reports, activeFilter, searchTerm]);

  const lostReports = useMemo(
    () => reports.filter((item) => item.type === "lost"),
    [reports]
  );

  const foundReports = useMemo(
    () => reports.filter((item) => item.type === "found"),
    [reports]
  );

  const priorityReports = useMemo(
    () => reports.filter((item) => item.priority && item.type === "lost"),
    [reports]
  );

  const spotlightPets = useMemo(() => {
    return reports
      .filter((item) => item.type === "lost")
      .sort((a, b) => Number(b.priority) - Number(a.priority));
  }, [reports]);

  const activeSpotlight =
    spotlightPets[selectedSpotlightIndex] || spotlightPets[0] || null;

  const mapCenter = useMemo(() => {
    if (userLocation) return userLocation;
    if (filteredReports.length) {
      return [filteredReports[0].lat, filteredReports[0].lng];
    }
    return [53.3498, -6.2603];
  }, [userLocation, filteredReports]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        setUseRadius(true);
      },
      () => {
        alert("Unable to get your location. Please allow location access.");
      }
    );
  };

  const getMarkerIcon = (type) => {
    if (type === "found") return foundIcon;
    if (type === "sighting") return sightingIcon;
    return lostIcon;
  };

  const handleViewReport = (reportId) => {
    navigate(`/lostfound/${reportId}`);
  };

  return (
    <div className="premium-lf-page">
      <header className="premium-lf-topbar">
        <div className="premium-lf-brand">
          <img
            src={PawfectionLogo}
            alt="Pawfection Logo"
            className="premium-lf-logo"
          />
          <div>
            <h1>Pawfection</h1>
            <p>Premium Lost &amp; Found</p>
          </div>
        </div>

        <nav className="premium-lf-nav">
          <Link to="/premium-dashboard">Premium Dashboard</Link>
          <Link to="/premium-mypets">My Pets</Link>
          <Link to="/premium/appointments">Appointments</Link>
          <Link to="/premium/reminders">Reminders</Link>
          <Link to="/premium/lostfound" className="active">
            Lost &amp; Found
          </Link>
          <Link to="/premium/community">Community</Link>
          <Link to="/premium/inventory">Inventory</Link>
          <Link to="/premium/profile">Profile</Link>
        </nav>

        <div className="premium-lf-userbar">
          <div className="premium-lf-date">Friday 27 March 2026</div>
          <div className="premium-lf-userchip">
            <div className="premium-lf-avatar">{userName?.charAt(0) || "P"}</div>
            <div>
              <strong>{userName}</strong>
              <span>Premium User</span>
            </div>
          </div>
        </div>
      </header>

      <section className="premium-lf-main-hero">
        <div className="premium-lf-hero-left">
          <div className="premium-lf-badge">PAWFECTION PREMIUM SAFETY</div>
          <h2>Lost &amp; Found TEST</h2>
          <p>
            Fast, localised lost-pet reporting with community sightings, smart
            filters, map tracking, and premium nearby alert support.
          </p>

          <div className="premium-lf-stat-row">
            <div className="premium-lf-stat-pill">
              📍 {lostReports.length} active lost reports
            </div>
            <div className="premium-lf-stat-pill">
              🚨 {priorityReports.length} priority alerts
            </div>
            <div className="premium-lf-stat-pill">
              👀 {foundReports.length} found reports
            </div>
            <div className="premium-lf-stat-pill">
              🔔 {useRadius ? "area alerts on" : "area alerts off"}
            </div>
          </div>

          <div className="premium-lf-action-row">
            <button
              className="premium-lf-primary-btn"
              onClick={() => navigate("/premium/lostfound/report")}
            >
              + Report Lost Pet
            </button>

            <button
              className="premium-lf-secondary-btn"
              onClick={handleUseLocation}
            >
              Use My Location
            </button>

            <button
              className={`premium-lf-secondary-btn ${
                activeFilter === "lost" ? "selected" : ""
              }`}
              onClick={() => setActiveFilter("lost")}
            >
              Priority Only
            </button>

            <button
              className="premium-lf-secondary-btn"
              onClick={() => window.location.reload()}
            >
              Refresh Feed
            </button>
          </div>
        </div>

        <div className="premium-lf-search-wrap">
          <input
            type="text"
            placeholder="Search lost and found reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="premium-lf-search"
          />
        </div>
      </section>

      {loadingReports && (
        <div className="premium-lf-info-box">
          Loading lost and found reports...
        </div>
      )}

      {reportsError && (
        <div className="premium-lf-info-box error">{reportsError}</div>
      )}

      <section className="premium-lf-feature-grid">
        <div className="premium-lf-map-card">
          <div className="premium-lf-card-head">
            <div>
              <h3>Lost Pet Map</h3>
              <p>Track nearby reports and explore activity by location.</p>
            </div>

            <div className="premium-lf-filter-chips">
              <button
                className={activeFilter === "all" ? "chip active" : "chip"}
                onClick={() => setActiveFilter("all")}
              >
                All
              </button>
              <button
                className={activeFilter === "lost" ? "chip active" : "chip"}
                onClick={() => setActiveFilter("lost")}
              >
                Lost
              </button>
              <button
                className={activeFilter === "found" ? "chip active" : "chip"}
                onClick={() => setActiveFilter("found")}
              >
                Found
              </button>
              <button
                className={activeFilter === "sighting" ? "chip active" : "chip"}
                onClick={() => setActiveFilter("sighting")}
              >
                Sightings
              </button>
            </div>
          </div>

          <div className="premium-lf-map-wrap">
            <MapContainer
              center={mapCenter}
              zoom={12}
              scrollWheelZoom
              className="premium-lf-map"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FlyToLocation center={mapCenter} />

              {userLocation && (
                <Circle
                  center={userLocation}
                  radius={2500}
                  pathOptions={{
                    color: "#7c6cff",
                    fillColor: "#7c6cff",
                    fillOpacity: 0.1,
                  }}
                />
              )}

              {filteredReports.map((report) => (
                <Marker
                  key={`${report.type}-${report.id}`}
                  position={[report.lat, report.lng]}
                  icon={getMarkerIcon(report.type)}
                >
                  <Popup>
                    <div className="premium-lf-popup">
                      <img src={report.image} alt={report.name} />
                      <div className="premium-lf-popup-text">
                        <strong>{report.name}</strong>
                        <span>
                          {report.species} • {report.breed}
                        </span>
                        <span>{report.area}</span>
                        <small>{report.status}</small>
                        <button onClick={() => handleViewReport(report.id)}>
                          View Report
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="premium-lf-spotlight-card">
          {activeSpotlight ? (
            <>
              <div className="premium-lf-spotlight-image-wrap">
                <img
                  src={activeSpotlight.image}
                  alt={activeSpotlight.name}
                  className="premium-lf-spotlight-image"
                />

                <div className="premium-lf-floating-note top-left">
                  Smart matching and local alert preferences are available.
                </div>

                <div className="premium-lf-floating-note top-right">
                  <span>UP NEXT</span>
                  {spotlightPets[(selectedSpotlightIndex + 1) % spotlightPets.length]
                    ?.name || "Next report"}{" "}
                  needs local sightings.
                </div>

                <div className="premium-lf-spotlight-overlay">
                  <div className="premium-lf-spotlight-tag">
                    {activeSpotlight.priority ? "PRIORITY REPORT" : "MISSING PET"}
                  </div>

                  <h3>{activeSpotlight.name}</h3>
                  <p>
                    {activeSpotlight.species} • {activeSpotlight.breed} •{" "}
                    {activeSpotlight.area}
                  </p>

                  <div className="premium-lf-spotlight-actions">
                    <button onClick={() => handleViewReport(activeSpotlight.id)}>
                      View Report
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/lostfound/${activeSpotlight.id}/sighting`)
                      }
                    >
                      Submit Sighting
                    </button>
                  </div>
                </div>
              </div>

              <div className="premium-lf-slider-dots">
                {spotlightPets.map((pet, index) => (
                  <button
                    key={pet.id}
                    className={index === selectedSpotlightIndex ? "dot active" : "dot"}
                    onClick={() => setSelectedSpotlightIndex(index)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="premium-lf-empty-state">
              No active lost pets to display.
            </div>
          )}
        </div>
      </section>

      <section className="premium-lf-lower-grid">
        <div className="premium-lf-panel">
          <div className="premium-lf-panel-head">
            <h3>Active Lost Reports</h3>
            <span>{lostReports.length} total</span>
          </div>

          <div className="premium-lf-report-list">
            {lostReports.map((report) => (
              <div key={report.id} className="premium-lf-report-card">
                <img src={report.image} alt={report.name} />
                <div className="premium-lf-report-info">
                  <h4>{report.name}</h4>
                  <p>
                    {report.species} • {report.breed}
                  </p>
                  <span>{report.area}</span>
                </div>
                <button onClick={() => handleViewReport(report.id)}>View</button>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-lf-panel">
          <div className="premium-lf-panel-head">
            <h3>Premium Alerts</h3>
            <span>Nearby support</span>
          </div>

          <div className="premium-lf-alert-stack">
            <div className="premium-lf-alert-card">
              <strong>Nearby Sighting Alert</strong>
              <p>A new sighting was reported within your local alert radius.</p>
            </div>

            <div className="premium-lf-alert-card">
              <strong>Smart Match Suggestion</strong>
              <p>
                A found report shares breed, size, and area similarities with an
                active lost pet.
              </p>
            </div>

            <div className="premium-lf-alert-card">
              <strong>Support Tip</strong>
              <p>
                Lost pets are more easily recognised when reports include clear
                recent photos.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}