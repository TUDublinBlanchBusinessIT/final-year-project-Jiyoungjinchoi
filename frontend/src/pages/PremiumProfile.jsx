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
  const [activePetIndex, setActivePetIndex] = useState(0);
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

  useEffect(() => {
    if (pets.length <= 1) return;

    const timer = setInterval(() => {
      setActivePetIndex((prev) => (prev + 1) % pets.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [pets.length]);

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
        setActivePetIndex(0);
        return;
      }

      const petList = Array.isArray(data)
        ? data
        : Array.isArray(data?.pets)
        ? data.pets
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setPets(petList);

      setActivePetIndex((prev) => {
        if (!petList.length) return 0;
        return prev >= petList.length ? 0 : prev;
      });

      if (petList.length > 0) {
        setSelectedPetId((prev) => prev || String(petList[0].id));
      }
    } catch {
      setPets([]);
      setPetsError("Server error. Is your backend running?");
      setActivePetIndex(0);
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

  const summaryPet = useMemo(() => {
    if (!pets.length) return null;
    return pets[activePetIndex] || pets[0] || null;
  }, [pets, activePetIndex]);

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

  const profileSliderItems = useMemo(() => {
    return [
      {
        icon: "💬",
        title: "AI Pet Assistant",
        text: "Use pet-aware AI support for health, behaviour, feeding, grooming, travel, and planning.",
        action: "Open AI assistant",
        route: "/premium/vet-chat",
      },
      {
        icon: "⚙️",
        title: "Account Settings",
        text: "Update your password, notification preferences, logout, or manage account actions.",
        action: "Manage settings",
        tab: "settings",
      },
      {
        icon: "👤",
        title: "Profile Centre",
        text: "Keep your personal details, contact information, and Premium account status organised.",
        action: "View overview",
        tab: "overview",
      },
      {
        icon: "⭐",
        title: "Premium Membership",
        text: `Your Premium plan is active at ${monthlyPrice} per month with upgraded Pawfection tools.`,
        action: "View membership",
        tab: "billing",
      },
      {
        icon: "🐾",
        title: "My Pet Profiles",
        text: `You currently have ${pets.length} pet${pets.length === 1 ? "" : "s"} connected to your Premium account.`,
        action: "Open my pets",
        route: "/premium-mypets",
      },
      {
        icon: "🌈",
        title: "Rainbow Bridge",
        text: "Create and customise a premium memorial profile with a message, theme, and visibility option.",
        action: "Customise memorial",
        tab: "memorial",
      },
    ];
  }, [monthlyPrice, pets.length]);

  const bottomSliderItems = useMemo(() => {
    return [
      {
        icon: "🐾",
        title: "Pet Summary",
        text: `You have ${pets.length} pet${pets.length === 1 ? "" : "s"} in Pawfection with ${activePets.length} active profile${activePets.length === 1 ? "" : "s"}.`,
        action: "View pet summary",
        tab: "overview",
      },
      {
        icon: "⭐",
        title: "Premium Plan",
        text: `Premium is active at ${monthlyPrice} per month with upgraded Pawfection tools.`,
        action: "View membership",
        tab: "billing",
      },
      {
        icon: "🌈",
        title: "Memorial Tools",
        text: "Create a private or public Rainbow Bridge memorial with custom message and theme.",
        action: "Customise memorial",
        tab: "memorial",
      },
      {
        icon: "⚙️",
        title: "Account Controls",
        text: "Manage password changes, notification preferences, logout, and account actions.",
        action: "Open settings",
        tab: "settings",
      },
      {
        icon: "👤",
        title: "Profile Snapshot",
        text: `${user.full_name || "Your profile"} • ${user.email || "email not provided"}`,
        action: "View overview",
        tab: "overview",
      },
      {
        icon: "💬",
        title: "AI Pet Support",
        text: "Open premium pet support for care, guidance, feeding, grooming, and planning.",
        action: "Open assistant",
        route: "/premium/vet-chat",
      },
    ];
  }, [
    pets.length,
    activePets.length,
    monthlyPrice,
    user.full_name,
    user.email,
  ]);

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
    if (pet?.display_photo_url) return pet.display_photo_url;
    if (pet?.lost_photo_url) return pet.lost_photo_url;
    if (pet?.photo_url) return pet.photo_url;
    if (pet?.image_url) return pet.image_url;
    if (pet?.image) return pet.image;
    if (pet?.photo_path) return `http://127.0.0.1:8000/storage/${pet.photo_path}`;
    if (pet?.photo) return `http://127.0.0.1:8000/storage/${pet.photo}`;
    return null;
  };

  const getPetSummaryText = (pet) => {
    if (!pet) return "Premium pet profile";

    const parts = [];

    if (pet?.breed) parts.push(pet.breed);
    else if (pet?.species) parts.push(pet.species);

    if (pet?.age) parts.push(`${pet.age} yrs`);
    if (pet?.weight) parts.push(`${pet.weight}kg`);

    return parts.length ? parts.join(" • ") : "Premium pet profile";
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

  const renderPetSummaryCard = () => {
    return (
      <article className="ppp-card ppp-card-wide ppp-pretty-pet-summary">
        <div className="ppp-pet-summary-bg-paw">🐾</div>

        <div className="ppp-pet-summary-head">
          <div>
            <div className="ppp-card-kicker">Multi-Pet Premium</div>
            <h3>Pet Summary</h3>
            <p>
              A quick premium overview of your pet profiles, active records, and memorial status.
            </p>
          </div>

          <button
            type="button"
            className="ppp-btn ppp-btn-primary"
            onClick={() => navigate("/premium-mypets")}
          >
            Manage Pets
          </button>
        </div>

        {loadingPets ? (
          <div className="ppp-empty">Loading pets...</div>
        ) : petsError ? (
          <div className="ppp-empty">{petsError}</div>
        ) : pets.length === 0 ? (
          <div className="ppp-empty">No pets added yet.</div>
        ) : (
          <div className="ppp-pretty-pet-layout">
            <div
              className="ppp-featured-pet-card ppp-auto-changing-pet"
              key={summaryPet?.id || "summary-pet"}
            >
              <div className="ppp-featured-pet-photo">
                {getPetImageSrc(summaryPet) ? (
                  <img src={getPetImageSrc(summaryPet)} alt={summaryPet?.name || "Pet"} />
                ) : (
                  <span>🐾</span>
                )}
              </div>

              <div className="ppp-featured-pet-info">
                <div className="ppp-featured-label">Featured Pet</div>
                <h4>{summaryPet?.name || "Your Pet"}</h4>
                <p>{getPetSummaryText(summaryPet)}</p>

                <div className="ppp-featured-status">
                  {hasMemorialData(summaryPet) ? "🌈 Memorial Profile" : "💜 Active Profile"}
                </div>

                {pets.length > 1 && (
                  <div className="ppp-pet-summary-dots">
                    {pets.map((pet, index) => (
                      <button
                        key={pet.id}
                        type="button"
                        className={index === activePetIndex ? "active" : ""}
                        onClick={() => setActivePetIndex(index)}
                        aria-label={`Show ${pet.name}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="ppp-pretty-stats-area">
              <div className="ppp-pretty-stat-card">
                <span>Total Pets</span>
                <strong>{pets.length}</strong>
                <small>Saved profiles</small>
              </div>

              <div className="ppp-pretty-stat-card">
                <span>Active Pets</span>
                <strong>{activePets.length}</strong>
                <small>Current care profiles</small>
              </div>

              <div className="ppp-pretty-stat-card">
                <span>Memorial Pets</span>
                <strong>{memorialPets.length}</strong>
                <small>Rainbow Bridge</small>
              </div>

              <div className="ppp-pretty-stat-card">
                <span>Highlighted Pet</span>
                <strong>{summaryPet?.name || "—"}</strong>
                <small>Auto changing</small>
              </div>
            </div>

            <div className="ppp-pet-progress-card">
              <div>
                <span>Profile Status</span>
                <strong>
                  {user.phone !== "Not Provided" && user.address !== "Not Provided"
                    ? "Complete"
                    : "Needs details"}
                </strong>
              </div>

              <div className="ppp-progress-track">
                <div
                  className={
                    user.phone !== "Not Provided" && user.address !== "Not Provided"
                      ? "ppp-progress-fill full"
                      : "ppp-progress-fill"
                  }
                ></div>
              </div>

              <p>
                {user.phone !== "Not Provided" && user.address !== "Not Provided"
                  ? "Your premium profile details are nicely completed."
                  : "Add phone and address details to make your profile feel more complete."}
              </p>
            </div>

            <div className="ppp-pet-summary-actions">
              <button type="button" onClick={() => navigate("/premium-mypets")}>
                🐾 Open My Pets
              </button>

              <button type="button" onClick={() => setActiveTab("memorial")}>
                🌈 Memorial Tools
              </button>

              <button type="button" onClick={() => navigate("/premium/reminders")}>
                🔔 View Reminders
              </button>
            </div>
          </div>
        )}
      </article>
    );
  };

  const renderOverviewTab = () => {
    return (
      <>
        <section className="ppp-bottom-auto-section">
          <div className="ppp-bottom-auto-head">
            <div>
              <div className="ppp-card-kicker">Premium profile pages</div>
              <h2>Your profile pages</h2>
            </div>
          </div>

          <div className="ppp-bottom-slider-mask">
            <div className="ppp-bottom-slider-track">
              {[0, 1].map((groupIndex) => (
                <div className="ppp-bottom-slider-group" key={groupIndex}>
                  {bottomSliderItems.map((item, index) => (
                    <button
                      key={`${groupIndex}-${index}`}
                      type="button"
                      className="ppp-bottom-slide-card"
                      onClick={() => {
                        if (item.route) {
                          navigate(item.route);
                        } else {
                          setActiveTab(item.tab);
                        }
                      }}
                    >
                      <span>{item.icon}</span>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                      <small>{item.action}</small>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="ppp-slider-dots">
            <span></span>
            <span className="active"></span>
            <span></span>
            <span></span>
          </div>
        </section>

        <section className="ppp-grid ppp-pet-only-grid">
          {renderPetSummaryCard()}
        </section>
      </>
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

        <section className="ppp-auto-section">
          <div className="ppp-auto-head">
            <div>
              <div className="ppp-card-kicker">Premium profile shortcuts</div>
              <h2>Everything in your profile</h2>
            </div>
          </div>

          <div className="ppp-slider-mask">
            <div className="ppp-slider-track">
              {[0, 1].map((groupIndex) => (
                <div className="ppp-slider-group" key={groupIndex}>
                  {profileSliderItems.map((item, index) => (
                    <button
                      key={`${groupIndex}-${index}`}
                      type="button"
                      className="ppp-slide-card"
                      onClick={() => {
                        if (item.route) {
                          navigate(item.route);
                        } else {
                          setActiveTab(item.tab);
                        }
                      }}
                    >
                      <span>{item.icon}</span>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                      <small>{item.action}</small>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="ppp-slider-dots">
            <span></span>
            <span className="active"></span>
            <span></span>
            <span></span>
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
