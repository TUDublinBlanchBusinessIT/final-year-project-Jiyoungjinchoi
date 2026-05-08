import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./LostFoundPremium.css";
import "./PremiumReportLostPet.css";
import "./PremiumReportSighting.css";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve(window.google);
      return;
    }

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });
}

function getReportImage(report) {
  return (
    report?.photo_url ||
    report?.image_url ||
    report?.photo ||
    report?.image ||
    report?.pet_photo ||
    report?.pet?.photo_url ||
    report?.pet?.image_url ||
    ""
  );
}

export default function PremiumReportSighting() {
  const navigate = useNavigate();
  const apiBase = "http://127.0.0.1:8000/api";
  const token = localStorage.getItem("pawfection_token");

  const [userName, setUserName] = useState("Premium User");
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [choice, setChoice] = useState("existing");
  const [mapsReady, setMapsReady] = useState(false);

  const [submittingUnknown, setSubmittingUnknown] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  const [unknownForm, setUnknownForm] = useState({
    name: "",
    species: "",
    breed: "",
    location: "",
    sighting_at: "",
    notes: "",
    photo: null,
    lat: "",
    lng: "",
    place_id: "",
  });

  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);

  const filteredReports = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    if (!q) return reports;

    return reports.filter((item) =>
      [
        item.name,
        item.pet_name,
        item.species,
        item.breed,
        item.area,
        item.last_seen_location,
        item.description,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [reports, searchTerm]);

  const unknownChecklist = [
    {
      label: "Pet details added",
      done: Boolean(
        unknownForm.name.trim() ||
          unknownForm.species.trim() ||
          unknownForm.breed.trim()
      ),
    },
    {
      label: "Sighting location added",
      done: Boolean(unknownForm.location.trim()),
    },
    {
      label: "Map pin confirmed",
      done: Boolean(unknownForm.lat && unknownForm.lng),
    },
    {
      label: "Notes written",
      done: Boolean(unknownForm.notes.trim()),
    },
    {
      label: "Photo attached",
      done: Boolean(unknownForm.photo),
    },
  ];

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("pawfection_user_name");

      if (savedName && savedName.trim()) {
        setUserName(savedName.trim());
        return;
      }

      const savedUser = localStorage.getItem("pawfection_user");

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        const fullName =
          parsedUser?.name ||
          parsedUser?.full_name ||
          parsedUser?.username ||
          parsedUser?.user_name ||
          "Premium User";

        setUserName(fullName);
      }
    } catch (err) {
      console.error("Failed to load user name:", err);
    }
  }, []);

  useEffect(() => {
    if (GOOGLE_MAPS_API_KEY) {
      loadGoogleMapsScript()
        .then(() => setMapsReady(true))
        .catch(() => {
          setError(
            "Google Maps failed to load. Check your API key, billing, and API restrictions."
          );
        });
    } else {
      setError(
        "Google Maps API key is missing. Put VITE_GOOGLE_MAPS_API_KEY in frontend/.env and restart npm run dev."
      );
    }
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      if (!token) {
        setError("You need to log in first.");
        setLoadingReports(false);
        return;
      }

      try {
        setLoadingReports(true);
        setError("");

        const res = await fetch(`${apiBase}/premium/lost-found`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load lost pet reports.");
        }

        const incomingReports = Array.isArray(data.reports)
          ? data.reports
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];

        const lostOnly = incomingReports.filter((item) => {
          const type = String(item.type || item.report_type || "").toLowerCase();
          const status = String(item.status || "").toLowerCase();

          return (
            type === "lost" ||
            status === "lost" ||
            status === "open" ||
            status === "active" ||
            !type
          );
        });

        setReports(lostOnly);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load lost pet reports.");
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [apiBase, token]);

  useEffect(() => {
    if (choice !== "unknown") {
      autocompleteRef.current = null;
      mapInstanceRef.current = null;
      markerRef.current = null;
      geocoderRef.current = null;
      return;
    }

    if (!mapsReady) return;

    const timer = setTimeout(() => {
      initialiseMap();
      initialiseAutocomplete();

      if (mapInstanceRef.current && window.google?.maps) {
        window.google.maps.event.trigger(mapInstanceRef.current, "resize");

        const hasCoords = unknownForm.lat !== "" && unknownForm.lng !== "";

        const center = hasCoords
          ? { lat: Number(unknownForm.lat), lng: Number(unknownForm.lng) }
          : { lat: 53.3498, lng: -6.2603 };

        mapInstanceRef.current.setCenter(center);
        mapInstanceRef.current.setZoom(hasCoords ? 16 : 11);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [mapsReady, choice]);

  useEffect(() => {
    if (
      choice !== "unknown" ||
      !mapsReady ||
      !mapInstanceRef.current ||
      !window.google?.maps
    ) {
      return;
    }

    const hasCoords = unknownForm.lat !== "" && unknownForm.lng !== "";

    if (hasCoords) {
      updateMapLocation(unknownForm.lat, unknownForm.lng, unknownForm.location);
    }
  }, [choice, mapsReady, unknownForm.lat, unknownForm.lng, unknownForm.location]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const initialiseMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 53.3498, lng: -6.2603 },
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    }

    geocoderRef.current = new window.google.maps.Geocoder();
  };

  const attachMarkerDragHandler = () => {
    if (!markerRef.current) return;

    markerRef.current.addListener("dragend", () => {
      const draggedPos = markerRef.current.getPosition();
      const draggedLat = draggedPos?.lat?.();
      const draggedLng = draggedPos?.lng?.();

      if (draggedLat == null || draggedLng == null) return;

      setUnknownForm((prev) => ({
        ...prev,
        lat: String(draggedLat),
        lng: String(draggedLng),
      }));

      if (geocoderRef.current) {
        geocoderRef.current.geocode(
          { location: { lat: draggedLat, lng: draggedLng } },
          (results, status) => {
            if (status === "OK" && results?.[0]) {
              const newAddress = results[0].formatted_address || "";

              setUnknownForm((prev) => ({
                ...prev,
                location: newAddress,
                place_id: results[0].place_id || "",
              }));

              if (locationInputRef.current) {
                locationInputRef.current.value = newAddress;
              }
            }
          }
        );
      }
    });
  };

  const updateMapLocation = (lat, lng, title = "") => {
    if (!mapInstanceRef.current || lat === "" || lng === "") return;

    const position = { lat: Number(lat), lng: Number(lng) };

    mapInstanceRef.current.setCenter(position);
    mapInstanceRef.current.setZoom(16);

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      title,
      draggable: true,
    });

    attachMarkerDragHandler();
  };

  const initialiseAutocomplete = () => {
    if (!locationInputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      locationInputRef.current,
      {
        fields: ["place_id", "name", "formatted_address", "geometry"],
        componentRestrictions: { country: "ie" },
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      const address = place?.formatted_address || place?.name || "";
      const placeId = place?.place_id || "";
      const lat = place?.geometry?.location?.lat?.() ?? "";
      const lng = place?.geometry?.location?.lng?.() ?? "";

      setUnknownForm((prev) => ({
        ...prev,
        location: address,
        place_id: placeId,
        lat: lat !== "" ? String(lat) : "",
        lng: lng !== "" ? String(lng) : "",
      }));

      if (locationInputRef.current) {
        locationInputRef.current.value = address;
      }

      updateMapLocation(lat, lng, address);
      setMessage("Location selected successfully.");
      setError("");
    });

    autocompleteRef.current = autocomplete;
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    if (!window.google?.maps) {
      setError("Google Maps is not ready yet.");
      return;
    }

    setGettingLocation(true);
    setError("");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);

        const setLocationValues = (addressText, placeId = "") => {
          setUnknownForm((prev) => ({
            ...prev,
            location: addressText,
            lat: String(lat),
            lng: String(lng),
            place_id: placeId,
          }));

          if (locationInputRef.current) {
            locationInputRef.current.value = addressText;
          }

          updateMapLocation(lat, lng, addressText);
          setMessage("Current location captured successfully.");
          setGettingLocation(false);
        };

        if (geocoderRef.current) {
          geocoderRef.current.geocode(
            { location: { lat, lng } },
            (results, status) => {
              if (status === "OK" && results?.[0]) {
                setLocationValues(
                  results[0].formatted_address || `Lat ${lat}, Lng ${lng}`,
                  results[0].place_id || ""
                );
              } else {
                setLocationValues(`Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`);
              }
            }
          );
        } else {
          setLocationValues(`Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`);
        }
      },
      () => {
        setError("Could not get your current location.");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleUnknownChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photo") {
      const file = files?.[0] || null;

      setUnknownForm((prev) => ({
        ...prev,
        photo: file,
      }));

      setPhotoPreview(file ? URL.createObjectURL(file) : "");
      return;
    }

    setUnknownForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationTyping = (e) => {
    setUnknownForm((prev) => ({
      ...prev,
      location: e.target.value,
    }));
  };

  const handleUnknownSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!unknownForm.location.trim()) {
      setError("Location is required.");
      return;
    }

    setSubmittingUnknown(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("name", unknownForm.name);
      formData.append("species", unknownForm.species);
      formData.append("breed", unknownForm.breed);
      formData.append("location", unknownForm.location);
      formData.append("notes", unknownForm.notes);
      formData.append("sighting_at", unknownForm.sighting_at);

      if (unknownForm.lat !== "") formData.append("lat", unknownForm.lat);
      if (unknownForm.lng !== "") formData.append("lng", unknownForm.lng);
      if (unknownForm.photo) formData.append("photo", unknownForm.photo);

      const response = await fetch(`${apiBase}/premium/report-sighting`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.message || "Failed to submit unknown pet sighting.");
        return;
      }

      setMessage("Unknown pet sighting submitted successfully.");

      setTimeout(() => {
        navigate("/premium/lostfound");
      }, 1200);
    } catch (err) {
      console.error("Unknown sighting submit error:", err);
      setError("Something went wrong while submitting the sighting.");
    } finally {
      setSubmittingUnknown(false);
    }
  };

  return (
    <div className="premium-sighting-page">
      <div className="premium-report-cloud cloud-one"></div>
      <div className="premium-report-cloud cloud-two"></div>
      <div className="premium-report-cloud cloud-three"></div>

      <header className="premium-lf-topbar premium-sighting-topbar">
        <div className="premium-lf-brand">
          <img
            src={PawfectionLogo}
            alt="Pawfection Logo"
            className="premium-lf-logo"
          />

          <div className="premium-lf-brand-text">
            <h1>Pawfection</h1>
            <p>PREMIUM LOST &amp; FOUND</p>
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
          <Link to="/premium/vet-chat">AI Pet Assistant</Link>
          <Link to="/premium/profile">Profile</Link>
        </nav>

        <div className="premium-lf-userbar">
          <div className="premium-lf-date">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>

          <div className="premium-lf-userchip">
            <div className="premium-lf-avatar">
              {userName?.charAt(0)?.toUpperCase() || "P"}
            </div>

            <div>
              <strong>{userName}</strong>
              <span>Premium User</span>
            </div>
          </div>
        </div>
      </header>

      <section className="premium-sighting-hero">
        <div className="premium-sighting-hero-left">
          <span className="premium-report-badge">PREMIUM FEATURE</span>

          <h2>Report Sighting</h2>

          <p>
            Help reunite pets with their families by reporting where you saw them.
            Choose an existing lost report or submit an unknown pet sighting.
          </p>
        </div>

        <div className="premium-sighting-type-card">
          <div className="premium-sighting-type-head">
            <h3>Choose type</h3>
            <span>
              {choice === "existing"
                ? "Match your sighting to a current lost pet report."
                : "Report a pet that is not already listed."}
            </span>
          </div>

          <div className="premium-sighting-toggle">
            <button
              type="button"
              className={choice === "existing" ? "selected" : ""}
              onClick={() => {
                setChoice("existing");
                setMessage("");
                setError("");
              }}
            >
              Existing Lost Pet Report
            </button>

            <button
              type="button"
              className={choice === "unknown" ? "selected" : ""}
              onClick={() => {
                setChoice("unknown");
                setMessage("");
                setError("");
              }}
            >
              Unknown Pet
            </button>
          </div>
        </div>
      </section>

      {message && <div className="premium-lf-info-box">{message}</div>}
      {error && <div className="premium-lf-info-box error">{error}</div>}

      {choice === "existing" && (
        <main className="premium-sighting-existing-grid">
          <section className="premium-sighting-list-card">
            <div className="premium-sighting-panel-head">
              <div>
                <h3>Select Lost Pet Report</h3>
                <p>Choose the lost pet you have seen and continue to submit details.</p>
              </div>

              <span>{filteredReports.length} shown</span>
            </div>

            <div className="premium-sighting-search-wrap">
              <input
                type="text"
                placeholder="Search by pet name, breed, area, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="premium-sighting-report-list">
              {loadingReports ? (
                <div className="premium-sighting-empty">Loading reports...</div>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const imageUrl = getReportImage(report);

                  return (
                    <article key={report.id} className="premium-sighting-report-card">
                      <div className="premium-sighting-report-img">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={report.name || report.pet_name || "Lost pet"}
                          />
                        ) : (
                          <span>🐾</span>
                        )}
                      </div>

                      <div className="premium-sighting-report-info">
                        <div>
                          <h4>{report.name || report.pet_name || "Unknown Pet"}</h4>
                          <p>
                            {report.species || "Pet"} •{" "}
                            {report.breed || "Unknown breed"}
                          </p>
                        </div>

                        <span>
                          {report.area ||
                            report.last_seen_location ||
                            "Unknown area"}
                        </span>

                        <small>LOST</small>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/premium/lostfound/view/${report.id}/sighting`)
                        }
                      >
                        Continue
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="premium-sighting-empty">
                  No lost pet reports found.
                </div>
              )}
            </div>
          </section>

          <aside className="premium-sighting-side-stack">
            <section className="premium-report-panel">
              <h3>How it works</h3>
              <p className="premium-report-sub">
                Your sighting will be linked to the selected lost report.
              </p>

              <div className="premium-sighting-steps">
                <div>
                  <span>1</span>
                  <p>Select the lost pet report.</p>
                </div>

                <div>
                  <span>2</span>
                  <p>Add where and when you saw the pet.</p>
                </div>

                <div>
                  <span>3</span>
                  <p>The owner can view the sighting from their dashboard.</p>
                </div>
              </div>
            </section>

            <section className="premium-safety-tip">
              <strong>Useful detail</strong>
              <p>
                Add collar colour, direction of travel, behaviour, and landmarks.
                These details help the owner search the right area faster.
              </p>
            </section>
          </aside>
        </main>
      )}

      {choice === "unknown" && (
        <main className="premium-report-grid premium-sighting-unknown-grid">
          <aside className="premium-report-side">
            <section className="premium-report-panel">
              <h3>Unknown Pet Preview</h3>
              <p className="premium-report-sub">
                This summary updates as you complete the form.
              </p>

              <div className="unknown-preview-card">
                <div className="unknown-preview-photo">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Unknown pet preview" />
                  ) : (
                    <span>🐾</span>
                  )}
                </div>

                <div className="unknown-preview-info">
                  <p>Possible sighting</p>
                  <h4>{unknownForm.name || "Unknown Pet"}</h4>
                  <span>{unknownForm.species || "Species not added"}</span>
                </div>

                <div className="unknown-preview-details">
                  <div>
                    <span>Breed / look</span>
                    <strong>{unknownForm.breed || "Not added"}</strong>
                  </div>

                  <div>
                    <span>Seen at</span>
                    <strong>{unknownForm.location || "No location yet"}</strong>
                  </div>

                  <div>
                    <span>Photo</span>
                    <strong>{unknownForm.photo ? "Attached" : "Optional"}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="premium-report-panel">
              <h3>Checklist</h3>
              <p className="premium-report-sub">Make your sighting useful.</p>

              <div className="report-checklist">
                {unknownChecklist.map((item) => (
                  <div
                    key={item.label}
                    className={`checklist-item ${item.done ? "done" : ""}`}
                  >
                    <span>{item.done ? "✓" : "○"}</span>
                    <p>{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="premium-safety-tip">
                <strong>Quick tip</strong>
                <p>
                  Include coat colour, size, collar, behaviour, and whether the pet
                  looked scared, injured, or calm.
                </p>
              </div>
            </section>
          </aside>

          <form className="premium-report-form" onSubmit={handleUnknownSubmit}>
            <div className="form-title-row">
              <div>
                <h3>Unknown Pet Sighting</h3>
                <p>Report a pet that is not already listed in lost reports.</p>
              </div>

              <span className="form-status-pill">Community sighting</span>
            </div>

            <div className="premium-report-row">
              <div className="premium-report-field">
                <label>Pet Name / Label</label>
                <input
                  type="text"
                  name="name"
                  value={unknownForm.name}
                  onChange={handleUnknownChange}
                  placeholder="Example: Small brown dog"
                />
              </div>

              <div className="premium-report-field">
                <label>Species</label>
                <input
                  type="text"
                  name="species"
                  value={unknownForm.species}
                  onChange={handleUnknownChange}
                  placeholder="Dog, Cat, Rabbit..."
                />
              </div>
            </div>

            <div className="premium-report-field">
              <label>Breed / Description</label>
              <input
                type="text"
                name="breed"
                value={unknownForm.breed}
                onChange={handleUnknownChange}
                placeholder="Golden Retriever, tabby cat, small terrier..."
              />
            </div>

            <div className="premium-report-field">
              <label>Where was the pet seen? *</label>
              <input
                ref={locationInputRef}
                type="text"
                value={unknownForm.location}
                onChange={handleLocationTyping}
                placeholder="Search area, road, park, or landmark"
                autoComplete="off"
              />
            </div>

            <button
              type="button"
              className="premium-report-location-btn"
              onClick={handleUseCurrentLocation}
              disabled={gettingLocation}
            >
              <span>📍</span>
              {gettingLocation ? "Getting Location..." : "Use My Current Location"}
            </button>

            <div className="premium-map-wrap">
              <div className="map-title-row">
                <label>Map Preview</label>
                <span>Drag the pin to adjust</span>
              </div>

              <div ref={mapRef} className="premium-report-map" />
            </div>

            <div className="premium-report-field">
              <label>Selected Address</label>
              <input
                type="text"
                value={unknownForm.location}
                readOnly
                placeholder="Selected location will appear here"
              />
            </div>

            <div className="premium-report-field">
              <label>Date &amp; Time Seen</label>
              <input
                type="datetime-local"
                name="sighting_at"
                value={unknownForm.sighting_at}
                onChange={handleUnknownChange}
              />
            </div>

            <div className="premium-report-field">
              <label>Notes</label>
              <textarea
                name="notes"
                value={unknownForm.notes}
                onChange={handleUnknownChange}
                placeholder="Add collar colour, behaviour, markings, direction, and nearby landmarks"
                rows="5"
              />
            </div>

            <div className="premium-report-field">
              <label>Upload Photo</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleUnknownChange}
              />
            </div>

            <div className="report-review-card">
              <strong>Before you submit</strong>
              <p>
                This sighting will be added to the Premium Lost & Found area so
                owners and nearby users can compare it with missing pet reports.
              </p>
            </div>

            <div className="premium-report-actions">
              <button
                type="button"
                className="premium-report-cancel"
                onClick={() => navigate("/premium/lostfound")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="premium-report-submit"
                disabled={submittingUnknown}
              >
                {submittingUnknown ? "Submitting..." : "Submit Unknown Sighting"}
              </button>
            </div>
          </form>
        </main>
      )}
    </div>
  );
}