import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumSubmitSighting.css";

export default function PremiumSubmitSighting() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [userName, setUserName] = useState("Premium User");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    sighting_location: "",
    notes: "",
    photo: null,
  });

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

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setForm((prev) => ({
          ...prev,
          sighting_location: `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`,
        }));
      },
      () => {
        alert("Unable to get your current location.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("pawfection_token");
    if (!token) {
      alert("You must be logged in.");
      navigate("/login");
      return;
    }

    if (!form.sighting_location.trim()) {
      alert("Location is required.");
      return;
    }

    setSubmitting(true);

    try {
      const body = new FormData();
      body.append("pet_id", id);
      body.append("location", form.sighting_location.trim());

      if (form.notes.trim()) {
        body.append("notes", form.notes.trim());
      }

      if (form.photo) {
        body.append("photo", form.photo);
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/lost-pets/${id}/sightings`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Failed to submit sighting:", data);

        const firstError =
          data?.message ||
          (data?.errors && Object.values(data.errors)?.[0]?.[0]) ||
          "Failed to submit sighting.";

        alert(firstError);
        return;
      }

      alert(data?.message || "Sighting submitted successfully.");
      navigate("/premium/lostfound");
    } catch (error) {
      console.error("Submit sighting error:", error);
      alert("Something went wrong while submitting the sighting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="premium-sighting-page">
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
          <Link to="/premium/vet-chat">AI Vet Chat</Link>
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

      <section className="premium-sighting-hero">
        <span className="premium-sighting-badge">PREMIUM FEATURE</span>
        <h2>Submit Sighting</h2>
        <p>
          Share where the pet was seen so the owner can be notified quickly and
          take action faster.
        </p>
      </section>

      <div className="premium-sighting-grid">
        <div className="premium-sighting-panel">
          <h3>Sighting Form</h3>
          <p className="premium-sighting-sub">
            Location is required. Photo is optional. The pet owner will be notified.
          </p>

          <form className="premium-sighting-form" onSubmit={handleSubmit}>
            <div className="premium-sighting-field">
              <label>Location *</label>
              <input
                type="text"
                name="sighting_location"
                value={form.sighting_location}
                onChange={handleChange}
                placeholder="e.g. Tallaght, Dublin"
                required
              />
            </div>

            <button
              type="button"
              className="premium-sighting-location-btn"
              onClick={useCurrentLocation}
            >
              Use My Current Location
            </button>

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
              <small className="premium-sighting-help">
                A photo is optional but can help identify the pet.
              </small>
            </div>

            <div className="premium-sighting-actions">
              <button
                type="button"
                className="premium-sighting-cancel-btn"
                onClick={() => navigate("/premium/lostfound")}
              >
                Cancel
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
        </div>

        <div className="premium-sighting-side">
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
        </div>
      </div>
    </div>
  );
}