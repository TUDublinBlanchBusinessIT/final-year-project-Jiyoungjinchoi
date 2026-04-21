import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumReportLostPet.css";

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

export default function ReportLostPet() {
  const navigate = useNavigate();
  const apiBase = "http://127.0.0.1:8000/api";

  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("Premium User");
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [mapsReady, setMapsReady] = useState(false);

  const [selectedPetId, setSelectedPetId] = useState("");
  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    location: "",
    lost_at: "",
    description: "",
    priority: false,
    lat: "",
    lng: "",
    place_id: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("pawfection_token") || "";
    setToken(savedToken);

    if (!savedToken) {
      setError("You need to log in first.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
      return;
    }

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
  }, [navigate]);

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
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setLoadingPets(false);
      return;
    }

    const fetchPets = async () => {
      try {
        setLoadingPets(true);
        setError("");

        const res = await fetch(`${apiBase}/pets`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }

        if (!res.ok) {
          throw new Error(data.message || "Failed to load pets.");
        }

        const petList = Array.isArray(data) ? data : data.pets || data.data || [];
        setPets(petList);
      } catch (err) {
        setError(err.message || "Unable to load pets.");
      } finally {
        setLoadingPets(false);
      }
    };

    fetchPets();
  }, [apiBase, token]);

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

  const handlePetChange = (petId) => {
    setSelectedPetId(petId);

    const pet = pets.find((item) => String(item.id) === String(petId));

    if (!pet) {
      setForm((prev) => ({
        ...prev,
        name: "",
        species: "",
        breed: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: pet.name || "",
      species: pet.species || "",
      breed: pet.breed || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUseMyLocation = () => {
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
      () => {
        setError("Unable to get your location. Please allow location access.");
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
      setError("You need to log in first.");
      return;
    }

    if (!selectedPetId) {
      setError("Please select a pet first.");
      return;
    }

    if (!form.location.trim()) {
      setError("Please select where your pet was last seen.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter a description.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const payload = {
        pet_id: Number(selectedPetId),
        last_seen_location: form.location.trim(),
        description: form.description.trim(),
        lat: form.lat !== "" ? Number(form.lat) : null,
        lng: form.lng !== "" ? Number(form.lng) : null,
      };

      const res = await fetch(`${apiBase}/premium/lost-found`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      if (!res.ok) {
        if (data.errors) {
          const firstError = Object.values(data.errors)?.[0];
          const errorText = Array.isArray(firstError) ? firstError[0] : null;
          throw new Error(errorText || data.message || "Failed to submit lost report.");
        }

        throw new Error(data.message || "Failed to submit lost report.");
      }

      setMessage("Lost pet report submitted successfully.");

      setTimeout(() => {
        navigate("/premium/lostfound");
      }, 1000);
    } catch (err) {
      setError(err.message || "Something went wrong while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="premium-report-page">
      <div className="premium-lf-topbar">
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
          <Link to="/premium-appointments">Appointments</Link>
          <Link to="/premium-reminders">Reminders</Link>
          <Link to="/premium/lostfound" className="active">
            Lost &amp; Found
          </Link>
          <Link to="/premium-community">Community</Link>
          <Link to="/premium-inventory">Inventory</Link>
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
      </div>

      <section className="premium-report-hero">
        <span className="premium-report-badge">PREMIUM FEATURE</span>
        <h2>Report Lost Pet</h2>
        <p>
          Select an existing pet profile, auto-fill the key details, and add the
          lost report information with Google Maps for faster, cleaner reporting.
        </p>
      </section>

      {message && <div className="premium-lf-info-box">{message}</div>}
      {error && <div className="premium-lf-info-box error">{error}</div>}

      <div className="premium-report-grid">
        <section className="premium-report-panel">
          <h3>Select a Pet</h3>
          <p className="premium-report-sub">Choose from My Pets</p>

          <div className="premium-report-field">
            <select
              value={selectedPetId}
              onChange={(e) => handlePetChange(e.target.value)}
              disabled={loadingPets || !token}
            >
              <option value="">Select a pet</option>
              {loadingPets ? (
                <option disabled>Loading pets...</option>
              ) : (
                pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} {pet.breed ? `• ${pet.breed}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
        </section>

        <form className="premium-report-form" onSubmit={handleSubmit}>
          <h3>Lost Report Details</h3>

          <div className="premium-report-row">
            <div className="premium-report-field">
              <label>Pet Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Pet name"
                readOnly
              />
            </div>

            <div className="premium-report-field">
              <label>Species</label>
              <input
                type="text"
                name="species"
                value={form.species}
                onChange={handleChange}
                placeholder="Species"
                readOnly
              />
            </div>
          </div>

          <div className="premium-report-field">
            <label>Breed</label>
            <input
              type="text"
              name="breed"
              value={form.breed}
              onChange={handleChange}
              placeholder="Breed"
              readOnly
            />
          </div>

          <div className="premium-report-field">
            <label>Where was your pet last seen? *</label>
            <input
              ref={locationInputRef}
              type="text"
              placeholder="Search area, road, park, or landmark"
              autoComplete="off"
            />
          </div>

          <div className="premium-report-row premium-report-row-single">
            <button
              type="button"
              className="premium-report-location-btn"
              onClick={handleUseMyLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? "Getting Location..." : "Use My Current Location"}
            </button>
          </div>

          <div className="premium-report-field">
            <label>Map Preview</label>
            <div
              ref={mapRef}
              style={{
                width: "100%",
                height: "260px",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid rgba(223, 228, 243, 0.98)",
                background: "rgba(255, 255, 255, 0.82)",
              }}
            />
          </div>

          <div className="premium-report-field">
            <label>Selected Address</label>
            <input
              type="text"
              value={form.location}
              readOnly
              placeholder="Selected location will appear here"
            />
          </div>

          <div className="premium-report-field">
            <label>Date &amp; Time Reported Lost</label>
            <input
              type="datetime-local"
              name="lost_at"
              value={form.lost_at}
              onChange={handleChange}
            />
          </div>

          <div className="premium-report-field">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Add behaviour, collar, markings, and last seen details"
              rows="5"
            />
          </div>

          <label className="premium-report-checkbox">
            <input
              type="checkbox"
              name="priority"
              checked={form.priority}
              onChange={handleChange}
            />
            Mark as priority premium report
          </label>

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
              disabled={submitting || !token}
            >
              {submitting ? "Submitting..." : "Submit Lost Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}