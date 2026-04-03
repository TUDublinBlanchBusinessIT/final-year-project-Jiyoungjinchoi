import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumReportLostPet.css";

export default function ReportLostPet() {
  const navigate = useNavigate();
  const apiBase = "http://127.0.0.1:8000/api";

  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("Premium User");
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [matchingTypedLocation, setMatchingTypedLocation] = useState(false);

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
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("pawfection_token") || "";
    setToken(savedToken);

    if (!savedToken) {
      setError("You need to log in first.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
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

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "location") {
        updated.lat = "";
        updated.lng = "";
      }

      return updated;
    });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);

        setForm((prev) => ({
          ...prev,
          location: `Lat ${lat}, Lng ${lng}`,
          lat,
          lng,
        }));

        setMessage("Current location captured successfully.");
        setError("");
      },
      () => {
        alert("Unable to get your location. Please allow location access.");
      }
    );
  };

  const handleUseTypedLocation = async () => {
    const typedLocation = form.location.trim();

    if (!typedLocation) {
      setError("Please type a location first.");
      setMessage("");
      return;
    }

    try {
      setMatchingTypedLocation(true);
      setError("");
      setMessage("");

      const query = new URLSearchParams({
        q: typedLocation,
        format: "jsonv2",
        limit: "1",
      }).toString();

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => []);

      if (!response.ok || !Array.isArray(data) || data.length === 0) {
        throw new Error("Could not match that typed location.");
      }

      const match = data[0];

      setForm((prev) => ({
        ...prev,
        location: typedLocation,
        lat: match.lat,
        lng: match.lon,
      }));

      setMessage("Typed location matched successfully.");
    } catch (err) {
      setError(err.message || "Failed to match typed location.");
      setMessage("");
    } finally {
      setMatchingTypedLocation(false);
    }
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
      setError("Please enter where your pet was last seen.");
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
          lost report information for faster reporting.
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
            <label>Where was your pet last seen?</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Kerry, Cabra, Dublin or O'Connell Street"
            />
          </div>

          <div className="premium-report-row">
            <button
              type="button"
              className="premium-report-location-btn"
              onClick={handleUseMyLocation}
            >
              Use My Current Location
            </button>

            <button
              type="button"
              className="premium-report-location-btn"
              onClick={handleUseTypedLocation}
              disabled={matchingTypedLocation}
            >
              {matchingTypedLocation ? "Matching Location..." : "Use Typed Location"}
            </button>
          </div>

          <div className="premium-report-row">
            <div className="premium-report-field">
              <label>Latitude</label>
              <input
                type="text"
                value={form.lat}
                readOnly
                placeholder="Auto-filled"
              />
            </div>

            <div className="premium-report-field">
              <label>Longitude</label>
              <input
                type="text"
                value={form.lng}
                readOnly
                placeholder="Auto-filled"
              />
            </div>
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