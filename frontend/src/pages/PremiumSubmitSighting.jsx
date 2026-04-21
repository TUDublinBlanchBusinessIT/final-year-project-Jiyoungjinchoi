import { useEffect, useRef, useState } from "react";
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

export default function PremiumSubmitSighting() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [userName, setUserName] = useState("Premium User");
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const apiBase = "http://127.0.0.1:8000/api";
  const token = localStorage.getItem("pawfection_token");

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

  useEffect(() => {
    const savedUser = localStorage.getItem("pawfection_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser?.name) {
          setUserName(parsedUser.name);
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
    initialiseMap();
    initialiseAutocomplete();
  }, [mapsReady]);

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

  const todayText = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photo") {
      setForm((prev) => ({
        ...prev,
        photo: files?.[0] || null,
      }));
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
    <div className="premium-sighting-page">
      <div className="premium-lf-topbar">
        <div
          className="premium-lf-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/premium-dashboard");
            }
          }}
        >
          <img src={PawfectionLogo} alt="Pawfection" className="premium-lf-logo" />
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
          <Link to="/premium-inventory">Inventory</Link>
          <Link to="/premium/vet-chat">AI Pet Assistant</Link>
          <Link to="/premium/profile">Profile</Link>
        </nav>

        <div className="premium-lf-userbar">
          <div className="premium-lf-date">{todayText}</div>
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
      </div>

      <section className="premium-sighting-hero">
        <span className="premium-sighting-badge">PREMIUM FEATURE</span>
        <h2>Submit Sighting</h2>
        <p>
          Share where the pet was seen so the owner can be notified quickly and take
          action faster.
        </p>
      </section>

      <div className="premium-sighting-grid">
        <section className="premium-sighting-panel">
          <h3>Sighting Form</h3>
          <p className="premium-sighting-sub">
            Location is required. Photo is optional. The pet owner will be notified.
          </p>

          <form className="premium-sighting-form" onSubmit={handleSubmit}>
            <div className="premium-sighting-field">
              <label>Location *</label>
              <input
                ref={locationInputRef}
                type="text"
                placeholder="Search area, road, park, or landmark"
                autoComplete="off"
                required
              />
            </div>

            <div className="premium-sighting-location-actions premium-sighting-location-actions-single">
              <button
                type="button"
                className="premium-sighting-location-btn"
                onClick={handleUseCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? "Getting Location..." : "Use My Current Location"}
              </button>
            </div>

            <div className="premium-sighting-field">
              <label>Map Preview</label>
              <div ref={mapRef} className="premium-sighting-map-box" />
            </div>

            <div className="premium-sighting-field">
              <label>Selected Address</label>
              <input
                type="text"
                value={form.location}
                readOnly
                placeholder="Selected location will appear here"
              />
            </div>

            <div className="premium-sighting-field">
              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add anything helpful like time seen, direction, collar, behaviour, or nearby landmarks."
              />
            </div>

            <div className="premium-sighting-field">
              <label>Upload Photo</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleChange}
              />
            </div>

            {error && <div className="premium-sighting-message error">{error}</div>}
            {message && <div className="premium-sighting-message success">{message}</div>}

            <div className="premium-sighting-actions">
              <button
                type="button"
                className="premium-sighting-cancel-btn"
                onClick={() => navigate(`/premium/lostfound/view/${id}`)}
              >
                Back
              </button>

              <button
                type="submit"
                className="premium-sighting-submit-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Sighting"}
              </button>
            </div>
          </form>
        </section>

        <aside className="premium-sighting-side">
          <h3>Quick Guide</h3>
          <p className="premium-sighting-sub">
            Tips to make the sighting more useful.
          </p>

          <div className="premium-sighting-guide-list">
            <div className="premium-sighting-guide-item">
              <div className="premium-sighting-guide-label">Location</div>
              <div className="premium-sighting-guide-text">
                Add the nearest place, road, shop, or landmark.
              </div>
            </div>

            <div className="premium-sighting-guide-item">
              <div className="premium-sighting-guide-label">Timing</div>
              <div className="premium-sighting-guide-text">
                Mention when you saw the pet if you know the time.
              </div>
            </div>

            <div className="premium-sighting-guide-item">
              <div className="premium-sighting-guide-label">Behaviour</div>
              <div className="premium-sighting-guide-text">
                Include details like running direction, collar, nervous behaviour.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}