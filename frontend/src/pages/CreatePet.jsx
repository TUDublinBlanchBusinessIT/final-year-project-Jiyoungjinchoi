import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreatePet.css";

export default function CreatePet() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    dob: "",
    age: "", // ✅ add age
    gender: "",
    weight: "",
    notes: "",
  });

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("pawfection_token");

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ calculate age from YYYY-MM-DD
  const calcAgeFromDob = (dobStr) => {
    if (!dobStr) return "";
    const dob = new Date(dobStr);
    if (Number.isNaN(dob.getTime())) return "";

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age < 0 ? "" : age;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("You must be logged in.");
      return;
    }

    if (!form.name.trim() || !form.species.trim()) {
      setError("Please fill in required fields: Name and Species.");
      return;
    }

    // ✅ If age not entered but DOB is, auto-calc age
    const computedAge =
      form.age !== "" ? Number(form.age) : calcAgeFromDob(form.dob);

    // ✅ Backend currently requires age, so make sure we send it
    if (computedAge === "" || Number.isNaN(Number(computedAge))) {
      setError("Please enter Age, or select Date of Birth (so we can calculate it).");
      return;
    }

    if (photo) {
      const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowed.includes(photo.type)) {
        setError("Photo must be JPG, PNG, or WEBP.");
        return;
      }
      if (photo.size > 2 * 1024 * 1024) {
        setError("Photo must be 2MB or less.");
        return;
      }
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("species", form.species);
    if (form.breed) fd.append("breed", form.breed);
    if (form.dob) fd.append("dob", form.dob);
    fd.append("age", String(computedAge)); // ✅ ALWAYS send age
    if (form.gender) fd.append("gender", form.gender);
    if (form.weight !== "") fd.append("weight", form.weight);
    if (form.notes) fd.append("notes", form.notes);
    if (photo) fd.append("photo", photo);

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/pets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to create pet.";
        setError(msg);
        setLoading(false);
        return;
      }

      setSuccess("Pet created successfully!");
      setLoading(false);

      // ✅ Go dashboard
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      setError("Failed to fetch. Is the backend running?");
      setLoading(false);
    }
  };

  return (
    <div className="pf-auth-page">
      <div className="pf-auth-card">
        <h1 className="pf-auth-title">Create Pet Profile</h1>
        <p className="pf-auth-subtitle">
          Add your pet details so they appear on your dashboard.
        </p>

        {error && <div className="pf-alert pf-alert-error">{error}</div>}
        {success && <div className="pf-alert pf-alert-success">{success}</div>}

        <form onSubmit={submit} className="pf-form">
          <div className="pf-grid">
            <div className="pf-field">
              <label>Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="e.g. Bella"
              />
            </div>

            <div className="pf-field">
              <label>Species *</label>
              <input
                name="species"
                value={form.species}
                onChange={onChange}
                placeholder="e.g. Dog"
              />
            </div>

            <div className="pf-field">
              <label>Breed</label>
              <input
                name="breed"
                value={form.breed}
                onChange={onChange}
                placeholder="e.g. Husky"
              />
            </div>

            <div className="pf-field">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={(e) => {
                  const dob = e.target.value;
                  const autoAge = calcAgeFromDob(dob);
                  setForm((prev) => ({
                    ...prev,
                    dob,
                    age: prev.age === "" ? String(autoAge) : prev.age, // ✅ only auto-fill if age empty
                  }));
                }}
              />
            </div>

            {/* ✅ NEW AGE FIELD */}
            <div className="pf-field">
              <label>Age *</label>
              <input
                type="number"
                min="0"
                name="age"
                value={form.age}
                onChange={onChange}
                placeholder="e.g. 3"
              />
            </div>

            <div className="pf-field">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={onChange}>
                <option value="">Select</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div className="pf-field">
              <label>Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="weight"
                value={form.weight}
                onChange={onChange}
                placeholder="e.g. 12.5"
              />
            </div>

            <div className="pf-field pf-span-2">
              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={onChange}
                rows={4}
                placeholder="Anything important about your pet..."
              />
            </div>

            <div className="pf-field pf-file pf-span-2">
              <label>Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
              <span className="pf-help">JPG/PNG/WEBP, max 2MB</span>
            </div>
          </div>

          <div className="pf-actions-row">
            <button className="pf-btn pf-btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Pet"}
            </button>

            <button type="button" className="pf-btn" onClick={() => navigate("/dashboard")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
