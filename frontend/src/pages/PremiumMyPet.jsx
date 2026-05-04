import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ReferenceLine,
} from "recharts";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumMyPet.css";

export default function PremiumMyPet() {
  const navigate = useNavigate();

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

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

  const extractList = (data, keyName) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[keyName])) return data[keyName];
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

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
        setSelectedPetId("");
        setPetsError(data?.message || "Failed to load pets.");
        return;
      }

      const petList = extractList(data, "pets");
      setPets(petList);

      setSelectedPetId((currentSelectedId) => {
        if (currentSelectedId) {
          const petStillExists = petList.some(
            (pet) => String(pet.id) === String(currentSelectedId)
          );

          if (petStillExists) {
            return String(currentSelectedId);
          }
        }

        return petList.length > 0 ? String(petList[0].id) : "";
      });
    } catch {
      setPets([]);
      setSelectedPetId("");
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

      const data = await res.json().catch(() => []);
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

      const data = await res.json().catch(() => []);
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRecommendations([]);
        return;
      }

      const recommendationList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.recommendations)
        ? data.recommendations
        : [];

      setRecommendations(recommendationList);
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

      const data = await res.json().catch(() => []);
      setAlerts(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (!selectedPetId) {
      setHealthLogs([]);
      setReminders([]);
      setRecommendations([]);
      setAlerts([]);
      return;
    }

    fetchHealthLogs(selectedPetId);
    fetchReminders(selectedPetId);
    fetchRecommendations(selectedPetId);
    fetchAlerts(selectedPetId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPetId]);

  const selectedPet = useMemo(() => {
    if (!pets.length) return null;

    return (
      pets.find((pet) => String(pet.id) === String(selectedPetId)) ||
      pets[0] ||
      null
    );
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
    setHealthFormError("");
    setHealthFormSuccess("");
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

  const activityProgressPercent = useMemo(() => {
    if (!targetActivity || targetActivity <= 0) return 0;
    return Math.round((latestActivityNumber / targetActivity) * 100);
  }, [latestActivityNumber, targetActivity]);

  const activityChartValue = useMemo(() => {
    return Math.min(activityProgressPercent, 100);
  }, [activityProgressPercent]);

  const activityRingData = useMemo(() => {
    return [
      {
        name: "Activity Progress",
        value: activityChartValue,
        fill: "#7d68f2",
      },
    ];
  }, [activityChartValue]);

  const activityStatus = useMemo(() => {
    if (!targetActivity || targetActivity <= 0) return "No goal set";
    if (activityProgressPercent >= 100) return "Goal reached";
    if (activityProgressPercent >= 75) return "Almost there";
    if (activityProgressPercent >= 40) return "In progress";
    return "Needs activity";
  }, [activityProgressPercent, targetActivity]);

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
    const defaultCards = [
      {
        icon: "🏃",
        title: "Exercise Recommendation",
        text: "No exercise recommendation available yet.",
      },
      {
        icon: "🥣",
        title: "Feeding Advice",
        text: "Use measured portions and monitor weight trends regularly.",
      },
      {
        icon: "🩺",
        title: "Breed Health Tip",
        text: "No breed-based tip available yet.",
      },
      {
        icon: "⏰",
        title: "Care Recommendation",
        text:
          "Keep vaccination, grooming, and check-up records up to date for better insights.",
      },
    ];

    if (!recommendations.length) {
      return defaultCards;
    }

    return defaultCards.map((card, index) => {
      const recommendation = recommendations[index];

      if (!recommendation) return card;

      return {
        icon: card.icon,
        title: recommendation.title || card.title,
        text:
          recommendation.message ||
          recommendation.text ||
          recommendation.description ||
          card.text,
      };
    });
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

  const premiumPetSliderItems = useMemo(() => {
    return [
      {
        icon: "🩺",
        title: "Health Logs",
        text: "Track weight, activity, appetite, and care notes for your selected pet.",
        action: "Add health log",
        onClick: () => setShowHealthForm(true),
      },
      {
        icon: "📈",
        title: "Trend Graphs",
        text: "View weight and activity progress with premium health analytics.",
        action: "View trends",
        onClick: () => {
          document.querySelector(".pmp-graph-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        icon: "💡",
        title: "Smart Insights",
        text: "See personalised recommendations based on your pet profile and logs.",
        action: "View insights",
        onClick: () => {
          document.querySelector(".pmp-insight-list")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        icon: "🔔",
        title: "Reminders",
        text: `${pendingReminders} pending reminder${pendingReminders === 1 ? "" : "s"} for this pet.`,
        action: "Open reminders",
        onClick: () => navigate("/premium/reminders"),
      },
      {
        icon: "📍",
        title: "Lost Status",
        text: isSelectedPetLost
          ? "This pet is currently marked as missing."
          : "This pet is not marked as lost.",
        action: isSelectedPetLost ? "View sightings" : "Open lost & found",
        onClick: () =>
          isSelectedPetLost && selectedPet
            ? navigate(`/premium/pets/${selectedPet.id}/sightings`)
            : navigate("/premium/lostfound"),
      },
      {
        icon: "✏️",
        title: "Pet Profile",
        text: "Update your pet details, photo, health info, and profile notes.",
        action: "Edit profile",
        onClick: () => selectedPet && navigate(`/premium/pets/${selectedPet.id}/edit`),
      },
    ];
  }, [pendingReminders, isSelectedPetLost, selectedPet, navigate]);

  const WeightTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const actual = payload.find((item) => item.dataKey === "actualWeight");
    const target = payload.find((item) => item.dataKey === "targetWeight");

    return (
      <div className="pmp-custom-tooltip">
        <div className="pmp-tooltip-date">{label}</div>

        {actual && (
          <div className="pmp-tooltip-row">
            <span className="pmp-tooltip-dot actual"></span>
            <span>Actual Weight</span>
            <strong>{actual.value} kg</strong>
          </div>
        )}

        {target && (
          <div className="pmp-tooltip-row">
            <span className="pmp-tooltip-dot target"></span>
            <span>Target Weight</span>
            <strong>{target.value} kg</strong>
          </div>
        )}
      </div>
    );
  };

  const ActivityTooltip = () => {
    return (
      <div className="pmp-custom-tooltip">
        <div className="pmp-tooltip-date">Activity Progress</div>

        <div className="pmp-tooltip-row">
          <span className="pmp-tooltip-dot actual"></span>
          <span>Latest Activity</span>
          <strong>{latestActivityNumber} mins</strong>
        </div>

        <div className="pmp-tooltip-row">
          <span className="pmp-tooltip-dot target"></span>
          <span>Daily Goal</span>
          <strong>{targetActivity} mins</strong>
        </div>
      </div>
    );
  };

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
              Your Premium My Pet page gives personalised care insights, health
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
                disabled={!selectedPet}
              >
                {showHealthForm ? "Close Health Log" : "Add Health Log"}
              </button>

              <button
                className="pmp-btn"
                type="button"
                onClick={() =>
                  selectedPet ? navigate(`/premium/pets/${selectedPet.id}/edit`) : null
                }
                disabled={!selectedPet}
              >
                Edit Pet Profile
              </button>

              <button
                className="pmp-btn"
                type="button"
                onClick={() => navigate("/premium/pets/create")}
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

            {healthFormError && (
              <div className="pmp-form-message pmp-form-error">
                {healthFormError}
              </div>
            )}

            {healthFormSuccess && (
              <div className="pmp-form-message pmp-form-success">
                {healthFormSuccess}
              </div>
            )}

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
            key={selectedPet?.id || "no-selected-pet"}
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
                    <div>
                      <strong>Date of Birth</strong>
                      <span>{selectedPet?.date_of_birth || selectedPet?.dob || "-"}</span>
                    </div>
                    <div>
                      <strong>Gender</strong>
                      <span>{selectedPet?.gender || "-"}</span>
                    </div>
                    <div>
                      <strong>Vaccination Status</strong>
                      <span>{selectedPet?.vaccination_status || "-"}</span>
                    </div>
                    <div>
                      <strong>Last Vet Visit</strong>
                      <span>{formatDisplayDate(selectedPet?.last_vet_visit)}</span>
                    </div>
                    <div>
                      <strong>Microchip Number</strong>
                      <span>{selectedPet?.microchip_number || "-"}</span>
                    </div>
                    <div>
                      <strong>Activity Level</strong>
                      <span>{selectedPet?.activity_level || "Not added"}</span>
                    </div>
                    <div>
                      <strong>Lost Status</strong>
                      <span>{isSelectedPetLost ? "Missing Pet" : "Not lost"}</span>
                    </div>
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
                      <div>
                        <strong>Notes</strong>
                        <span>{selectedPet?.notes || "Friendly and energetic."}</span>
                      </div>
                      <div>
                        <strong>Species</strong>
                        <span>{selectedPet?.species || "-"}</span>
                      </div>
                      <div>
                        <strong>Breed</strong>
                        <span>{selectedPet?.breed || "-"}</span>
                      </div>
                      <div>
                        <strong>Weight</strong>
                        <span>{selectedPet?.weight ? `${selectedPet.weight}kg` : latestWeight}</span>
                      </div>
                    </>
                  )}

                  {activePetTab === "health" && (
                    <>
                      <div>
                        <strong>Vaccination</strong>
                        <span>{selectedPet?.vaccination_status || "Not set"}</span>
                      </div>
                      <div>
                        <strong>Last Vet Visit</strong>
                        <span>{formatDisplayDate(selectedPet?.last_vet_visit)}</span>
                      </div>
                      <div>
                        <strong>Microchip</strong>
                        <span>{selectedPet?.microchip_number || "Not set"}</span>
                      </div>
                      <div>
                        <strong>Latest Activity</strong>
                        <span>{latestActivity === "—" ? "Not added" : `${latestActivity} mins`}</span>
                      </div>
                    </>
                  )}

                  {activePetTab === "diet" && (
                    <div>
                      <strong>Diet</strong>
                      <span>{selectedPet?.diet || "Dry food and chicken"}</span>
                    </div>
                  )}

                  {activePetTab === "behaviour" && (
                    <div>
                      <strong>Behaviour</strong>
                      <span>{selectedPet?.behaviour || selectedPet?.behaviour_notes || "Playful and alert"}</span>
                    </div>
                  )}

                  {activePetTab === "reminders" && (
                    <>
                      <div>
                        <strong>Reminder Summary</strong>
                        <span>{reminders.length ? `${reminders.length} total reminders` : "No upcoming reminders"}</span>
                      </div>
                      <div>
                        <strong>Completed</strong>
                        <span>{completedReminders}</span>
                      </div>
                      <div>
                        <strong>Pending</strong>
                        <span>{pendingReminders}</span>
                      </div>
                    </>
                  )}

                  {activePetTab === "guidance" && (
                    <div>
                      <strong>Guidance</strong>
                      <span>
                        {recommendationCards[0]?.text ||
                          "Keep health logs and reminders updated for better premium insights."}
                      </span>
                    </div>
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
                    disabled={!selectedPet}
                    onClick={() => selectedPet && navigate(`/premium/pets/${selectedPet.id}/edit`)}
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

        <section className="pmp-auto-section">
          <div className="pmp-auto-head">
            <div>
              <div className="pmp-card-kicker">Premium pet shortcuts</div>
              <h2>Everything for {selectedPet?.name || "your pet"}, sliding automatically</h2>
            </div>
          </div>

          <div className="pmp-slider-mask">
            <div className="pmp-slider-track">
              {[0, 1].map((groupIndex) => (
                <div className="pmp-slider-group" key={groupIndex}>
                  {premiumPetSliderItems.map((item, index) => (
                    <button
                      key={`${groupIndex}-${index}`}
                      type="button"
                      className="pmp-slide-card"
                      onClick={item.onClick}
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

          <div className="pmp-slider-dots">
            <span></span>
            <span className="active"></span>
            <span></span>
            <span></span>
          </div>
        </section>

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
            <h3>Breed-Specific Recommendations for {selectedPet?.name || "Your Pet"}</h3>

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

            <div className="pmp-chart-header-row">
              <div>
                <h3>Health Trend Tracking</h3>
                <p>
                  Premium health analytics for {selectedPet?.name || "your pet"} based on
                  recent health logs.
                </p>
              </div>

              <div className="pmp-chart-metrics">
                <div className="pmp-chart-metric">
                  <span>Latest Weight</span>
                  <strong>{latestWeightNumber ? `${latestWeightNumber}kg` : "—"}</strong>
                </div>

                <div className="pmp-chart-metric">
                  <span>Target Weight</span>
                  <strong>{targetWeight ? `${targetWeight}kg` : "—"}</strong>
                </div>

                <div className="pmp-chart-metric">
                  <span>Activity</span>
                  <strong>{activityProgressPercent}%</strong>
                </div>
              </div>
            </div>

            <div className="pmp-graph-grid">
              <div>
                <h4 className="pmp-graph-title">Weight Trend Tracking</h4>

                <div className="pmp-chart-card pmp-weight-chart-card pmp-professional-chart">
                  {healthLoading ? (
                    <div className="pmp-empty">Loading weight chart...</div>
                  ) : weightChartData.length ? (
                    <>
                      <div className="pmp-chart-info">
                        <span className="pmp-chart-chip actual">Actual Weight</span>
                        <span className="pmp-chart-chip target">Target Weight</span>
                      </div>

                      <div className="pmp-recharts-wrap pmp-recharts-wrap-weight">
                        <ResponsiveContainer width="100%" height={330}>
                          <ComposedChart
                            data={weightChartData}
                            margin={{ top: 25, right: 35, left: 5, bottom: 35 }}
                          >
                            <defs>
                              <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7d68f2" stopOpacity={0.28} />
                                <stop offset="95%" stopColor="#7d68f2" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>

                            <CartesianGrid
                              stroke="#e9e5f8"
                              strokeDasharray="4 6"
                              vertical={false}
                            />

                            <XAxis
                              dataKey="date"
                              angle={-35}
                              textAnchor="end"
                              height={60}
                              tick={{ fill: "#746b95", fontSize: 12, fontWeight: 700 }}
                              tickLine={false}
                              axisLine={false}
                            />

                            <YAxis
                              tick={{ fill: "#746b95", fontSize: 12, fontWeight: 700 }}
                              tickLine={false}
                              axisLine={false}
                              width={48}
                              domain={["dataMin - 1", "dataMax + 1"]}
                              tickFormatter={(value) => `${value}kg`}
                            />

                            <Tooltip content={<WeightTooltip />} />

                            {targetWeight > 0 && (
                              <ReferenceLine
                                y={targetWeight}
                                stroke="#35c3a8"
                                strokeWidth={2}
                                strokeDasharray="8 8"
                                label={{
                                  value: "Target",
                                  position: "insideTopRight",
                                  fill: "#249c88",
                                  fontSize: 12,
                                  fontWeight: 800,
                                }}
                              />
                            )}

                            <Area
                              type="monotone"
                              dataKey="actualWeight"
                              stroke="none"
                              fill="url(#weightFill)"
                            />

                            <Line
                              type="monotone"
                              dataKey="actualWeight"
                              name="Actual Weight"
                              stroke="#7d68f2"
                              strokeWidth={4}
                              dot={{
                                r: 5,
                                fill: "#ffffff",
                                stroke: "#7d68f2",
                                strokeWidth: 3,
                              }}
                              activeDot={{
                                r: 8,
                                fill: "#7d68f2",
                                stroke: "#ffffff",
                                strokeWidth: 3,
                              }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="pmp-chart-caption">
                        {weightDifference > 0.2
                          ? `${selectedPet?.name || "Your pet"} is currently ${weightDifference}kg above the target weight.`
                          : weightDifference < -0.2
                          ? `${selectedPet?.name || "Your pet"} is currently ${Math.abs(weightDifference)}kg below the target weight.`
                          : `${selectedPet?.name || "Your pet"} is close to the target weight.`}
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

                <div className="pmp-chart-card pmp-activity-card pmp-professional-chart">
                  {healthLoading ? (
                    <div className="pmp-empty">Loading activity chart...</div>
                  ) : (
                    <>
                      <div className="pmp-chart-info">
                        <span className="pmp-chart-summary">Goal: {targetActivity} mins</span>
                        <span className="pmp-chart-summary">
                          Latest: {latestActivityNumber} mins
                        </span>
                      </div>

                      <div className="pmp-activity-layout">
                        <div className="pmp-recharts-wrap pmp-recharts-wrap-activity">
                          <ResponsiveContainer width="100%" height={280}>
                            <RadialBarChart
                              cx="50%"
                              cy="50%"
                              innerRadius="72%"
                              outerRadius="100%"
                              barSize={18}
                              data={activityRingData}
                              startAngle={90}
                              endAngle={-270}
                            >
                              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />

                              <RadialBar
                                dataKey="value"
                                cornerRadius={18}
                                background={{ fill: "#edf0fb" }}
                              />

                              <Tooltip content={<ActivityTooltip />} />
                            </RadialBarChart>
                          </ResponsiveContainer>

                          <div className="pmp-activity-centre">
                            <strong>{activityProgressPercent}%</strong>
                            <span>{activityStatus}</span>
                          </div>
                        </div>

                        <div className="pmp-activity-progress">
                          <div>
                            <span>Completed</span>
                            <strong>{latestActivityNumber} mins</strong>
                          </div>

                          <div>
                            <span>Daily Goal</span>
                            <strong>{targetActivity} mins</strong>
                          </div>

                          <div>
                            <span>Difference</span>
                            <strong>
                              {latestActivityNumber >= targetActivity
                                ? `+${latestActivityNumber - targetActivity} mins`
                                : `${targetActivity - latestActivityNumber} mins left`}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="pmp-chart-caption">
                        {latestActivityNumber >= targetActivity
                          ? `${selectedPet?.name || "Your pet"} has reached today’s activity goal.`
                          : `${selectedPet?.name || "Your pet"} needs ${targetActivity - latestActivityNumber} more minutes to reach the goal.`}
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

          <article className="pmp-card pmp-selected-pet-card">
            <div className="pmp-card-kicker">Premium Care Context</div>
            <h3>Selected Pet Summary</h3>

            <div className="pmp-selected-pet-box">
              <div className="pmp-selected-pet-photo">
                {getPetImageSrc(selectedPet) ? (
                  <img src={getPetImageSrc(selectedPet)} alt={selectedPet?.name || "Pet"} />
                ) : (
                  <span>🐾</span>
                )}
              </div>

              <div className="pmp-selected-pet-info">
                <div className="pmp-selected-pet-badge">
                  {isSelectedPetLost ? "📍 Missing Pet" : "💜 Active Profile"}
                </div>

                <h4>{selectedPet?.name || "Your Pet"}</h4>
                <p>
                  {selectedPet?.breed || selectedPet?.species || "Premium pet profile"}
                  {selectedPet?.age ? ` • ${selectedPet.age} yrs` : ""}
                </p>

                <div className="pmp-selected-mini-grid">
                  <div>
                    <span>Weight</span>
                    <strong>{selectedPet?.weight || latestWeight || "—"}</strong>
                  </div>

                  <div>
                    <span>Target Weight</span>
                    <strong>{targetWeight || "—"}</strong>
                  </div>

                  <div>
                    <span>Target Activity</span>
                    <strong>{targetActivity} mins</strong>
                  </div>

                  <div>
                    <span>Progress</span>
                    <strong>{reminderProgress}%</strong>
                  </div>
                </div>

                <div className="pmp-selected-actions">
                  <button
                    type="button"
                    disabled={!selectedPet}
                    onClick={() => selectedPet && navigate(`/premium/pets/${selectedPet.id}/edit`)}
                  >
                    ✏️ Edit Pet
                  </button>

                  <button type="button" onClick={() => navigate("/premium/reminders")}>
                    🔔 Reminders
                  </button>

                  {selectedPet && isSelectedPetLost && (
                    <button
                      type="button"
                      onClick={() => navigate(`/premium/pets/${selectedPet.id}/sightings`)}
                    >
                      👀 Sightings
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pmp-selected-note">
              <strong>Notes:</strong>{" "}
              {selectedPet?.notes || "No health notes added yet."}
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
                        Weight: {log?.weight || "—"} | Activity:{" "}
                        {log?.activity_minutes || "—"} mins
                      </div>
                      <div className="pmp-timeline-sub">
                        Appetite: {log?.appetite || "—"} |{" "}
                        {log?.note || "No extra notes added."}
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

          <article className="pmp-card pmp-routine-card">
            <div className="pmp-card-kicker">Reminder Progress</div>
            <h3>Care Routine Completion</h3>

            {remindersLoading ? (
              <div className="pmp-empty">Loading reminders...</div>
            ) : (
              <div className="pmp-routine-layout">
                <div>
                  <div className="pmp-progress-ring">
                    <div>
                      <div className="pmp-progress-value">{reminderProgress}%</div>
                      <div className="pmp-progress-label">complete</div>
                    </div>
                  </div>

                  <div className="pmp-progress-meta">
                    <div>Total reminders: {reminders.length}</div>
                    <div>Completed: {completedReminders}</div>
                    <div>Pending: {Math.max(reminders.length - completedReminders, 0)}</div>
                  </div>
                </div>

                <div className="pmp-routine-side">
                  <div className="pmp-routine-message">
                    <span>✨</span>
                    <div>
                      <strong>
                        {reminderProgress >= 80
                          ? "Care routine is looking great"
                          : reminderProgress >= 40
                          ? "Care routine is improving"
                          : "Care routine needs attention"}
                      </strong>
                      <p>
                        Keep reminders, health logs, appointments, and activity records updated
                        to make premium insights more useful.
                      </p>
                    </div>
                  </div>

                  <div className="pmp-routine-actions">
                    <button type="button" onClick={() => navigate("/premium/reminders")}>
                      🔔 Open Reminders
                    </button>

                    <button type="button" onClick={() => setShowHealthForm(true)}>
                      🩺 Add Health Log
                    </button>

                    <button type="button" onClick={() => navigate("/premium/appointments")}>
                      📅 Book Appointment
                    </button>

                    <button type="button" onClick={() => navigate("/premium/vet-chat")}>
                      💬 AI Pet Assistant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}