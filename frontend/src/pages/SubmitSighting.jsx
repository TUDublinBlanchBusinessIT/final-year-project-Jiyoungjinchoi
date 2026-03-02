import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function SubmitSighting() {
  const navigate = useNavigate();
  const { id } = useParams(); // lost pet id (pet record id)

  const [status, setStatus] = useState({ type: "idle", message: "" });

  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem("pawfection_token");
    if (!token) {
      setStatus({ type: "error", message: "You must be logged in. Redirecting..." });
      setTimeout(() => navigate("/login"), 500);
      return;
    }

    const cleanLoc = location.trim();
    const cleanNotes = notes.trim();

    if (!cleanLoc) {
      setStatus({ type: "error", message: "Location is required." });
      return;
    }

    setStatus({ type: "loading", message: "Submitting sighting..." });

    try {
      const form = new FormData();
      form.append("location", cleanLoc);
      if (cleanNotes) form.append("notes", cleanNotes);
      if (photo) form.append("photo", photo);

      const res = await fetch(`http://127.0.0.1:8000/api/lost-pets/${id}/sightings`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (res.status === 401) {
        localStorage.removeItem("pawfection_token");
        setStatus({ type: "error", message: "Session expired. Please log in again." });
        setTimeout(() => navigate("/login"), 700);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const firstError =
          data?.message ||
          (data?.errors && Object.values(data.errors)?.[0]?.[0]) ||
          "Failed to submit sighting.";
        throw new Error(firstError);
      }

      setStatus({ type: "success", message: data.message || "Sighting submitted ✅" });
      setTimeout(() => navigate("/lostfound"), 700);
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Failed to fetch" });
    }
  }

  const statusBg =
    status.type === "success"
      ? "#f0fdf4"
      : status.type === "loading"
      ? "#eff6ff"
      : "#fff7ed";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 10% 10%, rgba(255,228,230,.6), transparent 40%)," +
          "radial-gradient(circle at 90% 20%, rgba(219,234,254,.6), transparent 45%)," +
          "radial-gradient(circle at 50% 90%, rgba(220,252,231,.6), transparent 45%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#fff",
          borderRadius: 22,
          padding: 28,
          boxShadow: "0 12px 35px rgba(0,0,0,.07)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Submit Found / Sighting</h1>
          <button
            onClick={() => navigate("/lostfound")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#2563eb",
              textDecoration: "underline",
              fontWeight: 700,
              padding: 0,
            }}
          >
            Back to Lost &amp; Found
          </button>
        </div>

        <p style={{ marginTop: 10, marginBottom: 0, color: "#555" }}>
          Location is required. Photo is optional. The owner will be notified.
        </p>

        {status.type !== "idle" && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 14,
              background: statusBg,
              textAlign: "left",
            }}
          >
            <strong>
              {status.type === "success"
                ? "Success"
                : status.type === "loading"
                ? "Please wait"
                : "Attention"}
            </strong>
            <div style={{ marginTop: 4 }}>{status.message}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
          <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
            Location (required)
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="e.g., Tallaght, Dublin"
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              marginBottom: 14,
              boxSizing: "border-box",
            }}
          />

          <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any details? (time seen, direction, collar, etc.)"
            rows={4}
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              marginBottom: 14,
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />

          <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
            Photo (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            style={{ marginBottom: 18 }}
          />

          <button
            type="submit"
            disabled={status.type === "loading"}
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              fontWeight: 800,
              color: "#fff",
              cursor: "pointer",
              background: "linear-gradient(90deg,#fb7185,#60a5fa)",
              opacity: status.type === "loading" ? 0.6 : 1,
            }}
          >
            Submit Sighting
          </button>
        </form>
      </div>
    </div>
  );
}