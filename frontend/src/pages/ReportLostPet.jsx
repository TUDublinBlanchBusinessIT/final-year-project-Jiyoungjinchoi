import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumDashboard.css";
import "./LostFoundPremium.css";

export default function ReportLostPet() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const accountType = String(
    localStorage.getItem("pawfection_account_type") || "basic"
  ).toLowerCase();
  const isPremiumUser = accountType === "premium";

  const [userName, setUserName] = useState("User");
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);

  const [status, setStatus] = useState({ type: "idle", message: "" });

  const [form, setForm] = useState({
    pet_id: "",
    description: "",
    last_seen_location: "",
    last_seen_lat: "",
    last_seen_lng: "",
    photo: null,
  });

  const [isPriority, setIsPriority] = useState(false);

  const authHeaders = useMemo(() => {
    return token
      ? {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        }
      : {
          Accept: "application/json",
        };
  }, [token]);

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const fieldStyle = {
    width: "100%",
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(117, 70, 46, 0.12)",
    padding: "0 14px",
    outline: "none",
    background: "rgba(255, 251, 248, 0.96)",
    color: "#6f402c",
    fontWeight: 700,
    boxShadow: "var(--pfd-shadow-sm)",
  };

  const textareaStyle = {
    width: "100%",
    borderRadius: 16,
    border: "1px solid rgba(117, 70, 46, 0.12)",
    padding: 12,
    resize: "vertical",
    boxSizing: "border-box",
    background: "rgba(255, 251, 248, 0.96)",
    color: "#6f402c",
    fontWeight: 700,
    boxShadow: "var(--pfd-shadow-sm)",
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name) setUserName(userObj.name);
      }
    } catch {
      setUserName("User");
    }

    loadPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPets = async () => {
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
        const list = Array.isArray(data) ? data : data?.pets || [];
        setPets(Array.isArray(list) ? list : []);
      }
    } catch {
      setPets([]);
      setStatus({
        type: "error",
        message: "Server error while loading pets.",
      });
    } finally {
      setLoadingPets(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus({
        type: "error",
        message: "Geolocation is not supported in this browser.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          last_seen_lat: String(pos.coords.latitude),
          last_seen_lng: String(pos.coords.longitude),
        }));
        setStatus({
          type: "success",
          message: "Location detected successfully.",
        });
      },
      () => {
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

    if (!form.pet_id) {
      setStatus({ type: "error", message: "Please select a pet." });
      return;
    }

    if (!form.description.trim() || !form.last_seen_location.trim()) {
      setStatus({
        type: "error",
        message: "Description and last seen location are required.",
      });
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

      body.append("is_priority", isPremiumUser && isPriority ? "1" : "0");

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
        throw new Error(message);
      }

      setStatus({
        type: "success",
        message:
          isPremiumUser && isPriority
            ? "Priority lost pet report submitted successfully."
            : "Lost pet report submitted successfully.",
      });

      setTimeout(() => {
        navigate("/lostfound");
      }, 900);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Failed to submit lost report.",
      });
    }
  };

  return (
    <div className="pfd-shell">
      <header className="pfd-site-header">
        <div
          className="pfd-brand"
          onClick={() => navigate(isPremiumUser ? "/premium-dashboard" : "/dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate(isPremiumUser ? "/premium-dashboard" : "/dashboard");
            }
          }}
        >
          <img className="pfd-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pfd-brand-copy">
            <div className="pfd-brand-title">Pawfection</div>
            <div className="pfd-brand-sub">Report Lost Pet</div>
          </div>
        </div>

        <nav className="pfd-topnav">
          <Link className="pfd-topnav-item" to={isPremiumUser ? "/premium-dashboard" : "/dashboard"}>
            {isPremiumUser ? "Premium My Pet" : "Dashboard"}
          </Link>
          <Link className="pfd-topnav-item" to="/mypets">
            My Pets
          </Link>
          <Link className="pfd-topnav-item" to="/appointments">
            Appointments
          </Link>
          <Link className="pfd-topnav-item" to="/reminders">
            Reminders
          </Link>
          <Link className="pfd-topnav-item active" to="/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pfd-topnav-item" to="/community">
            Community
          </Link>
          <Link className="pfd-topnav-item" to="/inventory">
            Inventory
          </Link>
          <Link className="pfd-topnav-item" to="/profile">
            Profile
          </Link>
        </nav>

        <div className="pfd-header-side">
          <div className="pfd-header-meta">
            <div className="pfd-date-pill">{todayText}</div>

            <div className="pfd-userchip" title={userName}>
              <div className="pfd-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pfd-userchip-text">
                <div className="pfd-userchip-name">{userName}</div>
                <div className="pfd-userchip-sub">
                  {isPremiumUser ? "Premium User" : "Standard User"}
                </div>
              </div>
            </div>
          </div>

          <div className="pfd-search">
            <input placeholder="Create a lost pet alert..." disabled />
          </div>
        </div>
      </header>

      <main className="pfd-main">
        <section className="pfd-hero plf-hero">
          <span className="pfd-doodle pfd-doodle-paw-1">🐾</span>
          <span className="pfd-doodle pfd-doodle-paw-2">🐾</span>
          <span className="pfd-doodle pfd-doodle-bone">📍</span>
          <span className="pfd-doodle pfd-doodle-cat">🚨</span>

          <div className="pfd-hero-copy">
            <div className="pfd-kicker">
              {isPremiumUser ? "Premium Safety Alert" : "Community Lost Report"}
            </div>
            <h1 className="pfd-hero-title">Report Lost Pet</h1>
            <p className="pfd-hero-text">
              Create a community alert with your pet details, last known location, and photo.
              Premium users can boost visibility with Priority Alert.
            </p>

            <div className="pfd-hero-chips">
              <div className="pfd-chip">📍 add location</div>
              <div className="pfd-chip">📷 upload photo</div>
              <div className="pfd-chip">
                {isPremiumUser ? "🚨 priority available" : "🔒 priority locked"}
              </div>
            </div>

            <div className="pfd-hero-actions">
              <button className="pfd-btn pfd-btn-primary" onClick={useMyLocation}>
                Use My Location
              </button>
              <button className="pfd-btn" onClick={() => navigate("/lostfound")}>
                Back to Lost &amp; Found
              </button>
              {!isPremiumUser && (
                <button
                  className="pfd-btn"
                  onClick={() => navigate("/upgrade-premium")}
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>

          <div className="pfd-hero-visual">
            <div className="pfd-speech pfd-speech-left">
              <div className="pfd-speech-title">Visibility</div>
              <div className="pfd-speech-text">
                {isPremiumUser
                  ? "Priority Alert can boost visibility for this report."
                  : "Standard lost reports are still visible to the community."}
              </div>
            </div>

            <article className="pfd-hero-photo-card">
              <div className="pfd-photo-empty">
                <div className="pfd-photo-empty-icon">🐶</div>
                <div className="pfd-photo-empty-title">Lost report spotlight</div>
                <div className="pfd-photo-empty-text">
                  Add a clear description and recent photo so nearby users can recognise your pet.
                </div>
              </div>

              <div className="pfd-hero-photo-overlay">
                <div className="pfd-card-kicker pfd-card-kicker-light">New report</div>
                <div className="pfd-hero-photo-name">Your Pet Alert</div>
                <div className="pfd-hero-photo-meta">
                  Community sightings, nearby search, and faster recognition.
                </div>
              </div>
            </article>

            <div className="pfd-speech pfd-speech-right">
              <div className="pfd-speech-title">Tip</div>
              <div className="pfd-speech-text">
                Use the exact last-seen location and distinctive markings.
              </div>
            </div>
          </div>
        </section>

        {status.message && (
          <div className={status.type === "error" ? "plf-alert" : status.type === "success" ? "plf-success" : "pfd-empty"} style={{ marginTop: 16 }}>
            {status.message}
          </div>
        )}

        <section className="pfd-collage">
          <article className="pfd-card pfd-span-2 plf-card-soft">
            <div className="pfd-card-head">
              <div>
                <div className="pfd-card-kicker">Lost report form</div>
                <h2>Create Alert</h2>
                <p>Select one of your pets and submit a clear lost-pet report.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="plf-report-form-wrap">
              <div className="plf-report-form-grid-2">
                <div className="plf-report-form-card">
                  <h3 className="plf-report-form-title">Pet Selection</h3>
                  <div className="plf-report-form-sub">
                    Choose the pet profile you want to mark as lost.
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <select
                      value={form.pet_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, pet_id: e.target.value }))}
                      style={fieldStyle}
                      disabled={loadingPets}
                    >
                      <option value="">
                        {loadingPets ? "Loading pets..." : "Choose one of your pets"}
                      </option>
                      {pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name} {pet.breed ? `• ${pet.breed}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="plf-report-form-card">
                  <h3 className="plf-report-form-title">Last Seen</h3>
                  <div className="plf-report-form-sub">
                    Add the most accurate location to help nearby users respond quickly.
                  </div>

                  <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                    <input
                      type="text"
                      value={form.last_seen_location}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, last_seen_location: e.target.value }))
                      }
                      placeholder="e.g. Blanchardstown Shopping Centre, Dublin 15"
                      style={fieldStyle}
                    />

                    <div className="plf-inline-actions">
                      <button type="button" className="pfd-btn" onClick={useMyLocation}>
                        Use My Location
                      </button>

                      {form.last_seen_lat && form.last_seen_lng && (
                        <div className="pfd-chip">📍 Coordinates added</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="plf-report-form-card">
                <h3 className="plf-report-form-title">Description</h3>
                <div className="plf-report-form-sub">
                  Include collar details, colour, markings, behaviour, and where the pet was heading.
                </div>

                <div style={{ marginTop: 14 }}>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe where and when your pet went missing, collar details, markings, behaviour, etc."
                    style={textareaStyle}
                  />
                </div>
              </div>

              <div className="plf-report-form-grid-2">
                <div className="plf-report-form-card">
                  <h3 className="plf-report-form-title">Photo</h3>
                  <div className="plf-report-form-sub">
                    Upload a recent image to improve recognition.
                  </div>

                  <div style={{ marginTop: 14 }}>
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
                    <div className="plf-upload-note">
                      A recent, clear photo helps the community identify your pet faster.
                    </div>
                  </div>
                </div>

                <div className={`plf-priority-box ${isPremiumUser ? "premium" : ""}`}>
                  <div className="plf-priority-head">
                    <input
                      type="checkbox"
                      checked={isPriority}
                      onChange={(e) => setIsPriority(e.target.checked)}
                      disabled={!isPremiumUser}
                    />
                    <span className="plf-priority-label">
                      Priority Alert {isPremiumUser ? "(Premium)" : "(Upgrade to Premium)"}
                    </span>
                  </div>

                  <div className="plf-priority-note">
                    {isPremiumUser
                      ? "Priority reports are highlighted and boosted in premium Lost & Found."
                      : "Standard users can still report lost pets, but priority boosting is a premium feature."}
                  </div>

                  {!isPremiumUser && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        className="pfd-btn pfd-btn-small"
                        onClick={() => navigate("/upgrade-premium")}
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="plf-inline-actions">
                <button
                  type="submit"
                  className="pfd-btn pfd-btn-primary"
                  disabled={status.type === "loading"}
                >
                  {status.type === "loading" ? "Submitting..." : "Submit Lost Report"}
                </button>

                <button
                  type="button"
                  className="pfd-btn"
                  onClick={() => navigate("/lostfound")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </article>

          <article className="pfd-card pfd-card-care">
            <div className="pfd-card-kicker">Quick guide</div>

            <div className="pfd-care-ring">
              <div className="pfd-care-ring-value">{isPremiumUser ? "⭐" : "📍"}</div>
              <div className="pfd-care-ring-text">
                {isPremiumUser ? "premium alert" : "standard alert"}
              </div>
            </div>

            <div className="pfd-care-block">
              <div className="pfd-care-label">Best results</div>
              <div className="pfd-care-main">Clear details</div>
              <div className="pfd-care-sub">
                Include the exact location, a recent photo, and your pet’s standout features.
              </div>
            </div>

            <div className="pfd-care-divider" />

            <div className="pfd-care-block">
              <div className="pfd-care-label">Premium boost</div>
              <div className="pfd-care-main">
                {isPremiumUser ? "Enabled" : "Locked"}
              </div>
              <div className="pfd-care-sub">
                {isPremiumUser
                  ? "Priority Alert can help your report stand out."
                  : "Upgrade to unlock boosted report visibility."}
              </div>
            </div>

            <div className="pfd-care-actions">
              <button className="pfd-btn pfd-btn-small" onClick={() => navigate("/lostfound")}>
                Back
              </button>
              {!isPremiumUser && (
                <button
                  className="pfd-btn pfd-btn-small"
                  onClick={() => navigate("/upgrade-premium")}
                >
                  Upgrade
                </button>
              )}
            </div>
          </article>

          <article className="pfd-banner pfd-span-3">
            <span className="pfd-banner-paw pfd-banner-paw-1">🐾</span>
            <span className="pfd-banner-paw pfd-banner-paw-2">🐾</span>
            <span className="pfd-banner-bone">📍</span>

            <div className="pfd-banner-copy">
              <div className="pfd-card-kicker pfd-card-kicker-light">Lost & found network</div>
              <h2>
                {isPremiumUser
                  ? "Create a premium-priority lost alert with stronger visibility."
                  : "Create a lost-pet report and let the community help with sightings."}
              </h2>
              <div className="pfd-banner-divider">
                report, alert, locate, reunite 🐾
              </div>
            </div>

            <div className="pfd-banner-actions">
              <button className="pfd-quickaction" onClick={useMyLocation}>
                <span className="pfd-quickicon">🧭</span>
                <span>Use My Location</span>
              </button>

              <button className="pfd-quickaction" onClick={() => navigate("/lostfound")}>
                <span className="pfd-quickicon">↩️</span>
                <span>Back to Feed</span>
              </button>

              <button
                className="pfd-quickaction"
                onClick={() => navigate("/mypets")}
              >
                <span className="pfd-quickicon">🐶</span>
                <span>Open My Pets</span>
              </button>

              <button
                className="pfd-quickaction"
                onClick={() => navigate(isPremiumUser ? "/premium-dashboard" : "/dashboard")}
              >
                <span className="pfd-quickicon">🏠</span>
                <span>{isPremiumUser ? "Premium Dashboard" : "Dashboard"}</span>
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}