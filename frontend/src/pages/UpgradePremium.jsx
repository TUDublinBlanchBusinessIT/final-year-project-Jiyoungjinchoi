import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UpgradePremium.css";

export default function UpgradePremium() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("pawfection_token");
    const role = String(localStorage.getItem("pawfection_role") || "").toLowerCase();
    const accountType = String(localStorage.getItem("pawfection_account_type") || "").toLowerCase();

    if (!token) {
      navigate("/login");
      return;
    }

    if (role === "admin") {
      navigate("/admin/dashboard");
      return;
    }

    if (accountType === "premium") {
      navigate("/premium-dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpgrade = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("pawfection_token");

      const response = await fetch("http://127.0.0.1:8000/api/upgrade-premium", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_type: "premium",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upgrade failed.");
      }

      const updatedUser = {
        ...(JSON.parse(localStorage.getItem("pawfection_user") || "{}")),
        ...data.user,
        account_type: "premium",
      };

      localStorage.setItem("pawfection_user", JSON.stringify(updatedUser));
      localStorage.setItem("pawfection_account_type", "premium");

      setMessage("Membership updated to Premium!");

      setTimeout(() => {
        navigate("/premium-dashboard");
      }, 1000);
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upgrade-page">
      <div className="upgrade-container">
        <div className="upgrade-header-card">
          <h1>Upgrade to Pawfection Premium 🐾</h1>
          <p>Unlock advanced tools to care for your pets better.</p>
        </div>

        <div className="upgrade-grid">
          <div className="premium-card">
            <h2>Pawfection Premium</h2>
            <p className="price">€4.99 / month</p>

            <ul className="premium-benefits">
              <li>Unlimited pets</li>
              <li>Smart health reminders</li>
              <li>AI care guidance</li>
              <li>Priority booking features</li>
              <li>Premium pet support tools</li>
            </ul>
          </div>

          <div className="payment-card">
            <h2>Payment Details</h2>

            <form onSubmit={handleUpgrade}>
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleChange}
                  placeholder="Enter cardholder name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleChange}
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <div className="summary-box">
                <h3>Subscription Summary</h3>
                <p><strong>Plan:</strong> Pawfection Premium</p>
                <p><strong>Price:</strong> €4.99 / month</p>
                <p><strong>Renewal:</strong> Monthly subscription</p>
                <p><strong>Note:</strong> Cancel anytime</p>
              </div>

              <button type="submit" className="upgrade-btn" disabled={loading}>
                {loading ? "Processing..." : "Upgrade to Premium"}
              </button>

              <p className="secure-text">Secure payment processing</p>

              {message && <p className="upgrade-message">{message}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}