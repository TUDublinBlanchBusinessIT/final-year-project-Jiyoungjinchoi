import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditPet.css";

export default function EditPet() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    dob: "",
    gender: "",
    weight: "",
    notes: "",
  });

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("pawfection_token");

  useEffect(() => {
    const fetchPet = async () => {
      setError("");

      if (!token) {
        setError("You must be logged in.");
        setPageLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.message || "Failed to load pet.");
          setPageLoading(false);
          return;
        }

        setForm({
          name: data.name || "",
          species: data.species || "",
          breed: data.breed || "",
          dob: data.dob || "",
          gender: data.gender || "",
          weight: data.weight ?? "",
          notes: data.notes || "",
        });

        setPageLoading(false);
      } catch {
        setError("Failed to fetch pet. Is the backend running?");
        setPageLoading(false);
      }
    };

    fetchPet();
  }, [id, token]);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    if (form.gender) fd.append("gender", form.gender);
    if (form.weight !== "") fd.append("weight", form.weight);
    if (form.notes) fd.append("notes", form.notes);
    if (photo) fd.append("photo", photo);

    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}`, {
        method: "POST", // Laravel can accept POST + _method
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: (() => {
          fd.append("_method", "PUT");
          return fd;
        })(),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to update pet.";
        setError(msg);
        setLoading(false);
        return;
      }

      setSuccess("Pet updated successfully!");
      setLoading(false);

      setTimeout(() => navigate("/dashboard"), 600);
    } catch {
      setError("Failed to update pet. Is the backend running?");
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="pf-auth-page">
        <div className="pf-auth-card">
          <h1 className="pf-auth-title">Edit Pet Profile</h1>
          <p className="pf-auth-subtitle">Loading pet details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-auth-page">
      <div className="pf-auth-card">
        <h1 className="pf-auth-title">Edit Pet Profile</h1>
        <p className="pf-auth-subtitle">Update your pet details.</p>

        {error && <div className="pf-alert pf-alert-error">{error}</div>}
        {success && <div className="pf-alert pf-alert-success">{success}</div>}

        <form onSubmit={submit} className="pf-form">
          <div className="pf-grid">
            <div className="pf-field">
              <label>Name *</label>
              <input name="name" value={form.name} onChange={onChange} />
            </div>

            <div className="pf-field">
              <label>Species *</label>
              <input name="species" value={form.species} onChange={onChange} />
            </div>

            <div className="pf-field">
              <label>Breed</label>
              <input name="breed" value={form.breed} onChange={onChange} />
            </div>

            <div className="pf-field">
              <label>Date of Birth</label>
              <input type="date" name="dob" value={form.dob} onChange={onChange} />
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
              />
            </div>

            <div className="pf-field pf-span-2">
              <label>Notes</label>
              <textarea name="notes" value={form.notes} onChange={onChange} rows={4} />
            </div>

            <div className="pf-field pf-file pf-span-2">
              <label>Replace Photo (optional)</label>
              <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              <span className="pf-help">JPG/PNG/WEBP, max 2MB</span>
            </div>
          </div>

          <div className="pf-actions-row">
            <button className="pf-btn pf-btn-primary" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
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
