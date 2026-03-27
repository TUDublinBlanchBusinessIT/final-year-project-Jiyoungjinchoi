import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumReportLostPet.css";

export default function PremiumReportLostPet() {
  const navigate = useNavigate();
  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("Premium User");

  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState("");

  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedPet, setSelectedPet] = useState(null);

  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    lost_description: "",
    last_seen_location: "",
    last_seen_lat: "",
    last_seen_lng: "",
    reported_lost_at: "",
    is_priority: false,
  });

  useEffect(() => {
    const savedName = localStorage.getItem("pawfection_user_name");
    if (savedName) setUserName(savedName);
  }, []);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setPetsLoading(true);
        setPetsError("");

        const res = await fetch(`${apiBase}/pets`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load pets");
        }

        setPets(Array.isArray(data) ? data : data.pets || []);
      } catch (error) {
        console.error("Failed to load pets:", error);
        setPetsError("Unable to load your pet profiles.");
      } finally {
        setPetsLoading(false);
      }
    };

    if (token) {
      fetchPets();
    }
  }, [apiBase, token]);

  useEffect(() => {
    const pet =
      pets.find((item) => String(item.id) === String(selectedPetId)) || null;

    setSelectedPet(pet);

    if (pet) {
      setForm((prev) => ({
        ...prev,
        name: pet.name || "",
        species: pet.species || "",
        breed: pet.breed || "",
      }));
    }
  }, [selectedPetId, pets]);

  const petOptions = useMemo(() => {
    return pets.map((pet) => ({
      id: pet.id,
      label: `${pet.name || "Unnamed Pet"}${pet.breed ? ` • ${pet.breed}` : ""}`,
    }));
  }, [pets]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          last_seen_lat: position.coords.latitude,
          last_seen_lng: position.coords.longitude,
        }));
      },
      () => {
        alert("Unable to get your location.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPetId) {
      alert("Please select one of your pets first.");
      return;
    }

    try {
      const payload = {
        is_lost: true,
        is_priority: form.is_priority,
        lost_description: form.lost_description,
        last_seen_location: form.last_seen_location,
        last_seen_lat: form.last_seen_lat || null,
        last_seen_lng: form.last_seen_lng || null,
        reported_lost_at: form.reported_lost_at || null,
      };

      console.log("Submitting payload:", payload);

      const res = await fetch(`${apiBase}/pets/${selectedPetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Submit response:", data);

      if (!res.ok) {
        throw new Error(
          data.message ||
            JSON.stringify(data.errors) ||
            "Failed to report pet as lost."
        );
      }

      alert("Lost pet report submitted successfully.");
      navigate("/premium/lostfound");
    } catch (error) {
      console.error("Failed to submit lost pet report:", error);
      alert(error.message || "Unable to submit lost pet report.");
    }
  };

  return (
    <div className="premium-report-page">
      <header className="premium-report-topbar">
        <div className="premium-report-brand">
          <img
            src={PawfectionLogo}
            alt="Pawfection Logo"
            className="premium-report-logo"
          />
          <div>
            <h1>Pawfection</h1>
            <p>Premium Lost Report</p>
          </div>
        </div>

        <nav className="premium-report-nav">
          <Link to="/premium-dashboard">Dashboard</Link>
          <Link to="/premium-mypets">My Pets</Link>
          <Link to="/premium/lostfound" className="active">
            Lost &amp; Found
          </Link>
          <Link to="/premium/profile">Profile</Link>
        </nav>

        <div className="premium-report-userchip">
          <div className="premium-report-avatar">{userName?.charAt(0) || "P"}</div>
          <div>
            <strong>{userName}</strong>
            <span>Premium User</span>
          </div>
        </div>
      </header>

      <section className="premium-report-hero">
        <div>
          <div className="premium-report-badge">PREMIUM FEATURE</div>
          <h2>Report Lost Pet from My Pets</h2>
          <p>
            Select an existing pet profile, auto-fill the key details, and add the
            lost report information for faster reporting.
          </p>
        </div>
      </section>

      {petsLoading && <div className="premium-report-info">Loading your pets...</div>}
      {petsError && <div className="premium-report-info error">{petsError}</div>}

      <div className="premium-report-grid">
        <section className="premium-report-card">
          <h3>Select a Pet</h3>
          <label className="premium-report-label">Choose from My Pets</label>
          <select
            className="premium-report-input"
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
          >
            <option value="">Select a pet</option>
            {petOptions.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.label}
              </option>
            ))}
          </select>

          {selectedPet && (
            <div className="premium-report-pet-preview">
              <img
                src={
                  selectedPet.photo_path
                    ? `http://127.0.0.1:8000/storage/${selectedPet.photo_path}`
                    : "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80"
                }
                alt={selectedPet.name}
              />
              <div>
                <h4>{selectedPet.name}</h4>
                <p>
                  {selectedPet.species} • {selectedPet.breed || "Unknown breed"}
                </p>
                <span>{selectedPet.gender || "Unknown gender"}</span>
              </div>
            </div>
          )}
        </section>

        <section className="premium-report-card">
          <h3>Lost Report Details</h3>

          <form onSubmit={handleSubmit} className="premium-report-form">
            <div className="premium-report-row">
              <div>
                <label className="premium-report-label">Pet Name</label>
                <input className="premium-report-input" value={form.name} disabled />
              </div>
              <div>
                <label className="premium-report-label">Species</label>
                <input className="premium-report-input" value={form.species} disabled />
              </div>
            </div>

            <div>
              <label className="premium-report-label">Breed</label>
              <input className="premium-report-input" value={form.breed} disabled />
            </div>

            <div>
              <label className="premium-report-label">Last Seen Location</label>
              <input
                type="text"
                name="last_seen_location"
                className="premium-report-input"
                value={form.last_seen_location}
                onChange={handleChange}
                placeholder="Enter last seen location"
                required
              />
            </div>

            <div className="premium-report-row">
              <div>
                <label className="premium-report-label">Latitude</label>
                <input
                  type="text"
                  name="last_seen_lat"
                  className="premium-report-input"
                  value={form.last_seen_lat}
                  onChange={handleChange}
                  placeholder="Latitude"
                />
              </div>
              <div>
                <label className="premium-report-label">Longitude</label>
                <input
                  type="text"
                  name="last_seen_lng"
                  className="premium-report-input"
                  value={form.last_seen_lng}
                  onChange={handleChange}
                  placeholder="Longitude"
                />
              </div>
            </div>

            <button
              type="button"
              className="premium-report-secondary-btn"
              onClick={handleUseMyLocation}
            >
              Use My Current Location
            </button>

            <div>
              <label className="premium-report-label">Date &amp; Time Reported Lost</label>
              <input
                type="datetime-local"
                name="reported_lost_at"
                className="premium-report-input"
                value={form.reported_lost_at}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="premium-report-label">Description</label>
              <textarea
                name="lost_description"
                className="premium-report-textarea"
                value={form.lost_description}
                onChange={handleChange}
                placeholder="Add behaviour, collar, markings, and last seen details"
                rows="5"
                required
              />
            </div>

            <label className="premium-report-checkbox">
              <input
                type="checkbox"
                name="is_priority"
                checked={form.is_priority}
                onChange={handleChange}
              />
              Mark as priority premium report
            </label>

            <div className="premium-report-actions">
              <button
                type="button"
                className="premium-report-secondary-btn"
                onClick={() => navigate("/premium/lostfound")}
              >
                Cancel
              </button>
              <button type="submit" className="premium-report-primary-btn">
                Submit Lost Report
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}