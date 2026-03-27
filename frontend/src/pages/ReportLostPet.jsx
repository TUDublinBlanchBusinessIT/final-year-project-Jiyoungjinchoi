import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./LostFoundBasic.css";
import "./ReportLostPet.css";

export default function ReportLostPet() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [usingLocation, setUsingLocation] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const [form, setForm] = useState({
    pet_id: "",
    description: "",
    last_seen_location: "",
    last_seen_lat: "",
    last_seen_lng: "",
    photo: null,
  });

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

  const fetchPets = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoadingPets(true);
    setStatus({ type: "idle", message: "" });

    try {
      const res = await fetch(`${apiBase}/pets`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPets([]);
        setStatus({
          type: "error",
          message: data?.message || "Failed to load pets.",
        });
      } else {
        const list = Array.isArray(data) ? data : data?.pets || data?.data || [];
        setPets(Array.isArray(list) ? list : []);
      }
    } catch {
      setPets([]);
      setStatus({
        type: "error",
        message: "Server error. Is your backend running?",
      });
    } finally {
      setLoadingPets(false);
    }
  };

  const resetForm = () => {
    setForm({
      pet_id: "",
      description: "",
      last_seen_location: "",
      last_seen_lat: "",
      last_seen_lng: "",
      photo: null,
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus({
        type: "error",
        message: "Geolocation is not supported in this browser.",
      });
      return;
    }

    setUsingLocation(true);
    setStatus({ type: "idle", message: "" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = String(pos.coords.latitude);
        const lng = String(pos.coords.longitude);
        const visibleLocation = `Lat ${Number(lat).toFixed(5)}, Lng ${Number(lng).toFixed(5)}`;

        setForm((prev) => ({
          ...prev,
          last_seen_lat: lat,
          last_seen_lng: lng,
          last_seen_location: visibleLocation,
        }));

        setUsingLocation(false);
        setStatus({
          type: "success",
          message: "Location detected successfully.",
        });
      },
      () => {
        setUsingLocation(false);
        setStatus({
          type: "error",
          message: "Location permission denied.",
        });
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    setStatus({ type: "idle", message: "" });

    if (!form.pet_id) {
      setStatus({ type: "error", message: "Please select a pet." });
      return;
    }

    if (!form.last_seen_location.trim()) {
      setStatus({ type: "error", message: "Please enter the last seen location." });
      return;
    }

    if (!form.description.trim()) {
      setStatus({ type: "error", message: "Please enter a description." });
      return;
    }

    setStatus({ type: "loading", message: "Submitting lost pet report..." });

    try {
      const body = new FormData();
      body.append("pet_id", form.pet_id);
      body.append("description", form.description.trim());
      body.append("last_seen_location", form.last_seen_location.trim());

      if (form.last_seen_lat) body.append("last_seen_lat", form.last_seen_lat);
      if (form.last_seen_lng) body.append("last_seen_lng", form.last_seen_lng);
      if (form.photo) body.append("photo", form.photo);

      body.append("is_priority", "0");

      const res = await fetch(`${apiBase}/lost-pets`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to submit lost report.";

        setStatus({ type: "error", message });
        return;
      }

      setStatus({
        type: "success",
        message: "Lost pet report submitted successfully.",
      });

      resetForm();

      setTimeout(() => {
        navigate("/lostfound");
      }, 1000);
    } catch {
      setStatus({
        type: "error",
        message: "Failed to submit lost report. Is the backend running?",
      });
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadUserName();
    fetchPets();
  }, []);

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
          <Link className="pf2-nav-item" to="/dashboard">
            Dashboard
          </Link>
          <Link className="pf2-nav-item" to="/mypets">
            My Pets
          </Link>
          <Link className="pf2-nav-item" to="/appointments">
            Appointments
          </Link>
          <Link className="pf2-nav-item" to="/reminders">
            Reminders
          </Link>
          <Link
            className={`pf2-nav-item ${location.pathname.includes("/lostfound") ? "active" : ""}`}
            to="/lostfound"
          >
            Lost &amp; Found
          </Link>
          <Link className="pf2-nav-item" to="/community">
            Community
          </Link>
          <Link className="pf2-nav-item" to="/inventory">
            Inventory
          </Link>
          <Link className="pf2-nav-item" to="/upgrade-premium">
            Premium My Pet
          </Link>
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
            <input placeholder="Create a lost pet alert..." disabled />
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
              <h1 className="lf2-title">Report Lost Pet</h1>
              <p className="lf2-subtitle">
                Create a community alert with your pet details, last seen location, description, and photo.
              </p>
            </div>
          </div>

          {status.message && status.type === "error" && (
            <div className="prl-alert">{status.message}</div>
          )}

          {status.message && status.type === "success" && (
            <div className="prl-success">{status.message}</div>
          )}

          {status.message && status.type === "loading" && (
            <div className="prl-empty">{status.message}</div>
          )}

          <section className="lf2-grid-top">
            <div className="lf2-card">
              <div className="lf2-cardtop">
                <div>
                  <div className="lf2-cardtitle">Lost pet report form</div>
                  <div className="lf2-mini">
                    Fill in the details below so the community can help identify and locate your pet faster.
                  </div>
                </div>

                <div className="lf2-actions-right">
                  <button
                    className="pf2-btn pf2-btn-primary"
                    type="button"
                    onClick={useMyLocation}
                    disabled={usingLocation}
                  >
                    {usingLocation ? "Locating..." : "Use My Location"}
                  </button>

                  <button className="pf2-btn" type="button" onClick={() => navigate("/lostfound")}>
                    Back
                  </button>
                </div>
              </div>

              <form className="prl-form" onSubmit={handleSubmit}>
                <div className="prl-formgrid">
                  <div className="prl-field">
                    <label>Select pet *</label>
                    <select
                      value={form.pet_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, pet_id: e.target.value }))}
                      disabled={loadingPets}
                    >
                      <option value="">
                        {loadingPets ? "Loading pets..." : "-- Choose --"}
                      </option>
                      {pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name} {pet.breed ? `• ${pet.breed}` : ""}
                        </option>
                      ))}
                    </select>
                    {!loadingPets && pets.length === 0 && (
                      <div className="prl-help">No pets found. Add a pet first.</div>
                    )}
                  </div>

                  <div className="prl-field">
                    <label>Last seen location *</label>
                    <input
                      value={form.last_seen_location}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          last_seen_location: e.target.value,
                        }))
                      }
                      placeholder="e.g. Blanchardstown Shopping Centre, Dublin 15"
                    />
                    <div className="prl-inline-actions">
                      {form.last_seen_lat && form.last_seen_lng && (
                        <span className="prl-badge">Coordinates added</span>
                      )}
                    </div>
                  </div>

                  <div className="prl-field prl-span2">
                    <label>Description *</label>
                    <textarea
                      rows="5"
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe where and when your pet went missing, collar details, colour, markings, behaviour, and any helpful information."
                    />
                  </div>

                  <div className="prl-field">
                    <label>Upload photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          photo: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    <div className="prl-help">A recent, clear photo improves recognition.</div>
                  </div>
                </div>

                <div className="prl-formactions">
                  <button
                    className="pf2-btn pf2-btn-primary"
                    type="submit"
                    disabled={status.type === "loading"}
                  >
                    {status.type === "loading" ? "Submitting..." : "Submit Lost Report"}
                  </button>

                  <button
                    className="pf2-btn"
                    type="button"
                    onClick={() => navigate("/lostfound")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            <div className="lf2-card">
              <div className="lf2-cardtitle">Quick guide</div>
              <div className="lf2-mini">Tips to improve the quality of your report.</div>

              <div className="lf2-guide-list">
                <div className="lf2-guide-item">
                  <div className="lf2-guide-label">Best location</div>
                  <div className="lf2-guide-text">
                    Add the most accurate last seen place possible.
                  </div>
                </div>

                <div className="lf2-guide-item">
                  <div className="lf2-guide-label">Best photo</div>
                  <div className="lf2-guide-text">
                    Use a clear and recent image of your pet.
                  </div>
                </div>

                <div className="lf2-guide-item">
                  <div className="lf2-guide-label">Description</div>
                  <div className="lf2-guide-text">
                    Mention colour, collar, markings, and behaviour.
                  </div>
                </div>

                <div className="lf2-guide-item">
                  <div className="lf2-guide-label">Basic account</div>
                  <div className="lf2-guide-text">
                    Basic users can submit normal community lost pet alerts.
                  </div>
                </div>
              </div>

              <div className="prl-side-actions">
                <button className="pf2-btn pf2-btn-small" onClick={fetchPets}>
                  {loadingPets ? "Refreshing..." : "Refresh Pets"}
                </button>

                <button
                  className="pf2-btn pf2-btn-small"
                  onClick={() => navigate("/mypets")}
                >
                  Open My Pets
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}