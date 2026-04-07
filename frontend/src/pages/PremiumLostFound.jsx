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

function FitMapToReports({ reports, userLocation }) {
  const map = useMap();

  useEffect(() => {
    const points = reports
      .filter(
        (report) =>
          report.lat !== null &&
          report.lat !== undefined &&
          report.lng !== null &&
          report.lng !== undefined
      )
      .map((report) => [Number(report.lat), Number(report.lng)]);

    if (userLocation) {
      points.push([Number(userLocation[0]), Number(userLocation[1])]);
    }

    if (points.length === 0) {
      map.setView([53.3498, -6.2603], 11);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, reports, userLocation]);

  return null;
}

export default function PremiumLostFound() {
  const navigate = useNavigate();
  const apiBase = "http://127.0.0.1:8000/api";
  const storageBase = "http://127.0.0.1:8000/storage";

  const [userName, setUserName] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [useRadius, setUseRadius] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedSpotlightIndex, setSelectedSpotlightIndex] = useState(0);
  const [selectedAlertIndex, setSelectedAlertIndex] = useState(0);
  const [selectedSupportIndex, setSelectedSupportIndex] = useState(0);

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState("");

  const [selectedMapReport, setSelectedMapReport] = useState(null);
  const [showMapReportModal, setShowMapReportModal] = useState(false);

  const fallbackImages = [
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80",
  ];

  const supportQuotes = [
    {
      title: "Take a breath",
      text: "Many lost pets are found with time, care, and community support. You are already helping by staying active and alert.",
    },
    {
      title: "Stay hopeful",
      text: "A single sighting, shared photo, or nearby check can make all the difference. Small steps really do matter.",
    },
    {
      title: "You are not alone",
      text: "This is a stressful moment, but support is around you. Keep checking updates and take things one step at a time.",
    },
    {
      title: "Keep going",
      text: "Many reunions happen because owners stayed consistent, checked local areas, and never gave up too early.",
    },
  ];

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("pawfection_user_name");

      if (savedName && savedName.trim()) {
        setUserName(savedName.trim());
      } else {
        const savedUser = localStorage.getItem("pawfection_user");

        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          const fullName =
            parsedUser?.name ||
            parsedUser?.full_name ||
            parsedUser?.username ||
            parsedUser?.user_name ||
            "User";

          setUserName(fullName);
        }
      }

      localStorage.setItem("pawfection_account_type", "premium");
    } catch (error) {
      console.error("Failed to load user name:", error);
      setUserName("User");
      localStorage.setItem("pawfection_account_type", "premium");
    }
  }, []);

  const getImageUrl = (pathOrUrl) => {
    if (!pathOrUrl) return null;

    if (
      String(pathOrUrl).startsWith("http://") ||
      String(pathOrUrl).startsWith("https://")
    ) {
      return pathOrUrl;
    }

    return `${storageBase}/${String(pathOrUrl).replace(/^\/+/, "")}`;
  };

  const getFallbackImageForReport = (report) => {
    const seedString = `${report.type || ""}-${report.id || ""}-${report.pet_name || report.name || ""}-${report.breed || ""}`;
    let hash = 0;

    for (let i = 0; i < seedString.length; i += 1) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % fallbackImages.length;
    return fallbackImages[index];
  };

  const getReportImage = (report) => {
    const realImages = [
      report.display_photo_url,
      report.lost_photo_url,
      report.photo_url,
      getImageUrl(report.lost_photo_path),
      getImageUrl(report.photo_path),
    ].filter(Boolean);

    return realImages[0] || getFallbackImageForReport(report);
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        setReportsError("");

        const token = localStorage.getItem("pawfection_token");

        if (!token) {
          setReportsError("You are not logged in.");
          setLoadingReports(false);
          return;
        }

        const res = await fetch(`${apiBase}/premium/lost-found`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load reports");
        }

        const incomingReports = Array.isArray(data.reports)
          ? data.reports
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];

        const normalisedReports = incomingReports.map((report) => ({
          ...report,
          resolvedImage: getReportImage(report),
        }));

        setReports(normalisedReports);
      } catch (error) {
        console.error("Failed to fetch premium lost & found reports:", error);
        setReportsError(error.message || "Unable to load lost and found reports right now.");
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedSupportIndex((prev) =>
        prev === supportQuotes.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [supportQuotes.length]);

  const filteredReports = useMemo(() => {
    let items = [...reports];

    if (activeFilter === "priority") {
      items = items.filter((item) => item.type === "lost" && item.priority);
    } else if (activeFilter !== "all") {
      items = items.filter((item) => item.type === activeFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();

      items = items.filter(
        (item) =>
          String(item.name || item.pet_name || "").toLowerCase().includes(q) ||
          String(item.breed || "").toLowerCase().includes(q) ||
          String(
            item.area ||
              item.last_seen_location ||
              item.sighting_location ||
              ""
          )
            .toLowerCase()
            .includes(q) ||
          String(item.species || "").toLowerCase().includes(q)
      );
    }

    if (useRadius && userLocation) {
      const [userLat, userLng] = userLocation;

      items = items.filter((item) => {
        if (
          item.lat === null ||
          item.lat === undefined ||
          item.lng === null ||
          item.lng === undefined
        ) {
          return false;
        }

        const latDiff = Number(item.lat) - Number(userLat);
        const lngDiff = Number(item.lng) - Number(userLng);
        const distanceApprox = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        return distanceApprox <= 0.03;
      });
    }

    return items;
  }, [reports, activeFilter, searchTerm, useRadius, userLocation]);

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

  const visibleListReports = useMemo(() => {
    if (activeFilter === "lost") {
      return filteredReports.filter((item) => item.type === "lost");
    }

    if (activeFilter === "found") {
      return filteredReports.filter((item) => item.type === "found");
    }

    if (activeFilter === "sighting") {
      return filteredReports.filter((item) => item.type === "sighting");
    }

    if (activeFilter === "priority") {
      return filteredReports.filter(
        (item) => item.type === "lost" && item.priority
      );
    }

    return filteredReports;
  }, [filteredReports, activeFilter]);

  const visibleLostReports = useMemo(
    () => visibleListReports.filter((item) => item.type === "lost"),
    [visibleListReports]
  );

  const spotlightPets = useMemo(() => {
    const source = visibleLostReports.length > 0 ? visibleLostReports : lostReports;
    return [...source].sort((a, b) => Number(b.priority) - Number(a.priority));
  }, [visibleLostReports, lostReports]);

  const activeSpotlight =
    spotlightPets[selectedSpotlightIndex] || spotlightPets[0] || null;

  const premiumAlertPets = useMemo(() => {
    return [...lostReports].sort((a, b) => Number(b.priority) - Number(a.priority));
  }, [lostReports]);

  const activeAlertPet =
    premiumAlertPets[selectedAlertIndex] || premiumAlertPets[0] || null;

  const activeSupportQuote =
    supportQuotes[selectedSupportIndex] || supportQuotes[0];

  useEffect(() => {
    if (!spotlightPets.length) {
      setSelectedSpotlightIndex(0);
      return;
    }

    if (selectedSpotlightIndex > spotlightPets.length - 1) {
      setSelectedSpotlightIndex(0);
    }

    const interval = setInterval(() => {
      setSelectedSpotlightIndex((prev) =>
        prev === spotlightPets.length - 1 ? 0 : prev + 1
      );
    }, 4500);

    return () => clearInterval(interval);
  }, [spotlightPets, selectedSpotlightIndex]);

  useEffect(() => {
    if (!premiumAlertPets.length) {
      setSelectedAlertIndex(0);
      return;
    }

    if (selectedAlertIndex > premiumAlertPets.length - 1) {
      setSelectedAlertIndex(0);
    }

    const interval = setInterval(() => {
      setSelectedAlertIndex((prev) =>
        prev === premiumAlertPets.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [premiumAlertPets, selectedAlertIndex]);

  const mapMarkers = useMemo(() => {
    return filteredReports.filter(
      (report) =>
        report.lat !== null &&
        report.lat !== undefined &&
        report.lng !== null &&
        report.lng !== undefined
    );
  }, [filteredReports]);

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

  const handleViewReport = (report) => {
    const targetId = report.type === "sighting" ? report.pet_id : report.id;
    if (!targetId) return;
    navigate(`/premium/lostfound/view/${targetId}`);
  };

  const openMapReportModal = (report) => {
    setSelectedMapReport(report);
    setShowMapReportModal(true);
  };

  const closeMapReportModal = () => {
    setSelectedMapReport(null);
    setShowMapReportModal(false);
  };

  return (
    <div className="premium-lf-page">
      <div className="premium-lf-glow premium-lf-glow-1" />
      <div className="premium-lf-glow premium-lf-glow-2" />
      <div className="premium-lf-glow premium-lf-glow-3" />

      <header className="premium-lf-topbar">
        <div className="premium-lf-brand glass-panel">
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

        <nav className="premium-lf-nav glass-panel">
          <Link to="/premium-dashboard">Premium Dashboard</Link>
          <Link to="/premium-mypets">My Pets</Link>
          <Link to="/premium/appointments">Appointments</Link>
          <Link to="/premium/reminders">Reminders</Link>
          <Link to="/premium/lostfound" className="active">
            Lost &amp; Found
          </Link>
          <Link to="/premium/community">Community</Link>
          <Link to="/premium/inventory">Inventory</Link>
          <Link to="/premium/vet-chat">AI Pet Assistant</Link>
          <Link to="/premium/profile">Profile</Link>
        </nav>

        <div className="premium-lf-userbar">
          <div className="premium-lf-date glass-panel">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>

          <div className="premium-lf-userchip glass-panel">
            <div className="premium-lf-avatar">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <strong>{userName}</strong>
              <span>Premium User</span>
            </div>
          </div>
        </div>
      </header>

      <section className="premium-lf-main-hero">
        <div className="premium-lf-hero-card glass-panel">
          <div className="premium-lf-hero-left">
            <div className="premium-lf-badge">PAWFECTION PREMIUM SAFETY</div>
            <h2>Lost &amp; Found</h2>
            <p>
              Fast, localised lost-pet reporting with community sightings,
              smart filters, map tracking, and premium nearby alert support.
            </p>

            <div className="premium-lf-hero-meta">
              <div className="premium-lf-stat-pill">
                <strong>{lostReports.length}</strong> active lost reports
              </div>
              <div className="premium-lf-stat-pill">
                <strong>{priorityReports.length}</strong> priority alerts
              </div>
              <div className="premium-lf-stat-pill">
                <strong>{foundReports.length}</strong> found reports
              </div>
              <div className="premium-lf-stat-pill">
                <strong>{useRadius ? "On" : "Off"}</strong> area alerts
              </div>
            </div>
          </div>

          <div className="premium-lf-hero-right">
            <div className="premium-lf-search-card glass-inner-panel">
              <div className="premium-lf-search-head">
                <h3>Search reports</h3>
                <span>Name, breed, species, area</span>
              </div>

              <div className="premium-lf-search-box">
                <input
                  type="text"
                  placeholder="Search Luna, Golden Retriever, Cat, Tallaght..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="premium-lf-search"
                />

                {searchTerm.trim() && (
                  <button
                    type="button"
                    className="premium-lf-clear-search"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="premium-lf-action-grid">
                <button
                  className="premium-lf-primary-btn"
                  onClick={() => navigate("/premium/lostfound/report")}
                >
                  <span className="premium-lf-plus">+</span>
                  <span>Report Lost Pet</span>
                </button>

                <button
                  className={`premium-lf-secondary-btn ${
                    useRadius ? "selected" : ""
                  }`}
                  onClick={handleUseLocation}
                >
                  Use My Location
                </button>

                <button
                  className={`premium-lf-secondary-btn ${
                    activeFilter === "priority" ? "selected" : ""
                  }`}
                  onClick={() =>
                    setActiveFilter((prev) =>
                      prev === "priority" ? "all" : "priority"
                    )
                  }
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
          </div>
        </div>
      </section>

      {loadingReports && (
        <div className="premium-lf-info-box glass-panel">
          Loading lost and found reports...
        </div>
      )}

      {reportsError && (
        <div className="premium-lf-info-box error glass-panel">{reportsError}</div>
      )}

      <section className="premium-lf-feature-grid">
        <div className="premium-lf-map-card glass-panel">
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
              center={[53.3498, -6.2603]}
              zoom={11}
              scrollWheelZoom
              className="premium-lf-map"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FitMapToReports reports={mapMarkers} userLocation={userLocation} />

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

              {mapMarkers.map((report) => (
                <Marker
                  key={`${report.type}-${report.id}`}
                  position={[Number(report.lat), Number(report.lng)]}
                  icon={getMarkerIcon(report.type)}
                >
                  <Popup>
                    <div className="premium-lf-popup">
                      <img
                        src={report.resolvedImage}
                        alt={report.name || report.pet_name || "Pet"}
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImageForReport(report);
                        }}
                      />
                      <div className="premium-lf-popup-text">
                        <strong>{report.name || report.pet_name || "Unknown Pet"}</strong>
                        <span>
                          {report.species || "Pet"} • {report.breed || "Unknown breed"}
                        </span>
                        <span>
                          {report.area ||
                            report.last_seen_location ||
                            report.sighting_location ||
                            "Unknown area"}
                        </span>
                        <small>{report.status || "Active"}</small>
                        <button
                          type="button"
                          onClick={() => openMapReportModal(report)}
                        >
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

        <div className="premium-lf-spotlight-card glass-panel">
          {activeSpotlight ? (
            <>
              <div className="premium-lf-spotlight-image-wrap">
                <img
                  src={activeSpotlight.resolvedImage}
                  alt={activeSpotlight.name || activeSpotlight.pet_name || "Pet"}
                  className="premium-lf-spotlight-image"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImageForReport(activeSpotlight);
                  }}
                />

                <div className="premium-lf-floating-bubble">
                  <span className="premium-lf-floating-bubble-label">
                    Nearby help needed
                  </span>
                  <strong>
                    {spotlightPets[
                      (selectedSpotlightIndex + 1) % spotlightPets.length
                    ]?.name ||
                      spotlightPets[
                        (selectedSpotlightIndex + 1) % spotlightPets.length
                      ]?.pet_name ||
                      "Next report"}
                  </strong>
                  <p>needs local sightings</p>
                </div>

                <div className="premium-lf-spotlight-overlay">
                  <div className="premium-lf-spotlight-tag">
                    {activeSpotlight.priority
                      ? "PRIORITY REPORT"
                      : "MISSING PET"}
                  </div>

                  <h3>{activeSpotlight.name || activeSpotlight.pet_name || "Unknown Pet"}</h3>
                  <p>
                    {activeSpotlight.species || "Pet"} • {activeSpotlight.breed || "Unknown breed"} •{" "}
                    {activeSpotlight.area ||
                      activeSpotlight.last_seen_location ||
                      "Unknown area"}
                  </p>

                  <div className="premium-lf-spotlight-actions">
                    <button onClick={() => handleViewReport(activeSpotlight)}>
                      View Report
                    </button>
                    <button
                      onClick={() =>
                        navigate(
                          `/premium/lostfound/view/${activeSpotlight.id}/sighting`
                        )
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
        <div className="premium-lf-panel glass-panel">
          <div className="premium-lf-panel-head">
            <h3>
              {activeFilter === "lost"
                ? "Active Lost Reports"
                : activeFilter === "found"
                ? "Found Reports"
                : activeFilter === "sighting"
                ? "Sighting Reports"
                : activeFilter === "priority"
                ? "Priority Lost Reports"
                : "All Reports"}
            </h3>
            <span>{visibleListReports.length} shown</span>
          </div>

          <div className="premium-lf-report-list">
            {visibleListReports.length > 0 ? (
              visibleListReports.map((report) => (
                <div
                  key={`${report.type}-${report.id}`}
                  className="premium-lf-report-card glass-row"
                >
                  <img
                    src={report.resolvedImage}
                    alt={report.name || report.pet_name || "Pet"}
                    onError={(e) => {
                      e.currentTarget.src = getFallbackImageForReport(report);
                    }}
                  />
                  <div className="premium-lf-report-info">
                    <h4>{report.name || report.pet_name || "Unknown Pet"}</h4>
                    <p>
                      {report.species || "Pet"} • {report.breed || "Unknown breed"}
                    </p>
                    <span>
                      {report.area ||
                        report.last_seen_location ||
                        report.sighting_location ||
                        "Unknown area"}
                    </span>
                    <small className={`premium-lf-type-badge ${report.type}`}>
                      {report.type === "lost"
                        ? "Lost"
                        : report.type === "found"
                        ? "Found"
                        : "Sighting"}
                    </small>
                  </div>

                  <button
                    onClick={() =>
                      report.type === "sighting"
                        ? openMapReportModal(report)
                        : handleViewReport(report)
                    }
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <div className="premium-lf-empty-list">
                {activeFilter === "sighting"
                  ? "No sighting reports match your search."
                  : activeFilter === "found"
                  ? "No found reports match your search."
                  : activeFilter === "lost"
                  ? "No lost reports match your search."
                  : "No reports match your search."}
              </div>
            )}
          </div>
        </div>

        <div className="premium-lf-panel glass-panel">
          <div className="premium-lf-panel-head">
            <h3>Premium Alerts</h3>
            <span>Urgent missing pets</span>
          </div>

          {activeAlertPet ? (
            <div className="premium-lf-alert-slider">
              <div className="premium-lf-alert-image-wrap">
                <img
                  src={activeAlertPet.resolvedImage}
                  alt={activeAlertPet.name || activeAlertPet.pet_name || "Pet"}
                  className="premium-lf-alert-image"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImageForReport(activeAlertPet);
                  }}
                />
                <div className="premium-lf-alert-badge">
                  {activeAlertPet.priority ? "Priority Alert" : "Missing Pet"}
                </div>
              </div>

              <div className="premium-lf-alert-content">
                <h4>{activeAlertPet.name || activeAlertPet.pet_name || "Unknown Pet"}</h4>
                <p>
                  {activeAlertPet.species || "Pet"} • {activeAlertPet.breed || "Unknown breed"}
                </p>
                <span>
                  Last seen:{" "}
                  {activeAlertPet.area ||
                    activeAlertPet.last_seen_location ||
                    "Unknown area"}
                </span>

                <div className="premium-lf-alert-actions">
                  <button onClick={() => handleViewReport(activeAlertPet)}>
                    View Report
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/premium/lostfound/view/${activeAlertPet.id}/sighting`
                      )
                    }
                  >
                    Submit Sighting
                  </button>
                </div>
              </div>

              <div className="premium-lf-alert-dots">
                {premiumAlertPets.map((pet, index) => (
                  <button
                    key={pet.id}
                    className={
                      index === selectedAlertIndex
                        ? "premium-alert-dot active"
                        : "premium-alert-dot"
                    }
                    onClick={() => setSelectedAlertIndex(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="premium-lf-empty-list">
              No missing pets available for alerts.
            </div>
          )}
        </div>
      </section>

      <section className="premium-lf-support-section">
        <div className="premium-lf-support-card glass-panel">
          <div className="premium-lf-support-header">
            <span className="premium-lf-support-badge">Support for pet owners</span>
            <h3>You are not alone in this.</h3>
            <p>
              Losing a pet can feel overwhelming. Take one step at a time, keep
              checking updates, and remember that many pets are reunited through
              steady searching and community help.
            </p>
          </div>

          <div className="premium-lf-support-slider">
            <div className="premium-lf-support-quote-card">
              <h4>{activeSupportQuote.title}</h4>
              <p>{activeSupportQuote.text}</p>
            </div>

            <div className="premium-lf-support-dots">
              {supportQuotes.map((quote, index) => (
                <button
                  key={quote.title}
                  className={
                    index === selectedSupportIndex
                      ? "premium-support-dot active"
                      : "premium-support-dot"
                  }
                  onClick={() => setSelectedSupportIndex(index)}
                />
              ))}
            </div>
          </div>

          <div className="premium-lf-support-grid">
            <div className="premium-lf-support-item">
              <h4>Stay calm</h4>
              <p>
                Pets are often found close to where they were last seen. Staying
                calm helps you think clearly and act steadily.
              </p>
            </div>

            <div className="premium-lf-support-item">
              <h4>Keep checking</h4>
              <p>
                Review sightings, refresh your report, and revisit nearby places.
                Repeating the basics really can help.
              </p>
            </div>

            <div className="premium-lf-support-item">
              <h4>Hold onto hope</h4>
              <p>
                Many reunions happen because owners kept going, stayed visible,
                and followed up on every lead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {showMapReportModal && selectedMapReport && (
        <div className="premium-lf-report-modal-overlay" onClick={closeMapReportModal}>
          <div
            className="premium-lf-report-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="premium-lf-report-modal-close"
              onClick={closeMapReportModal}
            >
              ×
            </button>

            <div className="premium-lf-report-modal-grid">
              <div className="premium-lf-report-modal-image-wrap">
                <img
                  src={selectedMapReport.resolvedImage}
                  alt={selectedMapReport.name || selectedMapReport.pet_name || "Pet"}
                  className="premium-lf-report-modal-image"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImageForReport(selectedMapReport);
                  }}
                />
              </div>

              <div className="premium-lf-report-modal-content">
                <div className="premium-lf-report-modal-badge">
                  {selectedMapReport.type === "sighting"
                    ? "Sighting Report"
                    : selectedMapReport.type === "found"
                    ? "Found Report"
                    : selectedMapReport.priority
                    ? "Priority Lost Report"
                    : "Lost Report"}
                </div>

                <h2>{selectedMapReport.name || selectedMapReport.pet_name || "Unknown Pet"}</h2>

                <p className="premium-lf-report-modal-subtitle">
                  {selectedMapReport.species || "Pet"} •{" "}
                  {selectedMapReport.breed || "Unknown breed"}
                </p>

                <div className="premium-lf-report-modal-details">
                  <div className="premium-lf-report-detail-box">
                    <span>Area</span>
                    <strong>
                      {selectedMapReport.area ||
                        selectedMapReport.last_seen_location ||
                        selectedMapReport.sighting_location ||
                        "Unknown area"}
                    </strong>
                  </div>

                  <div className="premium-lf-report-detail-box">
                    <span>Status</span>
                    <strong>{selectedMapReport.status || "Active"}</strong>
                  </div>

                  <div className="premium-lf-report-detail-box">
                    <span>Type</span>
                    <strong>{selectedMapReport.type || "Report"}</strong>
                  </div>

                  <div className="premium-lf-report-detail-box">
                    <span>Priority</span>
                    <strong>{selectedMapReport.priority ? "Yes" : "No"}</strong>
                  </div>
                </div>

                <div className="premium-lf-report-modal-description">
                  <span>More details</span>
                  <p>
                    {selectedMapReport.notes ||
                      selectedMapReport.description ||
                      selectedMapReport.message ||
                      "No extra details were provided for this report yet."}
                  </p>
                </div>

                <div className="premium-lf-report-modal-actions">
                  <button
                    type="button"
                    className="premium-lf-primary-btn"
                    onClick={() => handleViewReport(selectedMapReport)}
                  >
                    Open Full Report Page
                  </button>

                  {selectedMapReport.type === "lost" && (
                    <button
                      type="button"
                      className="premium-lf-secondary-btn"
                      onClick={() =>
                        navigate(
                          `/premium/lostfound/view/${selectedMapReport.id}/sighting`
                        )
                      }
                    >
                      Submit Sighting
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}