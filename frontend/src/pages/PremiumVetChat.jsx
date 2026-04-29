import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumVetChat.css";

const SUPPORT_MODES = [
  "Health & Symptoms",
  "Behaviour & Training",
  "Food & Nutrition",
  "Grooming & Care",
  "Routine & Reminders",
  "Appointment Prep",
  "Lost Pet Support",
  "New Pet Owner Help",
  "Travel & Planning",
  "Other",
];

const HEALTH_SYMPTOM_OPTIONS = [
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

const MODE_PROMPTS = {
  "Health & Symptoms": [
    "My pet has been vomiting since this morning",
    "My dog is limping after a walk",
    "My cat is scratching more than usual",
  ],
  "Behaviour & Training": [
    "My dog barks when guests arrive",
    "My puppy keeps chewing furniture",
    "My cat scratches the sofa",
  ],
  "Food & Nutrition": [
    "How should I change my pet’s food safely?",
    "Can you help me build a feeding routine?",
    "My pet is eating less than usual",
  ],
  "Grooming & Care": [
    "How often should I groom this breed?",
    "What home grooming routine is best?",
    "How can I make nail trimming easier?",
  ],
  "Routine & Reminders": [
    "Create a weekly care plan for my pet",
    "What reminders should I set each month?",
    "Help me build a daily routine",
  ],
  "Appointment Prep": [
    "Help me prepare for tomorrow’s vet visit",
    "What questions should I ask the groomer?",
    "Can you summarise my pet’s recent issues?",
  ],
  "Lost Pet Support": [
    "Help me write a lost pet alert",
    "What details should I include in a missing pet post?",
    "Create a description from my pet profile",
  ],
  "New Pet Owner Help": [
    "I just adopted a kitten, what should I do first?",
    "What should I buy for a new puppy?",
    "Can you make me a first-week checklist?",
  ],
  "Travel & Planning": [
    "What should I pack for travelling with my dog?",
    "How can I help my cat adjust to a new home?",
    "Create a travel checklist for my pet",
  ],
  Other: [
    "I need help with something else about my pet",
    "Can you guide me on a pet question not listed here?",
    "I’m not sure which support option fits my question",
  ],
};

const getDefaultIntakeForm = () => ({
  supportMode: "Health & Symptoms",

  concern: "",
  duration: "",
  appetite: "",
  behaviour: "",
  symptoms: [],
  useAiSummary: true,

  behaviourIssue: "",
  behaviourTrigger: "",
  behaviourFrequency: "",
  trainingGoal: "",

  currentFood: "",
  feedingSchedule: "",
  eatingChange: "",
  nutritionGoal: "",

  groomingNeed: "",
  groomingFrequency: "",
  coatSkinNotes: "",
  careGoal: "",

  routineGoal: "",
  currentRoutine: "",
  reminderNeeds: "",
  planningNotes: "",

  appointmentType: "",
  appointmentDate: "",
  appointmentGoal: "",
  appointmentQuestions: "",

  lastSeenLocation: "",
  lastSeenTime: "",
  petDescription: "",
  collarMicrochipInfo: "",

  newPetSituation: "",
  starterHelpNeeded: "",
  homeSetupStatus: "",

  travelType: "",
  destinationType: "",
  travelConcern: "",
  packingHelp: "",

  otherTopic: "",
  otherDetails: "",
});

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
  const [chatStatus, setChatStatus] = useState("idle");
  const [assistantName, setAssistantName] = useState("Pawfection AI Pet Assistant");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [chatError, setChatError] = useState("");

  const [intakeForm, setIntakeForm] = useState(getDefaultIntakeForm());

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [aiSummary, setAiSummary] = useState("");
  const [aiGuidance, setAiGuidance] = useState([]);
  const [emergencyDetected, setEmergencyDetected] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);

  const [ratingForm, setRatingForm] = useState({
    score: 0,
    feedback: "",
  });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState("");
  const [ratingError, setRatingError] = useState("");

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

  useEffect(() => {
    if (selectedPetId && isPremium) {
      fetchSessionHistory(selectedPetId);
    } else {
      setSessionHistory([]);
      setSelectedHistorySession(null);
    }
  }, [selectedPetId, isPremium]);

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

  const fetchSessionHistory = async (petId) => {
    if (!token || !petId) return;

    setLoadingHistory(true);
    setHistoryError("");

    try {
      const res = await fetch(`${apiBase}/premium/ai-vet-chat/sessions?pet_id=${petId}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSessionHistory([]);
        setHistoryError(data?.message || "Could not load AI assistant history.");
        return;
      }

      const sessions = Array.isArray(data) ? data : data?.sessions || [];
      setSessionHistory(sessions);
    } catch {
      setSessionHistory([]);
      setHistoryError("Could not load AI assistant history.");
    } finally {
      setLoadingHistory(false);
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
    if (selectedPet?.species) items.push(`Species: ${selectedPet.species}`);
    if (selectedPet?.age) items.push(`Age: ${selectedPet.age} yrs`);
    if (selectedPet?.weight) items.push(`Weight: ${selectedPet.weight}kg`);
    if (selectedPet?.gender) items.push(`Gender: ${selectedPet.gender}`);
    if (selectedPet?.allergies) items.push(`Allergies: ${selectedPet.allergies}`);
    if (selectedPet?.health_conditions) items.push(`Conditions: ${selectedPet.health_conditions}`);
    if (selectedPet?.vaccination_status) items.push(`Vaccination: ${selectedPet.vaccination_status}`);
    if (selectedPet?.eye_color) items.push(`Eye colour: ${selectedPet.eye_color}`);
    if (selectedPet?.fur_type) items.push(`Fur type: ${selectedPet.fur_type}`);
    if (selectedPet?.markings) items.push(`Markings: ${selectedPet.markings}`);
    if (selectedPet?.microchip_number) items.push(`Microchip: ${selectedPet.microchip_number}`);
    if (selectedPet?.notes) items.push(`Notes: ${selectedPet.notes}`);

    return items;
  }, [selectedPet]);

  const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const handleSupportModeChange = (mode) => {
    setIntakeForm((prev) => ({
      ...prev,
      supportMode: mode,
      symptoms: mode === "Health & Symptoms" ? prev.symptoms : [],
    }));
    setFormError("");
    setFormSuccess("");
    setChatError("");
    setAiSummary("");
    setAiGuidance([]);
    setEmergencyDetected(false);
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
    setActiveSessionId(null);
    setSessionStartedAt(null);
    setSessionEnded(false);
    setSelectedHistorySession(null);
    setRatingForm({ score: 0, feedback: "" });
    setRatingSuccess("");
    setRatingError("");
    setIntakeForm(getDefaultIntakeForm());
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const detectEmergency = () => {
    if (intakeForm.supportMode !== "Health & Symptoms") return false;

    const combinedText = `${intakeForm.concern} ${intakeForm.symptoms.join(" ")} ${chatInput}`.toLowerCase();
    return EMERGENCY_KEYWORDS.some((keyword) => combinedText.includes(keyword));
  };

  const buildPetProfileText = () => {
    if (!selectedPet) return "No pet selected.";

    const sections = [
      `Name: ${selectedPet?.name || "Unknown"}`,
      `Species: ${selectedPet?.species || "Unknown"}`,
      `Breed: ${selectedPet?.breed || "Unknown"}`,
      `DOB: ${selectedPet?.dob || "Unknown"}`,
      `Age: ${selectedPet?.age || "Unknown"}`,
      `Gender: ${selectedPet?.gender || "Unknown"}`,
      `Weight: ${selectedPet?.weight || "Unknown"}`,
      `Eye colour: ${selectedPet?.eye_color || "Unknown"}`,
      `Fur type: ${selectedPet?.fur_type || "Unknown"}`,
      `Markings: ${selectedPet?.markings || "Unknown"}`,
      `Allergies: ${selectedPet?.allergies || "None recorded"}`,
      `Health conditions: ${selectedPet?.health_conditions || "None recorded"}`,
      `Vaccination status: ${selectedPet?.vaccination_status || "Not recorded"}`,
      `Vaccination history: ${selectedPet?.vaccination_history || "Not recorded"}`,
      `Microchip number: ${selectedPet?.microchip_number || "Not recorded"}`,
      `Last vaccination date: ${selectedPet?.last_vaccination_date || "Not recorded"}`,
      `Vaccine interval days: ${selectedPet?.vaccine_interval_days || "Not recorded"}`,
      `Last grooming date: ${selectedPet?.last_grooming_date || "Not recorded"}`,
      `Grooming interval days: ${selectedPet?.grooming_interval_days || "Not recorded"}`,
      `General notes: ${selectedPet?.notes || "None recorded"}`,
    ];

    return sections.join("\n");
  };

  const buildModeSpecificSummary = () => {
    const mode = intakeForm.supportMode;

    switch (mode) {
      case "Health & Symptoms":
        return [
          `Support mode: ${mode}`,
          `Reason for concern: ${intakeForm.concern || "Not provided"}`,
          `Duration: ${intakeForm.duration || "Not provided"}`,
          `Appetite / drinking: ${intakeForm.appetite || "Not provided"}`,
          `Behaviour change: ${intakeForm.behaviour || "Not provided"}`,
          `Symptoms: ${intakeForm.symptoms.length ? intakeForm.symptoms.join(", ") : "None selected"}`,
        ].join("\n");

      case "Behaviour & Training":
        return [
          `Support mode: ${mode}`,
          `Behaviour issue: ${intakeForm.behaviourIssue || "Not provided"}`,
          `Trigger: ${intakeForm.behaviourTrigger || "Not provided"}`,
          `Frequency: ${intakeForm.behaviourFrequency || "Not provided"}`,
          `Training goal: ${intakeForm.trainingGoal || "Not provided"}`,
        ].join("\n");

      case "Food & Nutrition":
        return [
          `Support mode: ${mode}`,
          `Current food: ${intakeForm.currentFood || "Not provided"}`,
          `Feeding schedule: ${intakeForm.feedingSchedule || "Not provided"}`,
          `Eating change: ${intakeForm.eatingChange || "Not provided"}`,
          `Nutrition goal: ${intakeForm.nutritionGoal || "Not provided"}`,
        ].join("\n");

      case "Grooming & Care":
        return [
          `Support mode: ${mode}`,
          `Grooming need: ${intakeForm.groomingNeed || "Not provided"}`,
          `Current grooming frequency: ${intakeForm.groomingFrequency || "Not provided"}`,
          `Coat / skin notes: ${intakeForm.coatSkinNotes || "Not provided"}`,
          `Care goal: ${intakeForm.careGoal || "Not provided"}`,
        ].join("\n");

      case "Routine & Reminders":
        return [
          `Support mode: ${mode}`,
          `Routine goal: ${intakeForm.routineGoal || "Not provided"}`,
          `Current routine: ${intakeForm.currentRoutine || "Not provided"}`,
          `Reminder needs: ${intakeForm.reminderNeeds || "Not provided"}`,
          `Planning notes: ${intakeForm.planningNotes || "Not provided"}`,
        ].join("\n");

      case "Appointment Prep":
        return [
          `Support mode: ${mode}`,
          `Appointment type: ${intakeForm.appointmentType || "Not provided"}`,
          `Appointment date: ${intakeForm.appointmentDate || "Not provided"}`,
          `Appointment goal: ${intakeForm.appointmentGoal || "Not provided"}`,
          `Questions to prepare: ${intakeForm.appointmentQuestions || "Not provided"}`,
        ].join("\n");

      case "Lost Pet Support":
        return [
          `Support mode: ${mode}`,
          `Last seen location: ${intakeForm.lastSeenLocation || "Not provided"}`,
          `Last seen time: ${intakeForm.lastSeenTime || "Not provided"}`,
          `Pet description: ${intakeForm.petDescription || "Not provided"}`,
          `Collar / microchip info: ${intakeForm.collarMicrochipInfo || "Not provided"}`,
        ].join("\n");

      case "New Pet Owner Help":
        return [
          `Support mode: ${mode}`,
          `Situation: ${intakeForm.newPetSituation || "Not provided"}`,
          `Help needed: ${intakeForm.starterHelpNeeded || "Not provided"}`,
          `Home setup status: ${intakeForm.homeSetupStatus || "Not provided"}`,
        ].join("\n");

      case "Travel & Planning":
        return [
          `Support mode: ${mode}`,
          `Travel type: ${intakeForm.travelType || "Not provided"}`,
          `Destination type: ${intakeForm.destinationType || "Not provided"}`,
          `Travel concern: ${intakeForm.travelConcern || "Not provided"}`,
          `Packing help: ${intakeForm.packingHelp || "Not provided"}`,
        ].join("\n");

      case "Other":
        return [
          `Support mode: ${mode}`,
          `Topic: ${intakeForm.otherTopic || "Not provided"}`,
          `Details: ${intakeForm.otherDetails || "Not provided"}`,
        ].join("\n");

      default:
        return `Support mode: ${mode}`;
    }
  };

  const buildAiSummary = () => {
    if (!selectedPet) return "";

    const petName = selectedPet?.name || "Your pet";
    const species = selectedPet?.species || "pet";
    const breed = selectedPet?.breed || "unknown breed";
    const age = selectedPet?.age ? `${selectedPet.age}-year-old` : "age not provided";

    return `${petName} is a ${age} ${species}${breed ? ` (${breed})` : ""}. ${
      buildModeSpecificSummary()
    }. ${selectedFiles.length ? `The owner attached ${selectedFiles.length} image(s).` : "No images attached."}`;
  };

  const buildAiGuidance = (emergency) => {
    const mode = intakeForm.supportMode;
    const guidance = [];

    if (mode === "Health & Symptoms" && emergency) {
      guidance.push("Possible urgent warning signs detected. Please contact an emergency vet clinic immediately.");
      guidance.push("Do not wait for chat advice if your pet is struggling to breathe, collapsing, bleeding heavily, or having a seizure.");
      return guidance;
    }

    switch (mode) {
      case "Health & Symptoms":
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
        guidance.push("The AI can organise symptoms and suggest next questions, but it does not diagnose.");
        break;

      case "Behaviour & Training":
        guidance.push("The AI can help identify triggers, patterns, and gentle next-step training ideas.");
        guidance.push("Consistency, routine, and tracking when the behaviour happens can make support more useful.");
        break;

      case "Food & Nutrition":
        guidance.push("The AI can help organise feeding routines, transitions, and food-related questions using your pet profile.");
        guidance.push("Major diet changes should still be checked with a qualified vet when needed.");
        break;

      case "Grooming & Care":
        guidance.push("The AI can suggest care routines, grooming schedules, and home care questions based on breed and coat details.");
        break;

      case "Routine & Reminders":
        guidance.push("The AI can help create a daily, weekly, or monthly care plan using your pet’s saved details.");
        break;

      case "Appointment Prep":
        guidance.push("The AI can help prepare summaries, organise questions, and make appointments more productive.");
        break;

      case "Lost Pet Support":
        guidance.push("The AI can help draft clear missing pet alerts and organise key identifying details from your pet profile.");
        break;

      case "New Pet Owner Help":
        guidance.push("The AI can help with first-week checklists, home setup ideas, and basic care guidance.");
        break;

      case "Travel & Planning":
        guidance.push("The AI can help plan travel checklists, packing lists, and transition support for your pet.");
        break;

      case "Other":
        guidance.push("The AI can still help with broader pet-related questions even if they do not fit the main categories.");
        guidance.push("Use this option for general pet support, unusual requests, or anything not covered elsewhere.");
        break;

      default:
        guidance.push("The AI will use your pet’s profile and the intake details to guide the chat.");
        break;
    }

    guidance.push("This AI assistant gives general support only and does not replace a licensed veterinarian or emergency service.");
    return guidance;
  };

  const buildIntakeChatText = () => {
    return buildModeSpecificSummary() + `\nImages attached: ${selectedFiles.length ? `${selectedFiles.length}` : "0"}`;
  };

  const buildInitialAiPrompt = () => {
    const petProfileText = buildPetProfileText();
    const modeSummary = buildModeSpecificSummary();

    return `
You are Pawfection AI Pet Assistant.

Please respond to this support request and continue the conversation without asking the user to repeat the same details again.

The selected support mode is: ${intakeForm.supportMode}

Use the pet profile below as existing context. The pet profile details are already known and should be considered throughout the conversation.

PET PROFILE:
${petProfileText}

USER REQUEST DETAILS:
${modeSummary}

Images attached: ${selectedFiles.length ? `${selectedFiles.length}` : "0"}

Instructions:
- Acknowledge the user's selected support mode.
- Use the pet's saved profile details naturally in your response.
- Give practical, helpful first guidance.
- Ask only useful follow-up questions.
- If the support mode is Health & Symptoms, do not diagnose and mention when in-person veterinary care may be needed.
- If urgent warning signs appear in health mode, advise emergency vet care clearly.
- For non-health modes, provide structured and supportive guidance relevant to the chosen topic.
- If the mode is Other, help the user as broadly as possible with their pet-related question and clarify the request gently if needed.
    `.trim();
  };

  const buildTranscriptPayload = (messages) => {
    return messages.map((msg) => ({
      sender: msg.sender,
      sender_label: msg.senderLabel,
      type: msg.type,
      text: msg.text || null,
      image_url: msg.imageUrl || null,
      file_name: msg.fileName || null,
      time: msg.time,
    }));
  };

  const createSessionRecord = async ({ intakeSummary, guidance, initialTranscript }) => {
    const res = await fetch(`${apiBase}/premium/ai-vet-chat/sessions`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pet_id: selectedPet?.id,
        intake_summary: intakeSummary,
        support_mode: intakeForm.supportMode,
        concern: intakeForm.concern,
        duration: intakeForm.duration,
        appetite: intakeForm.appetite,
        behaviour: intakeForm.behaviour,
        symptoms: intakeForm.symptoms,
        guidance,
        transcript: initialTranscript,
        started_at: new Date().toISOString(),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "Could not create AI assistant session.");
    }

    return data;
  };

  const syncTranscriptToSession = async (sessionId, messages) => {
    if (!sessionId) return;

    try {
      await fetch(`${apiBase}/premium/ai-vet-chat/sessions/${sessionId}/transcript`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transcript: buildTranscriptPayload(messages),
        }),
      });
    } catch {
      // silent fail
    }
  };

  const endSessionRecord = async (sessionId, messages) => {
    const res = await fetch(`${apiBase}/premium/ai-vet-chat/sessions/${sessionId}/end`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ended_at: new Date().toISOString(),
        transcript: buildTranscriptPayload(messages),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "Could not end the AI assistant session.");
    }

    return data;
  };

  const submitSessionRating = async () => {
    if (!activeSessionId) {
      setRatingError("No ended session found to rate.");
      return;
    }

    if (!ratingForm.score) {
      setRatingError("Please choose a rating before submitting.");
      return;
    }

    setSubmittingRating(true);
    setRatingError("");
    setRatingSuccess("");

    try {
      const res = await fetch(`${apiBase}/premium/ai-vet-chat/sessions/${activeSessionId}/rating`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: ratingForm.score,
          feedback: ratingForm.feedback,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Could not save your session rating.");
      }

      setRatingSuccess("Thank you. Your session rating has been saved.");
      fetchSessionHistory(selectedPetId);
    } catch (error) {
      setRatingError(error.message || "Could not save your session rating.");
    } finally {
      setSubmittingRating(false);
    }
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
        session_id: activeSessionId,
        support_mode: intakeForm.supportMode,
        pet_profile_context: buildPetProfileText(),
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

  const validateBeforeStart = () => {
    if (!isPremium) return "AI Pet Assistant is a premium feature. Please upgrade to continue.";
    if (!selectedPet) return "Please select a pet first.";

    switch (intakeForm.supportMode) {
      case "Health & Symptoms":
        if (!intakeForm.concern.trim()) return "Please describe the reason for concern.";
        return "";

      case "Behaviour & Training":
        if (!intakeForm.behaviourIssue.trim()) return "Please describe the behaviour issue.";
        return "";

      case "Food & Nutrition":
        if (!intakeForm.currentFood.trim() && !intakeForm.nutritionGoal.trim()) {
          return "Please add current food details or a nutrition goal.";
        }
        return "";

      case "Grooming & Care":
        if (!intakeForm.groomingNeed.trim()) return "Please describe the grooming or care need.";
        return "";

      case "Routine & Reminders":
        if (!intakeForm.routineGoal.trim()) return "Please describe the routine goal.";
        return "";

      case "Appointment Prep":
        if (!intakeForm.appointmentType.trim() && !intakeForm.appointmentGoal.trim()) {
          return "Please add the appointment type or goal.";
        }
        return "";

      case "Lost Pet Support":
        if (!intakeForm.lastSeenLocation.trim() && !intakeForm.petDescription.trim()) {
          return "Please add the last seen location or pet description.";
        }
        return "";

      case "New Pet Owner Help":
        if (!intakeForm.newPetSituation.trim()) return "Please describe your new pet situation.";
        return "";

      case "Travel & Planning":
        if (!intakeForm.travelConcern.trim() && !intakeForm.travelType.trim()) {
          return "Please describe the trip or travel concern.";
        }
        return "";

      case "Other":
        if (!intakeForm.otherTopic.trim() && !intakeForm.otherDetails.trim()) {
          return "Please describe what you need help with.";
        }
        return "";

      default:
        return "";
    }
  };

  const handleStartChat = async (e) => {
    e.preventDefault();

    setFormError("");
    setFormSuccess("");
    setChatError("");
    setRatingSuccess("");
    setRatingError("");
    setSelectedHistorySession(null);

    const validationError = validateBeforeStart();
    if (validationError) {
      setFormError(validationError);
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
    setFormSuccess("AI Pet Assistant session started.");
    setChatMessages([]);
    setSessionEnded(false);
    setRatingForm({ score: 0, feedback: "" });

    try {
      await wait(700);
      setChatStatus("summarising");

      await wait(700);
      setChatStatus("connected");

      const nowTime = new Date().toLocaleTimeString("en-IE", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const starterMessages = [
        {
          id: 1,
          sender: "system",
          senderLabel: "System",
          type: "text",
          text: "You are now chatting with Pawfection AI Pet Assistant.",
          time: nowTime,
        },
        {
          id: 2,
          sender: "ai",
          senderLabel: "Pawfection AI Pet Assistant",
          type: "text",
          text: `Selected support mode: ${intakeForm.supportMode}`,
          time: nowTime,
        },
      ];

      if (intakeForm.useAiSummary && summary) {
        starterMessages.push({
          id: 3,
          sender: "ai",
          senderLabel: "Pawfection AI Pet Assistant",
          type: "text",
          text: `AI intake summary prepared:\n${summary}`,
          time: nowTime,
        });
      }

      starterMessages.push({
        id: 4,
        sender: "user",
        senderLabel: userName,
        type: "text",
        text: `Submitted intake details:\n${intakeChatText}`,
        time: nowTime,
      });

      starterMessages.push({
        id: 5,
        sender: "ai",
        senderLabel: "Pawfection AI Pet Assistant",
        type: "text",
        text: `Thanks, ${userName}. I’ve received the support request for ${selectedPet?.name || "your pet"} and I’ll use the saved pet profile as context, so you do not need to repeat those details again.`,
        time: nowTime,
      });

      setChatMessages(starterMessages);
      setSessionStartedAt(new Date().toISOString());

      try {
        const sessionData = await createSessionRecord({
          intakeSummary: summary,
          guidance,
          initialTranscript: buildTranscriptPayload(starterMessages),
        });

        setActiveSessionId(sessionData?.session?.id || sessionData?.id || null);
      } catch (error) {
        setFormError(error.message || "Session could not be saved yet.");
      }

      setSendingMessage(true);

      try {
        const data = await sendMessageToAi(initialAiPrompt);
        const aiReply =
          data?.reply || "I’m sorry, I could not generate a response right now. Please try again.";

        setChatMessages((prev) => {
          const updated = [
            ...prev,
            {
              id: Date.now() + Math.random(),
              sender: "ai",
              senderLabel: data?.assistant_name || assistantName,
              type: "text",
              text: aiReply,
              time: new Date().toLocaleTimeString("en-IE", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ];

          if (activeSessionId || data?.session_id) {
            syncTranscriptToSession(activeSessionId || data?.session_id, updated);
          }

          return updated;
        });

        if (data?.session_id && !activeSessionId) {
          setActiveSessionId(data.session_id);
        }
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
      setFormError("Could not start the AI Pet Assistant session.");
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && selectedFiles.length === 0) return;

    if (chatStatus !== "connected" || sessionEnded) {
      setChatError("This session is read-only now. Start a new AI Pet Assistant session to send more messages.");
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

    const updatedAfterUser = [...chatMessages, ...newMessages];
    setChatMessages(updatedAfterUser);

    const sentText = chatInput.trim();
    const emergency = detectEmergency();

    if (emergency) {
      setEmergencyDetected(true);
    }

    setChatInput("");
    setSelectedFiles([]);
    setImagePreviews([]);

    try {
      if (activeSessionId) {
        syncTranscriptToSession(activeSessionId, updatedAfterUser);
      }

      if (sentText) {
        const data = await sendMessageToAi(sentText);

        const aiMessage = {
          id: Date.now() + Math.random(),
          sender: "ai",
          senderLabel: data?.assistant_name || assistantName,
          type: "text",
          text:
            data?.reply ||
            "I’m sorry, I could not generate a response right now. Please try again.",
          time: new Date().toLocaleTimeString("en-IE", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        const updatedWithReply = [...updatedAfterUser, aiMessage];
        setChatMessages(updatedWithReply);

        if (activeSessionId || data?.session_id) {
          syncTranscriptToSession(activeSessionId || data?.session_id, updatedWithReply);
        }

        if (data?.session_id && !activeSessionId) {
          setActiveSessionId(data.session_id);
        }
      } else if (newMessages.some((msg) => msg.type === "image")) {
        const aiMessage = {
          id: Date.now() + Math.random(),
          sender: "ai",
          senderLabel: assistantName,
          type: "text",
          text:
            "I can see that you uploaded image files in this chat session, but image analysis has not been connected yet. Please describe what the photo shows so I can help with general guidance.",
          time: new Date().toLocaleTimeString("en-IE", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        const updatedWithReply = [...updatedAfterUser, aiMessage];
        setChatMessages(updatedWithReply);

        if (activeSessionId) {
          syncTranscriptToSession(activeSessionId, updatedWithReply);
        }
      }
    } catch (error) {
      setChatError(error.message || "AI response could not be generated.");
      addSystemMessage("The AI assistant could not respond just now. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEndSession = async () => {
    const confirmed = window.confirm("End this AI Pet Assistant session?");
    if (!confirmed) return;

    const finalMessage = {
      id: Date.now() + Math.random(),
      sender: "system",
      senderLabel: "System",
      type: "text",
      text: "This AI Pet Assistant session has ended.",
      time: new Date().toLocaleTimeString("en-IE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const finalTranscript = [...chatMessages, finalMessage];
    setChatMessages(finalTranscript);

    try {
      if (activeSessionId) {
        await endSessionRecord(activeSessionId, finalTranscript);
      }

      setChatStatus("ended");
      setChatStarted(false);
      setShowIntakeForm(true);
      setSessionEnded(true);
      setFormSuccess("Session ended. You can now rate it and review it in history.");
      fetchSessionHistory(selectedPetId);
    } catch (error) {
      setChatError(error.message || "Could not end the session properly.");
    }
  };

  const handleOpenHistorySession = (session) => {
    setSelectedHistorySession(session);
    setShowIntakeForm(false);
    setChatStarted(false);
    setChatStatus("ended");
    setSessionEnded(true);
    setActiveSessionId(session?.id || null);
    setAiSummary(session?.intake_summary || "");
    setAiGuidance(Array.isArray(session?.guidance) ? session.guidance : []);
    setChatMessages(
      Array.isArray(session?.transcript)
        ? session.transcript.map((msg, index) => ({
            id: msg?.id || `${session?.id || "history"}-${index}`,
            sender: msg?.sender || "system",
            senderLabel: msg?.sender_label || msg?.senderLabel || "System",
            type: msg?.type || "text",
            text: msg?.text || "",
            imageUrl: msg?.image_url || msg?.imageUrl || "",
            fileName: msg?.file_name || msg?.fileName || "",
            time: msg?.time || "",
          }))
        : []
    );
    setRatingForm({
      score: session?.rating || 0,
      feedback: session?.feedback || "",
    });
    setRatingSuccess("");
    setRatingError("");
  };

  const handleStartNewSessionView = () => {
    setSelectedHistorySession(null);
    setChatMessages([]);
    setAiSummary("");
    setAiGuidance([]);
    setEmergencyDetected(false);
    setChatStarted(false);
    setChatStatus("idle");
    setSessionEnded(false);
    setActiveSessionId(null);
    setSessionStartedAt(null);
    setShowIntakeForm(true);
    setRatingForm({ score: 0, feedback: "" });
    setRatingSuccess("");
    setRatingError("");
    setIntakeForm(getDefaultIntakeForm());
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
          text: "Organising pet context for a clearer response.",
        };
      case "connected":
        return {
          label: "AI assistant active",
          tone: "good",
          text: "You are chatting with Pawfection AI Pet Assistant.",
        };
      case "ended":
        return {
          label: "Session ended",
          tone: "medium",
          text: "This saved transcript is now read-only.",
        };
      default:
        return {
          label: "Ready to start",
          tone: "medium",
          text: "Choose a support mode and complete the form to begin.",
        };
    }
  }, [chatStatus]);

  const currentModePrompts = MODE_PROMPTS[intakeForm.supportMode] || [];

  if (!premiumChecked) {
    return <div className="pvc-loading-screen">Loading AI Pet Assistant...</div>;
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
            <div className="pvc-brand-sub">AI Pet Assistant</div>
          </div>
        </div>

        <nav className="pvc-topnav">
          <Link className="pvc-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pvc-topnav-item" to="/premium-mypets">
            My Pet
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
          <Link className="pvc-topnav-item" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="pvc-topnav-item active" to="/premium/vet-chat">
            AI Pet Assistant
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
            <div className="pvc-kicker">Pawfection Premium AI Support</div>
            <h1 className="pvc-hero-title">
              {getGreeting()}, {userName}
            </h1>
            <p className="pvc-hero-text">
              Get AI support for health, behaviour, feeding, grooming, routines,
              appointment prep, lost pet help, travel planning, new pet owner guidance,
              and anything else pet-related in one premium space.
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

              <button className="pvc-btn" type="button" onClick={handleStartNewSessionView}>
                New AI Session
              </button>

              <button
                className="pvc-btn"
                type="button"
                onClick={() => (selectedPet ? navigate(`/pets/${selectedPet.id}/edit`) : null)}
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
                    <div className="pvc-stat-pill">{statusMeta.label}</div>
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
              <h3>AI Pet Assistant is only available for premium users</h3>
              <p className="pvc-locked-text">
                Upgrade to premium to access AI-assisted summaries, pet-linked transcripts,
                session history, daily pet support tools, and post-session ratings.
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
                <h3>Pet profile snapshot</h3>

                <div className="pvc-context-box">
                  <div><strong>Name:</strong> {selectedPet?.name || "—"}</div>
                  <div><strong>Species:</strong> {selectedPet?.species || "—"}</div>
                  <div><strong>Breed:</strong> {selectedPet?.breed || "—"}</div>
                  <div><strong>Age:</strong> {selectedPet?.age || "—"}</div>
                  <div><strong>Weight:</strong> {selectedPet?.weight || "—"}</div>
                  <div><strong>Gender:</strong> {selectedPet?.gender || "—"}</div>
                  <div><strong>Allergies:</strong> {selectedPet?.allergies || "None recorded"}</div>
                  <div><strong>Conditions:</strong> {selectedPet?.health_conditions || "None recorded"}</div>
                  <div><strong>Vaccination:</strong> {selectedPet?.vaccination_status || "Not set"}</div>
                  <div><strong>Microchip:</strong> {selectedPet?.microchip_number || "Not recorded"}</div>
                  <div><strong>Notes:</strong> {selectedPet?.notes || "None recorded"}</div>
                </div>
              </div>

              <aside className="pvc-card">
                <div className="pvc-card-kicker">AI Assistant Overview</div>
                <h3>What it can help with</h3>

                <div className={`pvc-alert-item ${emergencyDetected ? "pvc-alert-warning" : "pvc-alert-good"}`}>
                  <div className="pvc-alert-title">
                    {emergencyDetected ? "Urgent symptoms flagged" : "Multi-purpose AI support"}
                  </div>
                  <div className="pvc-alert-text">
                    {emergencyDetected
                      ? "If your pet is collapsing, struggling to breathe, bleeding heavily, having a seizure, or may have been poisoned, contact an emergency vet immediately."
                      : "This assistant can support health questions, behaviour, training, feeding, grooming, routines, appointment prep, lost pet help, travel planning, new owner guidance, and other pet-related questions."}
                  </div>
                </div>

                <div className="pvc-quick-box">
                  <strong>AI ROLE</strong>
                  <span>
                    Uses your pet’s saved profile as context, organises details, gives general support,
                    suggests next steps, and helps you prepare better questions and plans.
                  </span>
                </div>
              </aside>
            </section>

            <section className="pvc-grid">
              <article className="pvc-card pvc-card-wide">
                <div className="pvc-card-kicker">Support Mode</div>
                <h3>Choose what you need help with</h3>

                <div className="pvc-chip-wrap" style={{ marginTop: "12px" }}>
                  {SUPPORT_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`pvc-chip ${intakeForm.supportMode === mode ? "active" : ""}`}
                      onClick={() => handleSupportModeChange(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="pvc-ai-box" style={{ marginTop: "16px" }}>
                  <div className="pvc-ai-section">
                    <div className="pvc-ai-title">Suggested prompts</div>
                    <div className="pvc-ai-list">
                      {currentModePrompts.map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          className="pvc-ai-list-item"
                          onClick={() => {
                            if (intakeForm.supportMode === "Health & Symptoms") {
                              setIntakeForm((prev) => ({ ...prev, concern: item }));
                            } else if (intakeForm.supportMode === "Behaviour & Training") {
                              setIntakeForm((prev) => ({ ...prev, behaviourIssue: item }));
                            } else if (intakeForm.supportMode === "Food & Nutrition") {
                              setIntakeForm((prev) => ({ ...prev, nutritionGoal: item }));
                            } else if (intakeForm.supportMode === "Grooming & Care") {
                              setIntakeForm((prev) => ({ ...prev, groomingNeed: item }));
                            } else if (intakeForm.supportMode === "Routine & Reminders") {
                              setIntakeForm((prev) => ({ ...prev, routineGoal: item }));
                            } else if (intakeForm.supportMode === "Appointment Prep") {
                              setIntakeForm((prev) => ({ ...prev, appointmentGoal: item }));
                            } else if (intakeForm.supportMode === "Lost Pet Support") {
                              setIntakeForm((prev) => ({ ...prev, petDescription: item }));
                            } else if (intakeForm.supportMode === "New Pet Owner Help") {
                              setIntakeForm((prev) => ({ ...prev, newPetSituation: item }));
                            } else if (intakeForm.supportMode === "Travel & Planning") {
                              setIntakeForm((prev) => ({ ...prev, travelConcern: item }));
                            } else if (intakeForm.supportMode === "Other") {
                              setIntakeForm((prev) => ({ ...prev, otherDetails: item }));
                            }
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              <article className="pvc-card pvc-card-wide">
                <div className="pvc-card-kicker">Consultation Intake</div>
                <h3>Start your AI Pet Assistant request</h3>

                {showIntakeForm && !sessionEnded && (
                  <form className="pvc-intake-form" onSubmit={handleStartChat}>
                    <div className="pvc-field">
                      <label>Selected support mode</label>
                      <input type="text" value={intakeForm.supportMode} readOnly />
                    </div>

                    {intakeForm.supportMode === "Health & Symptoms" && (
                      <>
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
                            {HEALTH_SYMPTOM_OPTIONS.map((symptom) => (
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
                      </>
                    )}

                    {intakeForm.supportMode === "Behaviour & Training" && (
                      <>
                        <div className="pvc-field">
                          <label>Behaviour issue</label>
                          <textarea
                            name="behaviourIssue"
                            rows="4"
                            value={intakeForm.behaviourIssue}
                            onChange={handleInputChange}
                            placeholder="Describe the behaviour you want help with..."
                          />
                        </div>

                        <div className="pvc-intake-grid">
                          <div className="pvc-field">
                            <label>When does it happen?</label>
                            <input
                              type="text"
                              name="behaviourTrigger"
                              value={intakeForm.behaviourTrigger}
                              onChange={handleInputChange}
                              placeholder="e.g. When visitors arrive"
                            />
                          </div>
                          <div className="pvc-field">
                            <label>How often?</label>
                            <input
                              type="text"
                              name="behaviourFrequency"
                              value={intakeForm.behaviourFrequency}
                              onChange={handleInputChange}
                              placeholder="e.g. Daily, every evening"
                            />
                          </div>
                        </div>

                        <div className="pvc-field">
                          <label>Training goal</label>
                          <input
                            type="text"
                            name="trainingGoal"
                            value={intakeForm.trainingGoal}
                            onChange={handleInputChange}
                            placeholder="e.g. Calm greeting routine"
                          />
                        </div>
                      </>
                    )}

                    {intakeForm.supportMode === "Food & Nutrition" && (
                      <>
                        <div className="pvc-field">
                          <label>Current food / diet</label>
                          <textarea
                            name="currentFood"
                            rows="3"
                            value={intakeForm.currentFood}
                            onChange={handleInputChange}
                            placeholder="Describe current food, treats, or diet..."
                          />
                        </div>

                        <div className="pvc-intake-grid">
                          <div className="pvc-field">
                            <label>Feeding schedule</label>
                            <input
                              type="text"
                              name="feedingSchedule"
                              value={intakeForm.feedingSchedule}
                              onChange={handleInputChange}
                              placeholder="e.g. Twice a day"
                            />
                          </div>
                          <div className="pvc-field">
                            <label>Eating change</label>
                            <input
                              type="text"
                              name="eatingChange"
                              value={intakeForm.eatingChange}
                              onChange={handleInputChange}
                              placeholder="e.g. Eating less this week"
                            />
                          </div>
                        </div>

                        <div className="pvc-field">
                          <label>Nutrition goal</label>
                          <input
                            type="text"
                            name="nutritionGoal"
                            value={intakeForm.nutritionGoal}
                            onChange={handleInputChange}
                            placeholder="e.g. Safe food transition"
                          />
                        </div>
                      </>
                    )}

                    {intakeForm.supportMode === "Grooming & Care" && (
                      <>
                        <div className="pvc-field">
                          <label>Grooming or care need</label>
                          <textarea
                            name="groomingNeed"
                            rows="3"
                            value={intakeForm.groomingNeed}
                            onChange={handleInputChange}
                            placeholder="Describe what you need help with..."
                          />
                        </div>

                        <div className="pvc-intake-grid">
                          <div className="pvc-field">
                            <label>Current grooming frequency</label>
                            <input
                              type="text"
                              name="groomingFrequency"
                              value={intakeForm.groomingFrequency}
                              onChange={handleInputChange}
                              placeholder="e.g. Once a month"
                            />
                          </div>
                          <div className="pvc-field">
                            <label>Coat / skin notes</label>
                            <input
                              type="text"
                              name="coatSkinNotes"
                              value={intakeForm.coatSkinNotes}
                              onChange={handleInputChange}
                              placeholder="e.g. Thick coat, dry skin"
                            />
                          </div>
                        </div>

                        <div className="pvc-field">
                          <label>Care goal</label>
                          <input
                            type="text"
                            name="careGoal"
                            value={intakeForm.careGoal}
                            onChange={handleInputChange}
                            placeholder="e.g. Easier home grooming routine"
                          />
                        </div>
                      </>
                    )}

                    {intakeForm.supportMode === "Routine & Reminders" && (
                      <>
                        <div className="pvc-field">
                          <label>Routine goal</label>
                          <textarea
                            name="routineGoal"
                            rows="3"
                            value={intakeForm.routineGoal}
                            onChange={handleInputChange}
                            placeholder="What kind of routine do you want help building?"
                          />
                        </div>

                        <div className="pvc-intake-grid">
                          <div className="pvc-field">
                            <label>Current routine</label>
                            <input
                              type="text"
                              name="currentRoutine"
                              value={intakeForm.currentRoutine}
                              onChange={handleInputChange}
                              placeholder="e.g. Morning walk, evening feed"
                            />
                          </div>
                          <div className="pvc-field">
                            <label>Reminder needs</label>
                            <input
                              type="text"
                              name="reminderNeeds"
                              value={intakeForm.reminderNeeds}
                              onChange={handleInputChange}
                              placeholder="e.g. Vaccines, grooming, flea treatment"
                            />
                          </div>
                        </div>

                        <div className="pvc-field">
                          <label>Extra planning notes</label>
                          <input
                            type="text"
                            name="planningNotes"
                            value={intakeForm.planningNotes}
                            onChange={handleInputChange}
                            placeholder="Anything else to include?"
                          />
                        </div>
                      </>
                    )}

                    {intakeForm.supportMode === "Appointment Prep" && (
                      <>
                        <div className="pvc-intake-grid">
                          <div className="pvc-field">
                            <label>Appointment type</label>
                            <input
                              type="text"
                              name="appointmentType"
                              value={intakeForm.appointmentType}
                              onChange={handleInputChange}
                              placeholder="e.g. Vet, grooming, check-up"
                            />
                          </div>
                          <div className="pvc-field">
                            <label>Appointment date</label>
                            <input
                              type="text"
                              name="appointmentDate"
                              value={intakeForm.appointmentDate}
                              onChange={handleInputChange}
                              placeholder="e.g. Tomorrow at 3pm"
                            />
                          </div>
                        </div>

                        <div className="pvc-field">
                          <label>Main appointment goal</label>
                          <textarea
                            name="appointmentGoal"
                            rows="3"
                            value={intakeForm.appointmentGoal}
                            onChange={handleInputChange}
                            placeholder="What do you want help preparing for?"
                          />
                        </div>

                        <div className="pvc-field">
                          <label>Questions you want to prepare</label>
                          <input
                            type="text"
                            name="appointmentQuestions"
                            value={intakeForm.appointmentQuestions}
                            onChange={handleInputChange}
                            placeholder="e.g. Diet, skin issue, vaccination"
                          />
                        </div>
                      </>
                    )}

                    {intakeForm.supportMode === "Lost Pet Support" && (
                      <>
                        <div className="pvc-intake-grid">
                          <div className="pvc-field">
                            <label>Last seen location</label>
                            <input
                              type="text"
                              name="lastSeenLocation"
                              value={intakeForm.lastSeenLocation}
                              onChange={handleInputChange}
                              placeholder="e.g. Near my home / local park"
                            />
                          </div>
                          <div className="pvc-field">
                            <label>Last seen time</label>
                            <input
                              type="text"
                              name="lastSeenTime"
                              value={intakeForm.lastSeenTime}
                              onChange={handleInputChange}
                              placeholder="e.g. Today around 7pm"
                            />
                          </div>
                        </div>

                        <div className="pvc-field">
                          <label>Pet description</label>
                          <textarea
                            name="petDescription"
                            rows="3"
                            value={intakeForm.petDescription}
                            onChange={handleInputChange}
                            placeholder="Describe your pet, or ask the AI to generate one from the profile"
                          />
                        </div>

                        <div className="pvc-field">
                          <label>Collar / microchip info</label>
                          <input
                            type="text"
                            name="collarMicrochipInfo"
                            value={intakeForm.collarMicrochipInfo}
                            onChange={handleInputChange}
                            placeholder="e.g. Blue collar, microchipped"
                          />
                        </div>
                      </>
                    )}

                    {intakeForm.supportMode === "New Pet Owner Help" && (
                      <>
                        <div className="pvc-field">
                          <label>Your situation</label>
                          <textarea
                            name="newPetSituation"
                            rows="3"
                            value={intakeForm.newPetSituation}
                            onChange={handleInputChange}
                            placeholder="e.g. I just adopted a kitten yesterday"
                          />
                        </div>

                        <div className="pvc-intake-grid">
                          <div className="pvc-field">
                            <label>Help needed</label>
                            <input
                              type="text"
                              name="starterHelpNeeded"
                              value={intakeForm.starterHelpNeeded}
                              onChange={handleInputChange}
                              placeholder="e.g. First week checklist"
                            />
                          </div>
                          <div className="pvc-field">
                            <label>Home setup status</label>
                            <input
                              type="text"
                              name="homeSetupStatus"
                              value={intakeForm.homeSetupStatus}
                              onChange={handleInputChange}
                              placeholder="e.g. Have food and bed, not litter tray yet"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {intakeForm.supportMode === "Travel & Planning" && (
                      <>
                        <div className="pvc-intake-grid">
                          <div className="pvc-field">
                            <label>Travel type</label>
                            <input
                              type="text"
                              name="travelType"
                              value={intakeForm.travelType}
                              onChange={handleInputChange}
                              placeholder="e.g. Car trip, moving house, holiday"
                            />
                          </div>
                          <div className="pvc-field">
                            <label>Destination type</label>
                            <input
                              type="text"
                              name="destinationType"
                              value={intakeForm.destinationType}
                              onChange={handleInputChange}
                              placeholder="e.g. Family home, hotel, new apartment"
                            />
                          </div>
                        </div>

                        <div className="pvc-field">
                          <label>Main concern</label>
                          <textarea
                            name="travelConcern"
                            rows="3"
                            value={intakeForm.travelConcern}
                            onChange={handleInputChange}
                            placeholder="What do you want help planning?"
                          />
                        </div>

                        <div className="pvc-field">
                          <label>Packing or preparation help</label>
                          <input
                            type="text"
                            name="packingHelp"
                            value={intakeForm.packingHelp}
                            onChange={handleInputChange}
                            placeholder="e.g. Need a packing checklist"
                          />
                        </div>
                      </>
                    )}

                    {intakeForm.supportMode === "Other" && (
                      <>
                        <div className="pvc-field">
                          <label>What do you need help with?</label>
                          <input
                            type="text"
                            name="otherTopic"
                            value={intakeForm.otherTopic}
                            onChange={handleInputChange}
                            placeholder="e.g. Something not listed above"
                          />
                        </div>

                        <div className="pvc-field">
                          <label>More details</label>
                          <textarea
                            name="otherDetails"
                            rows="4"
                            value={intakeForm.otherDetails}
                            onChange={handleInputChange}
                            placeholder="Describe what you want help with about your pet..."
                          />
                        </div>
                      </>
                    )}

                    <div className="pvc-field">
                      <label>Upload pictures</label>
                      <input type="file" accept="image/*" multiple onChange={handleFileChange} />
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
                      <span>Use AI to prepare a summary before the support session</span>
                    </label>

                    <div className="pvc-intake-actions">
                      <button className="pvc-btn pvc-btn-primary" type="submit">
                        Start AI Pet Assistant
                      </button>
                    </div>
                  </form>
                )}

                {sessionEnded && (
                  <div className="pvc-readonly-note">
                    This session has ended. Its saved transcript is read-only.
                  </div>
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
                        General support guidance will appear here once the AI reviews the request.
                      </div>
                    )}
                  </div>

                  <div className="pvc-ai-disclaimer">
                    This is AI guidance only. It supports organisation, planning, and general pet care guidance.
                    It does not replace diagnosis, emergency treatment, or a licensed veterinarian.
                  </div>
                </div>
              </article>

              <article className="pvc-card">
                <div className="pvc-card-kicker">Pet-Aware Context</div>
                <h3>Profile details shared with AI</h3>

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

              <article className="pvc-card">
                <div className="pvc-card-kicker">Saved Sessions</div>
                <h3>AI Pet Assistant history</h3>

                {loadingHistory ? (
                  <div className="pvc-empty">Loading session history...</div>
                ) : historyError ? (
                  <div className="pvc-form-message pvc-form-error">{historyError}</div>
                ) : sessionHistory.length === 0 ? (
                  <div className="pvc-empty">
                    No saved AI assistant sessions for this pet yet. Start one to build transcript history.
                  </div>
                ) : (
                  <div className="pvc-history-list">
                    {sessionHistory.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        className={`pvc-history-item ${
                          String(selectedHistorySession?.id) === String(session.id) ? "active" : ""
                        }`}
                        onClick={() => handleOpenHistorySession(session)}
                      >
                        <div className="pvc-history-top">
                          <strong>{formatDateTime(session?.started_at || session?.created_at)}</strong>
                          <span className="pvc-history-rating">
                            {session?.rating ? `★ ${session.rating}/5` : "Not rated"}
                          </span>
                        </div>
                        <div className="pvc-history-text">
                          {session?.intake_summary || "Saved session"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </article>

              <article className="pvc-card pvc-card-wide">
                <div className="pvc-card-kicker">AI Guidance Session</div>
                <h3>AI Pet Assistant</h3>

                <div className="pvc-chat-shell">
                  <div className="pvc-chat-statusbar">
                    <div className={`pvc-status-pill pvc-status-${statusMeta.tone}`}>
                      {statusMeta.label}
                    </div>
                    <div className="pvc-status-text">{statusMeta.text}</div>
                  </div>

                  <div className="pvc-session-meta-bar">
                    <div><strong>Pet:</strong> {selectedPet?.name || "—"}</div>
                    <div><strong>Mode:</strong> {intakeForm.supportMode}</div>
                    <div><strong>Started:</strong> {formatDateTime(selectedHistorySession?.started_at || sessionStartedAt)}</div>
                    <div><strong>Ended:</strong> {formatDateTime(selectedHistorySession?.ended_at)}</div>
                  </div>

                  <div className="pvc-chat-window">
                    {!chatMessages.length ? (
                      <div className="pvc-chat-empty">
                        Choose a support mode and complete the intake form to begin the AI Pet Assistant session.
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
                      disabled={chatStatus !== "connected" || sessionEnded}
                      placeholder={
                        chatStatus === "connected" && !sessionEnded
                          ? "Type your message to the AI assistant..."
                          : "This transcript is read-only. Start a new AI session to send messages."
                      }
                    />

                    <div className="pvc-composer-actions">
                      <label className={`pvc-upload-btn ${(chatStatus !== "connected" || sessionEnded) ? "disabled" : ""}`}>
                        Add Image
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          hidden
                          disabled={chatStatus !== "connected" || sessionEnded}
                        />
                      </label>

                      <button
                        className="pvc-btn pvc-btn-primary pvc-btn-small"
                        type="button"
                        onClick={handleSendMessage}
                        disabled={sendingMessage || chatStatus !== "connected" || sessionEnded}
                      >
                        {sendingMessage ? "Sending..." : "Send"}
                      </button>

                      <button
                        className="pvc-btn pvc-btn-small pvc-btn-danger"
                        type="button"
                        onClick={handleEndSession}
                        disabled={chatStatus !== "connected" || sessionEnded}
                      >
                        End Session
                      </button>
                    </div>

                    {imagePreviews.length > 0 && !sessionEnded && (
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

              <article className="pvc-card pvc-card-wide">
                <div className="pvc-card-kicker">Post-Session Rating</div>
                <h3>Rate this AI Pet Assistant session</h3>

                {sessionEnded || selectedHistorySession ? (
                  <>
                    <div className="pvc-rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`pvc-star-btn ${ratingForm.score >= star ? "active" : ""}`}
                          onClick={() =>
                            !selectedHistorySession &&
                            setRatingForm((prev) => ({ ...prev, score: star }))
                          }
                          disabled={!!selectedHistorySession}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <div className="pvc-field">
                      <label>Short feedback</label>
                      <textarea
                        rows="3"
                        value={ratingForm.feedback}
                        onChange={(e) =>
                          setRatingForm((prev) => ({ ...prev, feedback: e.target.value }))
                        }
                        placeholder="Share how helpful this AI pet assistant session was..."
                        disabled={!!selectedHistorySession}
                      />
                    </div>

                    {selectedHistorySession ? (
                      <div className="pvc-readonly-note">
                        This saved session has already been stored and is being shown in read-only mode.
                      </div>
                    ) : (
                      <button
                        className="pvc-btn pvc-btn-primary"
                        type="button"
                        onClick={submitSessionRating}
                        disabled={submittingRating}
                      >
                        {submittingRating ? "Saving rating..." : "Submit Rating"}
                      </button>
                    )}

                    {ratingError && <div className="pvc-form-message pvc-form-error">{ratingError}</div>}
                    {ratingSuccess && <div className="pvc-form-message pvc-form-success">{ratingSuccess}</div>}
                  </>
                ) : (
                  <div className="pvc-empty">
                    End an AI Pet Assistant session to rate it here.
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  );
}