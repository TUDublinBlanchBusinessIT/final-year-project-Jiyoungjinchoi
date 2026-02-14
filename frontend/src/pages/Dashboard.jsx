import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("pawfection_token");
    const userRaw = localStorage.getItem("pawfection_user");

    // ✅ Only redirect if NOT logged in
    if (!token || !userRaw) {
      navigate("/login");
      return;
    }

    // ✅ Fetch pets for logged-in user
    const fetchPets = async () => {
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

        const data = await res.json();

        if (!res.ok) {
          setPetsError(data?.message || "Failed to load pets.");
          setPets([]);
        } else {
          // If API returns array, store it
          setPets(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        setPetsError("Server error. Is your backend running?");
        setPets([]);
      } finally {
        setPetsLoading(false);
      }
    };

    fetchPets();
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem("pawfection_user") || "{}");
  const isVerified = !!user.email_verified_at;

  function logout() {
    localStorage.removeItem("pawfection_token");
    localStorage.removeItem("pawfection_user");
    localStorage.removeItem("pawfection_user_email");
    navigate("/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
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
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 22,
          padding: 28,
          boxShadow: "0 12px 35px rgba(0,0,0,.07)",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Dashboard 🐾</h1>

        <p style={{ color: "#555", marginTop: 6 }}>
          Welcome <strong>{user?.name || "User"}</strong>
        </p>

        {/* ✅ Unverified message (NO redirect) */}
        {!isVerified && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 14,
              background: "#fff7ed",
            }}
          >
            <strong>Attention:</strong> Your email is not verified yet.
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => navigate("/verify-email")}
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
                Go to Verify Email
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 14,
            background: "#eff6ff",
          }}
        >
          <div>
            <strong>Email:</strong> {user?.email || "-"}
          </div>
          <div style={{ marginTop: 6 }}>
            <strong>Verified:</strong> {isVerified ? "Yes ✅" : "No ❌"}
          </div>
        </div>

        {/* ✅ My Pets section */}
        <div style={{ marginTop: 22 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0 }}>My Pets</h2>

            <button
              onClick={() => navigate("/pets/create")}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "none",
                fontWeight: 800,
                color: "#fff",
                cursor: "pointer",
                background: "linear-gradient(90deg,#fb7185,#60a5fa)",
                whiteSpace: "nowrap",
              }}
            >
              + Add Pet
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            {petsLoading && <p style={{ color: "#555" }}>Loading pets...</p>}

            {!petsLoading && petsError && (
              <div
                style={{
                  marginTop: 10,
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "#fef2f2",
                  color: "#991b1b",
                }}
              >
                {petsError}
              </div>
            )}

            {!petsLoading && !petsError && pets.length === 0 && (
              <p style={{ color: "#555" }}>
                No pets yet. Click <strong>+ Add Pet</strong> to create one.
              </p>
            )}

            {!petsLoading &&
              !petsError &&
              pets.length > 0 &&
              pets.map((pet) => (
                <div
                  key={pet.id}
                  style={{
                    marginTop: 12,
                    padding: 16,
                    borderRadius: 14,
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {pet.name}
                  </div>

                  <div style={{ marginTop: 6, color: "#555" }}>
                    {pet.breed} • {pet.age} years old
                  </div>

                  {pet.notes && (
                    <div style={{ marginTop: 8, color: "#666" }}>
                      <strong>Notes:</strong> {pet.notes}
                    </div>
                  )}

                  {/* ✅ Photo display if backend returns "photo" path later */}
                  {pet.photo && (
                    <div style={{ marginTop: 12 }}>
                      <img
                        src={`http://127.0.0.1:8000/storage/${pet.photo}`}
                        alt={pet.name}
                        style={{
                          width: "100%",
                          maxWidth: 260,
                          borderRadius: 14,
                          border: "1px solid #e5e7eb",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            marginTop: 22,
            padding: "12px 18px",
            borderRadius: 12,
            border: "none",
            fontWeight: 800,
            color: "#fff",
            cursor: "pointer",
            background: "linear-gradient(90deg,#fb7185,#60a5fa)",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
