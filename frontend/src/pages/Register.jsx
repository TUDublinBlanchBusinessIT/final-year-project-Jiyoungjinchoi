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
    errors.email = "Enter a valid email address.";
  }

  if (!form.password) errors.password = "Password is required.";
  if (!form.confirmPassword) errors.confirmPassword = "Confirm password is required.";

  if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (form.password && form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ type: "idle", message: "" }); // idle | success | error

  const errors = useMemo(() => validate(form), [form]);
  const isValid = Object.keys(errors).length === 0;

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function markTouched(name) {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // mark all as touched so errors show
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const currentErrors = validate(form);
    if (Object.keys(currentErrors).length > 0) {
      setStatus({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    // For now, we’re not calling backend yet.
    // This simulates success so you can demo the UI.
    setStatus({ type: "success", message: "Account created — please verify your email." });
  }

  const inputBaseStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d0d5dd",
    outline: "none",
    fontSize: 14,
    background: "#fff",
  };

  const labelStyle = { fontSize: 13, fontWeight: 700, marginBottom: 6 };

  function fieldError(name) {
    return touched[name] ? errors[name] : undefined;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 10% 10%, rgba(255, 228, 230, 0.65), transparent 42%)," +
          "radial-gradient(circle at 90% 20%, rgba(219, 234, 254, 0.65), transparent 48%)," +
          "radial-gradient(circle at 50% 90%, rgba(220, 252, 231, 0.65), transparent 48%)," +
          "#fff",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 22,
            padding: 24,
            background: "#fff",
            boxShadow: "0 12px 35px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "linear-gradient(90deg, #fb7185, #60a5fa, #34d399)",
              marginBottom: 16,
            }}
          />

          <h1 style={{ margin: 0, fontSize: 26 }}>🐾 Create your Pawfection account</h1>
          <p style={{ marginTop: 8, color: "#555", lineHeight: 1.4 }}>
            Register to report lost/found pets and get alerts.
          </p>

          {status.type !== "idle" && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid #eee",
                background: status.type === "success" ? "#f0fdf4" : "#fff7ed",
              }}
            >
              <strong style={{ display: "block", marginBottom: 2 }}>
                {status.type === "success" ? "Success" : "Attention"}
              </strong>
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 18, display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={labelStyle}>First name</div>
                <input
                  style={{
                    ...inputBaseStyle,
                    borderColor: fieldError("firstName") ? "#f04438" : inputBaseStyle.borderColor,
                  }}
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  onBlur={() => markTouched("firstName")}
                  placeholder="e.g. Aleena"
                  autoComplete="given-name"
                />
                {fieldError("firstName") && (
                  <div style={{ marginTop: 6, color: "#f04438", fontSize: 12 }}>
                    {fieldError("firstName")}
                  </div>
                )}
              </div>

              <div>
                <div style={labelStyle}>Last name</div>
                <input
                  style={{
                    ...inputBaseStyle,
                    borderColor: fieldError("lastName") ? "#f04438" : inputBaseStyle.borderColor,
                  }}
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  onBlur={() => markTouched("lastName")}
                  placeholder="e.g. Khan"
                  autoComplete="family-name"
                />
                {fieldError("lastName") && (
                  <div style={{ marginTop: 6, color: "#f04438", fontSize: 12 }}>
                    {fieldError("lastName")}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Email</div>
              <input
                style={{
                  ...inputBaseStyle,
                  borderColor: fieldError("email") ? "#f04438" : inputBaseStyle.borderColor,
                }}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={() => markTouched("email")}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {fieldError("email") && (
                <div style={{ marginTop: 6, color: "#f04438", fontSize: 12 }}>{fieldError("email")}</div>
              )}
            </div>

            <div>
              <div style={labelStyle}>Password</div>
              <input
                type="password"
                style={{
                  ...inputBaseStyle,
                  borderColor: fieldError("password") ? "#f04438" : inputBaseStyle.borderColor,
                }}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                onBlur={() => markTouched("password")}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
              {fieldError("password") && (
                <div style={{ marginTop: 6, color: "#f04438", fontSize: 12 }}>{fieldError("password")}</div>
              )}
            </div>

            <div>
              <div style={labelStyle}>Confirm password</div>
              <input
                type="password"
                style={{
                  ...inputBaseStyle,
                  borderColor: fieldError("confirmPassword") ? "#f04438" : inputBaseStyle.borderColor,
                }}
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                onBlur={() => markTouched("confirmPassword")}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              {fieldError("confirmPassword") && (
                <div style={{ marginTop: 6, color: "#f04438", fontSize: 12 }}>
                  {fieldError("confirmPassword")}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid && Object.keys(touched).length > 0}
              style={{
                marginTop: 6,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 14,
                color: "#fff",
                background: "linear-gradient(90deg, #fb7185, #60a5fa)",
                boxShadow: "0 10px 20px rgba(96, 165, 250, 0.25)",
                opacity: !isValid && Object.keys(touched).length > 0 ? 0.6 : 1,
              }}
            >
              Create account
            </button>

            <div style={{ textAlign: "center", marginTop: 6, fontSize: 13, color: "#555" }}>
              Already have an account? <span style={{ textDecoration: "underline", cursor: "pointer" }}>Log in</span>
            </div>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#666" }}>
          By creating an account, you agree to our Terms & Privacy Policy.
        </div>
      </div>
    </div>
  );
}
