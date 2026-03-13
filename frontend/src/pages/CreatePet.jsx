import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreatePet.css";

export default function CreatePet() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    dob: "",
    age: "",
    weight: "",

    last_vaccination_date: "",
    vaccine_interval_days: "365",
    last_grooming_date: "",
    grooming_interval_days: "30",

    eye_color: "",
    fur_type: "",
    markings: "",

    vaccination_status: "",
    last_vet_visit: "",
    medical_notes: "",
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("pawfection_token");

  const allowedPhotoTypes = useMemo(
    () => ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    []
  );

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

  const validate = () => {
    if (!token) return "You must be logged in.";

    if (!form.name.trim()) return "Please enter Pet Name.";
    if (!form.species.trim()) return "Please select Species.";
    if (!form.breed.trim()) return "Please enter Breed.";
    if (!form.gender.trim()) return "Please select Gender.";

    if (form.weight === "" || Number.isNaN(Number(form.weight)) || Number(form.weight) <= 0) {
      return "Please enter Weight (kg).";
    }

    const computedAge = form.age !== "" ? Number(form.age) : calcAgeFromDob(form.dob);
    if (computedAge === "" || Number.isNaN(Number(computedAge)) || Number(computedAge) < 0) {
      return "Please enter Age, or select Date of Birth.";
    }

    if (!photo) return "Please upload at least 1 photo.";

    if (photo) {
      if (!allowedPhotoTypes.includes(photo.type)) return "Photo must be JPG, PNG, or WEBP.";
      if (photo.size > 2 * 1024 * 1024) return "Photo must be 2MB or less.";
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

    const computedAge = form.age !== "" ? Number(form.age) : calcAgeFromDob(form.dob);

    const fd = new FormData();

    fd.append("name", form.name.trim());
    fd.append("species", form.species);
    fd.append("breed", form.breed.trim());
    fd.append("gender", form.gender);
    fd.append("age", String(computedAge));
    fd.append("weight", String(form.weight));

    if (form.dob) {
      fd.append("dob", form.dob);
      fd.append("date_of_birth", form.dob);
    }

    if (form.last_vaccination_date) fd.append("last_vaccination_date", form.last_vaccination_date);
    if (form.vaccine_interval_days) fd.append("vaccine_interval_days", String(form.vaccine_interval_days));
    if (form.last_grooming_date) fd.append("last_grooming_date", form.last_grooming_date);
    if (form.grooming_interval_days) fd.append("grooming_interval_days", String(form.grooming_interval_days));

    if (form.eye_color) fd.append("eye_color", form.eye_color.trim());
    if (form.fur_type) fd.append("fur_type", form.fur_type.trim());
    if (form.markings) fd.append("markings", form.markings.trim());

    if (form.vaccination_status) fd.append("vaccination_status", form.vaccination_status);
    if (form.last_vet_visit) fd.append("last_vet_visit", form.last_vet_visit);
    if (form.medical_notes) fd.append("medical_notes", form.medical_notes.trim());
    if (form.health_conditions) fd.append("health_conditions", form.health_conditions.trim());
    if (form.allergies) fd.append("allergies", form.allergies.trim());
    if (form.vaccination_history) fd.append("vaccination_history", form.vaccination_history.trim());
    if (form.microchip_number) fd.append("microchip_number", form.microchip_number.trim());

    if (form.exercise_level) fd.append("exercise_level", form.exercise_level);
    if (form.activity_level) fd.append("activity_level", form.activity_level);

    if (form.diet) {
      fd.append("diet", form.diet.trim());
      fd.append("food_type", form.diet.trim());
    }

    if (form.personality_traits) {
      fd.append("personality_traits", form.personality_traits.trim());
      fd.append("temperament", form.personality_traits.trim());
    }

    if (form.notes) {
      fd.append("notes", form.notes.trim());
      fd.append("behaviour_notes", form.notes.trim());
    }

    fd.append("photo", photo);

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

      const data = await res.json().catch(() => ({}));

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

      setTimeout(() => navigate("/dashboard"), 600);
    } catch {
      setError("Failed to fetch. Is the backend running?");
      setLoading(false);
    }
  };

  return (
    <div className="pf-auth-page">
      <div className="pf-auth-card">
        <h1 className="pf-auth-title">Create Pet Profile</h1>
        <p className="pf-auth-subtitle">
          Add detailed pet information for personalised care recommendations.
        </p>

        {error && <div className="pf-alert pf-alert-error">{error}</div>}
        {success && <div className="pf-alert pf-alert-success">{success}</div>}

        <form onSubmit={submit} className="pf-form">
          <div className="pf-section">
            <div className="pf-section-head">
              <h2 className="pf-section-title">Basic Info</h2>
              <p className="pf-section-sub">Required fields to create a profile.</p>
            </div>

            <div className="pf-grid">
              <div className="pf-field">
                <label>Pet Name *</label>
                <input name="name" value={form.name} onChange={onChange} placeholder="e.g. Bella" />
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
                <input name="breed" value={form.breed} onChange={onChange} placeholder="e.g. Husky" />
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
              </div>

              <div className="pf-field">
                <label>Age *</label>
                <input type="number" min="0" name="age" value={form.age} onChange={onChange} />
              </div>

              <div className="pf-field">
                <label>Weight (kg) *</label>
                <input type="number" step="0.1" min="0" name="weight" value={form.weight} onChange={onChange} />
              </div>

              <div className="pf-field pf-file">
                <label>Photo *</label>
                <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>

          <div className="pf-section">
            <div className="pf-section-head">
              <h2 className="pf-section-title">Reminder Settings</h2>
            </div>

            <div className="pf-grid">
              <div className="pf-field">
                <label>Last Vaccination Date</label>
                <input type="date" name="last_vaccination_date" value={form.last_vaccination_date} onChange={onChange} />
              </div>

              <div className="pf-field">
                <label>Vaccine Interval (days)</label>
                <input type="number" min="1" name="vaccine_interval_days" value={form.vaccine_interval_days} onChange={onChange} />
              </div>

              <div className="pf-field">
                <label>Last Grooming Date</label>
                <input type="date" name="last_grooming_date" value={form.last_grooming_date} onChange={onChange} />
              </div>

              <div className="pf-field">
                <label>Grooming Interval (days)</label>
                <input type="number" min="1" name="grooming_interval_days" value={form.grooming_interval_days} onChange={onChange} />
              </div>
            </div>
          </div>

          <div className="pf-section">
            <div className="pf-section-head">
              <h2 className="pf-section-title">Physical Features</h2>
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

          <div className="pf-section">
            <div className="pf-section-head">
              <h2 className="pf-section-title">Health & Safety</h2>
            </div>

            <div className="pf-grid">
              <div className="pf-field">
                <label>Vaccination Status</label>
                <select name="vaccination_status" value={form.vaccination_status} onChange={onChange}>
                  <option value="">Select</option>
                  <option value="Up to date">Up to date</option>
                  <option value="Not updated">Not updated</option>
                </select>
              </div>

              <div className="pf-field">
                <label>Last Vet Visit</label>
                <input type="date" name="last_vet_visit" value={form.last_vet_visit} onChange={onChange} />
              </div>

              <div className="pf-field pf-span-2">
                <label>Medical Notes</label>
                <textarea name="medical_notes" value={form.medical_notes} onChange={onChange} rows={3} />
              </div>

              <div className="pf-field pf-span-2">
                <label>Health Conditions</label>
                <textarea name="health_conditions" value={form.health_conditions} onChange={onChange} rows={3} />
              </div>

              <div className="pf-field pf-span-2">
                <label>Allergies</label>
                <textarea name="allergies" value={form.allergies} onChange={onChange} rows={3} />
              </div>

              <div className="pf-field pf-span-2">
                <label>Vaccination History</label>
                <textarea name="vaccination_history" value={form.vaccination_history} onChange={onChange} rows={3} />
              </div>

              <div className="pf-field pf-span-2">
                <label>Microchip Number</label>
                <input name="microchip_number" value={form.microchip_number} onChange={onChange} />
              </div>
            </div>
          </div>

          <div className="pf-section">
            <div className="pf-section-head">
              <h2 className="pf-section-title">Lifestyle</h2>
            </div>

            <div className="pf-grid">
              <div className="pf-field">
                <label>Diet</label>
                <input name="diet" value={form.diet} onChange={onChange} placeholder="e.g. Dry food twice daily" />
              </div>

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
                <label>Personality Traits</label>
                <input
                  name="personality_traits"
                  value={form.personality_traits}
                  onChange={onChange}
                  placeholder="e.g. Friendly, playful, calm"
                />
              </div>

              <div className="pf-field pf-span-2">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={onChange}
                  rows={3}
                  placeholder="Anything else important..."
                />
              </div>
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