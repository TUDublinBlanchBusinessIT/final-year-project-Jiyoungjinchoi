import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumCommunity.css";

const CAPTION_LIBRARY = [
  "Having a pawsome day 🐾",
  "Too cute to handle 💖",
  "Living the good life, one wag at a time ✨",
  "Adventure mode: activated 🌿",
  "Another happy tail-wagging memory 🐶",
  "Just a little pet joy for your feed 💕",
  "Making today extra pawfect 🐾",
  "Tiny paws, big personality 💫",
];

function getSuggestedHashtags(text) {
  const lower = String(text || "").toLowerCase();
  const tags = [];

  if (lower.includes("park")) tags.push("#ParkDay");
  if (lower.includes("cute")) tags.push("#CutePet");
  if (lower.includes("walk")) tags.push("#WalkTime");
  if (lower.includes("sleep") || lower.includes("nap")) tags.push("#NapTime");
  if (lower.includes("play") || lower.includes("toy")) tags.push("#PlayfulPaws");
  if (lower.includes("food") || lower.includes("treat")) tags.push("#TastyTreats");
  if (lower.includes("happy")) tags.push("#HappyPet");
  if (lower.includes("groom")) tags.push("#FreshGroom");
  if (lower.includes("sun")) tags.push("#SunnyPaws");
  if (lower.includes("love")) tags.push("#PetLove");

  return [...new Set(tags)].slice(0, 5);
}

export default function PremiumCommunity() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [todayText, setTodayText] = useState("");

  const [posts, setPosts] = useState([]);
  const [pets, setPets] = useState([]);

  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingPets, setLoadingPets] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [captionSuggestions, setCaptionSuggestions] = useState([]);
  const [sortMode, setSortMode] = useState("latest");

  const [openComments, setOpenComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [likeBusy, setLikeBusy] = useState({});
  const [commentBusy, setCommentBusy] = useState({});
  const [reportBusy, setReportBusy] = useState({});
  const [deletePostBusy, setDeletePostBusy] = useState({});
  const [deleteCommentBusy, setDeleteCommentBusy] = useState({});

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const authHeaders = useMemo(
    () => ({
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const canPost = useMemo(() => {
    return content.trim().length > 0 && content.trim().length <= 2000;
  }, [content]);

  const hashtagSuggestions = useMemo(() => getSuggestedHashtags(content), [content]);

  const selectedPet = useMemo(() => {
    return pets.find((pet) => String(pet.id) === String(selectedPetId)) || null;
  }, [pets, selectedPetId]);

  const premiumStats = useMemo(() => {
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + Number(post.like_count || 0), 0);
    const totalComments = posts.reduce(
      (sum, post) => sum + Number(post.comment_count || 0),
      0
    );

    return { totalPosts, totalLikes, totalComments };
  }, [posts]);

  const displayedPosts = useMemo(() => {
    const list = [...posts];

    if (sortMode === "trending") {
      return list.sort((a, b) => {
        const scoreA = Number(a.like_count || 0) + Number(a.comment_count || 0);
        const scoreB = Number(b.like_count || 0) + Number(b.comment_count || 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }

    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [posts, sortMode]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);

        if (userObj?.name && typeof userObj.name === "string") {
          setUserName(userObj.name);
        }

        if (userObj?.id) {
          setCurrentUserId(userObj.id);
        }
      } else {
        const fallbackName =
          localStorage.getItem("pawfection_user_name") ||
          localStorage.getItem("user_name") ||
          localStorage.getItem("name");

        if (fallbackName) setUserName(fallbackName);
      }
    } catch {
      setUserName("User");
      setCurrentUserId(null);
    }

    setTodayText(
      new Date().toLocaleDateString("en-IE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    fetchPosts();
    fetchPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const resolvePostImage = (post) => {
    const raw =
      post?.image_url ||
      post?.imageUrl ||
      post?.image_path ||
      post?.imagePath ||
      post?.image ||
      null;

    if (!raw) return null;

    if (
      typeof raw === "string" &&
      (raw.startsWith("http://") || raw.startsWith("https://"))
    ) {
      return raw;
    }

    if (typeof raw === "string" && raw.startsWith("/")) {
      return `http://127.0.0.1:8000${raw}`;
    }

    if (typeof raw === "string") {
      return `http://127.0.0.1:8000/storage/${raw}`.replace(
        "/storage/storage/",
        "/storage/"
      );
    }

    return null;
  };

  const getPetSummary = (pet) => {
    if (!pet) return "Pet";
    const parts = [];
    if (pet?.name) parts.push(pet.name);
    if (pet?.breed) parts.push(pet.breed);
    else if (pet?.species) parts.push(pet.species);
    return parts.join(" • ");
  };

  const prettyDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-IE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  async function fetchPosts() {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoadingPosts(true);
    setError("");

    try {
      const res = await fetch(`${apiBase}/posts`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => []);

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to load posts.";
        setError(msg);
        setPosts([]);
      } else {
        setPosts(Array.isArray(data) ? data : data?.data || []);
      }
    } catch {
      setError("Server error. Is your backend running?");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }

  async function fetchPets() {
    if (!token) return;

    setLoadingPets(true);

    try {
      const res = await fetch(`${apiBase}/pets`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPets([]);
      } else {
        setPets(Array.isArray(data) ? data : data?.pets || []);
      }
    } catch {
      setPets([]);
    } finally {
      setLoadingPets(false);
    }
  }

  function suggestCaptions() {
    const shuffled = [...CAPTION_LIBRARY].sort(() => 0.5 - Math.random());
    setCaptionSuggestions(shuffled.slice(0, 3));
  }

  function applyCaptionSuggestion(text) {
    setContent(text);
  }

  function addHashtag(tag) {
    const trimmed = content.trim();
    if (!trimmed) {
      setContent(tag);
      return;
    }
    if (trimmed.includes(tag)) return;
    setContent(`${trimmed} ${tag}`);
  }

  async function submitPost(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!canPost) {
      setError("Please write something (max 2000 characters).");
      return;
    }

    if (image) {
      const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowed.includes(image.type)) {
        setError("Image must be JPG, PNG, or WEBP.");
        return;
      }
      if (image.size > 2 * 1024 * 1024) {
        setError("Image must be 2MB or less.");
        return;
      }
    }

    setPosting(true);

    try {
      const fd = new FormData();
      fd.append("content", content.trim());
      if (image) fd.append("image", image);
      if (selectedPetId) fd.append("pet_id", selectedPetId);

      const res = await fetch(`${apiBase}/posts`, {
        method: "POST",
        headers: authHeaders,
        body: fd,
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          `Failed to post (${res.status}).`;
        setError(msg);
        setPosting(false);
        return;
      }

      setContent("");
      setImage(null);
      setSelectedPetId("");
      setCaptionSuggestions([]);
      await fetchPosts();
    } catch {
      setError("Failed to post. Is the backend running?");
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(postId) {
    if (!token) return navigate("/login");
    if (likeBusy[postId]) return;

    setLikeBusy((prev) => ({ ...prev, [postId]: true }));
    setError("");

    try {
      const res = await fetch(`${apiBase}/posts/${postId}/like`, {
        method: "POST",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          `Like failed (${res.status})`;
        setError(msg);
        return;
      }

      await fetchPosts();
    } finally {
      setLikeBusy((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleReportPost(postId) {
    if (!token) return navigate("/login");
    if (reportBusy[postId]) return;

    const ok = window.confirm("Report this post to admin?");
    if (!ok) return;

    setReportBusy((prev) => ({ ...prev, [postId]: true }));
    setError("");

    try {
      const response = await fetch(`${apiBase}/posts/${postId}/report`, {
        method: "POST",
        headers: authHeaders,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to report post.";
        setError(msg);
        return;
      }

      alert("Post reported successfully.");
      await fetchPosts();
    } catch (err) {
      console.error("Report post error:", err);
      setError("Something went wrong while reporting the post.");
    } finally {
      setReportBusy((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function loadComments(postId) {
    if (!token) return navigate("/login");
    if (commentsByPost[postId]) return;

    try {
      const res = await fetch(`${apiBase}/posts/${postId}/comments`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) return;

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: Array.isArray(data) ? data : [],
      }));
    } catch {
      // silent
    }
  }

  async function submitComment(postId) {
    if (!token) return navigate("/login");

    const text = (commentDraft[postId] || "").trim();
    if (!text) return;
    if (commentBusy[postId]) return;

    setCommentBusy((prev) => ({ ...prev, [postId]: true }));
    setError("");

    try {
      const res = await fetch(`${apiBase}/posts/${postId}/comments`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          `Comment failed (${res.status})`;
        setError(msg);
        return;
      }

      const newComment = data.comment || data;

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [newComment, ...(prev[postId] || [])],
      }));

      setCommentDraft((prev) => ({ ...prev, [postId]: "" }));

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comment_count: Number(p.comment_count || 0) + 1 }
            : p
        )
      );
    } finally {
      setCommentBusy((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function deletePost(postId) {
    if (!token) return navigate("/login");
    if (deletePostBusy[postId]) return;

    const ok = window.confirm("Delete this post? This cannot be undone.");
    if (!ok) return;

    setDeletePostBusy((prev) => ({ ...prev, [postId]: true }));
    setError("");

    const attempts = [
      { method: "DELETE", url: `${apiBase}/posts/${postId}` },
      { method: "POST", url: `${apiBase}/posts/${postId}/delete` },
      { method: "POST", url: `${apiBase}/posts/${postId}`, body: { _method: "DELETE" } },
    ];

    try {
      let lastErr = "Failed to delete post.";

      for (const attempt of attempts) {
        const res = await fetch(attempt.url, {
          method: attempt.method,
          headers:
            attempt.method === "POST"
              ? { ...authHeaders, "Content-Type": "application/json" }
              : authHeaders,
          body: attempt.body ? JSON.stringify(attempt.body) : undefined,
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setOpenComments((prev) => ({ ...prev, [postId]: false }));
          setCommentsByPost((prev) => {
            const copy = { ...prev };
            delete copy[postId];
            return copy;
          });

          await fetchPosts();
          return;
        }

        lastErr =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          `Delete failed (${res.status})`;
      }

      setError(lastErr);
    } catch {
      setError("Failed to delete post. Is the backend running?");
    } finally {
      setDeletePostBusy((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function deleteComment(postId, commentId) {
    if (!token) return navigate("/login");
    if (deleteCommentBusy[commentId]) return;

    const ok = window.confirm("Delete this comment?");
    if (!ok) return;

    setDeleteCommentBusy((prev) => ({ ...prev, [commentId]: true }));
    setError("");

    const attempts = [
      { method: "DELETE", url: `${apiBase}/comments/${commentId}` },
      { method: "DELETE", url: `${apiBase}/posts/${postId}/comments/${commentId}` },
      { method: "POST", url: `${apiBase}/comments/${commentId}/delete` },
      { method: "POST", url: `${apiBase}/comments/${commentId}`, body: { _method: "DELETE" } },
    ];

    try {
      let lastErr = "Failed to delete comment.";

      for (const attempt of attempts) {
        const res = await fetch(attempt.url, {
          method: attempt.method,
          headers:
            attempt.method === "POST"
              ? { ...authHeaders, "Content-Type": "application/json" }
              : authHeaders,
          body: attempt.body ? JSON.stringify(attempt.body) : undefined,
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setCommentsByPost((prev) => ({
            ...prev,
            [postId]: (prev[postId] || []).filter((comment) => comment.id !== commentId),
          }));

          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    comment_count: Math.max(0, Number(post.comment_count || 1) - 1),
                  }
                : post
            )
          );

          return;
        }

        lastErr =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          `Delete failed (${res.status})`;
      }

      setError(lastErr);
    } catch {
      setError("Failed to delete comment. Is the backend running?");
    } finally {
      setDeleteCommentBusy((prev) => ({ ...prev, [commentId]: false }));
    }
  }

  return (
    <div className="ppc-shell">
      <header className="ppc-site-header">
        <div
          className="ppc-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img className="ppc-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="ppc-brand-copy">
            <div className="ppc-brand-title">Pawfection</div>
            <div className="ppc-brand-sub">Premium Community</div>
          </div>
        </div>

        <nav className="ppc-topnav">
          <Link className="ppc-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="ppc-topnav-item" to="/premium-mypets">
            My Pets
          </Link>
          <Link className="ppc-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="ppc-topnav-item" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="ppc-topnav-item" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="ppc-topnav-item active" to="/premium/community">
            Community
          </Link>
          <Link className="ppc-topnav-item" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="ppc-topnav-item" to="/premium/vet-chat">
            AI Pet Assistant
          </Link>
          <Link className="ppc-topnav-item" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="ppc-header-side">
          <div className="ppc-date-pill">{todayText}</div>
          <div className="ppc-userchip" title={userName}>
            <div className="ppc-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
            <div className="ppc-userchip-text">
              <div className="ppc-userchip-name">{userName}</div>
              <div className="ppc-userchip-sub">Premium User</div>
            </div>
          </div>
        </div>
      </header>

      <main className="ppc-main">
        <section className="ppc-hero">
          <span className="ppc-doodle ppc-doodle-paw-1">🐾</span>
          <span className="ppc-doodle ppc-doodle-paw-2">🐾</span>
          <span className="ppc-doodle ppc-doodle-heart">💗</span>
          <span className="ppc-doodle ppc-doodle-star">✨</span>

          <div className="ppc-hero-copy">
            <div className="ppc-kicker">Premium Social Space</div>
            <h1 className="ppc-hero-title">Share smarter, post prettier, connect better.</h1>
            <p className="ppc-hero-text">
              Tag your pets, get smart caption ideas, discover hashtag prompts, and
              enjoy a more polished premium community experience.
            </p>

            <div className="ppc-hero-chips">
              <div className="ppc-chip">⭐ Premium Community</div>
              <div className="ppc-chip">🐾 Pet Tagging</div>
              <div className="ppc-chip">✨ Smart Captions</div>
              <div className="ppc-chip">🔥 Trending Feed</div>
            </div>
          </div>

          <div className="ppc-hero-stats">
            <article className="ppc-stat-card">
              <div className="ppc-stat-label">Posts</div>
              <div className="ppc-stat-value">{premiumStats.totalPosts}</div>
            </article>

            <article className="ppc-stat-card">
              <div className="ppc-stat-label">Likes</div>
              <div className="ppc-stat-value">{premiumStats.totalLikes}</div>
            </article>

            <article className="ppc-stat-card">
              <div className="ppc-stat-label">Comments</div>
              <div className="ppc-stat-value">{premiumStats.totalComments}</div>
            </article>
          </div>
        </section>

        <section className="ppc-grid">
          <section className="ppc-card ppc-composer-card">
            <div className="ppc-card-head">
              <div>
                <div className="ppc-card-kicker">Create post</div>
                <h2>Post to the premium community</h2>
                <p>Make your updates feel more personal with pet tags and smart extras.</p>
              </div>
              <div className="ppc-badge">⭐ Premium tools</div>
            </div>

            {error && <div className="ppc-alert">{error}</div>}

            <form onSubmit={submitPost} className="ppc-form">
              <textarea
                className="ppc-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What’s happening with your pet today?"
                rows={5}
              />

              <div className="ppc-toolbar">
                <div className="ppc-field">
                  <label className="ppc-label">Tag a pet</label>
                  <select
                    className="ppc-select"
                    value={selectedPetId}
                    onChange={(e) => setSelectedPetId(e.target.value)}
                    disabled={loadingPets}
                  >
                    <option value="">
                      {loadingPets ? "Loading pets..." : "No pet tag selected"}
                    </option>
                    {pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {getPetSummary(pet)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ppc-field">
                  <label className="ppc-label">Add image</label>
                  <label className="ppc-file">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] || null)}
                    />
                    <span>{image ? "Image selected ✓" : "Choose image"}</span>
                  </label>
                </div>
              </div>

              {selectedPet && (
                <div className="ppc-selected-pet">
                  <span className="ppc-selected-pet-icon">🐾</span>
                  <span>
                    Posting as <strong>{selectedPet.name}</strong>
                    {selectedPet.breed ? ` • ${selectedPet.breed}` : ""}
                  </span>
                </div>
              )}

              <div className="ppc-ai-tools">
                <button
                  type="button"
                  className="ppc-btn"
                  onClick={suggestCaptions}
                >
                  ✨ Suggest captions
                </button>

                <div className="ppc-char">{content.trim().length}/2000</div>
              </div>

              {captionSuggestions.length > 0 && (
                <div className="ppc-suggestion-block">
                  <div className="ppc-suggestion-title">Suggested captions</div>
                  <div className="ppc-suggestion-list">
                    {captionSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="ppc-suggestion-chip"
                        onClick={() => applyCaptionSuggestion(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hashtagSuggestions.length > 0 && (
                <div className="ppc-suggestion-block">
                  <div className="ppc-suggestion-title">Suggested hashtags</div>
                  <div className="ppc-suggestion-list">
                    {hashtagSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="ppc-hashtag-chip"
                        onClick={() => addHashtag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="ppc-submit-row">
                <div className="ppc-helper">
                  Share pet moments, advice, wins, and updates in a premium-style feed.
                </div>

                <button
                  className="ppc-btn ppc-btn-primary"
                  type="submit"
                  disabled={posting || !canPost}
                >
                  {posting ? "Posting..." : "Post update"}
                </button>
              </div>
            </form>
          </section>

          <section className="ppc-card ppc-feed-card">
            <div className="ppc-card-head">
              <div>
                <div className="ppc-card-kicker">Community feed</div>
                <h2>Premium feed</h2>
                <p>Switch between the latest updates and top-performing posts.</p>
              </div>

              <div className="ppc-feed-controls">
                <button
                  type="button"
                  className={`ppc-sort-btn ${sortMode === "latest" ? "active" : ""}`}
                  onClick={() => setSortMode("latest")}
                >
                  Latest
                </button>
                <button
                  type="button"
                  className={`ppc-sort-btn ${sortMode === "trending" ? "active" : ""}`}
                  onClick={() => setSortMode("trending")}
                >
                  Trending
                </button>
                <button
                  type="button"
                  className="ppc-sort-btn"
                  onClick={fetchPosts}
                  disabled={loadingPosts}
                >
                  {loadingPosts ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            {loadingPosts && <div className="ppc-empty">Loading posts…</div>}
            {!loadingPosts && displayedPosts.length === 0 && (
              <div className="ppc-empty">No posts yet. Be the first premium voice 🐾</div>
            )}

            {!loadingPosts && displayedPosts.length > 0 && (
              <div className="ppc-feed-list">
                {displayedPosts.map((post) => {
                  const imgSrc = resolvePostImage(post);
                  const isOwner = Number(currentUserId) === Number(post.user_id);
                  const taggedPet =
                    post?.pet ||
                    pets.find((pet) => String(pet.id) === String(post.pet_id)) ||
                    null;

                  return (
                    <article key={post.id} className="ppc-post">
                      <div className="ppc-post-head">
                        <div className="ppc-author">
                          <div className="ppc-author-avatar">
                            {(post?.user?.name?.[0] || "U").toUpperCase()}
                          </div>

                          <div>
                            <div className="ppc-author-row">
                              <div className="ppc-author-name">
                                {post?.user?.name || "User"}
                              </div>
                              <span className="ppc-premium-badge">⭐ Premium</span>
                            </div>
                            <div className="ppc-time">{prettyDate(post.created_at)}</div>
                          </div>
                        </div>

                        {sortMode === "trending" && (
                          <div className="ppc-trending-pill">🔥 Popular</div>
                        )}
                      </div>

                      {taggedPet && (
                        <div className="ppc-tagged-pet">
                          🐾 Tagged pet: <strong>{taggedPet.name}</strong>
                          {taggedPet.breed ? ` • ${taggedPet.breed}` : ""}
                        </div>
                      )}

                      <div className="ppc-post-content">{post.content}</div>

                      {imgSrc && (
                        <div className="ppc-image-wrap">
                          <img
                            src={imgSrc}
                            alt="Post"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      <div className="ppc-actions">
                        <button
                          type="button"
                          className={`ppc-action-btn ${post.liked_by_me ? "is-liked" : ""}`}
                          onClick={() => toggleLike(post.id)}
                          disabled={!!likeBusy[post.id]}
                        >
                          <span>{post.liked_by_me ? "❤️" : "🤍"}</span>
                          <span>Like</span>
                          <span className="ppc-count">{post.like_count || 0}</span>
                        </button>

                        <button
                          type="button"
                          className={`ppc-action-btn ${openComments[post.id] ? "is-open" : ""}`}
                          onClick={() => {
                            setOpenComments((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }));
                            if (!openComments[post.id]) loadComments(post.id);
                          }}
                        >
                          <span>💬</span>
                          <span>Comment</span>
                          <span className="ppc-count">
                            {post.comment_count || (commentsByPost[post.id]?.length ?? 0)}
                          </span>
                        </button>

                        {!isOwner && (
                          <button
                            type="button"
                            className="ppc-action-btn"
                            onClick={() => handleReportPost(post.id)}
                            disabled={!!reportBusy[post.id]}
                          >
                            <span>🚩</span>
                            <span>{reportBusy[post.id] ? "Reporting..." : "Report"}</span>
                          </button>
                        )}

                        {isOwner && (
                          <button
                            type="button"
                            className="ppc-action-btn ppc-action-btn-danger"
                            onClick={() => deletePost(post.id)}
                            disabled={!!deletePostBusy[post.id]}
                          >
                            <span>🗑️</span>
                            <span>{deletePostBusy[post.id] ? "Deleting..." : "Delete"}</span>
                          </button>
                        )}
                      </div>

                      {openComments[post.id] && (
                        <div className="ppc-comments">
                          <div className="ppc-comment-box">
                            <input
                              className="ppc-comment-input"
                              value={commentDraft[post.id] || ""}
                              onChange={(e) =>
                                setCommentDraft((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder="Write a comment..."
                            />
                            <button
                              type="button"
                              className="ppc-comment-send"
                              onClick={() => submitComment(post.id)}
                              disabled={!!commentBusy[post.id]}
                            >
                              {commentBusy[post.id] ? "Sending..." : "Send"}
                            </button>
                          </div>

                          {(commentsByPost[post.id] || []).length === 0 ? (
                            <div className="ppc-empty ppc-empty-small">No comments yet.</div>
                          ) : (
                            <div className="ppc-comment-list">
                              {(commentsByPost[post.id] || []).map((comment) => (
                                <div key={comment.id} className="ppc-comment">
                                  <div className="ppc-comment-avatar">
                                    {(comment?.user?.name?.[0] || "U").toUpperCase()}
                                  </div>

                                  <div className="ppc-comment-body">
                                    <div className="ppc-comment-name">
                                      {comment?.user?.name || "User"}
                                    </div>
                                    <div className="ppc-comment-text">{comment.content}</div>
                                  </div>

                                  <button
                                    type="button"
                                    className="ppc-comment-delete"
                                    onClick={() => deleteComment(post.id, comment.id)}
                                    disabled={!!deleteCommentBusy[comment.id]}
                                  >
                                    {deleteCommentBusy[comment.id] ? "..." : "Delete"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}