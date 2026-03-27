import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./SubmitSighting.css";

export default function SubmitSighting() {
  const navigate = useNavigate();
  const locationPath = useLocation();
  const { id } = useParams();

  const [userName, setUserName] = useState("User");
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const [form, setForm] = useState({
    sighting_location: "",
    notes: "",
    photo: null,
  });

  useEffect(() => {
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
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem("pawfection_token");
    if (!token) {
      setStatus({ type: "error", message: "You must be logged in. Redirecting..." });
      setTimeout(() => navigate("/login"), 500);
      return;
    }

    const cleanLocation = form.sighting_location.trim();
    const cleanNotes = form.notes.trim();

    if (!cleanLocation) {
      setStatus({ type: "error", message: "Location is required." });
      return;
    }

    setStatus({ type: "loading", message: "Submitting sighting..." });

    try {
      const body = new FormData();
      body.append("location", cleanLocation);
      if (cleanNotes) body.append("notes", cleanNotes);
      if (form.photo) body.append("photo", form.photo);

      const res = await fetch(`http://127.0.0.1:8000/api/lost-pets/${id}/sightings`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (res.status === 401) {
        localStorage.removeItem("pawfection_token");
        setStatus({ type: "error", message: "Session expired. Please log in again." });
        setTimeout(() => navigate("/login"), 700);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to submit sighting.";

        setStatus({ type: "error", message });
        return;
      }

      setStatus({
        type: "success",
        message: data?.message || "Sighting submitted successfully.",
      });

      setTimeout(() => navigate("/lostfound"), 900);
    } catch {
      setStatus({
        type: "error",
        message: "Failed to submit sighting. Is the backend running?",
      });
    }
  }

  return (
    <div className="pf2-shell">
      <aside className="pf2-sidebar">
        <div
          className="pf2-brand"
          onClick={() => navigate("/dashboard")}
          role="button"
        >
          <img className="pf2-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pf2-brand-text">
            <div className="pf2-brand-title">Pawfection</div>
            <div className="pf2-brand-sub">Submit Sighting</div>
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
            className={`pf2-nav-item ${locationPath.pathname.includes("/lostfound") ? "active" : ""}`}
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
            <input placeholder="Submit a sighting update..." disabled />
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
          <div className="sbs-head">
            <div>
              <h1 className="sbs-title">Submit Found / Sighting</h1>
              <p className="sbs-subtitle">
                Share where the pet was seen so the owner can be notified quickly.
              </p>
            </div>

            <div className="sbs-head-actions">
              <button className="pf2-btn" onClick={() => navigate("/lostfound")}>
                Back
              </button>
            </div>
          </div>

          {status.message && status.type === "error" && (
            <div className="sbs-alert">{status.message}</div>
          )}

          {status.message && status.type === "success" && (
            <div className="sbs-success">{status.message}</div>
          )}

          {status.message && status.type === "loading" && (
            <div className="sbs-empty">{status.message}</div>
          )}

          <section className="sbs-grid">
            <div className="sbs-card">
              <div className="sbs-cardtop">
                <div>
                  <div className="sbs-cardtitle">Sighting form</div>
                  <div className="sbs-mini">
                    Location is required. Photo is optional. The pet owner will be notified.
                  </div>
                </div>
              </div>

              <form className="sbs-form" onSubmit={handleSubmit}>
                <div className="sbs-formgrid">
                  <div className="sbs-field">
                    <label>Location *</label>
                    <input
                      value={form.sighting_location}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          sighting_location: e.target.value,
                        }))
                      }
                      placeholder="e.g. Tallaght, Dublin"
                    />
                  </div>

                  <div className="sbs-field sbs-span2">
                    <label>Notes</label>
                    <textarea
                      rows="5"
                      value={form.notes}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Add anything helpful like time seen, direction, collar, behaviour, or nearby landmarks."
                    />
                  </div>

                  <div className="sbs-field">
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
                    <div className="sbs-help">A photo is optional but can help identify the pet.</div>
                  </div>
                </div>

                <div className="sbs-formactions">
                  <button
                    className="pf2-btn pf2-btn-primary"
                    type="submit"
                    disabled={status.type === "loading"}
                  >
                    {status.type === "loading" ? "Submitting..." : "Submit Sighting"}
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

            <div className="sbs-sidecard">
              <div className="sbs-cardtitle">Quick guide</div>
              <div className="sbs-mini">Tips to make the sighting more useful.</div>

              <div className="sbs-guide-list">
                <div className="sbs-guide-item">
                  <div className="sbs-guide-label">Location</div>
                  <div className="sbs-guide-text">
                    Add the nearest place, road, shop, or landmark.
                  </div>
                </div>

                <div className="sbs-guide-item">
                  <div className="sbs-guide-label">Timing</div>
                  <div className="sbs-guide-text">
                    Mention when you saw the pet if you know the time.
                  </div>
                </div>

                <div className="sbs-guide-item">
                  <div className="sbs-guide-label">Behaviour</div>
                  <div className="sbs-guide-text">
                    Include details like running direction, collar, or nervous behaviour.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}