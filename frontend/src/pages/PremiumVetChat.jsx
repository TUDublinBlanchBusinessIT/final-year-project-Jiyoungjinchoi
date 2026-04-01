import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumVetChat.css";

const SYMPTOM_OPTIONS = [
  "Vomiting",
  "Diarrhoea",
  "Not Eating",
  "Itching",
  "Limping",
  "Coughing",
  "Sneezing",
  "Low Energy",
  "Skin Rash",
  "Ear Issue",
  "Eye Discharge",
  "Anxiety",
];

const EMERGENCY_KEYWORDS = [
  "breathing",
  "collapse",
  "collapsed",
  "seizure",
  "bleeding",
  "poison",
  "poisoning",
  "unconscious",
  "not breathing",
  "cannot breathe",
  "hit by car",
  "cant breathe",
  "can't breathe",
  "difficulty breathing",
  "severe bleeding",
  "unable to stand",
  "not moving",
];

export default function PremiumVetChat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [userName, setUserName] = useState("User");
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [loadingPets, setLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState("");

  const [isPremium, setIsPremium] = useState(true);
  const [premiumChecked, setPremiumChecked] = useState(false);

  const [showIntakeForm, setShowIntakeForm] = useState(true);
  const [chatStarted, setChatStarted] = useState(false);
  const [chatStatus, setChatStatus] = useState("idle"); // idle | preparing | summarising | connected
  const [assistantName, setAssistantName] = useState("Pawfection AI Vet Assistant");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [chatError, setChatError] = useState("");

  const [intakeForm, setIntakeForm] = useState({
    concern: "",
    duration: "",
    appetite: "",
    behaviour: "",
    symptoms: [],
    useAiSummary: true,
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [aiSummary, setAiSummary] = useState("");
  const [aiGuidance, setAiGuidance] = useState([]);
  const [emergencyDetected, setEmergencyDetected] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

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

        const premiumFlag =
          userObj?.is_premium === true ||
          String(userObj?.account_type || "").toLowerCase() === "premium" ||
          String(userObj?.plan || "").toLowerCase() === "premium" ||
          String(userObj?.subscription || "").toLowerCase() === "premium" ||
          String(localStorage.getItem("pawfection_account_type") || "").toLowerCase() === "premium";

        setIsPremium(premiumFlag);
      } else {
        const accountType = String(localStorage.getItem("pawfection_account_type") || "").toLowerCase();
        setIsPremium(accountType === "premium");
      }
    } catch {
      setUserName("User");
      const accountType = String(localStorage.getItem("pawfection_account_type") || "").toLowerCase();
      setIsPremium(accountType === "premium");
    } finally {
      setPremiumChecked(true);
    }

    fetchPets();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
          setSelectedPetId(String(petList[0].id));
        }
      }
    } catch {
      setPets([]);
      setPetsError("Server error. Is your backend running?");
    } finally {
      setLoadingPets(false);
    }
  };

  const selectedPet = useMemo(() => {
    return pets.find((pet) => String(pet.id) === String(selectedPetId)) || pets[0] || null;
  }, [pets, selectedPetId]);

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

  const getPetImageSrc = (pet) => {
    if (!pet) return null;
    if (pet?.photo_url) return pet.photo_url;
    if (pet?.photo_path) return `http://127.0.0.1:8000/storage/${pet.photo_path}`;
    if (pet?.photo) return `http://127.0.0.1:8000/storage/${pet.photo}`;
    return null;
  };

  const petCareContext = useMemo(() => {
    if (!selectedPet) return [];

    const items = [];
    if (selectedPet?.breed) items.push(`Breed: ${selectedPet.breed}`);
    if (selectedPet?.age) items.push(`Age: ${selectedPet.age} yrs`);
    if (selectedPet?.weight) items.push(`Weight: ${selectedPet.weight}kg`);
    if (selectedPet?.gender) items.push(`Gender: ${selectedPet.gender}`);
    if (selectedPet?.allergies) items.push(`Allergies: ${selectedPet.allergies}`);
    if (selectedPet?.health_conditions) items.push(`Conditions: ${selectedPet.health_conditions}`);
    if (selectedPet?.vaccination_status) items.push(`Vaccination: ${selectedPet.vaccination_status}`);

    return items;
  }, [selectedPet]);

  const handleSymptomToggle = (symptom) => {
    setIntakeForm((prev) => {
      const exists = prev.symptoms.includes(symptom);
      return {
        ...prev,
        symptoms: exists
          ? prev.symptoms.filter((item) => item !== symptom)
          : [...prev.symptoms, symptom],
      };
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setIntakeForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePetChange = (petId) => {
    setSelectedPetId(String(petId));
    setFormError("");
    setFormSuccess("");
    setChatError("");
    setAiSummary("");
    setAiGuidance([]);
    setEmergencyDetected(false);
    setChatMessages([]);
    setChatStarted(false);
    setChatStatus("idle");
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const detectEmergency = () => {
    const combinedText = `${intakeForm.concern} ${intakeForm.symptoms.join(" ")} ${chatInput}`.toLowerCase();
    return EMERGENCY_KEYWORDS.some((keyword) => combinedText.includes(keyword));
  };

  const buildAiSummary = () => {
    if (!selectedPet) return "";

    const petName = selectedPet?.name || "Your pet";
    const species = selectedPet?.species || "pet";
    const breed = selectedPet?.breed || "unknown breed";
    const age = selectedPet?.age ? `${selectedPet.age}-year-old` : "age not provided";
    const symptomText = intakeForm.symptoms.length
      ? intakeForm.symptoms.join(", ")
      : "no symptom tags selected";

    return `${petName} is a ${age} ${species}${breed ? ` (${breed})` : ""}. Main concern: ${
      intakeForm.concern || "not provided"
    }. Symptoms selected: ${symptomText}. Appetite: ${
      intakeForm.appetite || "not provided"
    }. Behaviour change: ${intakeForm.behaviour || "not provided"}. Duration: ${
      intakeForm.duration || "not provided"
    }. ${selectedFiles.length ? `The owner attached ${selectedFiles.length} image(s).` : "No images attached."}`;
  };

  const buildAiGuidance = (emergency) => {
    const guidance = [];

    if (emergency) {
      guidance.push("Possible urgent warning signs detected. Please contact an emergency vet clinic immediately.");
      guidance.push("Do not wait for chat advice if your pet is struggling to breathe, collapsing, bleeding heavily, or having a seizure.");
      return guidance;
    }

    if (intakeForm.symptoms.includes("Vomiting") || intakeForm.symptoms.includes("Diarrhoea")) {
      guidance.push("Monitor hydration closely and note how often the symptoms are happening.");
    }

    if (intakeForm.symptoms.includes("Not Eating")) {
      guidance.push("Track when your pet last ate and drank, and whether appetite is fully absent or just reduced.");
    }

    if (intakeForm.symptoms.includes("Itching") || intakeForm.symptoms.includes("Skin Rash")) {
      guidance.push("Avoid any new treats, shampoos, or skin products until the issue is reviewed.");
    }

    if (intakeForm.symptoms.includes("Limping")) {
      guidance.push("Limit exercise and watch for swelling, pain, or difficulty bearing weight.");
    }

    guidance.push("This AI assistant gives general guidance only and does not replace a licensed veterinarian.");

    return guidance;
  };

  const buildIntakeChatText = () => {
    const symptomText = intakeForm.symptoms.length
      ? intakeForm.symptoms.join(", ")
      : "None selected";

    return [
      `Concern: ${intakeForm.concern || "Not provided"}`,
      `Duration: ${intakeForm.duration || "Not provided"}`,
      `Appetite / drinking: ${intakeForm.appetite || "Not provided"}`,
      `Behaviour: ${intakeForm.behaviour || "Not provided"}`,
      `Symptoms: ${symptomText}`,
      `Images attached: ${selectedFiles.length ? `${selectedFiles.length}` : "0"}`,
    ].join("\n");
  };

  const buildInitialAiPrompt = () => {
    const symptomText = intakeForm.symptoms.length
      ? intakeForm.symptoms.join(", ")
      : "None selected";

    return `
Please respond to this intake and continue the conversation without asking me to repeat the same details again.

Pet name: ${selectedPet?.name || "Unknown"}
Species: ${selectedPet?.species || "Unknown"}
Breed: ${selectedPet?.breed || "Unknown"}
Age: ${selectedPet?.age || "Unknown"}
Weight: ${selectedPet?.weight || "Unknown"}
Concern: ${intakeForm.concern || "Not provided"}
Duration: ${intakeForm.duration || "Not provided"}
Appetite / drinking: ${intakeForm.appetite || "Not provided"}
Behaviour change: ${intakeForm.behaviour || "Not provided"}
Symptoms selected: ${symptomText}
Images attached: ${selectedFiles.length ? `${selectedFiles.length}` : "0"}

Please acknowledge these details, give your first guidance based on them, and then ask only useful follow-up questions.
    `.trim();
  };

  const addSystemMessage = (text) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sender: "system",
        senderLabel: "System",
        type: "text",
        text,
        time: new Date().toLocaleTimeString("en-IE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const addAiMessage = (text, label = assistantName) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sender: "ai",
        senderLabel: label,
        type: "text",
        text,
        time: new Date().toLocaleTimeString("en-IE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const addUserMessage = (text) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sender: "user",
        senderLabel: userName,
        type: "text",
        text,
        time: new Date().toLocaleTimeString("en-IE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const sendMessageToAi = async (messageText) => {
    const res = await fetch(`${apiBase}/premium/ai-vet-chat`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pet_id: selectedPet?.id,
        message: messageText,
        concern: intakeForm.concern,
        duration: intakeForm.duration,
        appetite: intakeForm.appetite,
        behaviour: intakeForm.behaviour,
        symptoms: intakeForm.symptoms,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "Failed to get AI response.");
    }

    if (data?.assistant_name) {
      setAssistantName(data.assistant_name);
    }

    return data;
  };

  const handleStartChat = async (e) => {
    e.preventDefault();

    setFormError("");
    setFormSuccess("");
    setChatError("");

    if (!isPremium) {
      setFormError("AI Vet Assistant is a premium feature. Please upgrade to continue.");
      return;
    }

    if (!selectedPet) {
      setFormError("Please select a pet first.");
      return;
    }

    if (!intakeForm.concern.trim()) {
      setFormError("Please describe the reason for concern.");
      return;
    }

    const emergency = detectEmergency();
    const summary = buildAiSummary();
    const guidance = buildAiGuidance(emergency);
    const intakeChatText = buildIntakeChatText();
    const initialAiPrompt = buildInitialAiPrompt();

    setEmergencyDetected(emergency);
    setAiSummary(summary);
    setAiGuidance(guidance);

    setChatStarted(true);
    setShowIntakeForm(false);
    setChatStatus("preparing");
    setFormSuccess("AI guidance session started.");
    setChatMessages([]);

    try {
      await wait(700);
      setChatStatus("summarising");

      await wait(700);
      setChatStatus("connected");

      const starterMessages = [
        {
          id: 1,
          sender: "system",
          senderLabel: "System",
          type: "text",
          text: "You are now chatting with Pawfection AI Vet Assistant.",
          time: new Date().toLocaleTimeString("en-IE", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ];

      if (intakeForm.useAiSummary && summary) {
        starterMessages.push({
          id: 2,
          sender: "ai",
          senderLabel: "Pawfection AI Vet Assistant",
          type: "text",
          text: `AI intake summary prepared:\n${summary}`,
          time: new Date().toLocaleTimeString("en-IE", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }

      starterMessages.push({
        id: 3,
        sender: "user",
        senderLabel: userName,
        type: "text",
        text: `Submitted intake details:\n${intakeChatText}`,
        time: new Date().toLocaleTimeString("en-IE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      starterMessages.push({
        id: 4,
        sender: "ai",
        senderLabel: "Pawfection AI Vet Assistant",
        type: "text",
        text: `Thanks, ${userName}. I’ve received the intake details for ${selectedPet?.name || "your pet"} and I’ll use them as the starting point for this conversation, so you do not need to repeat them.`,
        time: new Date().toLocaleTimeString("en-IE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      setChatMessages(starterMessages);

      setSendingMessage(true);

      try {
        const data = await sendMessageToAi(initialAiPrompt);
        addAiMessage(
          data?.reply ||
            "I’m sorry, I could not generate a response right now. Please try again."
        );
      } catch (error) {
        setChatError(error.message || "AI response could not be generated.");
        addSystemMessage("The AI assistant could not respond just now. Please try again.");
      } finally {
        setSendingMessage(false);
      }
    } catch {
      setChatStatus("idle");
      setChatStarted(false);
      setShowIntakeForm(true);
      setFormError("Could not start the AI chat session.");
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && selectedFiles.length === 0) return;

    if (chatStatus !== "connected") {
      setChatError("You can send messages once the AI session is active.");
      return;
    }

    setSendingMessage(true);
    setChatError("");

    const newMessages = [];

    if (chatInput.trim()) {
      newMessages.push({
        id: Date.now() + Math.random(),
        sender: "user",
        senderLabel: userName,
        type: "text",
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString("en-IE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }

    if (imagePreviews.length) {
      imagePreviews.forEach((preview, index) => {
        newMessages.push({
          id: Date.now() + Math.random() + index,
          sender: "user",
          senderLabel: userName,
          type: "image",
          imageUrl: preview,
          fileName: selectedFiles[index]?.name || "Uploaded image",
          time: new Date().toLocaleTimeString("en-IE", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      });
    }

    setChatMessages((prev) => [...prev, ...newMessages]);

    const sentText = chatInput.trim();
    const emergency = detectEmergency();

    if (emergency) {
      setEmergencyDetected(true);
    }

    setChatInput("");
    setSelectedFiles([]);
    setImagePreviews([]);

    try {
      if (sentText) {
        const data = await sendMessageToAi(sentText);
        addAiMessage(
          data?.reply ||
            "I’m sorry, I could not generate a response right now. Please try again."
        );
      } else if (newMessages.some((msg) => msg.type === "image")) {
        addAiMessage(
          "I can see that you uploaded image files in this chat session, but image analysis has not been connected yet. Please describe what the photo shows so I can help with general guidance."
        );
      }
    } catch (error) {
      setChatError(error.message || "AI response could not be generated.");
      addSystemMessage("The AI assistant could not respond just now. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEndSession = () => {
    const confirmed = window.confirm("End this AI guidance session?");
    if (!confirmed) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sender: "system",
        senderLabel: "System",
        type: "text",
        text: "This AI guidance session has ended.",
        time: new Date().toLocaleTimeString("en-IE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setChatStatus("idle");
    setChatStarted(false);
    setShowIntakeForm(true);
    setFormSuccess("Session ended. Transcript saving and rating can be added later.");
  };

  const statusMeta = useMemo(() => {
    switch (chatStatus) {
      case "preparing":
        return {
          label: "Preparing AI support",
          tone: "medium",
          text: "Reviewing pet profile and intake details.",
        };
      case "summarising":
        return {
          label: "Generating AI summary",
          tone: "warning",
          text: "Organising symptom context for a clearer response.",
        };
      case "connected":
        return {
          label: "AI session active",
          tone: "good",
          text: "You are chatting with Pawfection AI Vet Assistant.",
        };
      default:
        return {
          label: "Ready to start",
          tone: "medium",
          text: "Complete the intake form to begin.",
        };
    }
  }, [chatStatus]);

  if (!premiumChecked) {
    return <div className="pvc-loading-screen">Loading AI Vet Assistant...</div>;
  }

  return (
    <div className="pvc-shell">
      <header className="pvc-site-header">
        <div
          className="pvc-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img className="pvc-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pvc-brand-copy">
            <div className="pvc-brand-title">Pawfection</div>
            <div className="pvc-brand-sub">Premium AI Vet Assistant</div>
          </div>
        </div>

        <nav className="pvc-topnav">
          <Link className="pvc-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pvc-topnav-item" to="/premium-mypets">
            My Pet
          </Link>
          <Link className="pvc-topnav-item active" to="/premium/vet-chat">
            Vet Chat
          </Link>
          <Link className="pvc-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="pvc-topnav-item" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="pvc-topnav-item" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pvc-topnav-item" to="/premium/community">
            Community
          </Link>
          <Link className="pvc-topnav-item" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="pvc-header-side">
          <div className="pvc-date-pill">{todayText}</div>
          <div className="pvc-userchip">
            <div className="pvc-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
            <div>
              <div className="pvc-userchip-name">{userName}</div>
              <div className="pvc-userchip-sub">
                {isPremium ? "Premium User" : "Standard User"}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pvc-main">
        <section className="pvc-hero">
          <div className="pvc-hero-copy">
            <div className="pvc-kicker">Pawfection Premium AI Care Support</div>
            <h1 className="pvc-hero-title">
              {getGreeting()}, {userName}
            </h1>
            <p className="pvc-hero-text">
              Start an AI guidance session, organise symptoms with pet-aware context,
              and get general support in a clear and safe premium space.
            </p>

            <div className="pvc-selector-wrap">
              <label htmlFor="petSelect" className="pvc-selector-label">
                Select Pet
              </label>
              <select
                id="petSelect"
                className="pvc-selector"
                value={selectedPetId}
                onChange={(e) => handlePetChange(e.target.value)}
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

            <div className="pvc-hero-actions">
              <button
                className="pvc-btn pvc-btn-primary"
                type="button"
                onClick={() => setShowIntakeForm((prev) => !prev)}
              >
                {showIntakeForm ? "Hide Intake Form" : "Open Intake Form"}
              </button>

              <button
                className="pvc-btn"
                type="button"
                onClick={() =>
                  selectedPet ? navigate(`/pets/${selectedPet.id}/edit`) : null
                }
              >
                Edit Pet Profile
              </button>

              <button
                className="pvc-btn"
                type="button"
                onClick={() => navigate("/premium-dashboard")}
              >
                Back to Dashboard
              </button>
            </div>

            {formError && <div className="pvc-form-message pvc-form-error">{formError}</div>}
            {formSuccess && <div className="pvc-form-message pvc-form-success">{formSuccess}</div>}
          </div>

          <div className="pvc-hero-card">
            {loadingPets ? (
              <div className="pvc-photo-empty">Loading pet...</div>
            ) : petsError ? (
              <div className="pvc-photo-empty">{petsError}</div>
            ) : !selectedPet ? (
              <div className="pvc-photo-empty">No pet selected</div>
            ) : (
              <>
                <div className="pvc-hero-photo">
                  {getPetImageSrc(selectedPet) ? (
                    <img src={getPetImageSrc(selectedPet)} alt={selectedPet?.name || "Pet"} />
                  ) : (
                    <div className="pvc-photo-empty">🐾 Add a pet photo</div>
                  )}
                </div>

                <div className="pvc-hero-meta">
                  <div className={`pvc-premium-badge ${isPremium ? "" : "locked"}`}>
                    {isPremium ? "Premium Active" : "Premium Required"}
                  </div>
                  <h2>{selectedPet?.name || "Your Pet"}</h2>
                  <p>
                    {selectedPet?.breed || selectedPet?.species || "Pet profile"}
                    {selectedPet?.age ? ` • ${selectedPet.age} yrs` : ""}
                    {selectedPet?.weight ? ` • ${selectedPet.weight}kg` : ""}
                  </p>

                  <div className="pvc-stat-row">
                    <div className="pvc-stat-pill">{selectedPet?.species || "Pet"}</div>
                    <div className="pvc-stat-pill">
                      {selectedPet?.allergies ? "Allergies noted" : "No allergies added"}
                    </div>
                    <div className="pvc-stat-pill">{chatStarted ? statusMeta.label : "AI support ready"}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {!isPremium ? (
          <section className="pvc-locked-wrap">
            <article className="pvc-card pvc-card-wide pvc-locked-card">
              <div className="pvc-card-kicker">Premium Access Needed</div>
              <h3>AI Vet Assistant is only available for premium users</h3>
              <p className="pvc-locked-text">
                Upgrade to premium to access AI-assisted symptom summaries and pet-linked guidance support.
              </p>

              <div className="pvc-locked-actions">
                <button
                  className="pvc-btn pvc-btn-primary"
                  type="button"
                  onClick={() => navigate("/premium-dashboard")}
                >
                  View Premium Features
                </button>
                <button
                  className="pvc-btn"
                  type="button"
                  onClick={() => navigate("/premium/profile")}
                >
                  Manage Plan
                </button>
              </div>
            </article>
          </section>
        ) : (
          <>
            <section className="pvc-pet-details-wrap">
              <div className="pvc-card">
                <div className="pvc-card-kicker">Selected Pet Context</div>
                <h3>Pet care snapshot</h3>

                <div className="pvc-context-box">
                  <div><strong>Name:</strong> {selectedPet?.name || "—"}</div>
                  <div><strong>Species:</strong> {selectedPet?.species || "—"}</div>
                  <div><strong>Breed:</strong> {selectedPet?.breed || "—"}</div>
                  <div><strong>Age:</strong> {selectedPet?.age || "—"}</div>
                  <div><strong>Weight:</strong> {selectedPet?.weight || "—"}</div>
                  <div><strong>Allergies:</strong> {selectedPet?.allergies || "None recorded"}</div>
                  <div><strong>Conditions:</strong> {selectedPet?.health_conditions || "None recorded"}</div>
                  <div><strong>Vaccination:</strong> {selectedPet?.vaccination_status || "Not set"}</div>
                </div>
              </div>

              <aside className="pvc-card">
                <div className="pvc-card-kicker">Safety Notice</div>
                <h3>Emergency guidance</h3>

                <div className={`pvc-alert-item ${emergencyDetected ? "pvc-alert-warning" : "pvc-alert-good"}`}>
                  <div className="pvc-alert-title">
                    {emergencyDetected ? "Urgent symptoms flagged" : "No urgent flag detected"}
                  </div>
                  <div className="pvc-alert-text">
                    {emergencyDetected
                      ? "If your pet is collapsing, struggling to breathe, bleeding heavily, having a seizure, or may have been poisoned, contact an emergency vet immediately."
                      : "AI guidance is for organisation and general support only. It does not replace emergency or in-person veterinary care."}
                  </div>
                </div>

                <div className="pvc-quick-box">
                  <strong>AI ROLE</strong>
                  <span>Explains general next steps, organises symptoms, asks follow-up questions, and flags urgent warning signs.</span>
                </div>
              </aside>
            </section>

            <section className="pvc-grid">
              <article className="pvc-card pvc-card-wide">
                <div className="pvc-card-kicker">Consultation Intake</div>
                <h3>Start your AI guidance request</h3>

                {showIntakeForm && (
                  <form className="pvc-intake-form" onSubmit={handleStartChat}>
                    <div className="pvc-field">
                      <label>Reason for concern</label>
                      <textarea
                        name="concern"
                        rows="4"
                        value={intakeForm.concern}
                        onChange={handleInputChange}
                        placeholder="Describe what is happening with your pet..."
                        required
                      />
                    </div>

                    <div className="pvc-intake-grid">
                      <div className="pvc-field">
                        <label>How long has this been happening?</label>
                        <input
                          type="text"
                          name="duration"
                          value={intakeForm.duration}
                          onChange={handleInputChange}
                          placeholder="e.g. Since this morning"
                        />
                      </div>

                      <div className="pvc-field">
                        <label>Appetite / drinking</label>
                        <input
                          type="text"
                          name="appetite"
                          value={intakeForm.appetite}
                          onChange={handleInputChange}
                          placeholder="e.g. Eating less but drinking water"
                        />
                      </div>
                    </div>

                    <div className="pvc-field">
                      <label>Behaviour change</label>
                      <input
                        type="text"
                        name="behaviour"
                        value={intakeForm.behaviour}
                        onChange={handleInputChange}
                        placeholder="e.g. More sleepy, hiding, restless"
                      />
                    </div>

                    <div className="pvc-field">
                      <label>Quick symptom tags</label>
                      <div className="pvc-chip-wrap">
                        {SYMPTOM_OPTIONS.map((symptom) => (
                          <button
                            key={symptom}
                            type="button"
                            className={`pvc-chip ${intakeForm.symptoms.includes(symptom) ? "active" : ""}`}
                            onClick={() => handleSymptomToggle(symptom)}
                          >
                            {symptom}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pvc-field">
                      <label>Upload pictures</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                      />
                    </div>

                    {imagePreviews.length > 0 && (
                      <div className="pvc-preview-grid">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="pvc-preview-card">
                            <img src={preview} alt={`Preview ${index + 1}`} />
                            <span>{selectedFiles[index]?.name || `Image ${index + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="pvc-checkbox-row">
                      <input
                        type="checkbox"
                        name="useAiSummary"
                        checked={intakeForm.useAiSummary}
                        onChange={handleInputChange}
                      />
                      <span>Use AI to prepare an intake summary before the guidance session</span>
                    </label>

                    <div className="pvc-intake-actions">
                      <button className="pvc-btn pvc-btn-primary" type="submit">
                        Start AI Chat
                      </button>
                    </div>
                  </form>
                )}
              </article>

              <article className="pvc-card">
                <div className="pvc-card-kicker">AI Assistant</div>
                <h3>Consultation summary</h3>

                <div className="pvc-summary-top">
                  <div className={`pvc-summary-badge pvc-summary-${statusMeta.tone}`}>
                    {statusMeta.label}
                  </div>
                </div>

                <div className="pvc-ai-box">
                  <div className="pvc-ai-section">
                    <div className="pvc-ai-title">Summary</div>
                    <div className="pvc-ai-text">
                      {aiSummary || "AI summary will appear here after you submit the intake form."}
                    </div>
                  </div>

                  <div className="pvc-ai-section">
                    <div className="pvc-ai-title">Guidance</div>
                    {aiGuidance.length ? (
                      <div className="pvc-ai-list">
                        {aiGuidance.map((item, index) => (
                          <div key={index} className="pvc-ai-list-item">
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pvc-ai-text">
                        General support guidance will appear here once the AI reviews the concern.
                      </div>
                    )}
                  </div>

                  <div className="pvc-ai-disclaimer">
                    This is AI guidance only. It supports symptom organisation and general care guidance, not diagnosis or emergency treatment.
                  </div>
                </div>
              </article>

              <article className="pvc-card">
                <div className="pvc-card-kicker">Pet-Aware Context</div>
                <h3>Relevant profile details</h3>

                <div className="pvc-insight-list">
                  {petCareContext.length ? (
                    petCareContext.map((item, index) => (
                      <div key={index} className="pvc-insight-item">
                        <div className="pvc-insight-icon">🐾</div>
                        <div>
                          <div className="pvc-insight-title">Pet profile detail</div>
                          <div className="pvc-insight-text">{item}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pvc-empty">No extra pet care details available yet.</div>
                  )}
                </div>
              </article>

              <article className="pvc-card pvc-card-wide">
                <div className="pvc-card-kicker">AI Guidance Session</div>
                <h3>AI Pet Care Chat</h3>

                <div className="pvc-chat-shell">
                  <div className="pvc-chat-statusbar">
                    <div className={`pvc-status-pill pvc-status-${statusMeta.tone}`}>
                      {statusMeta.label}
                    </div>
                    <div className="pvc-status-text">{statusMeta.text}</div>
                  </div>

                  <div className="pvc-chat-window">
                    {!chatMessages.length ? (
                      <div className="pvc-chat-empty">
                        Complete the intake form to begin the AI guidance session.
                      </div>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`pvc-msg-row ${
                            message.sender === "user"
                              ? "user"
                              : message.sender === "system"
                              ? "system"
                              : ""
                          }`}
                        >
                          <div className={`pvc-msg-bubble pvc-msg-${message.sender}`}>
                            <div className="pvc-msg-meta">
                              <strong>{message.senderLabel}</strong>
                              <span>{message.time}</span>
                            </div>

                            {message.type === "image" ? (
                              <div className="pvc-msg-image-wrap">
                                <img src={message.imageUrl} alt={message.fileName || "Uploaded"} />
                                <div className="pvc-msg-image-name">{message.fileName}</div>
                              </div>
                            ) : (
                              <div className="pvc-msg-text" style={{ whiteSpace: "pre-wrap" }}>
                                {message.text}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {chatError && <div className="pvc-form-message pvc-form-error">{chatError}</div>}

                  <div className="pvc-chat-composer">
                    <textarea
                      rows="2"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={
                        chatStatus === "connected"
                          ? "Type your message to the AI assistant..."
                          : "You can send messages once the AI session is active..."
                      }
                    />

                    <div className="pvc-composer-actions">
                      <label className="pvc-upload-btn">
                        Add Image
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          hidden
                        />
                      </label>

                      <button
                        className="pvc-btn pvc-btn-primary pvc-btn-small"
                        type="button"
                        onClick={handleSendMessage}
                        disabled={sendingMessage || chatStatus !== "connected"}
                      >
                        {sendingMessage ? "Sending..." : "Send"}
                      </button>

                      <button
                        className="pvc-btn pvc-btn-small pvc-btn-danger"
                        type="button"
                        onClick={handleEndSession}
                        disabled={!chatStarted && chatStatus !== "connected"}
                      >
                        End Session
                      </button>
                    </div>

                    {imagePreviews.length > 0 && (
                      <div className="pvc-composer-preview-row">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="pvc-composer-preview">
                            <img src={preview} alt={`Upload ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  );
}