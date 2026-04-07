import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";

export default function MyPets() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");

  // Pets state
  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem("pawfection_token");

  const fetchPets = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setPetsLoading(true);
    setPetsError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/pets", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to load pets.";
        setPetsError(msg);
        setPets([]);
      } else {
        setPets(Array.isArray(data) ? data : data?.pets || []);
      }
    } catch {
      setPetsError("Server error. Is your backend running?");
      setPets([]);
    } finally {
      setPetsLoading(false);
    }
  };

  useEffect(() => {
    // Load user name
    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name && typeof userObj.name === "string") {
          setUserName(userObj.name);
        }
      } else {
        const fallbackName =
          localStorage.getItem("pawfection_user_name") ||
          localStorage.getItem("user_name") ||
          localStorage.getItem("name");
        if (fallbackName) setUserName(fallbackName);
      }
    } catch {
      setUserName("User");
    }

    fetchPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const getPetImageSrc = (pet) => {
    if (pet?.photo_url) return pet.photo_url;
    if (pet?.photo_path) return `http://127.0.0.1:8000/storage/${pet.photo_path}`;
    if (pet?.photo) return `http://127.0.0.1:8000/storage/${pet.photo}`;
    return null;
  };

  const deletePet = async (petId, petName) => {
    if (!token) {
      navigate("/login");
      return;
    }

    const ok = window.confirm(
      `Delete ${petName || "this pet"}? This cannot be undone.`
    );
    if (!ok) return;

    setDeletingId(petId);
    setPetsError("");

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/pets/${petId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to delete pet.";
        setPetsError(msg);
        setDeletingId(null);
        return;
      }

      setPets((prev) => prev.filter((p) => p.id !== petId));
    } catch {
      setPetsError("Failed to delete. Is the backend running?");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const petCount = pets?.length || 0;
    return [
      { label: "Pets", value: String(petCount), sub: "Registered", tone: "blue", icon: "🐾" },
      { label: "Appointments", value: "0", sub: "Upcoming", tone: "mint", icon: "📅" },
      { label: "Reminders", value: "0", sub: "Active", tone: "peach", icon: "⏰" },
    ];
  }, [pets]);

  return (
    <div className="pf2-shell">
      {/* Sidebar */}
      <aside className="pf2-sidebar">
        <div
          className="pf2-brand"
          onClick={() => navigate("/dashboard")}
          role="button"
        >
          <img className="pf2-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pf2-brand-text">
            <div className="pf2-brand-title">Pawfection</div>
            <div className="pf2-brand-sub">Dashboard</div>
          </div>
        </div>

        <nav className="pf2-nav">
          <Link className="pf2-nav-item" to="/dashboard">Dashboard</Link>
          <Link className="pf2-nav-item active" to="/mypets">My Pets</Link>
          <Link className="pf2-nav-item" to="/appointments">Appointments</Link>
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
            <input placeholder="Search pets..." />
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
          <div className="pf2-pagehead">
            <div>
              <h1 className="pf2-title">My Pets</h1>
              <p className="pf2-subtitle">All pets linked to your account.</p>
            </div>

            <div className="pf2-actions">
              <button className="pf2-btn pf2-btn-primary" onClick={() => navigate("/pets/create")}>
                + Add Pet
              </button>
            </div>
          </div>

          {/* Optional stats row (keeps it consistent with dashboard look) */}
          <section className="pf2-stats">
            {stats.map((s) => (
              <div key={s.label} className={`pf2-stat pf2-${s.tone}`}>
                <div className="pf2-stat-top">
                  <div className="pf2-stat-label">{s.label}</div>
                  <div className={`pf2-stat-icon pf2-icon-${s.tone}`}>{s.icon}</div>
                </div>
                <div className="pf2-stat-value">{s.value}</div>
                <div className="pf2-stat-sub">{s.sub}</div>
              </div>
            ))}
          </section>

          <section className="pf2-grid">
            <div className="pf2-card pf2-span-2">
              <div className="pf2-cardhead">
                <h2>All Pets</h2>
                <button className="pf2-btn pf2-btn-small" onClick={fetchPets}>
                  Refresh
                </button>
              </div>

              {petsLoading && <div className="pf2-empty">Loading pets…</div>}
              {!petsLoading && petsError && <div className="pf2-empty">{petsError}</div>}
              {!petsLoading && !petsError && pets.length === 0 && (
                <div className="pf2-empty">
                  No pets yet. Click <b>+ Add Pet</b> to create one.
                </div>
              )}

              {!petsLoading && !petsError && pets.length > 0 && (
                <div className="pf2-petlist">
                  {pets.map((pet) => {
                    const imgSrc = getPetImageSrc(pet);

                    return (
                      <div key={pet.id} className="pf2-petrow">
                        <div className="pf2-petleft">
                          <div className="pf2-petimg">
                            {imgSrc ? <img src={imgSrc} alt={pet.name} /> : <span>🐾</span>}
                          </div>

                          <div className="pf2-petmeta">
                            <div className="pf2-petname">{pet.name}</div>
                            <div className="pf2-petdesc">
                              {(pet.breed || pet.species || "Pet")}
                              {" • "}
                              {pet.age ? `${pet.age} yrs` : "Age n/a"}
                              {pet.weight ? ` • ${pet.weight}kg` : ""}
                            </div>
                          </div>
                        </div>

                        <div className="pf2-petactions">
                          {/* ✅ View button = Soon colour */}
                          <button
                            className="pf2-btn pf2-btn-small pf2-btn-soon"
                            onClick={() => navigate(`/pets/${pet.id}`)}
                          >
                            View
                          </button>

                          {/* ✅ Edit button = Inventory Edit blue */}
                          <button
                            className="pf2-btn pf2-btn-small pf2-btn-edit"
                            onClick={() => navigate(`/pets/${pet.id}/edit`)}
                          >
                            Edit
                          </button>

                          <button
                            className="pf2-btn pf2-btn-small pf2-btn-danger"
                            disabled={deletingId === pet.id}
                            onClick={() => deletePet(pet.id, pet.name)}
                          >
                            {deletingId === pet.id ? "Deleting…" : "Delete"}
                          </button>
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