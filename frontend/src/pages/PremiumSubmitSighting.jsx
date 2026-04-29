import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumSubmitSighting.css";

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

export default function PremiumSubmitSighting() {
  const navigate = useNavigate();
  const { id } = useParams();

  const apiBase = "http://127.0.0.1:8000/api";
  const token = localStorage.getItem("pawfection_token");

  const [userName, setUserName] = useState("Premium User");
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  const [form, setForm] = useState({
    location: "",
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

  const todayText = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const reportImage = getReportImage(report);

  const checklist = useMemo(
    () => [
      {
        label: "Sighting location added",
        done: Boolean(form.location.trim()),
      },
      {
        label: "Map pin confirmed",
        done: Boolean(form.lat && form.lng),
      },
      {
        label: "Helpful notes written",
        done: Boolean(form.notes.trim()),
      },
      {
        label: "Photo attached",
        done: Boolean(form.photo),
      },
    ],
    [form.location, form.lat, form.lng, form.notes, form.photo]
  );

  useEffect(() => {
    const savedUser = localStorage.getItem("pawfection_user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        const fullName =
          parsedUser?.name ||
          parsedUser?.full_name ||
          parsedUser?.username ||
          parsedUser?.user_name;

        if (fullName) {
          setUserName(fullName);
          return;
        }
      } catch (err) {
        console.error("Failed to parse pawfection_user:", err);
      }
    }

    const savedName = localStorage.getItem("pawfection_user_name");
    if (savedName) setUserName(savedName);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchReport = async () => {
      try {
        setLoadingReport(true);

        const endpoints = [
          `${apiBase}/premium/lost-found/${id}`,
          `${apiBase}/lost-pets/${id}`,
        ];

        for (const endpoint of endpoints) {
          const response = await fetch(endpoint, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json().catch(() => ({}));
            const foundReport = data.report || data.lost_pet || data.pet || data.data || data;
            setReport(foundReport);
            return;
          }
        }
      } catch (err) {
        console.error("Could not load linked report:", err);
      } finally {
        setLoadingReport(false);
      }
    };

    fetchReport();
  }, [apiBase, id, token]);

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
    if (!mapsReady) return;

    const timer = setTimeout(() => {
      initialiseMap();
      initialiseAutocomplete();

      if (mapInstanceRef.current && window.google?.maps) {
        window.google.maps.event.trigger(mapInstanceRef.current, "resize");
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [mapsReady]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const initialiseMap = () => {
    if (!mapRef.current || !window.google?.maps) return;
    if (mapInstanceRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 53.3498, lng: -6.2603 },
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    geocoderRef.current = new window.google.maps.Geocoder();
  };

  const attachMarkerDragHandler = () => {
    if (!markerRef.current) return;

    markerRef.current.addListener("dragend", () => {
      const draggedPos = markerRef.current.getPosition();
      const draggedLat = draggedPos?.lat?.();
      const draggedLng = draggedPos?.lng?.();

      if (draggedLat == null || draggedLng == null) return;

      setForm((prev) => ({
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

              setForm((prev) => ({
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

      setForm((prev) => ({
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

  const handleLocationTyping = (e) => {
    setForm((prev) => ({
      ...prev,
      location: e.target.value,
    }));
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photo") {
      const file = files?.[0] || null;

      setForm((prev) => ({
        ...prev,
        photo: file,
      }));

      setPhotoPreview(file ? URL.createObjectURL(file) : "");
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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
          setForm((prev) => ({
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
      (err) => {
        console.error("Geolocation error:", err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!form.location.trim()) {
      setError("Location is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("location", form.location);
      formData.append("notes", form.notes);

      if (form.lat !== "") formData.append("lat", form.lat);
      if (form.lng !== "") formData.append("lng", form.lng);
      if (form.photo) formData.append("photo", form.photo);

      const response = await fetch(`${apiBase}/lost-pets/${id}/sightings`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.message || "Failed to submit sighting.");
        return;
      }

      setMessage("Sighting submitted successfully.");

      setTimeout(() => {
        navigate(`/premium/lostfound/view/${id}`);
      }, 1200);
    } catch (err) {
      console.error("Submit sighting error:", err);
      setError("Something went wrong while submitting the sighting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="premium-submit-sighting-page">
      <div className="premium-submit-cloud cloud-one"></div>
      <div className="premium-submit-cloud cloud-two"></div>
      <div className="premium-submit-cloud cloud-three"></div>

      <header className="premium-submit-topbar">
        <div
          className="premium-submit-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/premium-dashboard");
            }
          }}
        >
          <img src={PawfectionLogo} alt="Pawfection" className="premium-submit-logo" />

          <div>
            <h1>Pawfection</h1>
            <p>PREMIUM LOST &amp; FOUND</p>
          </div>
        </div>

        <nav className="premium-submit-nav">
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

        <div className="premium-submit-userbar">
          <div className="premium-submit-date">{todayText}</div>

          <div className="premium-submit-userchip">
            <div className="premium-submit-avatar">
              {userName?.charAt(0)?.toUpperCase() || "P"}
            </div>

            <div>
              <strong>{userName}</strong>
              <span>Premium User</span>
            </div>
          </div>
        </div>
      </header>

      <section className="premium-submit-hero">
        <div>
          <span className="premium-submit-badge">PREMIUM FEATURE</span>

          <h2>Submit Sighting</h2>

          <p>
            Share where the pet was seen so the owner can be notified quickly and
            follow the latest sighting on their Lost & Found dashboard.
          </p>
        </div>

        <div className="premium-submit-hero-card">
          <span>Linked report</span>
          <strong>Lost Pet #{id}</strong>
        </div>
      </section>

      {message && <div className="premium-submit-message success">{message}</div>}
      {error && <div className="premium-submit-message error">{error}</div>}

      <main className="premium-submit-grid">
        <aside className="premium-submit-side">
          <section className="premium-submit-card">
            <h3>Linked Lost Report</h3>
            <p className="premium-submit-sub">
              Your sighting will be sent to this lost pet report.
            </p>

            <div className="premium-linked-card">
              <div className="premium-linked-photo">
                {reportImage ? (
                  <img
                    src={reportImage}
                    alt={report?.name || report?.pet_name || "Lost pet"}
                  />
                ) : (
                  <span>🐾</span>
                )}
              </div>

              <div className="premium-linked-info">
                <p>{loadingReport ? "Loading report..." : "Selected report"}</p>
                <h4>{report?.name || report?.pet_name || "Lost Pet Report"}</h4>
                <span>
                  {report?.species || "Pet"}{" "}
                  {report?.breed ? `• ${report.breed}` : ""}
                </span>
              </div>

              <div className="premium-linked-details">
                <div>
                  <span>Status</span>
                  <strong>{report?.status || "Active"}</strong>
                </div>

                <div>
                  <span>Last seen</span>
                  <strong>
                    {report?.last_seen_location ||
                      report?.area ||
                      report?.location ||
                      "View report for details"}
                  </strong>
                </div>

                <div>
                  <span>Report ID</span>
                  <strong>#{id}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="premium-submit-card">
            <h3>Sighting Checklist</h3>
            <p className="premium-submit-sub">Make your update useful for the owner.</p>

            <div className="premium-submit-checklist">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className={`premium-submit-check-item ${item.done ? "done" : ""}`}
                >
                  <span>{item.done ? "✓" : "○"}</span>
                  <p>{item.label}</p>
                </div>
              ))}
            </div>

            <div className="premium-submit-tip">
              <strong>Quick tip</strong>
              <p>
                Mention the direction the pet was moving, collar colour, behaviour,
                nearby shops, parks, roads, or anything that could help the owner.
              </p>
            </div>
          </section>
        </aside>

        <form className="premium-submit-form" onSubmit={handleSubmit}>
          <div className="premium-submit-form-head">
            <div>
              <h3>Sighting Form</h3>
              <p>Location is required. Photo and notes are optional but helpful.</p>
            </div>

            <span>Owner will be notified</span>
          </div>

          <div className="premium-submit-field">
            <label>Location *</label>
            <input
              ref={locationInputRef}
              type="text"
              value={form.location}
              onChange={handleLocationTyping}
              placeholder="Search area, road, park, or landmark"
              autoComplete="off"
              required
            />
          </div>

          <button
            type="button"
            className="premium-submit-location-btn"
            onClick={handleUseCurrentLocation}
            disabled={gettingLocation}
          >
            <span>📍</span>
            {gettingLocation ? "Getting Location..." : "Use My Current Location"}
          </button>

          <div className="premium-submit-map-wrap">
            <div className="premium-submit-map-head">
              <label>Map Preview</label>
              <span>Drag the pin to adjust</span>
            </div>

            <div ref={mapRef} className="premium-submit-map" />
          </div>

          <div className="premium-submit-field">
            <label>Selected Address</label>
            <input
              type="text"
              value={form.location}
              readOnly
              placeholder="Selected location will appear here"
            />
          </div>

          <div className="premium-submit-field">
            <label>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add anything helpful like time seen, direction, collar, behaviour, or nearby landmarks."
              rows="5"
            />
          </div>

          <div className="premium-submit-field">
            <label>Upload Photo</label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          {photoPreview && (
            <div className="premium-submit-photo-preview">
              <img src={photoPreview} alt="Sighting preview" />
              <div>
                <strong>Photo attached</strong>
                <p>This image will be sent with your sighting.</p>
              </div>
            </div>
          )}

          <div className="premium-submit-review-card">
            <strong>Before you submit</strong>
            <p>
              Your sighting will be linked to this lost pet report. The owner can
              review your location, notes, and photo from the Lost & Found details page.
            </p>
          </div>

          <div className="premium-submit-actions">
            <button
              type="button"
              className="premium-submit-back-btn"
              onClick={() => navigate(`/premium/lostfound/view/${id}`)}
            >
              Back
            </button>

            <button
              type="submit"
              className="premium-submit-main-btn"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Sighting"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}