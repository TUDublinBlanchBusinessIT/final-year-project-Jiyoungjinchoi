import { useEffect, useState } from "react";
import "./ViewProfile.css";

export default function ViewProfile() {

  const [activeTab, setActiveTab] = useState("profile");

  const [user, setUser] = useState({
    username: "User",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    member_since: "",
    account_type: "Basic"
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
        account_type: parsedUser.account_type || "Basic"
      });
    }

  }, []);

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

      default:
        return null;
    }

  };

  return (

    <div className="view-profile-page">

      <div className="view-profile-container">

        {/* Profile Header */}

        <div className="profile-header-card">

          <div className="profile-avatar">
            {user.username ? user.username.charAt(0).toUpperCase() : "U"}
          </div>

          <div className="profile-header-text">
            <h1>{user.username}</h1>
            <p>{user.email}</p>
          </div>

        </div>


        {/* Only ONE button for today */}

        <div className="profile-tabs">

          <button
            className={activeTab === "profile" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("profile")}
          >
            My Profile
          </button>

        </div>


        {/* Content */}

        <div className="profile-content-section">
          {renderContent()}
        </div>

      </div>

    </div>

  );

}