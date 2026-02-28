import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ReportLostPet() {
  const navigate = useNavigate();
  const token = localStorage.getItem("pawfection_token");

  const [status, setStatus] = useState({ type: "idle", message: "" });

  const [petName, setPetName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!photo) {
      setStatus({ type: "error", message: "Photo is required." });
      return;
    }

    const cleanName = petName.trim();
    const cleanDesc = description.trim();
    const cleanLoc = location.trim();

    if (!cleanDesc || !cleanLoc) {
      setStatus({ type: "error", message: "Description and location are required." });
      return;
    }

    setStatus({ type: "loading", message: "Submitting lost pet report..." });

    try {
      const form = new FormData();
      if (cleanName) form.append("pet_name", cleanName); // ✅ only send if provided
      form.append("description", cleanDesc);
      form.append("last_seen_location", cleanLoc);
      form.append("photo", photo);

      const res = await fetch("http://127.0.0.1:8000/api/lost-pets", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Laravel validation errors come in data.errors
        const firstError =
          data?.message ||
          (data?.errors && Object.values(data.errors)?.[0]?.[0]) ||
          "Failed to submit report.";
        throw new Error(firstError);
      }

      setStatus({ type: "success", message: "Lost pet reported ✅" });
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
          <h1 style={{ fontSize: 24, margin: 0 }}>Report Lost Pet</h1>
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
            Back to Lost & Found
          </button>
        </div>

        <p style={{ marginTop: 10, marginBottom: 0, color: "#555" }}>
          Please fill in the details below. Photo is required.
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
            Pet Name (optional)
          </label>
          <input
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="e.g., Coco"
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
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Describe your pet (colour, breed, collar, etc.)"
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
            Last Seen Location
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
            Photo (required)
          </label>
          <input
            type="file"
            accept="image/*"
            required
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
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}