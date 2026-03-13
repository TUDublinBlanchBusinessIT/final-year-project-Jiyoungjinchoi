import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ReportLostPet() {
  const navigate = useNavigate();
  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedPet, setSelectedPet] = useState(null);

  const [description, setDescription] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [lastSeenLat, setLastSeenLat] = useState("");
  const [lastSeenLng, setLastSeenLng] = useState("");
  const [photo, setPhoto] = useState(null);

  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [loadingPets, setLoadingPets] = useState(true);

  const authHeaders = useMemo(() => {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPets() {
    setLoadingPets(true);
    setStatus({ type: "idle", message: "" });

    try {
      const res = await fetch(`${apiBase}/pets`, {
        headers: authHeaders,
      });

      if (res.status === 401) {
        localStorage.removeItem("pawfection_token");
        navigate("/login");
        return;
      }

      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data) ? data : data?.data || [];
      setPets(Array.isArray(list) ? list : []);
    } catch {
      setStatus({ type: "error", message: "Failed to load your pets." });
    } finally {
      setLoadingPets(false);
    }
  }

  function handlePetChange(value) {
    setSelectedPetId(value);
    const pet = pets.find((p) => String(p.id) === String(value)) || null;
    setSelectedPet(pet);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedPetId) {
      setStatus({ type: "error", message: "Please choose a pet first." });
      return;
    }

    if (!description.trim() || !lastSeenLocation.trim()) {
      setStatus({
        type: "error",
        message: "Description and last seen location are required.",
      });
      return;
    }

    setStatus({ type: "loading", message: "Submitting lost report..." });

    try {
      const form = new FormData();
      form.append("pet_id", selectedPetId);
      form.append("description", description.trim());
      form.append("last_seen_location", lastSeenLocation.trim());

      if (lastSeenLat.trim()) form.append("last_seen_lat", lastSeenLat.trim());
      if (lastSeenLng.trim()) form.append("last_seen_lng", lastSeenLng.trim());
      if (photo) form.append("photo", photo);

      const res = await fetch(`${apiBase}/lost-pets`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const firstError =
          data?.message ||
          (data?.errors && Object.values(data.errors)?.[0]?.[0]) ||
          "Failed to submit lost report.";
        throw new Error(firstError);
      }

      setStatus({
        type: "success",
        message: "Lost report submitted successfully.",
      });

      setTimeout(() => navigate("/lostfound"), 800);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Failed to submit lost report.",
      });
    }
  }

  const panelBg =
    status.type === "success"
      ? "#f0fdf4"
      : status.type === "loading"
      ? "#eff6ff"
      : "#fff7ed";

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-IE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const petImageSrc =
    selectedPet?.photo_url ||
    (selectedPet?.photo_path
      ? `http://127.0.0.1:8000/storage/${selectedPet.photo_path}`
      : null);

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
          maxWidth: 920,
          background: "#fff",
          borderRadius: 22,
          padding: 28,
          boxShadow: "0 12px 35px rgba(0,0,0,.07)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: 26, margin: 0 }}>Report Lost Pet</h1>
            <p style={{ marginTop: 8, color: "#6b7280" }}>
              Choose one of your pets and the saved pet information will be used automatically.
            </p>
          </div>

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

        {status.type !== "idle" && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 14,
              background: panelBg,
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

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
            Choose Pet
          </label>

          <select
            value={selectedPetId}
            onChange={(e) => handlePetChange(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              marginBottom: 18,
            }}
          >
            <option value="">
              {loadingPets ? "Loading pets..." : "Select one of your pets"}
            </option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} {pet.species ? `• ${pet.species}` : ""} {pet.breed ? `• ${pet.breed}` : ""}
              </option>
            ))}
          </select>

          {selectedPet && (
            <div
              style={{
                border: "1px solid #eef0f4",
                borderRadius: 18,
                padding: 18,
                background: "#f9fafb",
                marginBottom: 20,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 14 }}>
                Selected Pet Information
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: 20,
                  alignItems: "start",
                }}
              >
                {petImageSrc ? (
                  <img
                    src={petImageSrc}
                    alt={selectedPet.name || "Pet"}
                    style={{
                      width: 160,
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 18,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 160,
                      height: 160,
                      borderRadius: 18,
                      background: "#e5e7eb",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      color: "#6b7280",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    No Photo
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div><strong>Name:</strong> {selectedPet.name || "—"}</div>
                  <div><strong>Species:</strong> {selectedPet.species || "—"}</div>
                  <div><strong>Breed:</strong> {selectedPet.breed || "—"}</div>
                  <div><strong>Date of Birth:</strong> {formatDate(selectedPet.dob)}</div>
                  <div><strong>Age:</strong> {selectedPet.age || "—"}</div>
                  <div><strong>Gender:</strong> {selectedPet.gender || "—"}</div>
                  <div><strong>Weight:</strong> {selectedPet.weight || "—"}</div>
                  <div><strong>Vaccination Status:</strong> {selectedPet.vaccination_status || "—"}</div>
                  <div><strong>Last Vet Visit:</strong> {formatDate(selectedPet.last_vet_visit)}</div>
                  <div><strong>Last Vaccination Date:</strong> {formatDate(selectedPet.last_vaccination_date)}</div>
                  <div><strong>Vaccine Interval:</strong> {selectedPet.vaccine_interval_days || "—"} days</div>
                  <div><strong>Last Grooming Date:</strong> {formatDate(selectedPet.last_grooming_date)}</div>
                  <div><strong>Grooming Interval:</strong> {selectedPet.grooming_interval_days || "—"} days</div>
                  <div><strong>Eye Colour:</strong> {selectedPet.eye_color || "—"}</div>
                  <div><strong>Fur Type:</strong> {selectedPet.fur_type || "—"}</div>
                  <div><strong>Markings:</strong> {selectedPet.markings || "—"}</div>
                  <div><strong>Health Conditions:</strong> {selectedPet.health_conditions || "—"}</div>
                  <div><strong>Allergies:</strong> {selectedPet.allergies || "—"}</div>
                  <div><strong>Vaccination History:</strong> {selectedPet.vaccination_history || "—"}</div>
                  <div><strong>Microchip Number:</strong> {selectedPet.microchip_number || "—"}</div>
                  <div><strong>Exercise Level:</strong> {selectedPet.exercise_level || "—"}</div>
                  <div><strong>Activity Level:</strong> {selectedPet.activity_level || "—"}</div>
                  <div><strong>Diet:</strong> {selectedPet.diet || selectedPet.food_type || "—"}</div>
                  <div><strong>Personality Traits:</strong> {selectedPet.personality_traits || selectedPet.temperament || "—"}</div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong>Medical Notes:</strong> {selectedPet.medical_notes || "—"}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong>Notes:</strong> {selectedPet.notes || selectedPet.behaviour_notes || "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe what happened, what the pet was wearing, behaviour, anything useful..."
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              resize: "vertical",
              marginBottom: 16,
              boxSizing: "border-box",
            }}
          />

          <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
            Last Seen Location
          </label>
          <input
            value={lastSeenLocation}
            onChange={(e) => setLastSeenLocation(e.target.value)}
            placeholder="e.g., Tallaght, Dublin"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              marginBottom: 16,
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
                Last Seen Latitude (optional)
              </label>
              <input
                value={lastSeenLat}
                onChange={(e) => setLastSeenLat(e.target.value)}
                placeholder="e.g., 53.288"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  marginBottom: 16,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
                Last Seen Longitude (optional)
              </label>
              <input
                value={lastSeenLng}
                onChange={(e) => setLastSeenLng(e.target.value)}
                placeholder="e.g., -6.373"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  marginBottom: 16,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
            Lost Report Photo (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            style={{ marginBottom: 22 }}
          />

          <button
            type="submit"
            disabled={status.type === "loading"}
            style={{
              width: "100%",
              padding: "13px 18px",
              borderRadius: 12,
              border: "none",
              fontWeight: 800,
              color: "#fff",
              cursor: "pointer",
              background: "linear-gradient(90deg,#fb7185,#60a5fa)",
              opacity: status.type === "loading" ? 0.6 : 1,
            }}
          >
            Submit Lost Report
          </button>
        </form>
      </div>
    </div>
  );
}