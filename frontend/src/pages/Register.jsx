import { useMemo, useState } from "react";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validate(form) {
  const errors = {};

  if (!form.firstName.trim()) errors.firstName = "First name is required.";
  if (!form.lastName.trim()) errors.lastName = "Last name is required.";

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [serverErrors, setServerErrors] = useState({});

  const errors = useMemo(() => validate(form), [form]);
  const isValid = Object.keys(errors).length === 0;

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setServerErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function markTouched(name) {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isValid) {
      setStatus({
        type: "error",
        message: "Please fix the highlighted fields before continuing.",
      });
      return;
    }

    setStatus({ type: "loading", message: "Creating your account…" });
    setServerErrors({});

    try {
      const response = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          password: form.password,
          password_confirmation: form.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Laravel validation errors
          setServerErrors(
            Object.fromEntries(
              Object.entries(data.errors).map(([k, v]) => [k, v[0]])
            )
          );
          setStatus({
            type: "error",
            message: "Please correct the highlighted errors.",
          });
          return;
        }

        throw new Error(data.message || "Registration failed.");
      }

      setStatus({
        type: "success",
        message: "Account created successfully. Please verify your email.",
      });

      setForm(initialForm);
      setTouched({});
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.message ||
          "Unable to connect to the server. Please try again later.",
      });
    }
  }

  const inputStyle = (error) => ({
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${error ? "#f04438" : "#d0d5dd"}`,
    fontSize: 14,
    outline: "none",
  });

  const labelStyle = { fontSize: 13, fontWeight: 700, marginBottom: 6 };

  const fieldError = (name) =>
    (touched[name] && errors[name]) || serverErrors[name];

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
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 22,
            padding: 24,
            boxShadow: "0 12px 35px rgba(0,0,0,.07)",
          }}
        >
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "linear-gradient(90deg,#fb7185,#60a5fa,#34d399)",
              marginBottom: 16,
            }}
          />

          <h1 style={{ fontSize: 26, margin: 0 }}>
            🐾 Create your Pawfection account
          </h1>
          <p style={{ marginTop: 8, color: "#555" }}>
            Register to report lost or found pets and receive alerts.
          </p>

          {status.type !== "idle" && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 12px",
                borderRadius: 14,
                background:
                  status.type === "success"
                    ? "#f0fdf4"
                    : status.type === "loading"
                    ? "#eff6ff"
                    : "#fff7ed",
              }}
            >
              <strong>
                {status.type === "success"
                  ? "Success"
                  : status.type === "loading"
                  ? "Please wait"
                  : "Attention"}
              </strong>
              <div>{status.message}</div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ marginTop: 18, display: "grid", gap: 14 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {["firstName", "lastName"].map((field, i) => (
                <div key={field}>
                  <div style={labelStyle}>
                    {i === 0 ? "First name" : "Last name"}
                  </div>
                  <input
                    style={inputStyle(fieldError(field))}
                    value={form[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    onBlur={() => markTouched(field)}
                  />
                  {fieldError(field) && (
                    <div style={{ color: "#f04438", fontSize: 12 }}>
                      {fieldError(field)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {["email", "password", "confirmPassword"].map((field) => (
              <div key={field}>
                <div style={labelStyle}>
                  {field === "confirmPassword"
                    ? "Confirm password"
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </div>
                <input
                  type={field.includes("password") ? "password" : "text"}
                  style={inputStyle(fieldError(field))}
                  value={form[field]}
                  onChange={(e) => updateField(field, e.target.value)}
                  onBlur={() => markTouched(field)}
                />
                {fieldError(field) && (
                  <div style={{ color: "#f04438", fontSize: 12 }}>
                    {fieldError(field)}
                  </div>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={status.type === "loading"}
              style={{
                marginTop: 8,
                padding: "12px",
                borderRadius: 12,
                border: "none",
                fontWeight: 800,
                color: "#fff",
                cursor: "pointer",
                background: "linear-gradient(90deg,#fb7185,#60a5fa)",
                opacity: status.type === "loading" ? 0.6 : 1,
              }}
            >
              Create account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
