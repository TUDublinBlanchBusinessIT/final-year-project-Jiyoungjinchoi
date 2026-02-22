import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Dashboard.css";

const TABS = ["Overview", "Health", "Diet", "Behaviour", "Reminders", "Guidance"];

export default function PetOverview() {
  const navigate = useNavigate();
  const { id } = useParams();

  const token = localStorage.getItem("pawfection_token");

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("Overview");

  const imgSrc = useMemo(() => {
    if (!pet) return null;
    if (pet?.photo_url) return pet.photo_url;
    if (pet?.photo_path) return `http://127.0.0.1:8000/storage/${pet.photo_path}`;
    if (pet?.photo) return `http://127.0.0.1:8000/storage/${pet.photo}`;
    return null;
  }, [pet]);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      setErr("");

      try {
        const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setErr(data?.message || "Failed to load pet.");
          setPet(null);
        } else {
          setPet(data);
        }
      } catch {
        setErr("Server error. Is your backend running?");
        setPet(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate, token]);

  return (
    <div style={{ padding: 24 }}>
      <button className="pf2-btn pf2-btn-small" onClick={() => navigate("/mypets")}>
        ← Back to My Pets
      </button>

      <div style={{ marginTop: 16 }} className="pf2-card">
        {loading && <div className="pf2-empty">Loading…</div>}
        {!loading && err && <div className="pf2-empty">{err}</div>}

        {!loading && !err && pet && (
          <>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div className="pf2-petimg" style={{ width: 72, height: 72 }}>
                {imgSrc ? <img src={imgSrc} alt={pet.name} /> : <span>🐾</span>}
              </div>

              <div>
                <h1 style={{ margin: 0 }}>{pet.name}</h1>
                <div style={{ opacity: 0.75, marginTop: 6 }}>
                  {pet.species || "Pet"}
                  {pet.breed ? ` • ${pet.breed}` : ""}
                  {pet.age ? ` • ${pet.age} yrs` : ""}
                  {pet.weight ? ` • ${pet.weight}kg` : ""}
                </div>
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <button className="pf2-btn" onClick={() => navigate(`/pets/${pet.id}/edit`)}>
                  Edit
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              {TABS.map((t) => (
                <button
                  key={t}
                  className={`pf2-btn pf2-btn-small ${tab === t ? "pf2-btn-primary" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ marginTop: 18 }}>
              {tab === "Overview" && (
                <div>
                  <div><b>Notes:</b> {pet.notes || "-"}</div>
                  <div style={{ marginTop: 8 }}><b>Date of Birth:</b> {pet.dob || "-"}</div>
                  <div style={{ marginTop: 8 }}><b>Gender:</b> {pet.gender || "-"}</div>
                </div>
              )}

              {tab !== "Overview" && (
                <div className="pf2-empty">
                  {tab} content coming soon (this is where you’ll extend fields later).
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
