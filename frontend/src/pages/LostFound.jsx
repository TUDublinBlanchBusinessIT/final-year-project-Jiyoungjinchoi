import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LostFound() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [items, setItems] = useState([]);

  const token = localStorage.getItem("pawfection_token");

  useEffect(() => {
    // If not logged in, go to login
    if (!token) {
      navigate("/login");
      return;
    }

    async function load() {
      setStatus({ type: "loading", message: "Loading lost pets..." });

      try {
        const res = await fetch("http://127.0.0.1:8000/api/lost-pets", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to load lost pets.");

        setItems(Array.isArray(data) ? data : data.data || []);
        setStatus({ type: "success", message: "Loaded successfully." });
      } catch (err) {
        setStatus({ type: "error", message: err.message || "Failed to fetch" });
      }
    }

    load();
  }, [navigate, token]);

  async function markResolved(id) {
    if (!token) {
      navigate("/login");
      return;
    }

    const ok = window.confirm("Mark this lost pet report as Resolved? This will archive it.");
    if (!ok) return;

    setStatus({ type: "loading", message: "Marking as Resolved..." });

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/lost-pets/${id}/resolve`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to mark as resolved.");

      // Archive behavior: remove from list so alerts stop
      setItems((prev) => prev.filter((x) => x.id !== id));

      setStatus({ type: "success", message: data.message || "Marked as Resolved." });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Something went wrong." });
    }
  }

  const statusBg =
    status.type === "success"
      ? "#f0fdf4"
      : status.type === "loading"
      ? "#eff6ff"
      : status.type === "error"
      ? "#fff7ed"
      : "#fff";

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Lost &amp; Found</h1>

        <button
          onClick={() => navigate("/lostfound/report")}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "none",
            fontWeight: 800,
            color: "#fff",
            cursor: "pointer",
            background: "linear-gradient(90deg,#fb7185,#60a5fa)",
          }}
        >
          + Report Lost Pet
        </button>
      </div>

      {status.type !== "idle" && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 14,
            background: statusBg,
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

      <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
        {items.length === 0 && status.type !== "loading" ? (
          <div style={{ padding: 18, borderRadius: 16, background: "#fff", boxShadow: "0 12px 35px rgba(0,0,0,.07)" }}>
            <p style={{ margin: 0 }}>No lost pets reported yet.</p>
          </div>
        ) : (
          items.map((p) => (
            <div
              key={p.id}
              style={{
                padding: 18,
                borderRadius: 16,
                background: "#fff",
                boxShadow: "0 12px 35px rgba(0,0,0,.07)",
                display: "flex",
                gap: 16,
                alignItems: "center",
              }}
            >
              {p.photo_url ? (
                <img
                  src={p.photo_url}
                  alt={p.pet_name || "Lost pet"}
                  style={{ width: 90, height: 90, borderRadius: 14, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 14,
                    background: "#f3f4f6",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    color: "#6b7280",
                  }}
                >
                  No Photo
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>
                  {p.pet_name || "Unnamed Pet"}{" "}
                  {p.status ? <span style={{ fontWeight: 700, color: "#6b7280" }}>({p.status})</span> : null}
                </div>
                <div style={{ color: "#555", marginTop: 4 }}>
                  {p.description || "No description"}
                </div>
                <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>
                  {p.last_seen_location ? `Last seen: ${p.last_seen_location}` : ""}
                </div>

                {/* ✅ NEW: Mark as Resolved button */}
                {p.status !== "Resolved" && (
                  <div style={{ marginTop: 10 }}>
                    <button
                      onClick={() => markResolved(p.id)}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 12,
                        border: "none",
                        fontWeight: 900,
                        cursor: "pointer",
                        background: "#111827",
                        color: "#fff",
                      }}
                    >
                      Mark as Resolved
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}