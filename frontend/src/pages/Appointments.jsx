import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./Appointments.css";

export default function Appointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("pawfection_token");

  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");

  // Options
  const [pets, setPets] = useState([]);
  const [optsLoading, setOptsLoading] = useState(false);

  // Appointments list
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create form toggle (like Inventory)
  const [showForm, setShowForm] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    pet_id: "",
    service_type: "",
    address: "",
    date: "",
    time: "",
    notes: "",
  });

  // Edit state (Inventory style)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    service_type: "vet",
    address: "",
    date: "",
    time: "",
    notes: "",
  });

  const authHeaders = useMemo(() => {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const loadUserName = () => {
    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name && typeof userObj.name === "string") setUserName(userObj.name);
        return;
      }
      const fallbackName =
        localStorage.getItem("pawfection_user_name") ||
        localStorage.getItem("user_name") ||
        localStorage.getItem("name");
      if (fallbackName) setUserName(fallbackName);
    } catch {
      setUserName("User");
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
      hour12: false, // ✅ 24-hour display
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
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { date, time };
  };

  // ✅ 24-hour dropdown: 00:00 to 23:30 every 30 minutes
  const timeOptions = useMemo(() => {
    const out = [];
    for (let h = 0; h <= 23; h++) {
      for (let m of [0, 30]) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return out;
  }, []);

  const fetchOptions = async () => {
    if (!token) return navigate("/login");
    setOptsLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiBase}/appointments/options`, {
        method: "GET",
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to load options.");
        setPets([]);
      } else {
        const petsList = data?.data?.pets || [];
        setPets(Array.isArray(petsList) ? petsList : []);
      }
    } catch {
      setError("Server error. Is your backend running?");
      setPets([]);
    } finally {
      setOptsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!token) return navigate("/login");
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiBase}/appointments`, {
        method: "GET",
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to load appointments.");
        setAppointments([]);
      } else {
        const list = data?.data || [];
        setAppointments(Array.isArray(list) ? list : []);
      }
    } catch {
      setError("Server error. Is your backend running?");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setForm({
      pet_id: "",
      service_type: "",
      address: "",
      date: "",
      time: "",
      notes: "",
    });
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");

    setError("");
    setSuccess("");

    if (!form.pet_id) return setError("Please select a pet.");
    if (!form.service_type) return setError("Please select service type.");
    if (!form.address.trim()) return setError("Please enter an address.");
    if (!form.date) return setError("Please select appointment date.");
    if (!form.time) return setError("Please select appointment time.");

    const appointment_at = buildISOFromDateTime(form.date, form.time);
    if (!appointment_at) return setError("Invalid date/time selection.");

    try {
      const res = await fetch(`${apiBase}/appointments`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          pet_id: Number(form.pet_id),
          service_type: form.service_type,
          address: form.address.trim(),
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

      setSuccess("Appointment created successfully!");
      resetCreateForm();
      setShowForm(false);

      await fetchAppointments();
    } catch {
      setError("Failed to create appointment. Is the backend running?");
    }
  };

  const startEdit = (appt) => {
    setError("");
    setSuccess("");
    setEditingId(appt.id);
    setShowForm(false);

    const { date, time } = splitISOToDateTime(appt.appointment_at);

    setEditForm({
      service_type: appt.service_type || "vet",
      address: appt.address || "",
      date,
      time,
      notes: appt.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (apptId) => {
    if (!token) return navigate("/login");

    setError("");
    setSuccess("");

    if (!editForm.service_type) return setError("Please select service type.");
    if (!editForm.address.trim()) return setError("Please enter an address.");
    if (!editForm.date) return setError("Please select appointment date.");
    if (!editForm.time) return setError("Please select appointment time.");

    const appointment_at = buildISOFromDateTime(editForm.date, editForm.time);
    if (!appointment_at) return setError("Invalid date/time selection.");

    setBusyId(apptId);

    try {
      const res = await fetch(`${apiBase}/appointments/${apptId}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: editForm.service_type,
          address: editForm.address.trim(),
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
      setSuccess("Appointment updated!");
      await fetchAppointments();
    } catch {
      setError("Failed to update. Is your backend running?");
    } finally {
      setBusyId(null);
    }
  };

  const deleteAppointment = async (apptId) => {
    if (!token) return navigate("/login");

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
      await fetchAppointments();
    } catch {
      setError("Failed to delete. Is your backend running?");
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadUserName();
    fetchOptions();
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedAppointments = useMemo(() => {
    return (appointments || [])
      .slice()
      .sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at));
  }, [appointments]);

  return (
    <div className="pf2-shell">
      {/* Sidebar */}
      <aside className="pf2-sidebar">
        <div className="pf2-brand" onClick={() => navigate("/dashboard")} role="button">
          <img className="pf2-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pf2-brand-text">
            <div className="pf2-brand-title">Pawfection</div>
            <div className="pf2-brand-sub">Dashboard</div>
          </div>
        </div>

        <nav className="pf2-nav">
          <Link className="pf2-nav-item" to="/dashboard">Dashboard</Link>
          <Link className="pf2-nav-item" to="/mypets">My Pets</Link>
          <Link
            className={`pf2-nav-item ${location.pathname.includes("/appointments") ? "active" : ""}`}
            to="/appointments"
          >
            Appointments
          </Link>
          <Link className="pf2-nav-item" to="/reminders">Reminders</Link>
          <Link className="pf2-nav-item" to="/lostfound">Lost &amp; Found</Link>
          <Link className="pf2-nav-item" to="/community">Community</Link>
          <Link className="pf2-nav-item" to="/inventory">Inventory</Link>
        </nav>

        <div className="pf2-sidebar-footer">
          <button className="pf2-btn pf2-btn-ghost" onClick={() => navigate("/profile")}>
            View Profile
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="pf2-main">
        {/* Topbar */}
        <header className="pf2-topbar">
          <div className="pf2-search">
            <input placeholder="Search appointments..." />
          </div>

          <div className="pf2-topbar-right">
            <div className="pf2-userchip" title={userName}>
              <div className="pf2-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pf2-userchip-text">
                <div className="pf2-userchip-name">{userName}</div>
                <div className="pf2-userchip-sub">User</div>
              </div>
            </div>
          </div>
        </header>

        <main className="pf2-content">
          <div className="pfa-head">
            <div>
              <h1 className="pfa-title">Appointments</h1>
              <p className="pfa-subtitle">
                Create and manage vet/grooming appointments manually. Reminder scheduled 24 hours before.
              </p>
            </div>
          </div>

          {error && <div className="pfa-alert">{error}</div>}
          {success && <div className="pfa-success">{success}</div>}

          <section className="pfa-grid-one">
            <div className="pfa-card">
              <div className="pfa-cardtop">
                <div>
                  <div className="pfa-cardtitle">Your appointments</div>
                  <div className="pfa-mini">Create, edit, or delete appointments anytime.</div>
                </div>

                <div className="pfa-actions-right">
                  <button
                    className="pf2-btn pf2-btn-primary"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setEditingId(null);
                      setShowForm((p) => !p);
                    }}
                  >
                    {showForm ? "Close" : "+ Create Appointment"}
                  </button>

                  <button className="pf2-btn" onClick={fetchAppointments} disabled={loading}>
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>

              {showForm && (
                <form className="pfa-form" onSubmit={createAppointment}>
                  <div className="pfa-formgrid">
                    <div className="pfa-field">
                      <label>Select pet *</label>
                      <select
                        value={form.pet_id}
                        onChange={(e) => setForm((p) => ({ ...p, pet_id: e.target.value }))}
                        disabled={optsLoading}
                      >
                        <option value="">-- Choose --</option>
                        {pets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {!optsLoading && pets.length === 0 && (
                        <div className="pfa-help">No pets found. Add a pet first.</div>
                      )}
                    </div>

                    <div className="pfa-field">
                      <label>Service type *</label>
                      <select
                        value={form.service_type}
                        onChange={(e) => setForm((p) => ({ ...p, service_type: e.target.value }))}
                      >
                        <option value="">-- Choose --</option>
                        <option value="vet">Vet</option>
                        <option value="groomer">Grooming</option>
                      </select>
                    </div>

                    <div className="pfa-field pfa-span2">
                      <label>Address *</label>
                      <input
                        value={form.address}
                        onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                        placeholder="e.g., 12 Main Street, Dublin"
                      />
                    </div>

                    <div className="pfa-field">
                      <label>Appointment date *</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      />
                    </div>

                    <div className="pfa-field">
                      <label>Appointment time *</label>
                      <select
                        value={form.time}
                        onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                      >
                        <option value="">-- Choose --</option>
                        {timeOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <div className="pfa-help">24-hour format (00:00 – 23:30)</div>
                    </div>

                    <div className="pfa-field pfa-span2">
                      <label>Notes (optional)</label>
                      <input
                        value={form.notes}
                        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="Any notes for this appointment..."
                      />
                      <div className="pfa-help">
                        Reminder is scheduled automatically 24 hours before the appointment.
                      </div>
                    </div>
                  </div>

                  <div className="pfa-formactions">
                    <button className="pf2-btn pf2-btn-primary" type="submit">
                      Create appointment
                    </button>
                    <button
                      className="pf2-btn"
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

              {loading && <div className="pfa-empty">Loading appointments…</div>}

              {!loading && sortedAppointments.length === 0 && (
                <div className="pfa-empty">No appointments yet. Click “Create Appointment” to add one.</div>
              )}

              {!loading && sortedAppointments.length > 0 && (
                <div className="pfa-list">
                  {sortedAppointments.map((a) => {
                    const isEditing = editingId === a.id;
                    const petName = a?.pet?.name || "Pet";

                    return (
                      <div key={a.id} className="pfa-row">
                        <div className="pfa-left">
                          <div className="pfa-name">
                            {petName} • <span className="pfa-chip">{a.service_type}</span>
                          </div>

                          {!isEditing ? (
                            <>
                              <div className="pfa-sub">{a.address || "Address n/a"}</div>
                              <div className="pfa-sub">{fmtDateTime(a.appointment_at)}</div>
                              <div className="pfa-sub2">
                                Reminder: {fmtDateTime(a.reminder_at)} (24h before)
                              </div>
                            </>
                          ) : (
                            <div className="pfa-edit">
                              <div className="pfa-field">
                                <label>Service type *</label>
                                <select
                                  value={editForm.service_type}
                                  onChange={(e) =>
                                    setEditForm((p) => ({ ...p, service_type: e.target.value }))
                                  }
                                >
                                  <option value="vet">Vet</option>
                                  <option value="groomer">Grooming</option>
                                </select>
                              </div>

                              <div className="pfa-field">
                                <label>Address *</label>
                                <input
                                  value={editForm.address}
                                  onChange={(e) =>
                                    setEditForm((p) => ({ ...p, address: e.target.value }))
                                  }
                                />
                              </div>

                              <div className="pfa-field">
                                <label>Date *</label>
                                <input
                                  type="date"
                                  value={editForm.date}
                                  onChange={(e) =>
                                    setEditForm((p) => ({ ...p, date: e.target.value }))
                                  }
                                />
                              </div>

                              <div className="pfa-field">
                                <label>Time *</label>
                                <select
                                  value={editForm.time}
                                  onChange={(e) =>
                                    setEditForm((p) => ({ ...p, time: e.target.value }))
                                  }
                                >
                                  <option value="">-- Choose --</option>
                                  {timeOptions.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="pfa-field pfa-span2">
                                <label>Notes</label>
                                <input
                                  value={editForm.notes}
                                  onChange={(e) =>
                                    setEditForm((p) => ({ ...p, notes: e.target.value }))
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pfa-right">
                          {!isEditing ? (
                            <>
                              <button
                                className="pf2-btn pf2-btn-small pfa-editbtn"
                                onClick={() => startEdit(a)}
                                disabled={busyId === a.id}
                              >
                                Edit
                              </button>

                              <button
                                className="pf2-btn pf2-btn-small pfa-deletebtn"
                                onClick={() => deleteAppointment(a.id)}
                                disabled={busyId === a.id}
                              >
                                {busyId === a.id ? "..." : "Delete"}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="pf2-btn pf2-btn-small pf2-btn-primary"
                                onClick={() => saveEdit(a.id)}
                                disabled={busyId === a.id}
                              >
                                {busyId === a.id ? "Saving..." : "Save"}
                              </button>

                              <button className="pf2-btn pf2-btn-small" onClick={cancelEdit}>
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}