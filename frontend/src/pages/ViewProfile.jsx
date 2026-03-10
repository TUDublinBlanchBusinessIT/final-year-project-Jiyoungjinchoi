import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ViewProfile.css";
import PawfectionLogo from "../assets/PawfectionLogo.png";

export default function ViewProfile() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");

  const [user, setUser] = useState({
    username: "User",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    member_since: "",
    account_type: "Basic",
    subscription_started_at: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("pawfection_user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);

      setUser({
        username: parsedUser.username || parsedUser.name || "User",
        full_name: parsedUser.full_name || parsedUser.name || "Not Provided",
        email: parsedUser.email || "Not Provided",
        phone: parsedUser.phone || "Not Provided",
        address: parsedUser.address || "Not Provided",
        member_since: parsedUser.created_at
          ? new Date(parsedUser.created_at).toLocaleDateString()
          : "Not Provided",
        account_type: parsedUser.account_type || "Basic",
        subscription_started_at: parsedUser.subscription_started_at
          ? new Date(parsedUser.subscription_started_at).toLocaleDateString()
          : "Not Provided",
      });
    }
  }, []);

  const handleUpgrade = () => {
    navigate("/upgrade");
  };

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your Premium subscription?"
    );

    if (!confirmed) return;

    setLoadingCancel(true);
    setCancelMessage("");

    try {
      const token = localStorage.getItem("pawfection_token");

      const response = await fetch("http://127.0.0.1:8000/api/cancel-premium", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Cancellation failed.");
      }

      const storedUser = localStorage.getItem("pawfection_user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.account_type = "Basic";
        parsedUser.subscription_started_at = null;
        localStorage.setItem("pawfection_user", JSON.stringify(parsedUser));
      }

      setUser((prev) => ({
        ...prev,
        account_type: "Basic",
        subscription_started_at: "Not Provided",
      }));

      setCancelMessage("Your subscription has been cancelled.");
    } catch (error) {
      setCancelMessage(error.message || "Something went wrong.");
    } finally {
      setLoadingCancel(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="profile-card">
            <h2>My Profile</h2>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="label">Full Name</span>
                <span>{user.full_name}</span>
              </div>

              <div className="profile-info-item">
                <span className="label">Email Address</span>
                <span>{user.email}</span>
              </div>

              <div className="profile-info-item">
                <span className="label">Phone Number</span>
                <span>{user.phone || "Not Provided"}</span>
              </div>

              <div className="profile-info-item">
                <span className="label">Address</span>
                <span>{user.address || "Not Provided"}</span>
              </div>

              <div className="profile-info-item">
                <span className="label">Member Since</span>
                <span>{user.member_since}</span>
              </div>

              <div className="profile-info-item">
                <span className="label">Account Type</span>
                <span>{user.account_type}</span>
              </div>
            </div>
          </div>
        );

      case "subscription":
        return (
          <div className="profile-card">
            <h2>Subscription</h2>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="label">Membership Plan</span>
                <span>{user.account_type}</span>
              </div>

              <div className="profile-info-item">
                <span className="label">Subscription Start Date</span>
                <span>
                  {user.account_type === "Premium"
                    ? user.subscription_started_at
                    : "Not Subscribed"}
                </span>
              </div>
            </div>

            {user.account_type !== "Premium" && (
              <div className="profile-action-row">
                <button
                  className="profile-primary-btn"
                  onClick={handleUpgrade}
                >
                  Upgrade to Premium
                </button>
              </div>
            )}

            {user.account_type === "Premium" && (
              <div className="profile-action-row">
                <button
                  className="profile-danger-btn"
                  onClick={handleCancelSubscription}
                  disabled={loadingCancel}
                >
                  {loadingCancel ? "Cancelling..." : "Cancel Subscription"}
                </button>
              </div>
            )}

            {cancelMessage && (
              <p className="subscription-message">{cancelMessage}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="view-profile-page">

      {/* Pawfection Logo Navigation */}
      <Link to="/dashboard" className="profile-logo">
        <img src={PawfectionLogo} alt="Pawfection Logo" />
      </Link>

      <div className="view-profile-container">

        <div className="profile-header-card">
          <div className="profile-avatar">
            {user.username ? user.username.charAt(0).toUpperCase() : "U"}
          </div>

          <div className="profile-header-text">
            <h1>{user.username}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={activeTab === "profile" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("profile")}
          >
            My Profile
          </button>

          <button
            className={activeTab === "subscription" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("subscription")}
          >
            Subscription
          </button>
        </div>

        <div className="profile-content-section">
          {renderContent()}
        </div>

      </div>
    </div>
  );
}