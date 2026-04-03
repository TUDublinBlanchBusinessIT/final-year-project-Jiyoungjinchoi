import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumAppointments.css";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve(window.google);
      return;
    }

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });
}

export default function PremiumAppointments() {
  const navigate = useNavigate();
  const token = localStorage.getItem("pawfection_token");
  const role = String(localStorage.getItem("pawfection_role") || "").toLowerCase();
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [appointments, setAppointments] = useState([]);

  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mapsReady, setMapsReady] = useState(false);

  const locationInputRef = useRef(null);
  const editLocationInputRef = useRef(null);

  const createAutocompleteRef = useRef(null);
  const editAutocompleteRef = useRef(null);

  const createMapRef = useRef(null);
  const editMapRef = useRef(null);
  const createMapInstanceRef = useRef(null);
  const editMapInstanceRef = useRef(null);
  const createMarkerRef = useRef(null);
  const editMarkerRef = useRef(null);

  const [form, setForm] = useState({
    pet_id: "",
    service_type: "",
    clinic_name: "",
    address: "",
    place_id: "",
    latitude: "",
    longitude: "",
    date: "",
    time: "",
    notes: "",
    priority: "standard",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    service_type: "vet",
    clinic_name: "",
    address: "",
    place_id: "",
    latitude: "",
    longitude: "",
    date: "",
    time: "",
    notes: "",
    priority: "standard",
  });

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

    if (role === "admin") {
      navigate("/admin-dashboard");
      return;
    }

    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name) setUserName(userObj.name);
      }
    } catch {
      setUserName("User");
    }

    fetchPets();
    fetchAppointments();

    if (GOOGLE_MAPS_API_KEY) {
      loadGoogleMapsScript()
        .then(() => setMapsReady(true))
        .catch(() => {
          setError("Google Maps failed to load. Check your API key, billing, and API restrictions.");
        });
    } else {
      setError("Google Maps API key is missing. Put VITE_GOOGLE_MAPS_API_KEY in frontend/.env and restart npm run dev.");
    }
  }, [navigate, token, role]);

  useEffect(() => {
    if (mapsReady && showForm) {
      initialiseCreateAutocomplete();
      initialiseCreateMap();
    }
  }, [mapsReady, showForm]);

  useEffect(() => {
    if (mapsReady && editingId) {
      initialiseEditAutocomplete();
      initialiseEditMap();
    }
  }, [mapsReady, editingId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const timeOptions = useMemo(() => {
    const out = [];
    for (let h = 0; h <= 23; h++) {
      for (const m of [0, 30]) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return out;
  }, []);

  const selectedPet = useMemo(() => {
    return pets.find((pet) => String(pet.id) === String(selectedPetId)) || pets[0] || null;
  }, [pets, selectedPetId]);

  const fetchPets = async () => {
    if (!token) return;

    setLoadingPets(true);
    try {
      const res = await fetch(`${apiBase}/pets`, {
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPets([]);
        setError(data?.message || "Failed to load pets.");
        return;
      }

      const petList = Array.isArray(data) ? data : data?.pets || [];
      setPets(petList);

      if (petList.length > 0) {
        const firstId = petList[0]?.id;
        setSelectedPetId(String(firstId));
        setForm((prev) => ({ ...prev, pet_id: String(firstId) }));
      }
    } catch {
      setPets([]);
      setError("Server error. Is your backend running?");
    } finally {
      setLoadingPets(false);
    }
  };

  const fetchAppointments = async () => {
    if (!token) return;

    setLoadingAppointments(true);
    setError("");

    try {
      const res = await fetch(`${apiBase}/appointments`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAppointments([]);
        setError(data?.message || "Failed to load appointments.");
        return;
      }

      const list = data?.data || [];
      setAppointments(Array.isArray(list) ? list : []);
    } catch {
      setAppointments([]);
      setError("Failed to load appointments. Is your backend running?");
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fmtDateTime = (isoString) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleString("en-IE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const buildISOFromDateTime = (date, time) => {
    if (!date || !time) return "";
    const local = new Date(`${date}T${time}:00`);
    if (Number.isNaN(local.getTime())) return "";
    return local.toISOString();
  };

  const splitISOToDateTime = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { date: "", time: "" };

    const pad = (n) => String(n).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  };

  const resetCreateForm = () => {
    setForm({
      pet_id: selectedPet ? String(selectedPet.id) : "",
      service_type: "",
      clinic_name: "",
      address: "",
      place_id: "",
      latitude: "",
      longitude: "",
      date: "",
      time: "",
      notes: "",
      priority: "standard",
    });

    if (locationInputRef.current) locationInputRef.current.value = "";

    if (createMarkerRef.current) {
      createMarkerRef.current.setMap(null);
      createMarkerRef.current = null;
    }

    if (createMapInstanceRef.current) {
      createMapInstanceRef.current.setCenter({ lat: 53.3498, lng: -6.2603 });
      createMapInstanceRef.current.setZoom(11);
    }
  };

  const initialiseCreateMap = () => {
    if (!createMapRef.current || !window.google?.maps) return;
    if (createMapInstanceRef.current) return;

    createMapInstanceRef.current = new window.google.maps.Map(createMapRef.current, {
      center: { lat: 53.3498, lng: -6.2603 },
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
  };

  const initialiseEditMap = () => {
    if (!editMapRef.current || !window.google?.maps) return;
    if (editMapInstanceRef.current) return;

    editMapInstanceRef.current = new window.google.maps.Map(editMapRef.current, {
      center: { lat: 53.3498, lng: -6.2603 },
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
  };

  const updateCreateMapLocation = (lat, lng, title = "") => {
    if (!createMapInstanceRef.current || lat === "" || lng === "") return;

    const position = { lat: Number(lat), lng: Number(lng) };
    createMapInstanceRef.current.setCenter(position);
    createMapInstanceRef.current.setZoom(16);

    if (createMarkerRef.current) {
      createMarkerRef.current.setMap(null);
    }

    createMarkerRef.current = new window.google.maps.Marker({
      position,
      map: createMapInstanceRef.current,
      title,
    });
  };

  const updateEditMapLocation = (lat, lng, title = "") => {
    if (!editMapInstanceRef.current || lat === "" || lng === "") return;

    const position = { lat: Number(lat), lng: Number(lng) };
    editMapInstanceRef.current.setCenter(position);
    editMapInstanceRef.current.setZoom(16);

    if (editMarkerRef.current) {
      editMarkerRef.current.setMap(null);
    }

    editMarkerRef.current = new window.google.maps.Marker({
      position,
      map: editMapInstanceRef.current,
      title,
    });
  };

  const initialiseCreateAutocomplete = () => {
    if (!locationInputRef.current || !window.google?.maps?.places) return;
    if (createAutocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
      fields: ["place_id", "name", "formatted_address", "geometry"],
      types: ["establishment"],
      componentRestrictions: { country: "ie" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      const address = place?.formatted_address || "";
      const clinicName = place?.name || "";
      const placeId = place?.place_id || "";
      const lat = place?.geometry?.location?.lat?.() ?? "";
      const lng = place?.geometry?.location?.lng?.() ?? "";

      setForm((prev) => ({
        ...prev,
        clinic_name: clinicName,
        address,
        place_id: placeId,
        latitude: lat,
        longitude: lng,
      }));

      if (locationInputRef.current) {
        locationInputRef.current.value = clinicName || address;
      }

      updateCreateMapLocation(lat, lng, clinicName || address);
    });

    createAutocompleteRef.current = autocomplete;
  };

  const initialiseEditAutocomplete = () => {
    if (!editLocationInputRef.current || !window.google?.maps?.places) return;
    if (editAutocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(editLocationInputRef.current, {
      fields: ["place_id", "name", "formatted_address", "geometry"],
      types: ["establishment"],
      componentRestrictions: { country: "ie" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      const address = place?.formatted_address || "";
      const clinicName = place?.name || "";
      const placeId = place?.place_id || "";
      const lat = place?.geometry?.location?.lat?.() ?? "";
      const lng = place?.geometry?.location?.lng?.() ?? "";

      setEditForm((prev) => ({
        ...prev,
        clinic_name: clinicName,
        address,
        place_id: placeId,
        latitude: lat,
        longitude: lng,
      }));

      if (editLocationInputRef.current) {
        editLocationInputRef.current.value = clinicName || address;
      }

      updateEditMapLocation(lat, lng, clinicName || address);
    });

    editAutocompleteRef.current = autocomplete;
  };

  const createAppointment = async (e) => {
    e.preventDefault();

    if (!form.pet_id) return setError("Please select a pet.");
    if (!form.service_type) return setError("Please select service type.");
    if (!form.address.trim()) return setError("Please select a location from the suggestions.");
    if (!form.date) return setError("Please select appointment date.");
    if (!form.time) return setError("Please select appointment time.");

    const appointment_at = buildISOFromDateTime(form.date, form.time);
    if (!appointment_at) return setError("Invalid date/time selection.");

    setSavingAppointment(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/appointments`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pet_id: Number(form.pet_id),
          service_type: form.service_type,
          address: form.address.trim(),
          clinic_name: form.clinic_name || null,
          place_id: form.place_id || null,
          latitude: form.latitude || null,
          longitude: form.longitude || null,
          priority: form.priority || "standard",
          appointment_at,
          notes: form.notes.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data?.message ||
            (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
            "Failed to create appointment."
        );
        return;
      }

      setSuccess("Premium appointment created successfully.");
      resetCreateForm();
      setShowForm(false);
      fetchAppointments();
    } catch {
      setError("Failed to create appointment. Is your backend running?");
    } finally {
      setSavingAppointment(false);
    }
  };

  const startEdit = (appt) => {
    setEditingId(appt.id);
    setShowForm(false);
    setError("");
    setSuccess("");

    const { date, time } = splitISOToDateTime(appt.appointment_at);

    setEditForm({
      service_type: appt.service_type || "vet",
      clinic_name: appt.clinic_name || "",
      address: appt.address || "",
      place_id: appt.place_id || "",
      latitude: appt.latitude || "",
      longitude: appt.longitude || "",
      date,
      time,
      notes: appt.notes || "",
      priority: appt.priority || "standard",
    });

    setTimeout(() => {
      if (editLocationInputRef.current) {
        editLocationInputRef.current.value = appt.clinic_name || appt.address || "";
      }

      if (appt.latitude && appt.longitude) {
        updateEditMapLocation(
          appt.latitude,
          appt.longitude,
          appt.clinic_name || appt.address || ""
        );
      }
    }, 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (apptId) => {
    if (!editForm.service_type) return setError("Please select service type.");
    if (!editForm.address.trim()) return setError("Please select a location.");
    if (!editForm.date) return setError("Please select appointment date.");
    if (!editForm.time) return setError("Please select appointment time.");

    const appointment_at = buildISOFromDateTime(editForm.date, editForm.time);
    if (!appointment_at) return setError("Invalid date/time selection.");

    setBusyId(apptId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/appointments/${apptId}`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_type: editForm.service_type,
          address: editForm.address.trim(),
          clinic_name: editForm.clinic_name || null,
          place_id: editForm.place_id || null,
          latitude: editForm.latitude || null,
          longitude: editForm.longitude || null,
          priority: editForm.priority || "standard",
          appointment_at,
          notes: editForm.notes.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data?.message ||
            (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
            "Failed to update appointment."
        );
        return;
      }

      setEditingId(null);
      setSuccess("Appointment updated successfully.");
      fetchAppointments();
    } catch {
      setError("Failed to update appointment.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteAppointment = async (apptId) => {
    const ok = window.confirm("Delete this appointment?");
    if (!ok) return;

    setBusyId(apptId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/appointments/${apptId}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to delete appointment.");
        return;
      }

      setSuccess("Appointment deleted.");
      if (editingId === apptId) setEditingId(null);
      fetchAppointments();
    } catch {
      setError("Failed to delete appointment.");
    } finally {
      setBusyId(null);
    }
  };

  const filteredAppointments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return [...appointments]
      .sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at))
      .filter((a) => {
        if (!q) return true;

        const values = [
          a?.pet?.name,
          a?.service_type,
          a?.clinic_name,
          a?.address,
          a?.notes,
          a?.priority,
          fmtDateTime(a?.appointment_at),
          fmtDateTime(a?.reminder_at),
        ]
          .join(" ")
          .toLowerCase();

        return values.includes(q);
      });
  }, [appointments, searchTerm]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return filteredAppointments.find((a) => new Date(a.appointment_at) > now) || null;
  }, [filteredAppointments]);

  const totalAppointments = appointments.length;

  const urgentAppointments = useMemo(() => {
    return appointments.filter(
      (a) => String(a?.priority || "").toLowerCase() === "urgent"
    ).length;
  }, [appointments]);

  const vetAppointments = useMemo(() => {
    return appointments.filter(
      (a) => String(a?.service_type || "").toLowerCase() === "vet"
    ).length;
  }, [appointments]);

  const groomerAppointments = useMemo(() => {
    return appointments.filter(
      (a) => String(a?.service_type || "").toLowerCase() === "groomer"
    ).length;
  }, [appointments]);

  const openMap = (appt) => {
    const query = encodeURIComponent(appt?.clinic_name || appt?.address || "");
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  return (
    <div className="pmpa-shell">
      <header className="pmpa-site-header">
        <div
          className="pmpa-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img className="pmpa-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pmpa-brand-copy">
            <div className="pmpa-brand-title">Pawfection</div>
            <div className="pmpa-brand-sub">Premium Appointments</div>
          </div>
        </div>

        <nav className="pmpa-topnav">
          <Link className="pmpa-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pmpa-topnav-item" to="/premium-mypets">
            My Pet
          </Link>
          <Link className="pmpa-topnav-item active" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="pmpa-topnav-item" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="pmpa-topnav-item" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pmpa-topnav-item" to="/premium/community">
            Community
          </Link>
          <Link className="pmpa-topnav-item" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="pmpa-topnav-item" to="/premium/vet-chat">
            AI Vet Chat
          </Link>
          <Link className="pmpa-topnav-item" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="pmpa-header-side">
          <div className="pmpa-date-pill">{todayText}</div>
          <div className="pmpa-userchip">
            <div className="pmpa-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
            <div>
              <div className="pmpa-userchip-name">{userName}</div>
              <div className="pmpa-userchip-sub">Premium User</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pmpa-main">
        <section className="pmpa-hero">
          <div className="pmpa-hero-copy">
            <div className="pmpa-kicker">Pawfection Premium Scheduling</div>
            <h1 className="pmpa-hero-title">
              {getGreeting()}, {userName}
            </h1>
            <p className="pmpa-hero-text">
              Manage premium vet and grooming bookings with smarter location search,
              better appointment tracking, and a polished premium experience.
            </p>

            <div className="pmpa-selector-wrap">
              <label htmlFor="appointmentPetSelect" className="pmpa-selector-label">
                Select Pet
              </label>
              <select
                id="appointmentPetSelect"
                className="pmpa-selector"
                value={selectedPetId}
                onChange={(e) => {
                  setSelectedPetId(e.target.value);
                  setForm((prev) => ({ ...prev, pet_id: e.target.value }));
                }}
                disabled={loadingPets || pets.length === 0}
              >
                {pets.length === 0 && <option value="">No pets available</option>}
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} {pet.breed ? `• ${pet.breed}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="pmpa-hero-actions">
              <button
                className="pmpa-btn pmpa-btn-primary"
                type="button"
                onClick={() => {
                  setShowForm((prev) => !prev);
                  setEditingId(null);
                  setError("");
                  setSuccess("");
                }}
              >
                {showForm ? "Close Form" : "Create Appointment"}
              </button>

              <button
                className="pmpa-btn"
                type="button"
                onClick={() => fetchAppointments()}
              >
                Refresh Appointments
              </button>

              <button
                className="pmpa-btn"
                type="button"
                onClick={() => navigate("/premium-dashboard")}
              >
                Back to Dashboard
              </button>
            </div>

            {error && <div className="pmpa-form-message pmpa-form-error">{error}</div>}
            {success && <div className="pmpa-form-message pmpa-form-success">{success}</div>}

            {showForm && (
              <form className="pmpa-form-card" onSubmit={createAppointment}>
                <div className="pmpa-form-grid">
                  <div className="pmpa-field">
                    <label>Pet *</label>
                    <select
                      value={form.pet_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, pet_id: e.target.value }))}
                    >
                      <option value="">Choose pet</option>
                      {pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pmpa-field">
                    <label>Service Type *</label>
                    <select
                      value={form.service_type}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, service_type: e.target.value }))
                      }
                    >
                      <option value="">Choose service</option>
                      <option value="vet">Vet</option>
                      <option value="groomer">Grooming</option>
                    </select>
                  </div>

                  <div className="pmpa-field">
                    <label>Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, priority: e.target.value }))
                      }
                    >
                      <option value="standard">Standard</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="pmpa-field pmpa-span-2">
                    <label>Location *</label>
                    <input
                      ref={locationInputRef}
                      type="text"
                      placeholder="Search exact vet clinic or grooming shop"
                      autoComplete="off"
                    />
                  </div>

                  <div className="pmpa-field pmpa-span-2">
                    <label>Map Preview</label>
                    <div ref={createMapRef} className="pmpa-map-box" />
                  </div>

                  <div className="pmpa-field pmpa-span-2">
                    <label>Selected Address</label>
                    <input
                      value={form.address}
                      readOnly
                      placeholder="Selected location address will appear here"
                    />
                  </div>

                  <div className="pmpa-field">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </div>

                  <div className="pmpa-field">
                    <label>Time *</label>
                    <select
                      value={form.time}
                      onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                    >
                      <option value="">Choose time</option>
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pmpa-field pmpa-span-2">
                    <label>Notes</label>
                    <textarea
                      rows="4"
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any extra appointment notes..."
                    />
                  </div>
                </div>

                <div className="pmpa-form-actions">
                  <button
                    className="pmpa-btn pmpa-btn-primary"
                    type="submit"
                    disabled={savingAppointment}
                  >
                    {savingAppointment ? "Saving..." : "Save Appointment"}
                  </button>

                  <button
                    className="pmpa-btn"
                    type="button"
                    onClick={() => {
                      resetCreateForm();
                      setShowForm(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="pmpa-hero-card">
            <div className="pmpa-hero-card-top">
              <div className="pmpa-premium-badge">Premium Active</div>
              <h2>{selectedPet?.name || "Your Pet"}</h2>
              <p>
                {selectedPet?.breed || selectedPet?.species || "Pet profile"}
                {selectedPet?.age ? ` • ${selectedPet.age} yrs` : ""}
                {selectedPet?.weight ? ` • ${selectedPet.weight}kg` : ""}
              </p>
            </div>

            <div className="pmpa-stat-row">
              <div className="pmpa-stat-pill">Appointments: {totalAppointments}</div>
              <div className="pmpa-stat-pill">Vet: {vetAppointments}</div>
              <div className="pmpa-stat-pill">Grooming: {groomerAppointments}</div>
              <div className="pmpa-stat-pill">Urgent: {urgentAppointments}</div>
            </div>

            <div className="pmpa-quick-box">
              <strong>NEXT APPOINTMENT</strong>
              <span>
                {nextAppointment
                  ? `${nextAppointment?.pet?.name || "Pet"} • ${fmtDateTime(nextAppointment.appointment_at)}`
                  : "No upcoming appointments"}
              </span>
            </div>

            <div className="pmpa-quick-box">
              <strong>LOCATION</strong>
              <span>
                {nextAppointment?.clinic_name ||
                  nextAppointment?.address ||
                  "Select a location to see details here"}
              </span>
            </div>

            <div className="pmpa-quick-box">
              <strong>PREMIUM BENEFIT</strong>
              <span>Location search, cleaner scheduling, and better appointment visibility.</span>
            </div>
          </div>
        </section>

        <section className="pmpa-grid">
          <article className="pmpa-card">
            <div className="pmpa-card-kicker">Premium Search</div>
            <h3>Find Your Appointment Fast</h3>

            <div className="pmpa-field" style={{ marginTop: "14px" }}>
              <label>Search</label>
              <input
                type="text"
                placeholder="Search by pet, location, service, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="pmpa-search-meta" style={{ marginTop: "12px" }}>
              {!searchTerm.trim() ? (
                <span>
                  Showing all appointments: <strong>{appointments.length}</strong>
                </span>
              ) : (
                <span>
                  Results for "<strong>{searchTerm}</strong>": <strong>{filteredAppointments.length}</strong>
                </span>
              )}
            </div>

            {searchTerm.trim() && (
              <>
                <div style={{ marginTop: "12px" }}>
                  <button
                    type="button"
                    className="pmpa-btn pmpa-btn-small"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </button>
                </div>

                <div className="pmpa-search-results">
                  {filteredAppointments.length === 0 ? (
                    <div className="pmpa-empty" style={{ marginTop: "14px" }}>
                      No appointments match "{searchTerm}".
                    </div>
                  ) : (
                    filteredAppointments.map((appt) => (
                      <div key={`search-${appt.id}`} className="pmpa-search-card">
                        <div className="pmpa-search-card-head">
                          <div className="pmpa-search-card-title">
                            {(appt?.pet?.name || "Pet")} • {appt?.service_type || "appointment"}
                          </div>
                          <div className="pmpa-chip-wrap">
                            <span className="pmpa-chip">{appt?.priority || "standard"}</span>
                            <span className="pmpa-chip">{fmtDateTime(appt?.appointment_at)}</span>
                          </div>
                        </div>

                        <div className="pmpa-search-detail-grid">
                          <div><strong>Location:</strong> {appt?.clinic_name || "Not saved"}</div>
                          <div><strong>Address:</strong> {appt?.address || "No address"}</div>
                          <div><strong>Reminder:</strong> {fmtDateTime(appt?.reminder_at)}</div>
                          <div><strong>Notes:</strong> {appt?.notes || "No notes added."}</div>
                        </div>

                        <div className="pmpa-timeline-actions">
                          <button
                            className="pmpa-btn pmpa-btn-small"
                            type="button"
                            onClick={() => openMap(appt)}
                          >
                            Open Map
                          </button>

                          <button
                            className="pmpa-btn pmpa-btn-small"
                            type="button"
                            onClick={() => startEdit(appt)}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </article>

          <article className="pmpa-card">
            <div className="pmpa-card-kicker">Appointment Snapshot</div>
            <h3>Quick Summary</h3>

            <div className="pmpa-analytics-grid">
              <div className="pmpa-analytics-box">
                <span>Total</span>
                <strong>{totalAppointments}</strong>
              </div>
              <div className="pmpa-analytics-box">
                <span>Upcoming</span>
                <strong>{nextAppointment ? "1+" : "0"}</strong>
              </div>
              <div className="pmpa-analytics-box">
                <span>Vet</span>
                <strong>{vetAppointments}</strong>
              </div>
              <div className="pmpa-analytics-box">
                <span>Grooming</span>
                <strong>{groomerAppointments}</strong>
              </div>
            </div>
          </article>

          <article className="pmpa-card pmpa-card-wide">
            <div className="pmpa-card-kicker">Appointment Timeline</div>
            <h3>Your Premium Appointments</h3>

            {loadingAppointments ? (
              <div className="pmpa-empty">Loading appointments...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="pmpa-empty">
                {searchTerm.trim()
                  ? `No appointments match "${searchTerm}".`
                  : "No appointments found yet."}
              </div>
            ) : (
              <div className="pmpa-timeline">
                {filteredAppointments.map((appt, index) => {
                  const isEditing = editingId === appt.id;
                  const petName = appt?.pet?.name || "Pet";

                  return (
                    <div key={appt.id || index} className="pmpa-timeline-item">
                      <div className="pmpa-timeline-dot" />
                      <div className="pmpa-timeline-content">
                        {!isEditing ? (
                          <>
                            <div className="pmpa-timeline-top">
                              <div>
                                <div className="pmpa-timeline-title">
                                  {petName} • {appt.service_type}
                                </div>
                                <div className="pmpa-timeline-text">
                                  {appt.clinic_name || "Location not saved"}
                                </div>
                                <div className="pmpa-timeline-sub">
                                  {appt.address || "No address"}
                                </div>
                              </div>

                              <div className="pmpa-chip-wrap">
                                <span className="pmpa-chip">{fmtDateTime(appt.appointment_at)}</span>
                                <span className="pmpa-chip">
                                  {appt.priority || "standard"}
                                </span>
                              </div>
                            </div>

                            <div className="pmpa-appointment-meta">
                              <div>
                                <strong>Reminder:</strong> {fmtDateTime(appt.reminder_at)}
                              </div>
                              <div>
                                <strong>Notes:</strong> {appt.notes || "No notes added."}
                              </div>
                            </div>

                            <div className="pmpa-timeline-actions">
                              <button
                                className="pmpa-btn pmpa-btn-small"
                                type="button"
                                onClick={() => openMap(appt)}
                              >
                                Open Map
                              </button>

                              <button
                                className="pmpa-btn pmpa-btn-small"
                                type="button"
                                onClick={() => startEdit(appt)}
                                disabled={busyId === appt.id}
                              >
                                Edit
                              </button>

                              <button
                                className="pmpa-btn pmpa-btn-danger pmpa-btn-small"
                                type="button"
                                onClick={() => deleteAppointment(appt.id)}
                                disabled={busyId === appt.id}
                              >
                                {busyId === appt.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="pmpa-form-grid">
                              <div className="pmpa-field">
                                <label>Service Type</label>
                                <select
                                  value={editForm.service_type}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      service_type: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="vet">Vet</option>
                                  <option value="groomer">Grooming</option>
                                </select>
                              </div>

                              <div className="pmpa-field">
                                <label>Priority</label>
                                <select
                                  value={editForm.priority}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      priority: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="standard">Standard</option>
                                  <option value="urgent">Urgent</option>
                                </select>
                              </div>

                              <div className="pmpa-field pmpa-span-2">
                                <label>Location</label>
                                <input
                                  ref={editLocationInputRef}
                                  type="text"
                                  placeholder="Search exact vet clinic or grooming shop"
                                  autoComplete="off"
                                />
                              </div>

                              <div className="pmpa-field pmpa-span-2">
                                <label>Map Preview</label>
                                <div ref={editMapRef} className="pmpa-map-box" />
                              </div>

                              <div className="pmpa-field pmpa-span-2">
                                <label>Address</label>
                                <input value={editForm.address} readOnly />
                              </div>

                              <div className="pmpa-field">
                                <label>Date</label>
                                <input
                                  type="date"
                                  value={editForm.date}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({ ...prev, date: e.target.value }))
                                  }
                                />
                              </div>

                              <div className="pmpa-field">
                                <label>Time</label>
                                <select
                                  value={editForm.time}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({ ...prev, time: e.target.value }))
                                  }
                                >
                                  <option value="">Choose time</option>
                                  {timeOptions.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="pmpa-field pmpa-span-2">
                                <label>Notes</label>
                                <textarea
                                  rows="4"
                                  value={editForm.notes}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                                  }
                                />
                              </div>
                            </div>

                            <div className="pmpa-timeline-actions">
                              <button
                                className="pmpa-btn pmpa-btn-primary pmpa-btn-small"
                                type="button"
                                onClick={() => saveEdit(appt.id)}
                                disabled={busyId === appt.id}
                              >
                                {busyId === appt.id ? "Saving..." : "Save"}
                              </button>

                              <button
                                className="pmpa-btn pmpa-btn-small"
                                type="button"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}