import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditPet.css";

export default function EditPet() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    dob: "",
    age: "",
    weight: "",

    eye_color: "",
    fur_type: "",
    markings: "",

    health_conditions: "",
    allergies: "",
    vaccination_history: "",
    microchip_number: "",

    exercise_level: "",
    activity_level: "",
    diet: "",

    personality_traits: "",
    notes: "",
  });

  const [photo, setPhoto] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("pawfection_token");

  const allowedPhotoTypes = useMemo(
    () => ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    []
  );

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

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data?.message || "Failed to load pet.");
          setPageLoading(false);
          return;
        }

        setForm({
          name: data.name || "",
          species: data.species || "",
          breed: data.breed || "",
          gender: data.gender || "",
          dob: data.dob || "",
          age: data.age !== undefined && data.age !== null ? String(data.age) : "",
          weight: data.weight !== undefined && data.weight !== null ? String(data.weight) : "",

          eye_color: data.eye_color || "",
          fur_type: data.fur_type || "",
          markings: data.markings || "",

          health_conditions: data.health_conditions || "",
          allergies: data.allergies || "",
          vaccination_history: data.vaccination_history || "",
          microchip_number: data.microchip_number || "",

          exercise_level: data.exercise_level || "",
          activity_level: data.activity_level || "",
          diet: data.diet || "",

          personality_traits: data.personality_traits || "",
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

  const validate = () => {
    if (!token) return "You must be logged in.";

    if (!form.name.trim()) return "Please enter Pet Name.";
    if (!form.species.trim()) return "Please select Species (Dog or Cat).";
    if (!form.breed.trim()) return "Please enter Breed.";
    if (!form.gender.trim()) return "Please select Gender.";

    if (form.weight === "" || Number.isNaN(Number(form.weight)) || Number(form.weight) <= 0) {
      return "Please enter Weight (kg).";
    }

    const computedAge =
      form.age !== "" ? Number(form.age) : calcAgeFromDob(form.dob);

    if (computedAge === "" || Number.isNaN(Number(computedAge)) || Number(computedAge) < 0) {
      return "Please enter Age, or select Date of Birth (so we can calculate it).";
    }

    if (photo) {
      if (!allowedPhotoTypes.includes(photo.type)) {
        return "Photo must be JPG, PNG, or WEBP.";
      }
      if (photo.size > 2 * 1024 * 1024) {
        return "Photo must be 2MB or less.";
      }
    }

    if (form.microchip_number && form.microchip_number.length > 60) {
      return "Microchip number looks too long. Please double-check it.";
    }

    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const computedAge =
      form.age !== "" ? Number(form.age) : calcAgeFromDob(form.dob);

    const fd = new FormData();

    fd.append("name", form.name.trim());
    fd.append("species", form.species);
    fd.append("breed", form.breed.trim());
    fd.append("gender", form.gender);
    fd.append("age", String(computedAge));
    if (form.dob) fd.append("dob", form.dob);
    fd.append("weight", String(form.weight));

    if (form.eye_color) fd.append("eye_color", form.eye_color.trim());
    if (form.fur_type) fd.append("fur_type", form.fur_type.trim());
    if (form.markings) fd.append("markings", form.markings.trim());

    if (form.health_conditions) fd.append("health_conditions", form.health_conditions.trim());
    if (form.allergies) fd.append("allergies", form.allergies.trim());
    if (form.vaccination_history) fd.append("vaccination_history", form.vaccination_history.trim());
    if (form.microchip_number) fd.append("microchip_number", form.microchip_number.trim());

    if (form.exercise_level) fd.append("exercise_level", form.exercise_level);
    if (form.activity_level) fd.append("activity_level", form.activity_level);

    if (form.diet) fd.append("diet", form.diet.trim());
    if (form.personality_traits) fd.append("personality_traits", form.personality_traits.trim());
    if (form.notes) fd.append("notes", form.notes.trim());

    if (photo) fd.append("photo", photo);

    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}`, {
        method: "POST", // Laravel accepts POST + _method
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: (() => {
          fd.append("_method", "PUT");
          return fd;
        })(),
      });

      const data = await res.json().catch(() => ({}));

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
          {/* SECTION: Basics */}
          <div className="pf-section">
            <div className="pf-section-head">
              <h2 className="pf-section-title">Basic Info</h2>
              <p className="pf-section-sub">Update required profile fields.</p>
            </div>

            <div className="pf-grid">
              <div className="pf-field">
                <label>Pet Name *</label>
                <input name="name" value={form.name} onChange={onChange} />
              </div>

              <div className="pf-field">
                <label>Species *</label>
                <select name="species" value={form.species} onChange={onChange}>
                  <option value="">Select</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>

              <div className="pf-field">
                <label>Breed *</label>
                <input name="breed" value={form.breed} onChange={onChange} />
              </div>

              <div className="pf-field">
                <label>Gender *</label>
                <select name="gender" value={form.gender} onChange={onChange}>
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Unknown">Unknown</option>
                </select>
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
                      age: prev.age === "" ? String(autoAge) : prev.age,
                    }));
                  }}
                />
                <span className="pf-help">If DOB is set, age can be calculated.</span>
              </div>

              <div className="pf-field">
                <label>Age *</label>
                <input type="number" min="0" name="age" value={form.age} onChange={onChange} />
              </div>

              <div className="pf-field">
                <label>Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="weight"
                  value={form.weight}
                  onChange={onChange}
                />
              </div>

              <div className="pf-field pf-file">
                <label>Replace Photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                />
                <span className="pf-help">JPG/PNG/WEBP, max 2MB</span>
              </div>
            </div>
          </div>

          {/* SECTION: Physical features */}
          <div className="pf-section">
            <div className="pf-section-head">
              <h2 className="pf-section-title">Physical Features</h2>
              <p className="pf-section-sub">Optional details like eye colour, fur type, markings.</p>
            </div>

            <div className="pf-grid">
              <div className="pf-field">
                <label>Eye Colour</label>
                <input name="eye_color" value={form.eye_color} onChange={onChange} />
              </div>

              <div className="pf-field">
                <label>Fur Type / Length</label>
                <input name="fur_type" value={form.fur_type} onChange={onChange} />
              </div>

              <div className="pf-field pf-span-2">
                <label>Markings</label>
                <input name="markings" value={form.markings} onChange={onChange} />
              </div>
            </div>
          </div>

          {/* SECTION: Health */}
          <div className="pf-section">
            <div className="pf-section-head">
              <h2 className="pf-section-title">Health & Safety</h2>
              <p className="pf-section-sub">Conditions, allergies, vaccinations, microchip.</p>
            </div>

            <div className="pf-grid">
              <div className="pf-field pf-span-2">
                <label>Health Conditions</label>
                <textarea
                  name="health_conditions"
                  value={form.health_conditions}
                  onChange={onChange}
                  rows={3}
                />
              </div>

              <div className="pf-field pf-span-2">
                <label>Allergies</label>
                <textarea name="allergies" value={form.allergies} onChange={onChange} rows={3} />
              </div>

              <div className="pf-field pf-span-2">
                <label>Vaccination History</label>
                <textarea
                  name="vaccination_history"
                  value={form.vaccination_history}
                  onChange={onChange}
                  rows={3}
                />
              </div>

              <div className="pf-field pf-span-2">
                <label>Microchip Number</label>
                <input
                  name="microchip_number"
                  value={form.microchip_number}
                  onChange={onChange}
                />
              </div>
            </div>
          </div>

          {/* SECTION: Lifestyle */}
          <div className="pf-section">
            <div className="pf-section-head">
              <h2 className="pf-section-title">Lifestyle</h2>
              <p className="pf-section-sub">Diet, exercise, activity, personality.</p>
            </div>

            <div className="pf-grid">
              <div className="pf-field">
                <label>Exercise Level</label>
                <select name="exercise_level" value={form.exercise_level} onChange={onChange}>
                  <option value="">Select</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="pf-field">
                <label>Activity Level</label>
                <select name="activity_level" value={form.activity_level} onChange={onChange}>
                  <option value="">Select</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="pf-field pf-span-2">
                <label>Diet</label>
                <textarea name="diet" value={form.diet} onChange={onChange} rows={3} />
              </div>

              <div className="pf-field pf-span-2">
                <label>Personality Traits</label>
                <textarea
                  name="personality_traits"
                  value={form.personality_traits}
                  onChange={onChange}
                  rows={3}
                />
              </div>

              <div className="pf-field pf-span-2">
                <label>Notes</label>
                <textarea name="notes" value={form.notes} onChange={onChange} rows={3} />
              </div>
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