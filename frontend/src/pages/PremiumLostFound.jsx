import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./LostFoundPremium.css";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const TEST_LOCATION_COORDS = [
  {
    petNames: ["milo"],
    locationKeywords: ["millennium park", "blanchardstown"],
    lat: 53.3925,
    lng: -6.3897,
  },
  {
    petNames: ["luna"],
    locationKeywords: ["swords main street", "swords"],
    lat: 53.4597,
    lng: -6.2181,
  },
  {
    petNames: ["coco"],
    locationKeywords: ["griffeen valley park"],
    lat: 53.3537,
    lng: -6.4482,
  },
  {
    petNames: ["max"],
    locationKeywords: ["tymon park"],
    lat: 53.3066,
    lng: -6.3418,
  },
  {
    petNames: ["oscar"],
    locationKeywords: ["corkagh park"],
    lat: 53.3166,
    lng: -6.4329,
  },
  {
    petNames: ["found maltese", "maltese"],
    locationKeywords: ["leixlip", "kildare", "co. kildare"],
    lat: 53.3656,
    lng: -6.4956,
  },
];

function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google);
      return;
    }

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });
}

export default function PremiumLostFound() {
  const navigate = useNavigate();
  const apiBase = "http://127.0.0.1:8000/api";
  const storageBase = "http://127.0.0.1:8000/storage";

  const [userName, setUserName] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [useRadius, setUseRadius] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedSpotlightIndex, setSelectedSpotlightIndex] = useState(0);
  const [selectedAlertIndex, setSelectedAlertIndex] = useState(0);
  const [selectedSupportIndex, setSelectedSupportIndex] = useState(0);

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [mapsReady, setMapsReady] = useState(false);

  const [selectedMapReport, setSelectedMapReport] = useState(null);
  const [showMapReportModal, setShowMapReportModal] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const userCircleRef = useRef(null);

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const supportQuotes = [
    {
      title: "Take a breath",
      text: "Many lost pets are found with time, care, and community support. You are already helping by staying active and alert.",
    },
    {
      title: "Stay hopeful",
      text: "A single sighting, shared photo, or nearby check can make all the difference. Small steps really do matter.",
    },
    {
      title: "You are not alone",
      text: "This is a stressful moment, but support is around you. Keep checking updates and take things one step at a time.",
    },
    {
      title: "Keep going",
      text: "Many reunions happen because owners stayed consistent, checked local areas, and never gave up too early.",
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem("pawfection_token");
    const role = String(localStorage.getItem("pawfection_role") || "").toLowerCase();

    if (!token) {
      navigate("/login");
      return;
    }

    if (role === "admin") {
      navigate("/admin-dashboard");
      return;
    }

    try {
      const savedName = localStorage.getItem("pawfection_user_name");

      if (savedName && savedName.trim()) {
        setUserName(savedName.trim());
      } else {
        const savedUser = localStorage.getItem("pawfection_user");

        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          const fullName =
            parsedUser?.name ||
            parsedUser?.full_name ||
            parsedUser?.username ||
            parsedUser?.user_name ||
            "User";

          setUserName(fullName);
        }
      }

      localStorage.setItem("pawfection_account_type", "premium");
    } catch (error) {
      console.error("Failed to load user name:", error);
      setUserName("User");
      localStorage.setItem("pawfection_account_type", "premium");
    }
  }, [navigate]);

  useEffect(() => {
    if (GOOGLE_MAPS_API_KEY) {
      loadGoogleMapsScript()
        .then(() => setMapsReady(true))
        .catch(() => {
          setReportsError(
            "Google Maps failed to load. Check your API key, billing, and API restrictions."
          );
        });
    } else {
      setReportsError(
        "Google Maps API key is missing. Put VITE_GOOGLE_MAPS_API_KEY in frontend/.env and restart npm run dev."
      );
    }
  }, []);

  const getReportType = (report) => {
    const rawType = String(
      report?.type || report?.report_type || report?.category || ""
    )
      .toLowerCase()
      .trim();

    if (rawType) return rawType;

    if (report?.location_found || report?.found_at) return "found";
    if (report?.sighting_location || report?.sighting_latitude) return "sighting";
    if (report?.pet_name && report?.location) return "lost";

    return "";
  };

  const getReportArea = (report) => {
    return (
      report?.area ||
      report?.last_seen_location ||
      report?.location_found ||
      report?.found_at ||
      report?.sighting_location ||
      report?.location ||
      "Unknown area"
    );
  };

  const isResolvedReport = (report) => {
    const valuesToCheck = [
      report?.status,
      report?.report_status,
      report?.lost_status,
      report?.pet_status,
      report?.lost_pet_status,
      report?.resolution_status,
      report?.sighting_status,
      report?.state,
      report?.lostPet?.status,
      report?.lostPet?.lost_status,
      report?.pet?.status,
      report?.pet?.lost_status,
      report?.lost_report?.status,
      report?.lost_report?.report_status,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase().trim());

    const resolvedWords = [
      "resolved",
      "closed",
      "inactive",
      "done",
      "completed",
      "complete",
      "marked done",
      "mark done",
      "reunited",
      "returned",
      "safe",
      "archived",
    ];

    return (
      valuesToCheck.some((value) => resolvedWords.includes(value)) ||
      report?.is_resolved === true ||
      report?.is_resolved === 1 ||
      report?.resolved === true ||
      report?.resolved === 1 ||
      report?.is_done === true ||
      report?.done === true ||
      report?.completed === true ||
      report?.is_completed === true ||
      Boolean(report?.resolved_at) ||
      Boolean(report?.completed_at) ||
      Boolean(report?.done_at) ||
      Boolean(report?.closed_at)
    );
  };

  const getImageUrl = (pathOrUrl) => {
    if (!pathOrUrl) return null;

    const cleanPath = String(pathOrUrl).trim();

    if (
      !cleanPath ||
      cleanPath === "null" ||
      cleanPath === "undefined" ||
      cleanPath === "false"
    ) {
      return null;
    }

    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      return cleanPath;
    }

    return `${storageBase}/${cleanPath.replace(/^\/+/, "")}`;
  };

  const getPlaceholderImage = (report) => {
    const name = report?.name || report?.pet_name || "Pet";
    const reportType = getReportType(report);

    const type =
      reportType === "sighting"
        ? "Sighting"
        : reportType === "found"
        ? "Found Pet"
        : "Lost Pet";

    const initial = name?.charAt(0)?.toUpperCase() || "P";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#efeaff"/>
            <stop offset="50%" stop-color="#f7fbff"/>
            <stop offset="100%" stop-color="#dff8f4"/>
          </linearGradient>
          <linearGradient id="circle" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#7d68f2"/>
            <stop offset="100%" stop-color="#9a83ff"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="900" fill="url(#bg)"/>
        <circle cx="250" cy="170" r="130" fill="#ffffff" opacity="0.55"/>
        <circle cx="960" cy="210" r="165" fill="#ffffff" opacity="0.45"/>
        <circle cx="560" cy="820" r="220" fill="#ffffff" opacity="0.38"/>
        <circle cx="600" cy="390" r="150" fill="url(#circle)" opacity="0.92"/>
        <text x="600" y="435" text-anchor="middle" font-size="128" font-family="Arial, sans-serif" font-weight="800" fill="#ffffff">${initial}</text>
        <text x="600" y="620" text-anchor="middle" font-size="62" font-family="Arial, sans-serif" font-weight="800" fill="#2b1d57">${type}</text>
        <text x="600" y="690" text-anchor="middle" font-size="38" font-family="Arial, sans-serif" font-weight="700" fill="#706b88">No photo uploaded</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const getReportImage = (report) => {
    const possibleImages = [
      report?.display_photo_url,
      report?.lost_photo_url,
      report?.sighting_photo_url,
      report?.found_photo_url,
      report?.photo_url,
      report?.image_url,
      report?.pet?.display_photo_url,
      report?.pet?.photo_url,
      report?.lostPet?.display_photo_url,
      report?.lostPet?.photo_url,
      getImageUrl(report?.lost_photo_path),
      getImageUrl(report?.sighting_photo_path),
      getImageUrl(report?.found_photo_path),
      getImageUrl(report?.photo_path),
      getImageUrl(report?.image_path),
      getImageUrl(report?.photo),
      getImageUrl(report?.pet?.photo_path),
      getImageUrl(report?.pet?.photo),
      getImageUrl(report?.lostPet?.photo_path),
      getImageUrl(report?.lostPet?.photo),
    ].filter(Boolean);

    return possibleImages[0] || getPlaceholderImage(report);
  };

  const toMapNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  };

  const firstValidMapNumber = (values) => {
    for (const value of values) {
      const numberValue = toMapNumber(value);
      if (numberValue !== null) return numberValue;
    }

    return null;
  };

  const getFallbackCoords = (report) => {
    const petName = String(report?.name || report?.pet_name || "")
      .toLowerCase()
      .trim();

    const locationText = [
      report?.location,
      report?.area,
      report?.last_seen_location,
      report?.location_found,
      report?.found_at,
      report?.sighting_location,
      report?.description,
      report?.notes,
      report?.message,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return TEST_LOCATION_COORDS.find((item) => {
      const nameMatches = item.petNames.some((name) => petName === name);
      const locationMatches = item.locationKeywords.some((keyword) =>
        locationText.includes(keyword)
      );

      return nameMatches || locationMatches;
    });
  };

  const getReportLat = (report) => {
    const directLat = firstValidMapNumber([
      report?.lat,
      report?.latitude,
      report?.last_seen_latitude,
      report?.location_latitude,
      report?.lost_latitude,
      report?.found_latitude,
      report?.sighting_latitude,
      report?.pet?.lat,
      report?.pet?.latitude,
      report?.lostPet?.lat,
      report?.lostPet?.latitude,
    ]);

    if (directLat !== null) return directLat;

    return getFallbackCoords(report)?.lat ?? null;
  };

  const getReportLng = (report) => {
    const directLng = firstValidMapNumber([
      report?.lng,
      report?.longitude,
      report?.lon,
      report?.last_seen_longitude,
      report?.location_longitude,
      report?.lost_longitude,
      report?.found_longitude,
      report?.sighting_longitude,
      report?.pet?.lng,
      report?.pet?.longitude,
      report?.lostPet?.lng,
      report?.lostPet?.longitude,
    ]);

    if (directLng !== null) return directLng;

    return getFallbackCoords(report)?.lng ?? null;
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        setReportsError("");

        const token = localStorage.getItem("pawfection_token");

        if (!token) {
          setReportsError("You are not logged in.");
          setLoadingReports(false);
          return;
        }

        const res = await fetch(`${apiBase}/premium/lost-found`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load reports");
        }

        const incomingReports = Array.isArray(data.reports)
          ? data.reports
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];

        const activeReportsOnly = incomingReports.filter((report) => {
          return !isResolvedReport(report);
        });

        const activeLostReports = activeReportsOnly.filter((report) => {
          return getReportType(report) === "lost";
        });

        const activeLostIds = new Set(
          activeLostReports
            .flatMap((report) => [
              report.id,
              report.pet_id,
              report.lost_pet_id,
              report.lost_report_id,
              report.report_id,
            ])
            .filter((value) => value !== null && value !== undefined && value !== "")
            .map((value) => String(value))
        );

        const filteredLinkedReports = activeReportsOnly.filter((report) => {
          if (isResolvedReport(report)) return false;

          const type = getReportType(report);

          if (type === "lost" || type === "found") return true;

          if (type === "sighting") {
            const possibleLinkedIds = [
              report.pet_id,
              report.lost_pet_id,
              report.lost_report_id,
              report.report_id,
            ]
              .filter((value) => value !== null && value !== undefined && value !== "")
              .map((value) => String(value));

            return possibleLinkedIds.some((id) => activeLostIds.has(id));
          }

          return false;
        });

        const normalisedReports = filteredLinkedReports.map((report) => ({
          ...report,
          type: getReportType(report),
          lat: getReportLat(report),
          lng: getReportLng(report),
          priority:
            report?.priority === true ||
            report?.is_priority === true ||
            report?.priority === 1 ||
            report?.is_priority === 1 ||
            String(report?.priority).toLowerCase() === "true" ||
            String(report?.is_priority).toLowerCase() === "true",
          resolvedImage: getReportImage(report),
        }));

        setReports(normalisedReports);
      } catch (error) {
        console.error("Failed to fetch premium lost & found reports:", error);
        setReportsError(
          error.message || "Unable to load lost and found reports right now."
        );
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedSupportIndex((prev) =>
        prev === supportQuotes.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [supportQuotes.length]);

  const visibleReportPool = useMemo(() => {
    return reports.filter((item) => {
      return !isResolvedReport(item);
    });
  }, [reports]);

  const searchableText = (item) => {
    return [
      item.type,
      item.name,
      item.pet_name,
      item.species,
      item.breed,
      item.area,
      item.location,
      item.location_found,
      item.found_at,
      item.last_seen_location,
      item.sighting_location,
      item.notes,
      item.description,
      item.message,
      item.collar,
      item.colour,
      item.color,
      item.markings,
      item.behaviour,
      item.behavior,
      item.size,
      item.gender,
      item.fur_type,
      item.eye_colour,
      item.eye_color,
      item.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  };

  const filteredReports = useMemo(() => {
    let items = [...visibleReportPool];

    if (activeFilter === "priority") {
      items = items.filter((item) => getReportType(item) === "lost" && item.priority);
    } else if (activeFilter !== "all") {
      items = items.filter((item) => getReportType(item) === activeFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      items = items.filter((item) => searchableText(item).includes(q));
    }

    if (useRadius && userLocation) {
      const [userLat, userLng] = userLocation;

      items = items.filter((item) => {
        const itemLat = getReportLat(item);
        const itemLng = getReportLng(item);

        if (itemLat === null || itemLng === null) return false;

        const latDiff = itemLat - Number(userLat);
        const lngDiff = itemLng - Number(userLng);
        const distanceApprox = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        return distanceApprox <= 0.03;
      });
    }

    return items;
  }, [visibleReportPool, activeFilter, searchTerm, useRadius, userLocation]);

  const lostReports = useMemo(
    () => visibleReportPool.filter((item) => getReportType(item) === "lost"),
    [visibleReportPool]
  );

  const foundReports = useMemo(
    () => visibleReportPool.filter((item) => getReportType(item) === "found"),
    [visibleReportPool]
  );

  const sightingReports = useMemo(
    () => visibleReportPool.filter((item) => getReportType(item) === "sighting"),
    [visibleReportPool]
  );

  const visibleListReports = useMemo(() => {
    if (activeFilter === "lost") {
      return filteredReports.filter((item) => getReportType(item) === "lost");
    }

    if (activeFilter === "found") {
      return filteredReports.filter((item) => getReportType(item) === "found");
    }

    if (activeFilter === "sighting") {
      return filteredReports.filter((item) => {
        return getReportType(item) === "sighting" && !isResolvedReport(item);
      });
    }

    if (activeFilter === "priority") {
      return filteredReports.filter(
        (item) => getReportType(item) === "lost" && item.priority
      );
    }

    return filteredReports.filter((item) => getReportType(item) === "lost");
  }, [filteredReports, activeFilter]);

  const visibleLostReports = useMemo(
    () => visibleListReports.filter((item) => getReportType(item) === "lost"),
    [visibleListReports]
  );

  const spotlightPets = useMemo(() => {
    const source = visibleLostReports.length > 0 ? visibleLostReports : lostReports;
    return [...source].sort((a, b) => Number(b.priority) - Number(a.priority));
  }, [visibleLostReports, lostReports]);

  const activeSpotlight =
    spotlightPets[selectedSpotlightIndex] || spotlightPets[0] || null;

  const premiumAlertPets = useMemo(() => {
    return [...lostReports].sort((a, b) => Number(b.priority) - Number(a.priority));
  }, [lostReports]);

  const activeAlertPet =
    premiumAlertPets[selectedAlertIndex] || premiumAlertPets[0] || null;

  const activeSupportQuote = supportQuotes[selectedSupportIndex] || supportQuotes[0];

  const supportCloudItems = [
    ...supportQuotes.map((quote, index) => ({
      id: `quote-${index}`,
      icon: ["☁️", "💜", "🐾", "✨"][index] || "☁️",
      title: quote.title,
      text: quote.text,
      quoteIndex: index,
      action: "Show message",
    })),
    {
      id: "stay-calm",
      icon: "🌙",
      title: "Stay calm",
      text: "Pets are often found close to where they were last seen. Staying calm helps you think clearly and act steadily.",
      action: "Gentle reminder",
    },
    {
      id: "keep-checking",
      icon: "🔎",
      title: "Keep checking",
      text: "Review sightings, refresh your report, and revisit nearby places. Repeating the basics really can help.",
      action: "Stay active",
    },
    {
      id: "hold-hope",
      icon: "💫",
      title: "Hold onto hope",
      text: "Many reunions happen because owners kept going, stayed visible, and followed up on every lead.",
      action: "Keep going",
    },
  ];

  useEffect(() => {
    if (!spotlightPets.length) {
      setSelectedSpotlightIndex(0);
      return;
    }

    if (selectedSpotlightIndex > spotlightPets.length - 1) {
      setSelectedSpotlightIndex(0);
    }

    const interval = setInterval(() => {
      setSelectedSpotlightIndex((prev) =>
        prev === spotlightPets.length - 1 ? 0 : prev + 1
      );
    }, 4500);

    return () => clearInterval(interval);
  }, [spotlightPets, selectedSpotlightIndex]);

  useEffect(() => {
    if (!premiumAlertPets.length) {
      setSelectedAlertIndex(0);
      return;
    }

    if (selectedAlertIndex > premiumAlertPets.length - 1) {
      setSelectedAlertIndex(0);
    }

    const interval = setInterval(() => {
      setSelectedAlertIndex((prev) =>
        prev === premiumAlertPets.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [premiumAlertPets, selectedAlertIndex]);

  const mapMarkers = useMemo(() => {
    return filteredReports.filter((report) => {
      const lat = getReportLat(report);
      const lng = getReportLng(report);
      return lat !== null && lng !== null;
    });
  }, [filteredReports]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        setUseRadius(true);
      },
      () => {
        alert("Unable to get your location. Please allow location access.");
      }
    );
  };

  const handleViewReport = (report) => {
    const type = getReportType(report);

    if (type === "found") {
      openMapReportModal(report);
      return;
    }

    const targetId =
      type === "sighting"
        ? report.lost_report_id ||
          report.lost_pet_id ||
          report.report_id ||
          report.pet_id ||
          report.id
        : report.id;

    if (!targetId) return;
    navigate(`/premium/lostfound/view/${targetId}`);
  };

  const openMapReportModal = (report) => {
    setSelectedMapReport(report);
    setShowMapReportModal(true);
  };

  const closeMapReportModal = () => {
    setSelectedMapReport(null);
    setShowMapReportModal(false);
  };

  const getMarkerStyle = (type) => {
    if (type === "sighting") {
      return {
        color: "#f39c3d",
        label: "S",
      };
    }

    if (type === "found") {
      return {
        color: "#35c3a8",
        label: "F",
      };
    }

    return {
      color: "#7c6cff",
      label: "L",
    };
  };

  useEffect(() => {
    if (!mapsReady || !mapRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 53.3498, lng: -6.2603 },
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    }

    const map = mapInstanceRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    if (userCircleRef.current) {
      userCircleRef.current.setMap(null);
      userCircleRef.current = null;
    }

    const bounds = new window.google.maps.LatLngBounds();
    let pointCount = 0;

    if (userLocation) {
      const userPoint = {
        lat: Number(userLocation[0]),
        lng: Number(userLocation[1]),
      };

      userMarkerRef.current = new window.google.maps.Marker({
        position: userPoint,
        map,
        title: "Your Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#2f80ed",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        label: {
          text: "Y",
          color: "#ffffff",
          fontSize: "10px",
          fontWeight: "700",
        },
      });

      userCircleRef.current = new window.google.maps.Circle({
        map,
        center: userPoint,
        radius: 2500,
        strokeColor: "#7c6cff",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#7c6cff",
        fillOpacity: 0.1,
      });

      bounds.extend(userPoint);
      pointCount += 1;
    }

    mapMarkers.forEach((report) => {
      const lat = getReportLat(report);
      const lng = getReportLng(report);

      if (lat === null || lng === null) return;

      const position = { lat, lng };
      const markerStyle = getMarkerStyle(getReportType(report));

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: report.name || report.pet_name || "Pet",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: markerStyle.color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        label: {
          text: markerStyle.label,
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "700",
        },
      });

      marker.addListener("click", () => {
        openMapReportModal(report);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
      pointCount += 1;
    });

    if (pointCount === 0) {
      map.setCenter({ lat: 53.3498, lng: -6.2603 });
      map.setZoom(11);
    } else if (pointCount === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(12);
    } else {
      map.fitBounds(bounds, 60);
    }
  }, [mapsReady, mapMarkers, userLocation]);

  return (
    <div className="premium-lf-page">
      <header className="premium-lf-topbar">
        <div
          className="premium-lf-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img
            src={PawfectionLogo}
            alt="Pawfection Logo"
            className="premium-lf-logo"
          />
          <div className="premium-lf-brand-copy">
            <div className="premium-lf-brand-title">Pawfection</div>
            <div className="premium-lf-brand-sub">Premium Lost &amp; Found</div>
          </div>
        </div>

        <nav className="premium-lf-nav">
          <Link to="/premium-dashboard">Premium Dashboard</Link>
          <Link to="/premium-mypets">My Pet</Link>
          <Link to="/premium/appointments">Appointments</Link>
          <Link to="/premium/reminders">Reminders</Link>
          <Link to="/premium/lostfound" className="active">
            Lost &amp; Found
          </Link>
          <Link to="/premium/community">Community</Link>
          <Link to="/premium/inventory">Inventory</Link>
          <Link to="/premium/vet-chat">AI Pet Assistant</Link>
          <Link to="/premium/profile">Profile</Link>
        </nav>

        <div className="premium-lf-userbar">
          <div className="premium-lf-date">{todayText}</div>

          <div className="premium-lf-userchip">
            <div className="premium-lf-avatar">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <strong>{userName}</strong>
              <span>Premium User</span>
            </div>
          </div>
        </div>
      </header>

      <section className="premium-lf-main-hero">
        <div className="premium-lf-hero-card glass-panel">
          <div className="premium-lf-hero-left">
            <div className="premium-lf-badge">Pawfection Premium Safety</div>
            <h1 className="premium-lf-hero-title">Lost &amp; Found</h1>
            <p className="premium-lf-hero-text">
              Fast, localised lost-pet reporting with community sightings, smart
              filters, map tracking, and premium nearby alert support.
            </p>

            <div className="premium-lf-hero-meta">
              <div className="premium-lf-stat-pill">
                <strong>{lostReports.length}</strong> active lost reports
              </div>
              <div className="premium-lf-stat-pill">
                <strong>{foundReports.length}</strong> found reports
              </div>
              <div className="premium-lf-stat-pill">
                <strong>{sightingReports.length}</strong> sighting reports
              </div>
              <div className="premium-lf-stat-pill">
                <strong>{useRadius ? "On" : "Off"}</strong> area alerts
              </div>
            </div>
          </div>

          <div className="premium-lf-hero-right">
            <div className="premium-lf-search-card glass-inner-panel">
              <div className="premium-lf-search-head">
                <h3>Search reports</h3>
                <span>Name, breed, species, area, collar, colour, notes</span>
              </div>

              <div className="premium-lf-search-box">
                <input
                  type="text"
                  placeholder="Search blue collar, Tallaght, Golden Retriever, nervous..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="premium-lf-search"
                />

                {searchTerm.trim() && (
                  <button
                    type="button"
                    className="premium-lf-clear-search"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="premium-lf-action-grid">
                <button
                  className="premium-lf-primary-btn"
                  onClick={() => navigate("/premium/lostfound/report")}
                >
                  <span className="premium-lf-plus">+</span>
                  <span>Report Lost Pet</span>
                </button>

                <button
                  className="premium-lf-sighting-btn"
                  onClick={() => navigate("/premium/lostfound/report-sighting")}
                >
                  <span className="premium-lf-plus">+</span>
                  <span>Report Sighting</span>
                </button>

                <button
                  className={`premium-lf-secondary-btn ${
                    useRadius ? "selected" : ""
                  }`}
                  onClick={handleUseLocation}
                >
                  Use My Location
                </button>

                <button
                  className={`premium-lf-secondary-btn ${
                    activeFilter === "priority" ? "selected" : ""
                  }`}
                  onClick={() =>
                    setActiveFilter((prev) =>
                      prev === "priority" ? "all" : "priority"
                    )
                  }
                >
                  Priority Only
                </button>

                <button
                  className="premium-lf-secondary-btn"
                  onClick={() => window.location.reload()}
                >
                  Refresh Feed
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loadingReports && (
        <div className="premium-lf-info-box glass-panel">
          Loading lost and found reports...
        </div>
      )}

      {reportsError && (
        <div className="premium-lf-info-box error glass-panel">
          {reportsError}
        </div>
      )}

      <section className="premium-lf-feature-grid">
        <div className="premium-lf-map-card glass-panel">
          <div className="premium-lf-card-head">
            <div>
              <h3>Lost &amp; Found Map</h3>
              <p>Track nearby reports and explore activity by location.</p>
            </div>

            <div className="premium-lf-filter-chips">
              <button
                className={activeFilter === "all" ? "chip active" : "chip"}
                onClick={() => setActiveFilter("all")}
              >
                All
              </button>
              <button
                className={activeFilter === "lost" ? "chip active" : "chip"}
                onClick={() => setActiveFilter("lost")}
              >
                Lost
              </button>
              <button
                className={activeFilter === "found" ? "chip active" : "chip"}
                onClick={() => setActiveFilter("found")}
              >
                Found
              </button>
              <button
                className={activeFilter === "sighting" ? "chip active" : "chip"}
                onClick={() => setActiveFilter("sighting")}
              >
                Sightings
              </button>
            </div>
          </div>

          <div className="premium-lf-map-wrap">
            <div ref={mapRef} className="premium-lf-map" />
          </div>
        </div>

        <div className="premium-lf-spotlight-card glass-panel">
          {activeSpotlight ? (
            <>
              <div className="premium-lf-spotlight-image-wrap">
                <img
                  src={activeSpotlight.resolvedImage}
                  alt={activeSpotlight.name || activeSpotlight.pet_name || "Pet"}
                  className="premium-lf-spotlight-image"
                  onError={(e) => {
                    e.currentTarget.src = getPlaceholderImage(activeSpotlight);
                  }}
                />

                <div className="premium-lf-floating-bubble">
                  <span className="premium-lf-floating-bubble-label">
                    Nearby help needed
                  </span>
                  <strong>
                    {spotlightPets[
                      (selectedSpotlightIndex + 1) % spotlightPets.length
                    ]?.name ||
                      spotlightPets[
                        (selectedSpotlightIndex + 1) % spotlightPets.length
                      ]?.pet_name ||
                      "Next report"}
                  </strong>
                  <p>needs local sightings</p>
                </div>

                <div className="premium-lf-spotlight-overlay">
                  <div className="premium-lf-spotlight-tag">
                    {activeSpotlight.priority ? "PRIORITY REPORT" : "MISSING PET"}
                  </div>

                  <h3>
                    {activeSpotlight.name ||
                      activeSpotlight.pet_name ||
                      "Unknown Pet"}
                  </h3>
                  <p>
                    {activeSpotlight.species || "Pet"} •{" "}
                    {activeSpotlight.breed || "Unknown breed"} •{" "}
                    {getReportArea(activeSpotlight)}
                  </p>

                  <div className="premium-lf-spotlight-actions">
                    <button onClick={() => handleViewReport(activeSpotlight)}>
                      View Report
                    </button>
                    <button
                      onClick={() =>
                        navigate(
                          `/premium/lostfound/view/${activeSpotlight.id}/sighting`
                        )
                      }
                    >
                      Submit Sighting
                    </button>
                  </div>
                </div>
              </div>

              <div className="premium-lf-slider-dots">
                {spotlightPets.map((pet, index) => (
                  <button
                    key={`${pet.type}-${pet.id}-${index}`}
                    className={index === selectedSpotlightIndex ? "dot active" : "dot"}
                    onClick={() => setSelectedSpotlightIndex(index)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="premium-lf-empty-state">
              No active lost pets to display.
            </div>
          )}
        </div>
      </section>

      <section className="premium-lf-lower-grid">
        <div className="premium-lf-panel glass-panel">
          <div className="premium-lf-panel-head">
            <h3>
              {activeFilter === "lost"
                ? "Active Lost Reports"
                : activeFilter === "found"
                ? "Found Pet Reports"
                : activeFilter === "sighting"
                ? "Sighting Reports"
                : activeFilter === "priority"
                ? "Priority Lost Reports"
                : "Active Lost Reports"}
            </h3>
            <span>{visibleListReports.length} shown</span>
          </div>

          <div className="premium-lf-report-list">
            {visibleListReports.length > 0 ? (
              visibleListReports.map((report) => (
                <div
                  key={`${report.type}-${report.id || report.pet_id}`}
                  className="premium-lf-report-card glass-row"
                >
                  <img
                    src={report.resolvedImage}
                    alt={report.name || report.pet_name || "Pet"}
                    onError={(e) => {
                      e.currentTarget.src = getPlaceholderImage(report);
                    }}
                  />

                  <div className="premium-lf-report-info">
                    <h4>{report.name || report.pet_name || "Unknown Pet"}</h4>
                    <p>
                      {report.species || "Pet"} •{" "}
                      {report.breed || "Unknown breed"}
                    </p>
                    <span>{getReportArea(report)}</span>
                    <small className={`premium-lf-type-badge ${report.type}`}>
                      {report.type === "lost"
                        ? "Lost"
                        : report.type === "found"
                        ? "Found"
                        : "Sighting"}
                    </small>
                  </div>

                  <button
                    onClick={() =>
                      report.type === "sighting" || report.type === "found"
                        ? openMapReportModal(report)
                        : handleViewReport(report)
                    }
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <div className="premium-lf-empty-list">
                {activeFilter === "found"
                  ? "No found pet reports match your search."
                  : activeFilter === "sighting"
                  ? "No sighting reports match your search."
                  : activeFilter === "lost"
                  ? "No lost reports match your search."
                  : "No active lost reports match your search."}
              </div>
            )}
          </div>
        </div>

        <div className="premium-lf-panel glass-panel">
          <div className="premium-lf-panel-head">
            <h3>Premium Alerts</h3>
            <span>Urgent missing pets</span>
          </div>

          {activeAlertPet ? (
            <div className="premium-lf-alert-slider">
              <div className="premium-lf-alert-image-wrap">
                <img
                  src={activeAlertPet.resolvedImage}
                  alt={activeAlertPet.name || activeAlertPet.pet_name || "Pet"}
                  className="premium-lf-alert-image"
                  onError={(e) => {
                    e.currentTarget.src = getPlaceholderImage(activeAlertPet);
                  }}
                />
                <div className="premium-lf-alert-badge">
                  {activeAlertPet.priority ? "Priority Alert" : "Missing Pet"}
                </div>
              </div>

              <div className="premium-lf-alert-content">
                <h4>
                  {activeAlertPet.name || activeAlertPet.pet_name || "Unknown Pet"}
                </h4>
                <p>
                  {activeAlertPet.species || "Pet"} •{" "}
                  {activeAlertPet.breed || "Unknown breed"}
                </p>
                <span>Last seen: {getReportArea(activeAlertPet)}</span>

                <div className="premium-lf-alert-actions">
                  <button onClick={() => handleViewReport(activeAlertPet)}>
                    View Report
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/premium/lostfound/view/${activeAlertPet.id}/sighting`
                      )
                    }
                  >
                    Submit Sighting
                  </button>
                </div>
              </div>

              <div className="premium-lf-alert-dots">
                {premiumAlertPets.map((pet, index) => (
                  <button
                    key={`${pet.type}-${pet.id}-${index}`}
                    className={
                      index === selectedAlertIndex
                        ? "premium-alert-dot active"
                        : "premium-alert-dot"
                    }
                    onClick={() => setSelectedAlertIndex(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="premium-lf-empty-list">
              No missing pets available for alerts.
            </div>
          )}
        </div>
      </section>

      <section className="premium-lf-support-section">
        <div className="premium-lf-support-card premium-lf-cloud-support-card glass-panel">
          <div className="premium-lf-support-top-row">
            <div className="premium-lf-support-header">
              <span className="premium-lf-support-badge">
                Support for pet owners
              </span>
              <h3>You are not alone in this.</h3>
              <p>
                Losing a pet can feel overwhelming. Take one step at a time, keep
                checking updates, and remember that many pets are reunited through
                steady searching and community help.
              </p>
            </div>

            <div className="premium-lf-active-support-cloud">
              <span className="premium-lf-active-cloud-icon">☁️</span>
              <h4>{activeSupportQuote.title}</h4>
              <p>{activeSupportQuote.text}</p>
            </div>
          </div>

          <div className="premium-lf-support-auto-slider">
            <div className="premium-lf-support-auto-track">
              {[0, 1].map((groupIndex) => (
                <div className="premium-lf-support-auto-group" key={groupIndex}>
                  {supportCloudItems.map((item) => (
                    <button
                      key={`${groupIndex}-${item.id}`}
                      type="button"
                      className="premium-lf-support-cloud-slide"
                      onClick={() => {
                        if (typeof item.quoteIndex === "number") {
                          setSelectedSupportIndex(item.quoteIndex);
                        }
                      }}
                    >
                      <span className="premium-lf-cloud-slide-icon">
                        {item.icon}
                      </span>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                      <small>{item.action}</small>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="premium-lf-support-dots">
            {supportQuotes.map((quote, index) => (
              <button
                key={quote.title}
                className={
                  index === selectedSupportIndex
                    ? "premium-support-dot active"
                    : "premium-support-dot"
                }
                onClick={() => setSelectedSupportIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {showMapReportModal && selectedMapReport && (
        <div className="premium-lf-report-modal-overlay" onClick={closeMapReportModal}>
          <div
            className="premium-lf-report-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="premium-lf-report-modal-close"
              onClick={closeMapReportModal}
            >
              ×
            </button>

            <div className="premium-lf-report-modal-grid">
              <div className="premium-lf-report-modal-image-wrap">
                <img
                  src={selectedMapReport.resolvedImage}
                  alt={selectedMapReport.name || selectedMapReport.pet_name || "Pet"}
                  className="premium-lf-report-modal-image"
                  onError={(e) => {
                    e.currentTarget.src = getPlaceholderImage(selectedMapReport);
                  }}
                />
              </div>

              <div className="premium-lf-report-modal-content">
                <div className="premium-lf-report-modal-badge">
                  {selectedMapReport.type === "sighting"
                    ? "Sighting Report"
                    : selectedMapReport.type === "found"
                    ? "Found Pet Report"
                    : selectedMapReport.priority
                    ? "Priority Lost Report"
                    : "Lost Report"}
                </div>

                <h2>
                  {selectedMapReport.name ||
                    selectedMapReport.pet_name ||
                    "Unknown Pet"}
                </h2>

                <p className="premium-lf-report-modal-subtitle">
                  {selectedMapReport.species || "Pet"} •{" "}
                  {selectedMapReport.breed || "Unknown breed"}
                </p>

                <div className="premium-lf-report-modal-details">
                  <div className="premium-lf-report-detail-box">
                    <span>Area</span>
                    <strong>{getReportArea(selectedMapReport)}</strong>
                  </div>

                  <div className="premium-lf-report-detail-box">
                    <span>Status</span>
                    <strong>{selectedMapReport.status || "Active"}</strong>
                  </div>

                  <div className="premium-lf-report-detail-box">
                    <span>Type</span>
                    <strong>{selectedMapReport.type || "Report"}</strong>
                  </div>

                  <div className="premium-lf-report-detail-box">
                    <span>Priority</span>
                    <strong>{selectedMapReport.priority ? "Yes" : "No"}</strong>
                  </div>
                </div>

                <div className="premium-lf-report-modal-description">
                  <span>More details</span>
                  <p>
                    {selectedMapReport.notes ||
                      selectedMapReport.description ||
                      selectedMapReport.message ||
                      "No extra details were provided for this report yet."}
                  </p>
                </div>

                <div className="premium-lf-report-modal-actions">
                  <button
                    type="button"
                    className="premium-lf-primary-btn"
                    onClick={() => handleViewReport(selectedMapReport)}
                  >
                    {selectedMapReport.type === "found"
                      ? "Close"
                      : "Open Full Report Page"}
                  </button>

                  {selectedMapReport.type === "lost" && (
                    <button
                      type="button"
                      className="premium-lf-secondary-btn"
                      onClick={() =>
                        navigate(
                          `/premium/lostfound/view/${selectedMapReport.id}/sighting`
                        )
                      }
                    >
                      Submit Sighting
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}