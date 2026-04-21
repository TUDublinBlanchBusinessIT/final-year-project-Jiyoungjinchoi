import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumProfile.css";

export default function PremiumProfile() {
  const navigate = useNavigate();

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");
  const [user, setUser] = useState({
    username: "User",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    member_since: "",
    account_type: "Premium",
    subscription_started_at: "",
    subscription_status: "active",
    notification_email: true,
    notification_sms: false,
  });

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  const [cancelLoading, setCancelLoading] = useState(false);
  const [membershipMessage, setMembershipMessage] = useState("");

  const [settingsMessage, setSettingsMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [openSettingSection, setOpenSettingSection] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [selectedPetId, setSelectedPetId] = useState("");
  const [memorialForm, setMemorialForm] = useState({
    memorial_message: "",
    memorial_photo_url: "",
    memorial_theme: "rainbow",
    memorial_visibility: "private",
  });
  const [memorialLoading, setMemorialLoading] = useState(false);
  const [memorialMessage, setMemorialMessage] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("pawfection_token");
    const savedRole = String(localStorage.getItem("pawfection_role") || "").toLowerCase();

    if (!savedToken) {
      navigate("/login");
      return;
    }

    if (savedRole === "admin") {
      navigate("/admin-dashboard");
      return;
    }

    loadStoredUser();
    fetchPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadStoredUser = () => {
    try {
      const storedUser = localStorage.getItem("pawfection_user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        setUserName(parsedUser.username || parsedUser.name || "User");

        setUser({
          username: parsedUser.username || parsedUser.name || "User",
          full_name: parsedUser.full_name || parsedUser.name || "Not Provided",
          email: parsedUser.email || "Not Provided",
          phone: parsedUser.phone || "Not Provided",
          address: parsedUser.address || "Not Provided",
          member_since: parsedUser.created_at
            ? new Date(parsedUser.created_at).toLocaleDateString("en-IE")
            : "Not Provided",
          account_type: "Premium",
          subscription_started_at: parsedUser.subscription_started_at
            ? new Date(parsedUser.subscription_started_at).toLocaleDateString("en-IE")
            : "Active",
          subscription_status: "active",
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
    } catch {
      setUserName("User");
    }
  };

  const hasMemorialData = (pet) => {
    if (!pet) return false;

    return (
      String(pet?.status || "").toLowerCase() === "memorial" ||
      Boolean(pet?.memorial_message) ||
      Boolean(pet?.memorial_photo_url) ||
      Boolean(pet?.memorial_theme) ||
      Boolean(pet?.memorial_visibility)
    );
  };

  const fetchPets = async () => {
    if (!token) return;

    setLoadingPets(true);
    setPetsError("");

    try {
      const response = await fetch(`${apiBase}/pets`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPets([]);
        setPetsError(data?.message || "Failed to load pets.");
        return;
      }

      const petList = Array.isArray(data) ? data : data?.pets || [];
      setPets(petList);

      if (petList.length > 0) {
        setSelectedPetId((prev) => prev || String(petList[0].id));
      }
    } catch {
      setPets([]);
      setPetsError("Server error. Is your backend running?");
    } finally {
      setLoadingPets(false);
    }
  };

  const activePets = useMemo(() => {
    return pets.filter((pet) => !hasMemorialData(pet));
  }, [pets]);

  const memorialPets = useMemo(() => {
    return pets.filter((pet) => hasMemorialData(pet));
  }, [pets]);

  const selectedPet = useMemo(() => {
    return (
      pets.find((pet) => String(pet.id) === String(selectedPetId)) ||
      pets[0] ||
      null
    );
  }, [pets, selectedPetId]);

  useEffect(() => {
    if (!selectedPet) {
      setMemorialForm({
        memorial_message: "",
        memorial_photo_url: "",
        memorial_theme: "rainbow",
        memorial_visibility: "private",
      });
      return;
    }

    setMemorialForm({
      memorial_message: selectedPet.memorial_message || "",
      memorial_photo_url: selectedPet.memorial_photo_url || "",
      memorial_theme: selectedPet.memorial_theme || "rainbow",
      memorial_visibility: selectedPet.memorial_visibility || "private",
    });
  }, [selectedPetId, selectedPet]);

  const monthlyPrice = "€4.99";

  const renewalDate = useMemo(() => {
    if (
      !user.subscription_started_at ||
      user.subscription_started_at === "Not Provided" ||
      user.subscription_started_at === "Active"
    ) {
      return "Active";
    }

    const storedUser = localStorage.getItem("pawfection_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.subscription_started_at) {
          const start = new Date(parsedUser.subscription_started_at);
          if (!Number.isNaN(start.getTime())) {
            const renewal = new Date(start);
            renewal.setMonth(renewal.getMonth() + 1);
            return renewal.toLocaleDateString("en-IE");
          }
        }
      } catch {
        return "Active";
      }
    }

    return "Active";
  }, [user.subscription_started_at]);

  const nextBillingDays = useMemo(() => {
    if (renewalDate === "Active") return "-";

    const [day, month, year] = renewalDate.split("/");
    const renewal = new Date(`${year}-${month}-${day}`);
    const now = new Date();

    if (Number.isNaN(renewal.getTime())) return "-";

    const diff = Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? `${diff} day${diff === 1 ? "" : "s"}` : "Due soon";
  }, [renewalDate]);

  const premiumBenefits = useMemo(() => {
    return [
      {
        icon: "✨",
        title: "Premium Benefits",
        text: "Access exclusive Pawfection tools, enhanced care support, and upgraded profile features.",
      },
      {
        icon: "🩺",
        title: "Smart Pet Insights",
        text: "See personalised care guidance, helpful recommendations, and premium pet summaries.",
      },
      {
        icon: "🌈",
        title: "Memorial Customisation",
        text: "Create a more personal Rainbow Bridge memorial with custom message, theme, and visibility.",
      },
      {
        icon: "🐾",
        title: "Multi-Pet View",
        text: "Manage all your pets in one beautiful premium dashboard with clearer overview cards.",
      },
      {
        icon: "💬",
        title: "AI Pet Assistant",
        text: "Use premium support tools like the AI Pet Assistant and other premium experiences.",
      },
    ];
  }, []);

  const insightCards = useMemo(() => {
    const totalPets = pets.length;
    const activeCount = activePets.length;
    const memorialCount = memorialPets.length;

    return [
      {
        title: "Multi-pet overview",
        text:
          totalPets > 0
            ? `You currently have ${totalPets} pet${totalPets > 1 ? "s" : ""} in Pawfection, with ${activeCount} active and ${memorialCount} memorial profile${memorialCount === 1 ? "" : "s"}.`
            : "Add your first pet to begin using your Premium care dashboard.",
        type: "good",
      },
      {
        title: "Premium membership active",
        text: `Your Premium membership is active at ${monthlyPrice} per month.`,
        type: "good",
      },
      {
        title: "Profile completeness",
        text:
          user.phone !== "Not Provided" && user.address !== "Not Provided"
            ? "Your account profile looks nicely filled in."
            : "Add your phone and address details to complete your profile.",
        type:
          user.phone !== "Not Provided" && user.address !== "Not Provided"
            ? "good"
            : "medium",
      },
      {
        title: "Memorial customisation",
        text:
          memorialPets.length > 0
            ? "You already have memorial profiles that can be personalised further."
            : "You can create private or public premium memorials whenever needed.",
        type: "medium",
      },
    ];
  }, [pets.length, activePets.length, memorialPets.length, monthlyPrice, user.phone, user.address]);

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSettingsMessage("");
    setPasswordLoading(true);

    try {
      const response = await fetch(`${apiBase}/profile/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

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
      const response = await fetch(`${apiBase}/profile/notifications`, {
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
      });

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

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your Premium subscription?"
    );
    if (!confirmed) return;

    setCancelLoading(true);
    setMembershipMessage("");

    try {
      const response = await fetch(`${apiBase}/cancel-premium`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Cancellation failed.");
      }

      const storedUser = localStorage.getItem("pawfection_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.account_type = "Basic";
        parsedUser.subscription_started_at = null;
        parsedUser.subscription_status = "inactive";
        localStorage.setItem("pawfection_user", JSON.stringify(parsedUser));
      }

      setMembershipMessage("Your Premium subscription has been cancelled.");
      navigate("/dashboard");
    } catch (error) {
      setMembershipMessage(error.message || "Something went wrong.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiBase}/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // ignore
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
      const response = await fetch(`${apiBase}/profile`, {
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

  const getPetImageSrc = (pet) => {
    if (!pet) return null;
    if (pet?.photo_url) return pet.photo_url;
    if (pet?.photo_path) return `http://127.0.0.1:8000/storage/${pet.photo_path}`;
    if (pet?.photo) return `http://127.0.0.1:8000/storage/${pet.photo}`;
    return null;
  };

  const handleMemorialInputChange = (e) => {
    const { name, value } = e.target;
    setMemorialForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveMemorial = async (e) => {
    e.preventDefault();

    if (!selectedPetId) {
      setMemorialMessage("Please select a pet first.");
      return;
    }

    setMemorialLoading(true);
    setMemorialMessage("");

    try {
      const response = await fetch(`${apiBase}/premium/pets/${selectedPetId}/memorial-customise`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(memorialForm),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save memorial customisation.");
      }

      const updatedPet = data?.pet || data?.data || data?.updated_pet || null;

      if (updatedPet && updatedPet.id) {
        setPets((prev) =>
          prev.map((pet) =>
            String(pet.id) === String(updatedPet.id)
              ? { ...pet, ...updatedPet }
              : pet
          )
        );
      } else {
        setPets((prev) =>
          prev.map((pet) =>
            String(pet.id) === String(selectedPetId)
              ? {
                  ...pet,
                  memorial_message: memorialForm.memorial_message,
                  memorial_photo_url: memorialForm.memorial_photo_url,
                  memorial_theme: memorialForm.memorial_theme,
                  memorial_visibility: memorialForm.memorial_visibility,
                  status: pet.status || "memorial",
                }
              : pet
          )
        );
      }

      await fetchPets();
      setMemorialMessage("Premium memorial details saved successfully.");
    } catch (error) {
      setMemorialMessage(
        error.message ||
          "Backend endpoint not ready yet. Frontend form is ready for integration."
      );
    } finally {
      setMemorialLoading(false);
    }
  };

  const toggleSettingSection = (section) => {
    setOpenSettingSection((prev) => (prev === section ? "" : section));
  };

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const renderOverviewTab = () => {
    return (
      <section className="ppp-grid">
        <article className="ppp-card ppp-card-wide">
          <div className="ppp-card-kicker">Premium Overview</div>
          <h3>Your Premium Profile Centre</h3>

          <div className="ppp-summary-grid">
            {insightCards.map((item, index) => (
              <div key={index} className={`ppp-summary-item ppp-summary-${item.type}`}>
                <div className="ppp-summary-item-title">{item.title}</div>
                <div className="ppp-summary-item-text">{item.text}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="ppp-card">
          <div className="ppp-card-kicker">Profile Snapshot</div>
          <h3>Account Details</h3>

          <div className="ppp-info-list">
            <div><strong>Full Name</strong><span>{user.full_name}</span></div>
            <div><strong>Email</strong><span>{user.email}</span></div>
            <div><strong>Phone</strong><span>{user.phone}</span></div>
            <div><strong>Address</strong><span>{user.address}</span></div>
            <div><strong>Member Since</strong><span>{user.member_since}</span></div>
            <div><strong>Account Type</strong><span>Premium</span></div>
          </div>
        </article>

        <article className="ppp-card">
          <div className="ppp-card-kicker">Premium Benefits</div>
          <h3>What You Unlock</h3>

          <div className="ppp-insight-list">
            {premiumBenefits.map((item, index) => (
              <div key={index} className="ppp-insight-item">
                <div className="ppp-insight-icon">{item.icon}</div>
                <div>
                  <div className="ppp-insight-title">{item.title}</div>
                  <div className="ppp-insight-text">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="ppp-card">
          <div className="ppp-card-kicker">Multi-Pet Premium</div>
          <h3>Pet Summary</h3>

          {loadingPets ? (
            <div className="ppp-empty">Loading pets...</div>
          ) : petsError ? (
            <div className="ppp-empty">{petsError}</div>
          ) : (
            <>
              <div className="ppp-analytics-grid">
                <div className="ppp-analytics-box">
                  <span>Total Pets</span>
                  <strong>{pets.length}</strong>
                </div>
                <div className="ppp-analytics-box">
                  <span>Active Pets</span>
                  <strong>{activePets.length}</strong>
                </div>
                <div className="ppp-analytics-box">
                  <span>Memorial Pets</span>
                  <strong>{memorialPets.length}</strong>
                </div>
                <div className="ppp-analytics-box">
                  <span>Selected Pet</span>
                  <strong>{selectedPet?.name || "—"}</strong>
                </div>
              </div>

              <div className="ppp-pet-mini-grid">
                {pets.length === 0 ? (
                  <div className="ppp-empty">No pets added yet.</div>
                ) : (
                  pets.map((pet) => (
                    <div key={pet.id} className="ppp-pet-mini-card">
                      <div className="ppp-pet-mini-top">
                        <div className="ppp-pet-mini-avatar">
                          {getPetImageSrc(pet) ? (
                            <img src={getPetImageSrc(pet)} alt={pet.name} />
                          ) : (
                            <span>🐾</span>
                          )}
                        </div>

                        <div>
                          <div className="ppp-pet-mini-name">{pet.name}</div>
                          <div className="ppp-pet-mini-sub">
                            {pet.breed || pet.species || "Pet profile"}
                          </div>
                        </div>
                      </div>

                      <div className="ppp-pet-mini-status">
                        {hasMemorialData(pet) ? "Memorial" : "Active"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </article>

        <article className="ppp-card">
          <div className="ppp-card-kicker">Premium Insights</div>
          <h3>Personalised Guidance</h3>

          <div className="ppp-alert-list">
            <div className="ppp-alert-item ppp-alert-good">
              <div className="ppp-alert-title">Premium access confirmed</div>
              <div className="ppp-alert-text">
                Your Premium account keeps pet care, memorial tools, and personalised features in one place.
              </div>
            </div>

            <div className="ppp-alert-item ppp-alert-medium">
              <div className="ppp-alert-title">Keep profile updated</div>
              <div className="ppp-alert-text">
                Updating contact details and pet information improves your overall Pawfection experience.
              </div>
            </div>

            <div className="ppp-alert-item ppp-alert-low">
              <div className="ppp-alert-title">Use Premium tools often</div>
              <div className="ppp-alert-text">
                The more complete your pet records are, the more useful premium guidance becomes.
              </div>
            </div>
          </div>
        </article>
      </section>
    );
  };

  const renderMembershipTab = () => {
    return (
      <section className="ppp-grid">
        <article className="ppp-card ppp-card-wide">
          <div className="ppp-card-kicker">Premium Membership</div>
          <h3>Membership & Subscription</h3>

          <div className="ppp-billing-grid">
            <div className="ppp-billing-panel">
              <div className="ppp-billing-top">
                <div>
                  <div className="ppp-panel-label">Membership Plan</div>
                  <h4>Premium Monthly</h4>
                </div>

                <div className="ppp-status-pill active">Premium Active</div>
              </div>

              <div className="ppp-billing-list">
                <div><strong>Monthly Plan</strong><span>{monthlyPrice}</span></div>
                <div><strong>Status</strong><span>Active</span></div>
                <div><strong>Subscription Start</strong><span>{user.subscription_started_at}</span></div>
                <div><strong>Next Renewal</strong><span>{renewalDate}</span></div>
                <div><strong>Time Until Renewal</strong><span>{nextBillingDays}</span></div>
              </div>

              <div className="ppp-billing-actions">
                <button
                  className="ppp-btn ppp-btn-danger"
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
                </button>
              </div>
            </div>

            <div className="ppp-billing-panel">
              <div className="ppp-panel-label">Premium Access</div>
              <h4>Your Membership Includes</h4>

              <div className="ppp-empty-billing-state">
                <p>Your premium plan is active.</p>
                <span>
                  You currently have access to premium-only profile tools, smarter pet insights,
                  memorial customisation, and enhanced Pawfection features.
                </span>
              </div>

              <div className="ppp-fake-invoice-list">
                <div className="ppp-invoice-item">
                  <strong>Plan Type</strong>
                  <span>Premium Monthly</span>
                </div>

                <div className="ppp-invoice-item">
                  <strong>Membership Status</strong>
                  <span>Active Premium User</span>
                </div>

                <div className="ppp-invoice-item">
                  <strong>Premium Access</strong>
                  <span>Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {membershipMessage && (
            <div className="ppp-form-message ppp-form-success">{membershipMessage}</div>
          )}
        </article>
      </section>
    );
  };

  const renderMemorialTab = () => {
    return (
      <section className="ppp-grid">
        <article className="ppp-card">
          <div className="ppp-card-kicker">Premium Memorial</div>
          <h3>Customise Rainbow Bridge</h3>

          {pets.length === 0 ? (
            <div className="ppp-empty">No pets available for memorial customisation.</div>
          ) : (
            <>
              <div className="ppp-field">
                <label>Select Pet</label>
                <select
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                >
                  <option value="">Select a pet</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} {pet.breed ? `• ${pet.breed}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <form className="ppp-memorial-form" onSubmit={handleSaveMemorial}>
                <div className="ppp-field">
                  <label>Memorial Message</label>
                  <textarea
                    name="memorial_message"
                    rows="5"
                    value={memorialForm.memorial_message}
                    onChange={handleMemorialInputChange}
                    placeholder="Write a loving memorial message..."
                  />
                </div>

                <div className="ppp-field">
                  <label>Memorial Cover Photo URL</label>
                  <input
                    type="text"
                    name="memorial_photo_url"
                    value={memorialForm.memorial_photo_url}
                    onChange={handleMemorialInputChange}
                    placeholder="Paste a memorial image URL if you want"
                  />
                </div>

                <div className="ppp-field-grid">
                  <div className="ppp-field">
                    <label>Theme</label>
                    <select
                      name="memorial_theme"
                      value={memorialForm.memorial_theme}
                      onChange={handleMemorialInputChange}
                    >
                      <option value="rainbow">Rainbow</option>
                      <option value="soft-pink">Soft Pink</option>
                      <option value="golden-light">Golden Light</option>
                      <option value="stars">Stars</option>
                      <option value="paw-print">Paw Print</option>
                    </select>
                  </div>

                  <div className="ppp-field">
                    <label>Visibility</label>
                    <select
                      name="memorial_visibility"
                      value={memorialForm.memorial_visibility}
                      onChange={handleMemorialInputChange}
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                </div>

                <button
                  className="ppp-btn ppp-btn-primary"
                  type="submit"
                  disabled={memorialLoading}
                >
                  {memorialLoading ? "Saving..." : "Save Premium Memorial"}
                </button>
              </form>

              {memorialMessage && (
                <div className="ppp-form-message ppp-form-success">{memorialMessage}</div>
              )}
            </>
          )}
        </article>

        <article className="ppp-card">
          <div className="ppp-card-kicker">Memorial Preview</div>
          <h3>Preview Card</h3>

          <div className={`ppp-memorial-preview theme-${memorialForm.memorial_theme}`}>
            <div className="ppp-memorial-preview-badge">
              {memorialForm.memorial_visibility === "public" ? "Public Memorial" : "Private Memorial"}
            </div>

            <div className="ppp-memorial-preview-photo">
              {memorialForm.memorial_photo_url ? (
                <img src={memorialForm.memorial_photo_url} alt="Memorial preview" />
              ) : getPetImageSrc(selectedPet) ? (
                <img src={getPetImageSrc(selectedPet)} alt={selectedPet?.name || "Pet"} />
              ) : (
                <span>🌈🐾</span>
              )}
            </div>

            <h4>{selectedPet?.name || "Your Pet"}</h4>

            <p>
              {memorialForm.memorial_message ||
                "Forever loved, forever remembered, forever part of your heart."}
            </p>
          </div>
        </article>

        <article className="ppp-card ppp-card-wide">
          <div className="ppp-card-kicker">Community Memorial</div>
          <h3>Existing Memorial Profiles</h3>

          {memorialPets.length === 0 ? (
            <div className="ppp-empty">No memorial pets yet.</div>
          ) : (
            <div className="ppp-memorial-grid">
              {memorialPets.map((pet) => (
                <div key={pet.id} className="ppp-memorial-item">
                  <div className="ppp-memorial-item-photo">
                    {pet.memorial_photo_url ? (
                      <img src={pet.memorial_photo_url} alt={pet.name} />
                    ) : getPetImageSrc(pet) ? (
                      <img src={getPetImageSrc(pet)} alt={pet.name} />
                    ) : (
                      <span>🐾</span>
                    )}
                  </div>

                  <div className="ppp-memorial-item-name">{pet.name}</div>
                  <div className="ppp-memorial-item-text">
                    {pet.memorial_message || "Forever loved and never forgotten."}
                  </div>
                  <div className="ppp-memorial-item-text">
                    Theme: {pet.memorial_theme || "rainbow"} •{" "}
                    {pet.memorial_visibility || "private"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    );
  };

  const renderSettingsTab = () => {
    return (
      <section className="ppp-grid">
        <article className="ppp-card ppp-card-wide">
          <div className="ppp-card-kicker">Account Settings</div>
          <h3>Manage Your Premium Account</h3>

          <div className="ppp-settings-accordion">
            <button
              className="ppp-settings-toggle-btn"
              onClick={() => toggleSettingSection("password")}
              type="button"
            >
              Change Password
            </button>

            {openSettingSection === "password" && (
              <div className="ppp-settings-section">
                <form onSubmit={handleChangePassword} className="ppp-settings-form">
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
                    className="ppp-btn ppp-btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? "Saving..." : "Change Password"}
                  </button>
                </form>
              </div>
            )}

            <button
              className="ppp-settings-toggle-btn"
              onClick={() => toggleSettingSection("notifications")}
              type="button"
            >
              Notification Preferences
            </button>

            {openSettingSection === "notifications" && (
              <div className="ppp-settings-section">
                <div className="ppp-toggle-row">
                  <span>Email Notifications</span>
                  <button
                    type="button"
                    className={user.notification_email ? "ppp-toggle-btn active" : "ppp-toggle-btn"}
                    onClick={() => handleNotificationToggle("notification_email")}
                  >
                    {user.notification_email ? "On" : "Off"}
                  </button>
                </div>

                <div className="ppp-toggle-row">
                  <span>SMS Notifications</span>
                  <button
                    type="button"
                    className={user.notification_sms ? "ppp-toggle-btn active" : "ppp-toggle-btn"}
                    onClick={() => handleNotificationToggle("notification_sms")}
                  >
                    {user.notification_sms ? "On" : "Off"}
                  </button>
                </div>

                <button
                  type="button"
                  className="ppp-btn ppp-btn-primary"
                  onClick={handleSaveNotifications}
                  disabled={notificationsLoading}
                >
                  {notificationsLoading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            )}

            <button
              className="ppp-settings-toggle-btn"
              onClick={() => toggleSettingSection("actions")}
              type="button"
            >
              Account Actions
            </button>

            {openSettingSection === "actions" && (
              <div className="ppp-settings-section">
                <div className="ppp-action-row">
                  <button
                    type="button"
                    className="ppp-btn"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>

                  <button
                    type="button"
                    className="ppp-btn ppp-btn-danger"
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
            <div className="ppp-form-message ppp-form-success">{settingsMessage}</div>
          )}
        </article>
      </section>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "billing":
        return renderMembershipTab();
      case "memorial":
        return renderMemorialTab();
      case "settings":
        return renderSettingsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="ppp-shell">
      <header className="ppp-site-header">
        <div
          className="ppp-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img className="ppp-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="ppp-brand-copy">
            <div className="ppp-brand-title">Pawfection</div>
            <div className="ppp-brand-sub">Premium Profile</div>
          </div>
        </div>

        <nav className="ppp-topnav">
          <Link className="ppp-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="ppp-topnav-item" to="/premium-mypets">
            My Pet
          </Link>
          <Link className="ppp-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="ppp-topnav-item" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="ppp-topnav-item" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="ppp-topnav-item" to="/premium/community">
            Community
          </Link>
          <Link className="ppp-topnav-item" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="ppp-topnav-item" to="/premium/vet-chat">
            AI Pet Assistant
          </Link>
          <Link className="ppp-topnav-item active" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="ppp-header-side">
          <div className="ppp-date-pill">{todayText}</div>
          <div className="ppp-userchip">
            <div className="ppp-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
            <div>
              <div className="ppp-userchip-name">{userName}</div>
              <div className="ppp-userchip-sub">Premium User</div>
            </div>
          </div>
        </div>
      </header>

      <main className="ppp-main">
        <section className="ppp-hero">
          <div className="ppp-hero-copy">
            <div className="ppp-kicker">Pawfection Premium Membership</div>
            <h1 className="ppp-hero-title">
              {getGreeting()}, {userName}
            </h1>
            <p className="ppp-hero-text">
              Your Premium Profile brings together premium membership details, personalised benefits,
              pet-focused insights, memorial customisation, and a clearer multi-pet overview.
            </p>

            <div className="ppp-hero-actions">
              <button
                className="ppp-btn ppp-btn-primary"
                type="button"
                onClick={() => setActiveTab("billing")}
              >
                View Membership
              </button>

              <button
                className="ppp-btn"
                type="button"
                onClick={() => navigate("/premium-mypets")}
              >
                Go to My Pet
              </button>

              <button
                className="ppp-btn"
                type="button"
                onClick={() => setActiveTab("memorial")}
              >
                Memorial Customisation
              </button>
            </div>
          </div>

          <div className="ppp-hero-card">
            <div className="ppp-hero-badge">Premium Active</div>

            <h2>Premium Monthly Plan</h2>

            <p>
              Your Premium membership is active at {monthlyPrice} per month.
            </p>

            <div className="ppp-stat-row">
              <div className="ppp-stat-pill">Plan: Premium</div>
              <div className="ppp-stat-pill">Renewal: {renewalDate}</div>
              <div className="ppp-stat-pill">Pets: {pets.length}</div>
            </div>

            <div className="ppp-profile-glance">
              <div><strong>Email</strong><span>{user.email}</span></div>
              <div><strong>Member Since</strong><span>{user.member_since}</span></div>
              <div><strong>Status</strong><span>Active</span></div>
            </div>
          </div>
        </section>

        <section className="ppp-tabbar">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
            type="button"
          >
            Overview
          </button>
          <button
            className={activeTab === "billing" ? "active" : ""}
            onClick={() => setActiveTab("billing")}
            type="button"
          >
            Membership
          </button>
          <button
            className={activeTab === "memorial" ? "active" : ""}
            onClick={() => setActiveTab("memorial")}
            type="button"
          >
            Memorial
          </button>
          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
            type="button"
          >
            Settings
          </button>
        </section>

        {renderContent()}
      </main>
    </div>
  );
}