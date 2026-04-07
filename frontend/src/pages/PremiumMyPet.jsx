import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumMyPet.css";

export default function PremiumMyPet() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [loadingPets, setLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState("");

  const [healthLogs, setHealthLogs] = useState([]);
  const [healthLoading, setHealthLoading] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState(null);

  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const [showHealthForm, setShowHealthForm] = useState(false);
  const [showPetDetails, setShowPetDetails] = useState(false);
  const [activePetTab, setActivePetTab] = useState("overview");

  const [savingHealthLog, setSavingHealthLog] = useState(false);
  const [healthFormError, setHealthFormError] = useState("");
  const [healthFormSuccess, setHealthFormSuccess] = useState("");
  const [healthForm, setHealthForm] = useState({
    log_date: new Date().toISOString().split("T")[0],
    weight: "",
    activity_minutes: "",
    appetite: "",
    note: "",
  });

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

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

    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name) {
          setUserName(userObj.name);
        }
      }
    } catch {
      setUserName("User");
    }

    fetchPets();
  }, [navigate]);

  const fetchPets = async () => {
    if (!token) return;

    setLoadingPets(true);
    setPetsError("");

    try {
      const res = await fetch(`${apiBase}/pets`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPets([]);
        setPetsError(data?.message || "Failed to load pets.");
      } else {
        const petList = Array.isArray(data) ? data : data?.pets || [];
        setPets(petList);

        if (petList.length > 0) {
          const firstId = petList[0]?.id;
          setSelectedPetId(String(firstId));
          fetchHealthLogs(firstId);
          fetchReminders(firstId);
          fetchRecommendations(firstId);
          fetchAlerts(firstId);
        }
      }
    } catch {
      setPets([]);
      setPetsError("Server error. Is your backend running?");
    } finally {
      setLoadingPets(false);
    }
  };

  const fetchHealthLogs = async (petId) => {
    if (!token || !petId) return;

    setHealthLoading(true);
    try {
      const res = await fetch(`${apiBase}/premium/pets/${petId}/health-logs`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ([]));
      setHealthLogs(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setHealthLogs([]);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchReminders = async (petId) => {
    if (!token || !petId) return;

    setRemindersLoading(true);
    try {
      const res = await fetch(`${apiBase}/premium/pets/${petId}/reminders`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ([]));
      setReminders(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setReminders([]);
    } finally {
      setRemindersLoading(false);
    }
  };

  const fetchRecommendations = async (petId) => {
    if (!token || !petId) return;

    setRecommendationsLoading(true);
    try {
      const res = await fetch(`${apiBase}/premium/pets/${petId}/recommendations`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ([]));
      setRecommendations(Array.isArray(data) ? data : []);
    } catch {
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const fetchAlerts = async (petId) => {
    if (!token || !petId) return;

    setAlertsLoading(true);
    try {
      const res = await fetch(`${apiBase}/premium/pets/${petId}/alerts`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ([]));
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  const selectedPet = useMemo(() => {
    return pets.find((pet) => String(pet.id) === String(selectedPetId)) || pets[0] || null;
  }, [pets, selectedPetId]);

  const isSelectedPetLost = useMemo(() => {
    if (!selectedPet) return false;

    return (
      selectedPet?.is_lost === true ||
      selectedPet?.is_lost === 1 ||
      String(selectedPet?.lost_status || "").toLowerCase() === "missing" ||
      String(selectedPet?.status || "").toLowerCase() === "missing pet" ||
      String(selectedPet?.status || "").toLowerCase() === "missing"
    );
  }, [selectedPet]);

  const handleSelectPet = (petId) => {
    setSelectedPetId(String(petId));
    setShowPetDetails(false);
    setActivePetTab("overview");
    fetchHealthLogs(petId);
    fetchReminders(petId);
    fetchRecommendations(petId);
    fetchAlerts(petId);
    setHealthFormError("");
    setHealthFormSuccess("");
  };

  const getPetImageSrc = (pet) => {
    if (!pet) return null;
    if (pet?.display_photo_url) return pet.display_photo_url;
    if (pet?.lost_photo_url) return pet.lost_photo_url;
    if (pet?.photo_url) return pet.photo_url;
    if (pet?.photo_path) return `http://127.0.0.1:8000/storage/${pet.photo_path}`;
    if (pet?.photo) return `http://127.0.0.1:8000/storage/${pet.photo}`;
    return null;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const formatTimelineDate = (value) => {
    if (!value) return "Recent update";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-IE", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatDisplayDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const orderedHealthLogs = useMemo(() => {
    return [...healthLogs].sort(
      (a, b) => new Date(a.log_date || a.created_at) - new Date(b.log_date || b.created_at)
    );
  }, [healthLogs]);

  const latestWeight = useMemo(() => {
    const withWeight = orderedHealthLogs.filter(
      (log) => log?.weight !== null && log?.weight !== undefined && log?.weight !== ""
    );
    return withWeight.length
      ? withWeight[withWeight.length - 1].weight
      : selectedPet?.weight || "—";
  }, [orderedHealthLogs, selectedPet]);

  const latestActivity = useMemo(() => {
    const withActivity = orderedHealthLogs.filter(
      (log) =>
        log?.activity_minutes !== null &&
        log?.activity_minutes !== undefined &&
        log?.activity_minutes !== ""
    );
    return withActivity.length
      ? withActivity[withActivity.length - 1].activity_minutes
      : "—";
  }, [orderedHealthLogs]);

  const completedReminders = useMemo(() => {
    if (!reminders.length) return 0;
    return reminders.filter(
      (r) => String(r?.status || "").toLowerCase() === "completed"
    ).length;
  }, [reminders]);

  const reminderProgress = useMemo(() => {
    if (!reminders.length) return 0;
    return Math.round((completedReminders / reminders.length) * 100);
  }, [completedReminders, reminders]);

  const healthTimeline = useMemo(() => {
    return [...orderedHealthLogs].slice(-5).reverse();
  }, [orderedHealthLogs]);

  const targetWeight = useMemo(() => {
    return Number(
      selectedPet?.target_weight ||
      selectedPet?.ideal_weight ||
      selectedPet?.healthy_weight ||
      selectedPet?.recommended_weight ||
      selectedPet?.weight ||
      0
    );
  }, [selectedPet]);

  const targetActivity = useMemo(() => {
    return Number(
      selectedPet?.target_activity_minutes ||
      selectedPet?.ideal_activity_minutes ||
      selectedPet?.daily_activity_goal ||
      60
    );
  }, [selectedPet]);

  const latestWeightNumber = useMemo(() => {
    const value = Number(latestWeight);
    return Number.isNaN(value) ? 0 : value;
  }, [latestWeight]);

  const latestActivityNumber = useMemo(() => {
    const value = Number(latestActivity);
    return Number.isNaN(value) ? 0 : value;
  }, [latestActivity]);

  const weightDifference = useMemo(() => {
    if (!targetWeight || !latestWeightNumber) return 0;
    return Number((latestWeightNumber - targetWeight).toFixed(2));
  }, [latestWeightNumber, targetWeight]);

  const activityDifference = useMemo(() => {
    if (!targetActivity && targetActivity !== 0) return 0;
    return Number((targetActivity - latestActivityNumber).toFixed(0));
  }, [latestActivityNumber, targetActivity]);

  const pendingReminders = useMemo(() => {
    return Math.max(reminders.length - completedReminders, 0);
  }, [reminders.length, completedReminders]);

  const summaryItems = useMemo(() => {
    const items = [];

    if (targetWeight > 0 && latestWeightNumber > 0) {
      if (weightDifference > 0.2) {
        items.push({
          type: "warning",
          title: "Weight is above target",
          text: `${selectedPet?.name || "Your pet"} is ${weightDifference}kg above the target weight.`,
        });
      } else if (weightDifference < -0.2) {
        items.push({
          type: "good",
          title: "Weight is below target",
          text: `${selectedPet?.name || "Your pet"} is ${Math.abs(weightDifference)}kg below the target weight.`,
        });
      } else {
        items.push({
          type: "good",
          title: "Weight is on track",
          text: `${selectedPet?.name || "Your pet"} is very close to the target weight.`,
        });
      }
    }

    if (targetActivity > 0) {
      if (activityDifference > 0) {
        items.push({
          type: "warning",
          title: "Activity is below goal",
          text: `${selectedPet?.name || "Your pet"} needs ${activityDifference} more mins to reach the daily goal.`,
        });
      } else {
        items.push({
          type: "good",
          title: "Activity goal reached",
          text: `${selectedPet?.name || "Your pet"} has met or exceeded the activity goal.`,
        });
      }
    }

    if (pendingReminders > 0) {
      items.push({
        type: "warning",
        title: "Reminders still pending",
        text: `${pendingReminders} reminder${pendingReminders > 1 ? "s are" : " is"} still waiting to be completed.`,
      });
    } else {
      items.push({
        type: "good",
        title: "Reminders are up to date",
        text: "There are no pending reminders right now.",
      });
    }

    return items;
  }, [
    targetWeight,
    latestWeightNumber,
    weightDifference,
    targetActivity,
    activityDifference,
    pendingReminders,
    selectedPet?.name,
  ]);

  const overallSummary = useMemo(() => {
    const warningCount = summaryItems.filter((item) => item.type === "warning").length;

    if (warningCount >= 2) {
      return {
        label: "Needs attention",
        type: "warning",
      };
    }

    if (warningCount === 1) {
      return {
        label: "Mostly stable",
        type: "medium",
      };
    }

    return {
      label: "Healthy routine",
      type: "good",
    };
  }, [summaryItems]);

  const weightChartData = useMemo(() => {
    const logsWithWeight = orderedHealthLogs
      .filter(
        (log) =>
          log?.weight !== null &&
          log?.weight !== undefined &&
          log?.weight !== ""
      )
      .map((log) => ({
        date: formatShortDate(log.log_date || log.created_at),
        actualWeight: Number(log.weight),
        targetWeight: Number(targetWeight),
      }))
      .filter((item) => !Number.isNaN(item.actualWeight));

    if (logsWithWeight.length >= 2) return logsWithWeight;

    if (logsWithWeight.length === 1) {
      const first = logsWithWeight[0];
      return [
        {
          date: `${first.date} A`,
          actualWeight: first.actualWeight,
          targetWeight: first.targetWeight,
        },
        {
          date: `${first.date} B`,
          actualWeight: first.actualWeight,
          targetWeight: first.targetWeight,
        },
      ];
    }

    return [];
  }, [orderedHealthLogs, targetWeight]);

  const activityPieData = useMemo(() => {
    const done = Math.min(latestActivityNumber, targetActivity);
    const remaining = Math.max(targetActivity - done, 0);

    return [
      { name: "Completed", value: done },
      { name: "Remaining", value: remaining },
    ];
  }, [latestActivityNumber, targetActivity]);

  const handleHealthInputChange = (e) => {
    const { name, value } = e.target;
    setHealthForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetHealthForm = () => {
    setHealthForm({
      log_date: new Date().toISOString().split("T")[0],
      weight: "",
      activity_minutes: "",
      appetite: "",
      note: "",
    });
  };

  const refreshPremiumPetData = (petId) => {
    fetchHealthLogs(petId);
    fetchReminders(petId);
    fetchRecommendations(petId);
    fetchAlerts(petId);
  };

  const submitHealthLog = async (e) => {
    e.preventDefault();

    if (!selectedPet?.id) {
      setHealthFormError("Please select a pet first.");
      return;
    }

    setSavingHealthLog(true);
    setHealthFormError("");
    setHealthFormSuccess("");

    try {
      const payload = {
        log_date: healthForm.log_date,
        weight: healthForm.weight === "" ? null : Number(healthForm.weight),
        activity_minutes:
          healthForm.activity_minutes === ""
            ? null
            : Number(healthForm.activity_minutes),
        appetite: healthForm.appetite || null,
        note: healthForm.note || null,
      };

      const res = await fetch(`${apiBase}/premium/pets/${selectedPet.id}/health-logs`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to save health log.";
        setHealthFormError(msg);
        return;
      }

      setHealthFormSuccess("Health log added successfully.");
      resetHealthForm();
      setShowHealthForm(false);
      refreshPremiumPetData(selectedPet.id);
    } catch {
      setHealthFormError("Server error. Could not save health log.");
    } finally {
      setSavingHealthLog(false);
    }
  };

  const deleteHealthLog = async (logId) => {
    if (!selectedPet?.id || !logId) return;

    const confirmed = window.confirm("Delete this health log?");
    if (!confirmed) return;

    setDeletingLogId(logId);
    setHealthFormError("");
    setHealthFormSuccess("");

    try {
      const res = await fetch(
        `${apiBase}/premium/pets/${selectedPet.id}/health-logs/${logId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || "Failed to delete health log.";
        setHealthFormError(msg);
        return;
      }

      setHealthFormSuccess("Health log deleted successfully.");
      refreshPremiumPetData(selectedPet.id);
    } catch {
      setHealthFormError("Server error. Could not delete health log.");
    } finally {
      setDeletingLogId(null);
    }
  };

  const recommendationCards = useMemo(() => {
    if (!recommendations.length) return [];

    const findByTitle = (matchText) =>
      recommendations.find((item) =>
        String(item?.title || "").toLowerCase().includes(matchText)
      );

    const exercise = findByTitle("exercise");
    const feeding = findByTitle("feeding");
    const breedHealth =
      findByTitle("breed") || findByTitle("health") || findByTitle("care");
    const ageTip = findByTitle("senior") || findByTitle("young") || findByTitle("age");

    return [
      {
        icon: "🏃",
        title: exercise?.title || "Exercise Recommendation",
        text: exercise?.message || "No exercise recommendation available yet.",
      },
      {
        icon: "🥣",
        title: feeding?.title || "Feeding Advice",
        text: feeding?.message || "No feeding advice available yet.",
      },
      {
        icon: "🩺",
        title: breedHealth?.title || "Breed Health Tip",
        text: breedHealth?.message || "No breed-based tip available yet.",
      },
      {
        icon: "⏰",
        title: ageTip?.title || "Care Recommendation",
        text:
          ageTip?.message ||
          "Keep vaccination, grooming, and check-up records up to date for better insights.",
      },
    ];
  }, [recommendations]);

  const visibleAlerts = useMemo(() => {
    if (alerts.length) return alerts;

    return [
      {
        severity: "good",
        title: "No urgent alerts",
        message: "Everything looks stable for now.",
      },
    ];
  }, [alerts]);

  const pieColors = ["#7c6cf2", "#d9def0"];

  return (
    <div className="pmp-shell">
      <header className="pmp-site-header">
        <div
          className="pmp-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img className="pmp-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pmp-brand-copy">
            <div className="pmp-brand-title">Pawfection</div>
            <div className="pmp-brand-sub">Premium My Pet</div>
          </div>
        </div>

        <nav className="pmp-topnav">
          <Link className="pmp-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pmp-topnav-item active" to="/premium-mypets">
            My Pet
          </Link>
          <Link className="pmp-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="pmp-topnav-item" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="pmp-topnav-item" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pmp-topnav-item" to="/premium/community">
            Community
          </Link>
          <Link className="pmp-topnav-item" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="pmp-topnav-item" to="/premium/vet-chat">
            AI Pet Assistant
          </Link>
          <Link className="pmp-topnav-item" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="pmp-header-side">
          <div className="pmp-date-pill">{todayText}</div>
          <div className="pmp-userchip">
            <div className="pmp-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
            <div>
              <div className="pmp-userchip-name">{userName}</div>
              <div className="pmp-userchip-sub">Premium User</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pmp-main">
        <section className="pmp-hero">
          <div className="pmp-hero-copy">
            <div className="pmp-kicker">Pawfection Premium Intelligence</div>
            <h1 className="pmp-hero-title">
              {getGreeting()}, {userName}
            </h1>
            <p className="pmp-hero-text">
              Your Premium My Pet page now gives personalised care insights, health
              analytics, predictive alerts, and pet-aware premium support.
            </p>

            <div className="pmp-selector-wrap">
              <label htmlFor="petSelect" className="pmp-selector-label">
                Select Pet
              </label>
              <select
                id="petSelect"
                className="pmp-selector"
                value={selectedPetId}
                onChange={(e) => handleSelectPet(e.target.value)}
                disabled={loadingPets || pets.length === 0}
              >
                {pets.length === 0 && <option value="">No pets available</option>}
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} {pet.breed ? `• ${pet.breed}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="pmp-hero-actions">
              <button
                className="pmp-btn pmp-btn-primary"
                type="button"
                onClick={() => setShowHealthForm((prev) => !prev)}
              >
                {showHealthForm ? "Close Health Log" : "Add Health Log"}
              </button>

              <button
                className="pmp-btn"
                type="button"
                onClick={() =>
                  selectedPet ? navigate(`/pets/${selectedPet.id}/edit`) : null
                }
              >
                Edit Pet Profile
              </button>

              <button
                className="pmp-btn"
                type="button"
                onClick={() => navigate("/pets/create")}
              >
                Add New Pet
              </button>

              {selectedPet && isSelectedPetLost && (
                <button
                  className="pmp-btn pmp-btn-primary"
                  type="button"
                  onClick={() => navigate(`/premium/pets/${selectedPet.id}/sightings`)}
                >
                  View Sightings
                </button>
              )}
            </div>

            {healthFormError && <div className="pmp-form-message pmp-form-error">{healthFormError}</div>}
            {healthFormSuccess && <div className="pmp-form-message pmp-form-success">{healthFormSuccess}</div>}

            {showHealthForm && (
              <form className="pmp-health-form" onSubmit={submitHealthLog}>
                <div className="pmp-health-grid">
                  <div className="pmp-field">
                    <label>Log Date</label>
                    <input
                      type="date"
                      name="log_date"
                      value={healthForm.log_date}
                      onChange={handleHealthInputChange}
                      required
                    />
                  </div>

                  <div className="pmp-field">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="weight"
                      value={healthForm.weight}
                      onChange={handleHealthInputChange}
                      placeholder="e.g. 8.40"
                    />
                  </div>

                  <div className="pmp-field">
                    <label>Activity Minutes</label>
                    <input
                      type="number"
                      min="0"
                      name="activity_minutes"
                      value={healthForm.activity_minutes}
                      onChange={handleHealthInputChange}
                      placeholder="e.g. 45"
                    />
                  </div>

                  <div className="pmp-field">
                    <label>Appetite</label>
                    <input
                      type="text"
                      name="appetite"
                      value={healthForm.appetite}
                      onChange={handleHealthInputChange}
                      placeholder="Normal / Low / High"
                    />
                  </div>
                </div>

                <div className="pmp-field">
                  <label>Note</label>
                  <textarea
                    name="note"
                    rows="4"
                    value={healthForm.note}
                    onChange={handleHealthInputChange}
                    placeholder="Add any health observations here..."
                  />
                </div>

                <div className="pmp-health-actions">
                  <button
                    className="pmp-btn pmp-btn-primary"
                    type="submit"
                    disabled={savingHealthLog}
                  >
                    {savingHealthLog ? "Saving..." : "Save Health Log"}
                  </button>

                  <button
                    className="pmp-btn"
                    type="button"
                    onClick={() => {
                      resetHealthForm();
                      setShowHealthForm(false);
                      setHealthFormError("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div
            className={`pmp-hero-card pmp-hero-card-clickable ${showPetDetails ? "is-open" : ""}`}
            onClick={() => {
              if (selectedPet) {
                setShowPetDetails((prev) => !prev);
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && selectedPet) {
                e.preventDefault();
                setShowPetDetails((prev) => !prev);
              }
            }}
          >
            {loadingPets ? (
              <div className="pmp-photo-empty">Loading pet...</div>
            ) : petsError ? (
              <div className="pmp-photo-empty">{petsError}</div>
            ) : (
              <>
                <div className="pmp-hero-photo">
                  {getPetImageSrc(selectedPet) ? (
                    <img src={getPetImageSrc(selectedPet)} alt={selectedPet?.name || "Pet"} />
                  ) : (
                    <div className="pmp-photo-empty">🐾 Add a pet photo</div>
                  )}
                </div>

                <div className="pmp-hero-meta">
                  <div className="pmp-premium-badge">Premium Active</div>
                  <h2>{selectedPet?.name || "Your Pet"}</h2>
                  <p>
                    {selectedPet?.breed || selectedPet?.species || "Pet profile"}
                    {selectedPet?.age ? ` • ${selectedPet.age} yrs` : ""}
                    {selectedPet?.weight ? ` • ${selectedPet.weight}kg` : ""}
                  </p>

                  <div className="pmp-stat-row">
                    <div className="pmp-stat-pill">Weight: {latestWeight}</div>
                    <div className="pmp-stat-pill">
                      Activity: {latestActivity === "—" ? "—" : `${latestActivity} mins`}
                    </div>
                    <div className="pmp-stat-pill">Progress: {reminderProgress}%</div>
                  </div>

                  {selectedPet && isSelectedPetLost && (
                    <div className="pmp-stat-row" style={{ marginTop: "10px" }}>
                      <div className="pmp-stat-pill">Lost Pet Active</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <div className={`pmp-pet-details-outer ${showPetDetails ? "show" : ""}`}>
          <section className="pmp-pet-details-wrap">
            <div className="pmp-pet-details-main">
              <div className="pmp-pet-profile-card">
                <div className="pmp-pet-profile-head">
                  <div>
                    <h3>{selectedPet?.name || "Pet"}</h3>
                    <p>
                      {selectedPet?.species || "Pet"}
                      {selectedPet?.breed ? ` • ${selectedPet.breed}` : ""}
                      {selectedPet?.weight ? ` • ${selectedPet.weight}kg` : ""}
                    </p>
                  </div>
                </div>

                <div className="pmp-pet-profile-top">
                  <div className="pmp-pet-profile-image">
                    {getPetImageSrc(selectedPet) ? (
                      <img src={getPetImageSrc(selectedPet)} alt={selectedPet?.name || "Pet"} />
                    ) : (
                      <div className="pmp-photo-empty">🐾 No photo</div>
                    )}
                  </div>

                  <div className="pmp-pet-profile-info">
                    <div><strong>Date of Birth</strong><span>{selectedPet?.date_of_birth || selectedPet?.dob || "-"}</span></div>
                    <div><strong>Gender</strong><span>{selectedPet?.gender || "-"}</span></div>
                    <div><strong>Vaccination Status</strong><span>{selectedPet?.vaccination_status || "-"}</span></div>
                    <div><strong>Last Vet Visit</strong><span>{formatDisplayDate(selectedPet?.last_vet_visit)}</span></div>
                    <div><strong>Microchip Number</strong><span>{selectedPet?.microchip_number || "-"}</span></div>
                    <div><strong>Activity Level</strong><span>{selectedPet?.activity_level || "Not added"}</span></div>
                    <div><strong>Lost Status</strong><span>{isSelectedPetLost ? "Missing Pet" : "Not lost"}</span></div>
                  </div>
                </div>

                <div className="pmp-pet-tabs">
                  <button
                    className={activePetTab === "overview" ? "active" : ""}
                    onClick={() => setActivePetTab("overview")}
                    type="button"
                  >
                    Overview
                  </button>
                  <button
                    className={activePetTab === "health" ? "active" : ""}
                    onClick={() => setActivePetTab("health")}
                    type="button"
                  >
                    Health
                  </button>
                  <button
                    className={activePetTab === "diet" ? "active" : ""}
                    onClick={() => setActivePetTab("diet")}
                    type="button"
                  >
                    Diet
                  </button>
                  <button
                    className={activePetTab === "behaviour" ? "active" : ""}
                    onClick={() => setActivePetTab("behaviour")}
                    type="button"
                  >
                    Behaviour
                  </button>
                  <button
                    className={activePetTab === "reminders" ? "active" : ""}
                    onClick={() => setActivePetTab("reminders")}
                    type="button"
                  >
                    Reminders
                  </button>
                  <button
                    className={activePetTab === "guidance" ? "active" : ""}
                    onClick={() => setActivePetTab("guidance")}
                    type="button"
                  >
                    Guidance
                  </button>
                </div>

                <div className="pmp-pet-tab-panel">
                  {activePetTab === "overview" && (
                    <>
                      <div><strong>Notes</strong><span>{selectedPet?.notes || "Friendly and energetic."}</span></div>
                      <div><strong>Species</strong><span>{selectedPet?.species || "-"}</span></div>
                      <div><strong>Breed</strong><span>{selectedPet?.breed || "-"}</span></div>
                      <div><strong>Weight</strong><span>{selectedPet?.weight ? `${selectedPet.weight}kg` : latestWeight}</span></div>
                    </>
                  )}

                  {activePetTab === "health" && (
                    <>
                      <div><strong>Vaccination</strong><span>{selectedPet?.vaccination_status || "Not set"}</span></div>
                      <div><strong>Last Vet Visit</strong><span>{formatDisplayDate(selectedPet?.last_vet_visit)}</span></div>
                      <div><strong>Microchip</strong><span>{selectedPet?.microchip_number || "Not set"}</span></div>
                      <div><strong>Latest Activity</strong><span>{latestActivity === "—" ? "Not added" : `${latestActivity} mins`}</span></div>
                    </>
                  )}

                  {activePetTab === "diet" && (
                    <>
                      <div><strong>Diet</strong><span>{selectedPet?.diet || "Dry food and chicken"}</span></div>
                    </>
                  )}

                  {activePetTab === "behaviour" && (
                    <>
                      <div><strong>Behaviour</strong><span>{selectedPet?.behaviour || "Playful and alert"}</span></div>
                    </>
                  )}

                  {activePetTab === "reminders" && (
                    <>
                      <div><strong>Reminder Summary</strong><span>{reminders.length ? `${reminders.length} total reminders` : "No upcoming reminders"}</span></div>
                      <div><strong>Completed</strong><span>{completedReminders}</span></div>
                      <div><strong>Pending</strong><span>{pendingReminders}</span></div>
                    </>
                  )}

                  {activePetTab === "guidance" && (
                    <>
                      <div><strong>Guidance</strong><span>{recommendationCards[0]?.text || "Keep health logs and reminders updated for better premium insights."}</span></div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <aside className="pmp-pet-details-side">
              <div className="pmp-quick-summary-card">
                <h3>Quick summary</h3>
                <p>Helpful information for this pet profile.</p>

                <div className="pmp-quick-box">
                  <strong>NEXT REMINDER</strong>
                  <span>{pendingReminders > 0 ? `${pendingReminders} pending reminder(s)` : "No upcoming reminders"}</span>
                </div>

                <div className="pmp-quick-box">
                  <strong>DIET</strong>
                  <span>{selectedPet?.diet || "Dry food and chicken"}</span>
                </div>

                <div className="pmp-quick-box">
                  <strong>VACCINATION</strong>
                  <span>{selectedPet?.vaccination_status || "Not set"}</span>
                </div>

                <div className="pmp-quick-actions">
                  <button
                    className="pmp-btn pmp-btn-primary pmp-btn-small"
                    type="button"
                    onClick={() => navigate(`/pets/${selectedPet.id}/edit`)}
                  >
                    Edit Profile
                  </button>

                  <button
                    className="pmp-btn pmp-btn-small"
                    type="button"
                    onClick={() => navigate("/premium/reminders")}
                  >
                    View Reminders
                  </button>

                  <button
                    className="pmp-btn pmp-btn-small"
                    type="button"
                    onClick={() => navigate("/premium-dashboard")}
                  >
                    Dashboard
                  </button>

                  {selectedPet && isSelectedPetLost && (
                    <button
                      className="pmp-btn pmp-btn-small"
                      type="button"
                      onClick={() => navigate(`/premium/pets/${selectedPet.id}/sightings`)}
                    >
                      View Sightings
                    </button>
                  )}
                </div>
              </div>
            </aside>
          </section>
        </div>

        <section className="pmp-grid">
          <article className="pmp-card pmp-card-wide">
            <div className="pmp-card-kicker">Premium Health Summary</div>
            <h3>Today&apos;s Smart Care Overview</h3>

            <div className="pmp-summary-top">
              <div className={`pmp-summary-badge pmp-summary-${overallSummary.type}`}>
                {overallSummary.label}
              </div>
            </div>

            <div className="pmp-summary-grid">
              {summaryItems.map((item, index) => (
                <div key={index} className={`pmp-summary-item pmp-summary-${item.type}`}>
                  <div className="pmp-summary-item-title">{item.title}</div>
                  <div className="pmp-summary-item-text">{item.text}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="pmp-card">
            <div className="pmp-card-kicker">Personalised Insights</div>
            <h3>Smart Recommendations</h3>

            {recommendationsLoading ? (
              <div className="pmp-empty">Loading recommendations...</div>
            ) : (
              <div className="pmp-insight-list">
                {recommendationCards.map((item, index) => (
                  <div key={index} className="pmp-insight-item">
                    <div className="pmp-insight-icon">{item.icon}</div>
                    <div>
                      <div className="pmp-insight-title">{item.title}</div>
                      <div className="pmp-insight-text">{item.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="pmp-card">
            <div className="pmp-card-kicker">Health Analytics</div>
            <h3>Current Health Snapshot</h3>

            <div className="pmp-analytics-grid">
              <div className="pmp-analytics-box">
                <span>Latest Weight</span>
                <strong>{latestWeight}</strong>
              </div>
              <div className="pmp-analytics-box">
                <span>Latest Activity</span>
                <strong>{latestActivity === "—" ? "—" : `${latestActivity} mins`}</strong>
              </div>
              <div className="pmp-analytics-box">
                <span>Reminders Done</span>
                <strong>{completedReminders}</strong>
              </div>
              <div className="pmp-analytics-box">
                <span>Routine Progress</span>
                <strong>{reminderProgress}%</strong>
              </div>
            </div>
          </article>

          <article className="pmp-card pmp-card-wide">
            <div className="pmp-card-kicker">Trend Graph</div>
            <h3>Health Trend Tracking</h3>

            <div className="pmp-graph-grid">
              <div>
                <h4 className="pmp-graph-title">Weight Trend Tracking</h4>

                <div className="pmp-chart-card pmp-weight-chart-card">
                  {healthLoading ? (
                    <div className="pmp-empty">Loading weight chart...</div>
                  ) : weightChartData.length ? (
                    <>
                      <div className="pmp-chart-info">
                        <span className="pmp-chart-chip actual">Actual Weight</span>
                        <span className="pmp-chart-chip target">Target Weight</span>
                      </div>

                      <div className="pmp-recharts-wrap pmp-recharts-wrap-weight">
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart
                            data={weightChartData}
                            margin={{ top: 20, right: 35, left: 10, bottom: 35 }}
                          >
                            <CartesianGrid
                              strokeDasharray="0"
                              stroke="#d7d9e8"
                              vertical={true}
                              horizontal={true}
                            />

                            <XAxis
                              dataKey="date"
                              angle={-45}
                              textAnchor="end"
                              height={60}
                              tick={{ fill: "#746a95", fontSize: 12 }}
                              tickLine={false}
                              axisLine={{ stroke: "#7f8299", strokeWidth: 1.4 }}
                            />

                            <YAxis
                              tick={{ fill: "#746a95", fontSize: 12 }}
                              tickLine={false}
                              axisLine={{ stroke: "#7f8299", strokeWidth: 1.4 }}
                              domain={["auto", "auto"]}
                            />

                            <Tooltip />

                            <Line
                              type="linear"
                              dataKey="actualWeight"
                              name="Actual Weight"
                              stroke="#f2b21b"
                              strokeWidth={2.5}
                              dot={{
                                r: 5,
                                fill: "#f2b21b",
                                stroke: "#f2b21b",
                                strokeWidth: 1,
                              }}
                              activeDot={{ r: 7 }}
                              label={{
                                position: "top",
                                fill: "#5a4f7c",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />

                            <Line
                              type="linear"
                              dataKey="targetWeight"
                              name="Target Weight"
                              stroke="#22b573"
                              strokeWidth={2.5}
                              dot={{
                                r: 5,
                                fill: "#22b573",
                                stroke: "#22b573",
                                strokeWidth: 1,
                              }}
                              activeDot={{ r: 7 }}
                              label={{
                                position: "top",
                                fill: "#5a4f7c",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    <div className="pmp-empty">
                      No weight logs yet. Add health entries to show trends.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="pmp-graph-title">Activity Goal Progress</h4>

                <div className="pmp-chart-card">
                  {healthLoading ? (
                    <div className="pmp-empty">Loading activity chart...</div>
                  ) : (
                    <>
                      <div className="pmp-chart-info">
                        <span className="pmp-chart-summary">
                          Goal: {targetActivity} mins
                        </span>
                        <span className="pmp-chart-summary">
                          Latest: {latestActivityNumber} mins
                        </span>
                      </div>

                      <div className="pmp-recharts-wrap">
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={activityPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={90}
                              paddingAngle={3}
                              dataKey="value"
                              nameKey="name"
                              label
                            >
                              {activityPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className="pmp-card">
            <div className="pmp-card-kicker">Predictive Alerts</div>
            <h3>What Needs Attention</h3>

            {alertsLoading ? (
              <div className="pmp-empty">Loading alerts...</div>
            ) : (
              <div className="pmp-alert-list">
                {visibleAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`pmp-alert-item pmp-alert-${alert.severity || "medium"}`}
                  >
                    <div className="pmp-alert-title">{alert.title}</div>
                    <div className="pmp-alert-text">{alert.message}</div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="pmp-card">
            <div className="pmp-card-kicker">Premium Care Context</div>
            <h3>Selected Pet Summary</h3>

            <div className="pmp-context-box">
              <div><strong>Name:</strong> {selectedPet?.name || "—"}</div>
              <div><strong>Breed:</strong> {selectedPet?.breed || "—"}</div>
              <div><strong>Age:</strong> {selectedPet?.age || "—"}</div>
              <div><strong>Weight:</strong> {selectedPet?.weight || latestWeight || "—"}</div>
              <div><strong>Target Weight:</strong> {targetWeight || "—"}</div>
              <div><strong>Target Activity:</strong> {targetActivity} mins</div>
              <div><strong>Notes:</strong> {selectedPet?.notes || "No health notes added yet."}</div>
              <div><strong>Lost Status:</strong> {isSelectedPetLost ? "Missing Pet" : "Not lost"}</div>
            </div>
          </article>

          <article className="pmp-card pmp-card-wide">
            <div className="pmp-card-kicker">Health Timeline</div>
            <h3>Recent Health Log Activity</h3>

            {healthLoading ? (
              <div className="pmp-empty">Loading health timeline...</div>
            ) : healthTimeline.length === 0 ? (
              <div className="pmp-empty">No health logs yet.</div>
            ) : (
              <div className="pmp-timeline">
                {healthTimeline.map((log, index) => (
                  <div key={log.id || index} className="pmp-timeline-item">
                    <div className="pmp-timeline-dot" />
                    <div className="pmp-timeline-content">
                      <div className="pmp-timeline-title">
                        {formatTimelineDate(log?.log_date || log?.created_at)}
                      </div>
                      <div className="pmp-timeline-text">
                        Weight: {log?.weight || "—"} | Activity: {log?.activity_minutes || "—"} mins
                      </div>
                      <div className="pmp-timeline-sub">
                        Appetite: {log?.appetite || "—"} | {log?.note || "No extra notes added."}
                      </div>
                      <div className="pmp-timeline-actions">
                        <button
                          className="pmp-btn pmp-btn-danger pmp-btn-small"
                          type="button"
                          disabled={deletingLogId === log.id}
                          onClick={() => deleteHealthLog(log.id)}
                        >
                          {deletingLogId === log.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="pmp-card">
            <div className="pmp-card-kicker">Reminder Progress</div>
            <h3>Care Routine Completion</h3>

            {remindersLoading ? (
              <div className="pmp-empty">Loading reminders...</div>
            ) : (
              <>
                <div className="pmp-progress-ring">
                  <div className="pmp-progress-value">{reminderProgress}%</div>
                  <div className="pmp-progress-label">complete</div>
                </div>

                <div className="pmp-progress-meta">
                  <div>Total reminders: {reminders.length}</div>
                  <div>Completed: {completedReminders}</div>
                  <div>Pending: {Math.max(reminders.length - completedReminders, 0)}</div>
                </div>
              </>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}