import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ViewProfile.css";
import PawfectionLogo from "../assets/PawfectionLogo.png";

export default function ViewProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("pawfection_token");

  const [activeTab, setActiveTab] = useState("profile");
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");

  const [settingsMessage, setSettingsMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rainbowMessage, setRainbowMessage] = useState("");
  const [rainbowLoading, setRainbowLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(false);

  const [selectedPetId, setSelectedPetId] = useState("");

  const [openSettingSection, setOpenSettingSection] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [user, setUser] = useState({
    username: "User",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    member_since: "",
    account_type: "Basic",
    subscription_started_at: "",
    notification_email: true,
    notification_sms: false,
  });

  const [pets, setPets] = useState([]);

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
        notification_email:
          parsedUser.notification_email !== undefined
            ? Boolean(parsedUser.notification_email)
            : true,
        notification_sms:
          parsedUser.notification_sms !== undefined
            ? Boolean(parsedUser.notification_sms)
            : false,
      });
    }

    fetchPets();
  }, []);

  const fetchPets = async () => {
    if (!token) return;

    setPetsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/pets", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load pets.");
      }

      setPets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setPetsLoading(false);
    }
  };

  const activePets = useMemo(() => {
    return pets.filter((pet) => pet.status !== "Memorial");
  }, [pets]);

  const memorialPets = useMemo(() => {
    return pets.filter((pet) => pet.status === "Memorial");
  }, [pets]);

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

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSettingsMessage("");
    setPasswordLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/profile/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(passwordForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password update failed.");
      }

      setSettingsMessage("Password updated successfully.");
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (error) {
      setSettingsMessage(error.message || "Something went wrong.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNotificationToggle = (field) => {
    setUser((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSaveNotifications = async () => {
    setSettingsMessage("");
    setNotificationsLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/profile/notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            notification_email: user.notification_email,
            notification_sms: user.notification_sms,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save notification settings.");
      }

      const storedUser = localStorage.getItem("pawfection_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.notification_email = user.notification_email;
        parsedUser.notification_sms = user.notification_sms;
        localStorage.setItem("pawfection_user", JSON.stringify(parsedUser));
      }

      setSettingsMessage("Notification preferences saved.");
    } catch (error) {
      setSettingsMessage(error.message || "Something went wrong.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error(error.message);
    } finally {
      localStorage.removeItem("pawfection_token");
      localStorage.removeItem("pawfection_user");
      navigate("/");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleteLoading(true);
    setSettingsMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/profile", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account.");
      }

      localStorage.removeItem("pawfection_token");
      localStorage.removeItem("pawfection_user");
      navigate("/");
    } catch (error) {
      setSettingsMessage(error.message || "Something went wrong.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMarkMemorial = async () => {
    if (!selectedPetId) {
      setRainbowMessage("Please select a pet first.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to mark this pet as deceased and move it to the Community Memorial?"
    );

    if (!confirmed) return;

    setRainbowLoading(true);
    setRainbowMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/pets/${selectedPetId}/memorial`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            memorial_message:
              "Remember me with tears and laughter. Remember me though it hurts to do so, because the pain you have is equal to the love we shared. There is no goodbye if you carry me in your heart. Remember all the joy we shared, because there was so much of it for both of us.",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update memorial status.");
      }

      setRainbowMessage("Pet moved to Community Memorial successfully.");
      setSelectedPetId("");
      fetchPets();
    } catch (error) {
      setRainbowMessage(error.message || "Something went wrong.");
    } finally {
      setRainbowLoading(false);
    }
  };

  const handleDeleteMemorial = async (petId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this memorial?"
    );

    if (!confirmed) return;

    setRainbowMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/pets/${petId}/memorial`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete memorial.");
      }

      setRainbowMessage("Memorial deleted successfully.");
      fetchPets();
    } catch (error) {
      setRainbowMessage(error.message || "Something went wrong.");
    }
  };

  const toggleSettingSection = (section) => {
    setOpenSettingSection((prev) => (prev === section ? "" : section));
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

      case "settings":
        return (
          <div className="profile-card">
            <h2>Settings</h2>

            <div className="settings-accordion">
              <button
                className="settings-toggle-btn"
                onClick={() => toggleSettingSection("password")}
              >
                Change Password
              </button>

              {openSettingSection === "password" && (
                <div className="settings-section">
                  <form onSubmit={handleChangePassword} className="settings-form">
                    <input
                      type="password"
                      name="current_password"
                      placeholder="Current Password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      required
                    />

                    <input
                      type="password"
                      name="password"
                      placeholder="New Password"
                      value={passwordForm.password}
                      onChange={handlePasswordChange}
                      required
                    />

                    <input
                      type="password"
                      name="password_confirmation"
                      placeholder="Confirm New Password"
                      value={passwordForm.password_confirmation}
                      onChange={handlePasswordChange}
                      required
                    />

                    <button
                      type="submit"
                      className="profile-primary-btn"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? "Saving..." : "Change Password"}
                    </button>
                  </form>
                </div>
              )}

              <button
                className="settings-toggle-btn"
                onClick={() => toggleSettingSection("notifications")}
              >
                Notification Preferences
              </button>

              {openSettingSection === "notifications" && (
                <div className="settings-section">
                  <div className="toggle-row">
                    <span>Email Notifications</span>
                    <button
                      type="button"
                      className={
                        user.notification_email ? "toggle-btn active" : "toggle-btn"
                      }
                      onClick={() =>
                        handleNotificationToggle("notification_email")
                      }
                    >
                      {user.notification_email ? "On" : "Off"}
                    </button>
                  </div>

                  <div className="toggle-row">
                    <span>SMS Notifications</span>
                    <button
                      type="button"
                      className={
                        user.notification_sms ? "toggle-btn active" : "toggle-btn"
                      }
                      onClick={() => handleNotificationToggle("notification_sms")}
                    >
                      {user.notification_sms ? "On" : "Off"}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="profile-primary-btn"
                    onClick={handleSaveNotifications}
                    disabled={notificationsLoading}
                  >
                    {notificationsLoading ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              )}

              <button
                className="settings-toggle-btn"
                onClick={() => toggleSettingSection("actions")}
              >
                Account Actions
              </button>

              {openSettingSection === "actions" && (
                <div className="settings-section">
                  <div className="profile-action-row">
                    <button
                      type="button"
                      className="profile-outline-btn"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>

                    <button
                      type="button"
                      className="profile-danger-btn"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? "Deleting..." : "Delete Account"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {settingsMessage && (
              <p className="subscription-message">{settingsMessage}</p>
            )}
          </div>
        );

      case "rainbow":
        return (
          <div className="profile-card memorial-card">
            <h2>Crossed the Rainbow Bridge 🌈🐾</h2>

            <p className="memorial-intro">
                “No longer by our side, but forever in our hearts.”
            </p>

            <div className="settings-section">
              <h3>Mark a Pet as Memorial</h3>

              {petsLoading ? (
                <p>Loading pets...</p>
              ) : activePets.length === 0 ? (
                <p>No active pets available.</p>
              ) : (
                <>
                  <select
                    className="memorial-select"
                    value={selectedPetId}
                    onChange={(e) => setSelectedPetId(e.target.value)}
                  >
                    <option value="">Select a pet</option>
                    {activePets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name}
                      </option>
                    ))}
                  </select>

                  <div className="profile-action-row">
                    <button
                      type="button"
                      className="profile-primary-btn"
                      onClick={handleMarkMemorial}
                      disabled={rainbowLoading}
                    >
                      {rainbowLoading
                        ? "Submitting..."
                        : "Crossed the Rainbow Bridge"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {rainbowMessage && (
              <p className="subscription-message">{rainbowMessage}</p>
            )}

            <div className="settings-section">
              <h3>Community Memorial</h3>

              {memorialPets.length === 0 ? (
                <p>No memorials yet.</p>
              ) : (
                <div className="memorial-grid">
                  {memorialPets.map((pet) => (
                    <div className="memorial-item" key={pet.id}>
                      <div className="memorial-photo-wrap">
                        {pet.photo_url || pet.image || pet.photo ? (
                          <img
                            src={pet.photo_url || pet.image || pet.photo}
                            alt={pet.name}
                            className="memorial-photo"
                          />
                        ) : (
                          <div className="memorial-photo placeholder-photo">
                            🐾
                          </div>
                        )}
                      </div>

                      <h4>{pet.name}</h4>

                      <p className="memorial-message-text">
                        {pet.memorial_message ||
                        "Remember me with tears and laughter. Remember me though it hurts to do so, because the pain you have is equal to the love we shared. There is no goodbye if you carry me in your heart. Remember all the joy we shared, because there was so much of it for both of us."}
                      </p>

                      <button
                        type="button"
                        className="profile-danger-btn memorial-delete-btn"
                        onClick={() => handleDeleteMemorial(pet.id)}
                      >
                        Delete Memorial
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="view-profile-page">
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
            className={
              activeTab === "subscription" ? "tab-btn active" : "tab-btn"
            }
            onClick={() => setActiveTab("subscription")}
          >
            Subscription
          </button>

          <button
            className={activeTab === "settings" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>

          <button
            className={activeTab === "rainbow" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("rainbow")}
          >
            Crossed the Rainbow Bridge 🌈🐾
          </button>
        </div>

        <div className="profile-content-section">{renderContent()}</div>
      </div>
    </div>
  );
}