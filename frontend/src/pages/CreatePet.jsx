import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreatePet() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    breed: "",
    age: "",
    notes: "",
  });

  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("pawfection_token");

  useEffect(() => {
    // If not logged in, send user to login
    if (!token) navigate("/login");
  }, [token, navigate]);

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Pet name is required.";
    if (!form.breed.trim()) newErrors.breed = "Breed is required.";

    if (!form.age || isNaN(form.age)) {
      newErrors.age = "Age must be a number.";
    } else if (Number(form.age) < 0 || Number(form.age) > 100) {
      newErrors.age = "Age must be between 0 and 100.";
    }

    // Photo validation (optional but validated if provided)
    if (photo) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!allowedTypes.includes(photo.type)) {
        newErrors.photo = "Photo must be JPG, PNG, or WEBP.";
      }
      if (photo.size > maxSize) {
        newErrors.photo = "Photo must be under 2MB.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccess("");

    if (!validate()) return;

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("breed", form.breed);
      fd.append("age", form.age);
      fd.append("notes", form.notes);

      if (photo) fd.append("photo", photo);

      const res = await fetch("http://127.0.0.1:8000/api/pets", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          // ✅ DO NOT set Content-Type manually with FormData
        },
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        // Laravel validation errors
        if (data?.errors) {
          const mapped = {};
          Object.keys(data.errors).forEach((key) => {
            mapped[key] = data.errors[key][0];
          });
          setErrors(mapped);
        } else {
          setApiError(data?.message || "Something went wrong.");
        }
        setLoading(false);
        return;
      }

      setSuccess("Pet created successfully!");
      setLoading(false);

      // redirect back to dashboard after small moment
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (err) {
      setLoading(false);
      setApiError("Server error. Is your backend running?");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.12), rgba(0,0,0,0.9))",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "16px",
          padding: "24px",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2 style={{ color: "white", marginBottom: "8px" }}>Create Pet Profile</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: "18px" }}>
          Add your pet details so they appear on your dashboard.
        </p>

        {apiError && (
          <div style={{ background: "rgba(255,0,0,0.15)", color: "white", padding: "10px", borderRadius: "10px", marginBottom: "12px" }}>
            {apiError}
          </div>
        )}

        {success && (
          <div style={{ background: "rgba(0,255,0,0.12)", color: "white", padding: "10px", borderRadius: "10px", marginBottom: "12px" }}>
            {success}
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* Name */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: "white", display: "block", marginBottom: "6px" }}>Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="e.g. Bella"
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.25)", color: "white" }}
            />
            {errors.name && <small style={{ color: "#ffb3b3" }}>{errors.name}</small>}
          </div>

          {/* Breed */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: "white", display: "block", marginBottom: "6px" }}>Breed *</label>
            <input
              name="breed"
              value={form.breed}
              onChange={onChange}
              placeholder="e.g. Husky"
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.25)", color: "white" }}
            />
            {errors.breed && <small style={{ color: "#ffb3b3" }}>{errors.breed}</small>}
          </div>

          {/* Age */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: "white", display: "block", marginBottom: "6px" }}>Age *</label>
            <input
              name="age"
              value={form.age}
              onChange={onChange}
              placeholder="e.g. 3"
              type="number"
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.25)", color: "white" }}
            />
            {errors.age && <small style={{ color: "#ffb3b3" }}>{errors.age}</small>}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: "white", display: "block", marginBottom: "6px" }}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              placeholder="Any extra info..."
              rows={3}
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.25)", color: "white" }}
            />
            {errors.notes && <small style={{ color: "#ffb3b3" }}>{errors.notes}</small>}
          </div>

          {/* Photo */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "white", display: "block", marginBottom: "6px" }}>Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              style={{ color: "white" }}
            />
            {errors.photo && <small style={{ color: "#ffb3b3" }}>{errors.photo}</small>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "14px",
              border: "none",
              cursor: "pointer",
              color: "white",
              fontWeight: 700,
              background: "linear-gradient(135deg, #ff6b9e, #7c5cff)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating..." : "Create Pet"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.25)",
              cursor: "pointer",
              color: "white",
              fontWeight: 600,
              background: "transparent",
              marginTop: "10px",
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
