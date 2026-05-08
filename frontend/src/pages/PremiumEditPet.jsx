import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumPetForm.css";

export default function PremiumEditPet() {
  const navigate = useNavigate();
  const { id } = useParams();

  const apiBase = "http://127.0.0.1:8000/api";
  const token = localStorage.getItem("pawfection_token");

  const [userName, setUserName] = useState("Premium User");
  const [loadingPet, setLoadingPet] = useState(true);

  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    dob: "",
    age: "",
    weight: "",
    target_weight: "",
    target_activity_minutes: "",

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

  const [existingPhoto, setExistingPhoto] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allowedPhotoTypes = useMemo(
    () => ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    []
  );

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const getPetImageSrc = (pet) => {
    if (!pet) return "";

    if (pet?.display_photo_url) return pet.display_photo_url;
    if (pet?.lost_photo_url) return pet.lost_photo_url;
    if (pet?.photo_url) return pet.photo_url;
    if (pet?.image_url) return pet.image_url;

    if (pet?.photo_path) return `http://127.0.0.1:8000/storage/${pet.photo_path}`;
    if (pet?.photo) return `http://127.0.0.1:8000/storage/${pet.photo}`;
    if (pet?.image) return `http://127.0.0.1:8000/storage/${pet.image}`;

    return "";
  };

  const normaliseDate = (value) => {
    if (!value) return "";
    return String(value).slice(0, 10);
  };

  const calcAgeFromDob = (dobStr) => {
    if (!dobStr) return "";

    const dob = new Date(dobStr);
    if (Number.isNaN(dob.getTime())) return "";

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age < 0 ? "" : age;
  };

  const previewAge = form.age || calcAgeFromDob(form.dob) || "Not added";
  const visiblePhoto = photoPreview || existingPhoto;

  const checklist = useMemo(
    () => [
      {
        label: "Basic details",
        done: Boolean(
          form.name.trim() &&
            form.species.trim() &&
            form.breed.trim() &&
            form.gender.trim()
        ),
      },
      {
        label: "Age and weight",
        done: Boolean(
          (form.age || form.dob) &&
            form.weight !== "" &&
            !Number.isNaN(Number(form.weight))
        ),
      },
      {
        label: "Pet photo",
        done: Boolean(visiblePhoto),
      },
      {
        label: "Reminder settings",
        done: Boolean(form.last_vaccination_date || form.last_grooming_date),
      },
      {
        label: "Health and safety",
        done: Boolean(
          form.vaccination_status ||
            form.medical_notes ||
            form.health_conditions ||
            form.allergies ||
            form.microchip_number
        ),
      },
    ],
    [form, visiblePhoto]
  );

  const completedCount = checklist.filter((item) => item.done).length;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const savedUser = localStorage.getItem("pawfection_user");

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        const fullName =
          parsedUser?.name ||
          parsedUser?.full_name ||
          parsedUser?.username ||
          parsedUser?.user_name;

        if (fullName) {
          setUserName(fullName);
          return;
        }
      }

      const savedName = localStorage.getItem("pawfection_user_name");
      if (savedName) {
        setUserName(savedName);
      }
    } catch (err) {
      console.error("Failed to load user name:", err);
    }
  }, [navigate, token]);

  useEffect(() => {
    const fetchPet = async () => {
      if (!token || !id) return;

      try {
        setLoadingPet(true);
        setError("");

        const res = await fetch(`${apiBase}/pets/${id}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data?.message || "Failed to load pet details.");
          return;
        }

        const pet = data.pet || data.data || data;

        setExistingPhoto(getPetImageSrc(pet));

        setForm({
          name: pet?.name || "",
          species: pet?.species || "",
          breed: pet?.breed || "",
          gender: pet?.gender || "",
          dob: normaliseDate(pet?.dob || pet?.date_of_birth),
          age: pet?.age != null ? String(pet.age) : "",
          weight: pet?.weight != null ? String(pet.weight) : "",
          target_weight:
            pet?.target_weight != null
              ? String(pet.target_weight)
              : pet?.ideal_weight != null
              ? String(pet.ideal_weight)
              : "",
          target_activity_minutes:
            pet?.target_activity_minutes != null
              ? String(pet.target_activity_minutes)
              : pet?.daily_activity_goal != null
              ? String(pet.daily_activity_goal)
              : "",

          last_vaccination_date: normaliseDate(pet?.last_vaccination_date),
          vaccine_interval_days:
            pet?.vaccine_interval_days != null
              ? String(pet.vaccine_interval_days)
              : "365",
          last_grooming_date: normaliseDate(pet?.last_grooming_date),
          grooming_interval_days:
            pet?.grooming_interval_days != null
              ? String(pet.grooming_interval_days)
              : "30",

          eye_color: pet?.eye_color || "",
          fur_type: pet?.fur_type || "",
          markings: pet?.markings || "",

          vaccination_status: pet?.vaccination_status || "",
          last_vet_visit: normaliseDate(pet?.last_vet_visit),
          medical_notes: pet?.medical_notes || "",
          health_conditions: pet?.health_conditions || "",
          allergies: pet?.allergies || "",
          vaccination_history: pet?.vaccination_history || "",
          microchip_number: pet?.microchip_number || "",

          exercise_level: pet?.exercise_level || "",
          activity_level: pet?.activity_level || "",
          diet: pet?.diet || pet?.food_type || "",
          personality_traits:
            pet?.personality_traits || pet?.temperament || "",
          notes: pet?.notes || pet?.behaviour_notes || "",
        });
      } catch {
        setError("Server error. Could not load pet details.");
      } finally {
        setLoadingPet(false);
      }
    };

    fetchPet();
  }, [apiBase, id, token]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const onChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const selected = e.target.files?.[0] || null;

    setPhoto(selected);

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoPreview(selected ? URL.createObjectURL(selected) : "");
  };

  const validate = () => {
    if (!token) return "You must be logged in.";

    if (!form.name.trim()) return "Please enter Pet Name.";
    if (!form.species.trim()) return "Please select Species.";
    if (!form.breed.trim()) return "Please enter Breed.";
    if (!form.gender.trim()) return "Please select Gender.";

    if (
      form.weight === "" ||
      Number.isNaN(Number(form.weight)) ||
      Number(form.weight) <= 0
    ) {
      return "Please enter Weight (kg).";
    }

    if (
      form.target_weight !== "" &&
      (Number.isNaN(Number(form.target_weight)) || Number(form.target_weight) <= 0)
    ) {
      return "Target Weight must be a valid positive number.";
    }

    if (
      form.target_activity_minutes !== "" &&
      (Number.isNaN(Number(form.target_activity_minutes)) ||
        Number(form.target_activity_minutes) < 0)
    ) {
      return "Target Activity Minutes must be 0 or more.";
    }

    const computedAge = form.age !== "" ? Number(form.age) : calcAgeFromDob(form.dob);

    if (
      computedAge === "" ||
      Number.isNaN(Number(computedAge)) ||
      Number(computedAge) < 0
    ) {
      return "Please enter Age, or select Date of Birth.";
    }

    if (photo) {
      if (!allowedPhotoTypes.includes(photo.type)) {
        return "Photo must be JPG, PNG, or WEBP.";
      }

      if (photo.size > 2 * 1024 * 1024) {
        return "Photo must be 2MB or less.";
      }
    }

    return "";
  };

  const buildFormData = () => {
    const computedAge = form.age !== "" ? Number(form.age) : calcAgeFromDob(form.dob);

    const fd = new FormData();

    // Laravel route supports PATCH, but photo upload works best through POST + _method PATCH
    fd.append("_method", "PATCH");

    fd.append("name", form.name.trim());
    fd.append("species", form.species);
    fd.append("breed", form.breed.trim());
    fd.append("gender", form.gender);
    fd.append("age", String(computedAge));
    fd.append("weight", String(form.weight));

    if (form.target_weight !== "") {
      fd.append("target_weight", String(form.target_weight));
    }

    if (form.target_activity_minutes !== "") {
      fd.append("target_activity_minutes", String(form.target_activity_minutes));
    }

    if (form.dob) {
      fd.append("dob", form.dob);
      fd.append("date_of_birth", form.dob);
    }

    if (form.last_vaccination_date) {
      fd.append("last_vaccination_date", form.last_vaccination_date);
    }

    if (form.vaccine_interval_days) {
      fd.append("vaccine_interval_days", String(form.vaccine_interval_days));
    }

    if (form.last_grooming_date) {
      fd.append("last_grooming_date", form.last_grooming_date);
    }

    if (form.grooming_interval_days) {
      fd.append("grooming_interval_days", String(form.grooming_interval_days));
    }

    if (form.eye_color) fd.append("eye_color", form.eye_color.trim());
    if (form.fur_type) fd.append("fur_type", form.fur_type.trim());
    if (form.markings) fd.append("markings", form.markings.trim());

    if (form.vaccination_status) {
      fd.append("vaccination_status", form.vaccination_status);
    }

    if (form.last_vet_visit) fd.append("last_vet_visit", form.last_vet_visit);
    if (form.medical_notes) fd.append("medical_notes", form.medical_notes.trim());

    if (form.health_conditions) {
      fd.append("health_conditions", form.health_conditions.trim());
    }

    if (form.allergies) {
      fd.append("allergies", form.allergies.trim());
    }

    if (form.vaccination_history) {
      fd.append("vaccination_history", form.vaccination_history.trim());
    }

    if (form.microchip_number) {
      fd.append("microchip_number", form.microchip_number.trim());
    }

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

    if (photo) {
      fd.append("photo", photo);
    }

    return fd;
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationMessage = validate();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${apiBase}/pets/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: buildFormData(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to update pet.";

        setError(msg);
        setSaving(false);
        return;
      }

      setSuccess("Pet updated successfully!");

      setTimeout(() => {
        navigate("/premium-mypets");
      }, 700);
    } catch {
      setError("Failed to fetch. Is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ppf-page">
      <div className="ppf-cloud cloud-one"></div>
      <div className="ppf-cloud cloud-two"></div>
      <div className="ppf-cloud cloud-three"></div>

      <header className="ppf-topbar">
        <div
          className="ppf-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/premium-dashboard");
            }
          }}
        >
          <img src={PawfectionLogo} alt="Pawfection" className="ppf-logo" />

          <div>
            <h1>Pawfection</h1>
            <p>PREMIUM PET PROFILE</p>
          </div>
        </div>

        <div className="ppf-title-chip">Edit Premium Pet</div>

        <div className="ppf-userbar">
          <div className="ppf-date">{todayText}</div>

          <div className="ppf-userchip">
            <div className="ppf-avatar">{userName?.charAt(0)?.toUpperCase() || "P"}</div>

            <div>
              <strong>{userName}</strong>
              <span>Premium User</span>
            </div>
          </div>
        </div>
      </header>

      <section className="ppf-hero">
        <div>
          <span className="ppf-badge">PREMIUM PROFILE UPDATE</span>

          <h2>Edit Pet Profile</h2>

          <p>
            Update your pet’s details, health information, reminders, lifestyle notes,
            and safety details.
          </p>
        </div>

        <div className="ppf-hero-card">
          <span>Profile progress</span>
          <strong>
            {completedCount}/{checklist.length} complete
          </strong>
        </div>
      </section>

      {error && <div className="ppf-alert ppf-alert-error">{error}</div>}
      {success && <div className="ppf-alert ppf-alert-success">{success}</div>}

      {loadingPet ? (
        <main className="ppf-layout">
          <section className="ppf-form-card">
            <h3>Loading pet profile...</h3>
            <p className="ppf-sub">Please wait while Pawfection loads the details.</p>
          </section>
        </main>
      ) : (
        <main className="ppf-layout">
          <aside className="ppf-side">
            <section className="ppf-card">
              <h3>Pet Preview</h3>
              <p className="ppf-sub">This updates while you edit the form.</p>

              <div className="ppf-preview-card">
                <div className="ppf-preview-photo">
                  {visiblePhoto ? (
                    <img src={visiblePhoto} alt="Pet preview" />
                  ) : (
                    <span>🐾</span>
                  )}
                </div>

                <div className="ppf-preview-info">
                  <p>Premium pet profile</p>
                  <h4>{form.name || "Your Pet"}</h4>
                  <span>
                    {form.species || "Species"} {form.breed ? `• ${form.breed}` : ""}
                  </span>
                </div>

                <div className="ppf-preview-details">
                  <div>
                    <span>Age</span>
                    <strong>{previewAge}</strong>
                  </div>

                  <div>
                    <span>Weight</span>
                    <strong>{form.weight ? `${form.weight} kg` : "Not added"}</strong>
                  </div>

                  <div>
                    <span>Microchip</span>
                    <strong>{form.microchip_number || "Not added"}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="ppf-card">
              <h3>Checklist</h3>
              <p className="ppf-sub">Complete the main details before saving.</p>

              <div className="ppf-checklist">
                {checklist.map((item) => (
                  <div
                    key={item.label}
                    className={`ppf-check-item ${item.done ? "done" : ""}`}
                  >
                    <span>{item.done ? "✓" : "○"}</span>
                    <p>{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="ppf-tip-card">
                <strong>Quick tip</strong>
                <p>
                  Keep your pet profile updated so reminders, health logs, and Lost
                  & Found details stay accurate.
                </p>
              </div>
            </section>
          </aside>

          <form onSubmit={submit} className="ppf-form-card">
            <div className="ppf-form-head">
              <div>
                <h3>Pet Details</h3>
                <p>Update the details below and save your changes.</p>
              </div>

              <span>Premium profile</span>
            </div>

            <PetFormFields
              form={form}
              setForm={setForm}
              onChange={onChange}
              calcAgeFromDob={calcAgeFromDob}
              handlePhotoChange={handlePhotoChange}
              photoRequired={false}
            />

            <div className="ppf-actions-row">
              <button className="ppf-btn ppf-btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="ppf-btn ppf-btn-secondary"
                onClick={() => navigate("/premium-mypets")}
              >
                Cancel
              </button>
            </div>
          </form>
        </main>
      )}
    </div>
  );
}

function PetFormFields({
  form,
  setForm,
  onChange,
  calcAgeFromDob,
  handlePhotoChange,
  photoRequired,
}) {
  return (
    <>
      <div className="ppf-section">
        <div className="ppf-section-head">
          <h2>Basic Info</h2>
          <p>Required fields to keep the profile complete.</p>
        </div>

        <div className="ppf-grid">
          <div className="ppf-field">
            <label>Pet Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="e.g. Bella"
            />
          </div>

          <div className="ppf-field">
            <label>Species *</label>
            <select name="species" value={form.species} onChange={onChange}>
              <option value="">Select</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
            </select>
          </div>

          <div className="ppf-field">
            <label>Breed *</label>
            <input
              name="breed"
              value={form.breed}
              onChange={onChange}
              placeholder="e.g. Husky"
            />
          </div>

          <div className="ppf-field">
            <label>Gender *</label>
            <select name="gender" value={form.gender} onChange={onChange}>
              <option value="">Select</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div className="ppf-field">
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

          <div className="ppf-field">
            <label>Age *</label>
            <input
              type="number"
              min="0"
              name="age"
              value={form.age}
              onChange={onChange}
            />
          </div>

          <div className="ppf-field">
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

          <div className="ppf-field">
            <label>Target Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              name="target_weight"
              value={form.target_weight}
              onChange={onChange}
              placeholder="e.g. 7.5"
            />
          </div>

          <div className="ppf-field">
            <label>Target Activity Minutes</label>
            <input
              type="number"
              min="0"
              name="target_activity_minutes"
              value={form.target_activity_minutes}
              onChange={onChange}
              placeholder="e.g. 60"
            />
          </div>

          <div className="ppf-field ppf-file">
            <label>{photoRequired ? "Photo *" : "Replace Photo"}</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            <small>JPG, PNG or WEBP. Maximum 2MB.</small>
          </div>
        </div>
      </div>

      <div className="ppf-section">
        <div className="ppf-section-head">
          <h2>Reminder Settings</h2>
          <p>Used for care and health reminders.</p>
        </div>

        <div className="ppf-grid">
          <div className="ppf-field">
            <label>Last Vaccination Date</label>
            <input
              type="date"
              name="last_vaccination_date"
              value={form.last_vaccination_date}
              onChange={onChange}
            />
          </div>

          <div className="ppf-field">
            <label>Vaccine Interval (days)</label>
            <input
              type="number"
              min="1"
              name="vaccine_interval_days"
              value={form.vaccine_interval_days}
              onChange={onChange}
            />
          </div>

          <div className="ppf-field">
            <label>Last Grooming Date</label>
            <input
              type="date"
              name="last_grooming_date"
              value={form.last_grooming_date}
              onChange={onChange}
            />
          </div>

          <div className="ppf-field">
            <label>Grooming Interval (days)</label>
            <input
              type="number"
              min="1"
              name="grooming_interval_days"
              value={form.grooming_interval_days}
              onChange={onChange}
            />
          </div>
        </div>
      </div>

      <div className="ppf-section">
        <div className="ppf-section-head">
          <h2>Physical Features</h2>
          <p>Helpful for care and Lost & Found.</p>
        </div>

        <div className="ppf-grid">
          <div className="ppf-field">
            <label>Eye Colour</label>
            <input name="eye_color" value={form.eye_color} onChange={onChange} />
          </div>

          <div className="ppf-field">
            <label>Fur Type / Length</label>
            <input name="fur_type" value={form.fur_type} onChange={onChange} />
          </div>

          <div className="ppf-field ppf-span-2">
            <label>Markings</label>
            <input name="markings" value={form.markings} onChange={onChange} />
          </div>
        </div>
      </div>

      <div className="ppf-section">
        <div className="ppf-section-head">
          <h2>Health & Safety</h2>
          <p>Important care and emergency details.</p>
        </div>

        <div className="ppf-grid">
          <div className="ppf-field">
            <label>Vaccination Status</label>
            <select
              name="vaccination_status"
              value={form.vaccination_status}
              onChange={onChange}
            >
              <option value="">Select</option>
              <option value="Up to date">Up to date</option>
              <option value="Not updated">Not updated</option>
            </select>
          </div>

          <div className="ppf-field">
            <label>Last Vet Visit</label>
            <input
              type="date"
              name="last_vet_visit"
              value={form.last_vet_visit}
              onChange={onChange}
            />
          </div>

          <div className="ppf-field ppf-span-2">
            <label>Medical Notes</label>
            <textarea
              name="medical_notes"
              value={form.medical_notes}
              onChange={onChange}
              rows={3}
            />
          </div>

          <div className="ppf-field ppf-span-2">
            <label>Health Conditions</label>
            <textarea
              name="health_conditions"
              value={form.health_conditions}
              onChange={onChange}
              rows={3}
            />
          </div>

          <div className="ppf-field ppf-span-2">
            <label>Allergies</label>
            <textarea
              name="allergies"
              value={form.allergies}
              onChange={onChange}
              rows={3}
            />
          </div>

          <div className="ppf-field ppf-span-2">
            <label>Vaccination History</label>
            <textarea
              name="vaccination_history"
              value={form.vaccination_history}
              onChange={onChange}
              rows={3}
            />
          </div>

          <div className="ppf-field ppf-span-2">
            <label>Microchip Number</label>
            <input
              name="microchip_number"
              value={form.microchip_number}
              onChange={onChange}
            />
          </div>
        </div>
      </div>

      <div className="ppf-section">
        <div className="ppf-section-head">
          <h2>Lifestyle</h2>
          <p>Daily habits and personality notes.</p>
        </div>

        <div className="ppf-grid">
          <div className="ppf-field">
            <label>Diet</label>
            <input
              name="diet"
              value={form.diet}
              onChange={onChange}
              placeholder="e.g. Dry food twice daily"
            />
          </div>

          <div className="ppf-field">
            <label>Exercise Level</label>
            <select
              name="exercise_level"
              value={form.exercise_level}
              onChange={onChange}
            >
              <option value="">Select</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="ppf-field">
            <label>Activity Level</label>
            <select
              name="activity_level"
              value={form.activity_level}
              onChange={onChange}
            >
              <option value="">Select</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="ppf-field ppf-span-2">
            <label>Personality Traits</label>
            <input
              name="personality_traits"
              value={form.personality_traits}
              onChange={onChange}
              placeholder="e.g. Friendly, playful, calm"
            />
          </div>

          <div className="ppf-field ppf-span-2">
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
    </>
  );
}