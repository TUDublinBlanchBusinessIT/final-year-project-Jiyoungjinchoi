import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./LostFoundPremium.css";

export default function PremiumLostReportDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const apiBase = "http://127.0.0.1:8000/api";
  const storageBase = "http://127.0.0.1:8000/storage";

  const [userName, setUserName] = useState("Premium User");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingResolved, setMarkingResolved] = useState(false);

  const fallbackImage =
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80";

  useEffect(() => {
    const savedName = localStorage.getItem("pawfection_user_name");
    if (savedName) setUserName(savedName);
  }, []);

  const getImageUrl = (pathOrUrl) => {
    if (!pathOrUrl) return null;

    if (
      String(pathOrUrl).startsWith("http://") ||
      String(pathOrUrl).startsWith("https://")
    ) {
      return pathOrUrl;
    }

    return `${storageBase}/${String(pathOrUrl).replace(/^\/+/, "")}`;
  };

  const resolvedImage = useMemo(() => {
    if (!report) return fallbackImage;

    return (
      report.display_photo_url ||
      report.lost_photo_url ||
      report.photo_url ||
      getImageUrl(report.lost_photo_path) ||
      getImageUrl(report.photo_path) ||
      report.image ||
      fallbackImage
    );
  }, [report]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${apiBase}/premium/lost-found/${id}`, {
          headers: {
            Accept: "application/json",
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load lost report details.");
        }

        setReport(data.report || data.pet || data);
      } catch (err) {
        console.error("Failed to load premium lost report details:", err);
        setError("Unable to load this lost report.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [apiBase, id]);

  const handleMarkResolved = async () => {
    try {
      setMarkingResolved(true);

      const token = localStorage.getItem("pawfection_token");

      const res = await fetch(`${apiBase}/pets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_lost: false,
          lost_status: "Resolved",
          resolved_at: new Date().toISOString(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to mark report as resolved.");
      }

      alert("Lost report marked as resolved.");
      navigate("/premium/lostfound");
    } catch (err) {
      console.error("Failed to mark resolved:", err);
      alert(err.message || "Unable to mark this report as resolved.");
    } finally {
      setMarkingResolved(false);
    }
  };

  if (loading) {
    return (
      <div className="premium-lf-page">
        <header className="premium-lf-topbar">
          <div className="premium-lf-brand">
            <img
              src={PawfectionLogo}
              alt="Pawfection Logo"
              className="premium-lf-logo"
            />
            <div>
              <h1>Pawfection</h1>
              <p>Premium Lost Report Details</p>
            </div>
          </div>
        </header>

        <div className="premium-lf-info-box">Loading lost report details...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="premium-lf-page">
        <header className="premium-lf-topbar">
          <div className="premium-lf-brand">
            <img
              src={PawfectionLogo}
              alt="Pawfection Logo"
              className="premium-lf-logo"
            />
            <div>
              <h1>Pawfection</h1>
              <p>Premium Lost Report Details</p>
            </div>
          </div>
        </header>

        <div className="premium-lf-info-box error">
          {error || "Report not found."}
        </div>

        <div style={{ padding: "0 24px 24px" }}>
          <button
            className="premium-lf-secondary-btn"
            onClick={() => navigate("/premium/lostfound")}
          >
            Back to Lost &amp; Found
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-lf-page">
      <header className="premium-lf-topbar">
        <div className="premium-lf-brand">
          <img
            src={PawfectionLogo}
            alt="Pawfection Logo"
            className="premium-lf-logo"
          />
          <div>
            <h1>Pawfection</h1>
            <p>Premium Lost Report Details</p>
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
          <Link to="/premium/profile">Profile</Link>
        </nav>

        <div className="premium-lf-userbar">
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

      <section className="premium-lf-main-hero">
        <div className="premium-lf-hero-left">
          <div className="premium-lf-badge">PREMIUM REPORT VIEW</div>
          <h2>Lost Report Details</h2>
          <p>
            View the full report, submit sightings, and help reunite the pet with
            its owner.
          </p>
        </div>
      </section>

      <section className="premium-lf-feature-grid">
        <div className="premium-lf-map-card">
          <div className="premium-lf-card-head">
            <div>
              <h3>Pet Details</h3>
              <p>Report information and last known details.</p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="premium-lf-secondary-btn"
                onClick={() => navigate("/premium/lostfound")}
              >
                Back
              </button>

              <button
                className="premium-lf-primary-btn"
                onClick={() =>
                  navigate(`/premium/lostfound/view/${report.id}/sighting`)
                }
              >
                Submit Sighting
              </button>

              <button
                className="premium-lf-secondary-btn"
                onClick={handleMarkResolved}
                disabled={markingResolved}
              >
                {markingResolved ? "Marking..." : "Mark Resolved"}
              </button>
            </div>
          </div>

          <div style={{ padding: "20px" }}>
            <h3 style={{ marginBottom: "10px" }}>{report.name || "Unnamed Pet"}</h3>

            <div className="premium-lf-stat-row" style={{ marginBottom: "16px" }}>
              <div className="premium-lf-stat-pill">
                {report.is_lost ? "Active" : "Resolved"}
              </div>
              <div className="premium-lf-stat-pill">
                {report.species || "Unknown species"}
              </div>
              <div className="premium-lf-stat-pill">
                {report.breed || "Unknown breed"}
              </div>
              {report.is_priority ? (
                <div className="premium-lf-stat-pill">Priority</div>
              ) : null}
            </div>

            <p>
              <strong>Owner:</strong> {report.owner_name || report.user_name || "N/A"}
            </p>
            <p>
              <strong>Last seen:</strong>{" "}
              {report.area || report.last_seen_location || "Unknown location"}
            </p>
            <p>
              <strong>Reported at:</strong>{" "}
              {report.reported_lost_at
                ? new Date(report.reported_lost_at).toLocaleString()
                : "N/A"}
            </p>
            <p>
              <strong>Status:</strong> {report.lost_status || (report.is_lost ? "Active" : "Resolved")}
            </p>

            <div style={{ marginTop: "18px" }}>
              <strong>Description</strong>
              <p style={{ marginTop: "8px" }}>
                {report.lost_description || report.notes || "No description provided."}
              </p>
            </div>
          </div>
        </div>

        <div className="premium-lf-spotlight-card">
          <div className="premium-lf-spotlight-image-wrap" style={{ minHeight: "100%" }}>
            <img
              src={resolvedImage}
              alt={report.name || "Pet"}
              className="premium-lf-spotlight-image"
            />

            <div className="premium-lf-spotlight-overlay">
              <div className="premium-lf-spotlight-tag">
                {report.is_priority ? "PRIORITY REPORT" : "MISSING PET"}
              </div>

              <h3>{report.name || "Unnamed Pet"}</h3>
              <p>
                {report.species || "Unknown species"} •{" "}
                {report.breed || "Unknown breed"} •{" "}
                {report.area || report.last_seen_location || "Unknown area"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}