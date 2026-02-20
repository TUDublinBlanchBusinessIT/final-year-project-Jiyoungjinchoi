import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css"; // reuse sidebar/topbar layout styles
import "./Community.css"; // feed-specific styles

export default function Community() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const token = localStorage.getItem("pawfection_token");

  useEffect(() => {
    // load user name (same logic as Dashboard)
    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name && typeof userObj.name === "string") setUserName(userObj.name);
      } else {
        const fallbackName =
          localStorage.getItem("pawfection_user_name") ||
          localStorage.getItem("user_name") ||
          localStorage.getItem("name");
        if (fallbackName) setUserName(fallbackName);
      }
    } catch {
      setUserName("User");
    }
  }, []);

  const fetchPosts = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/posts", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
          "Failed to load posts.";
        setError(msg);
        setPosts([]);
      } else {
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch {
      setError("Server error. Is your backend running?");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const canPost = useMemo(() => content.trim().length > 0 && content.trim().length <= 2000, [content]);

  const submitPost = async (e) => {
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

      const res = await fetch("http://127.0.0.1:8000/api/posts", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        // ignore
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

      // reset form + refresh feed
      setContent("");
      setImage(null);
      await fetchPosts();
    } catch {
      setError("Failed to post. Is the backend running?");
    } finally {
      setPosting(false);
    }
  };

  const prettyDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return "";
    }
  };

  return (
    <div className="pf2-shell">
      {/* Sidebar */}
      <aside className="pf2-sidebar">
        <div className="pf2-brand" onClick={() => navigate("/dashboard")} role="button">
          <img className="pf2-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pf2-brand-text">
            <div className="pf2-brand-title">Pawfection</div>
            <div className="pf2-brand-sub">Dashboard</div>
          </div>
        </div>

        <nav className="pf2-nav">
          <Link className="pf2-nav-item" to="/dashboard">Dashboard</Link>
          <Link className="pf2-nav-item" to="/mypets">My Pets</Link>
          <Link className="pf2-nav-item" to="/appointments">Appointments</Link>
          <Link className="pf2-nav-item" to="/reminders">Reminders</Link>
          <Link className="pf2-nav-item" to="/lostfound">Lost &amp; Found</Link>
          <Link className="pf2-nav-item active" to="/community">Community</Link>
          <Link className="pf2-nav-item" to="/inventory">Inventory</Link>
        </nav>

        <div className="pf2-sidebar-footer">
          <button className="pf2-btn pf2-btn-ghost" onClick={() => navigate("/profile")}>
            View Profile
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="pf2-main">
        {/* Topbar */}
        <header className="pf2-topbar">
          <div className="pf2-search">
            <input placeholder="Search posts, topics..." />
          </div>

          <div className="pf2-topbar-right">
            <div className="pf2-userchip" title={userName}>
              <div className="pf2-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pf2-userchip-text">
                <div className="pf2-userchip-name">{userName}</div>
                <div className="pf2-userchip-sub">User</div>
              </div>
            </div>
          </div>
        </header>

        <main className="pf2-content">
          <div className="pfc-head">
            <div>
              <h1 className="pfc-title">Community</h1>
              <p className="pfc-subtitle">Share updates, tips, and pet wins with others.</p>
            </div>
            <div className="pfc-badge">✨ New</div>
          </div>

          <section className="pfc-grid">
            {/* Composer */}
            <div className="pfc-card pfc-composer">
              <div className="pfc-card-top">
                <div className="pfc-card-title">Create a post</div>
                <div className="pfc-hint">Be kind. Keep it helpful.</div>
              </div>

              {error && <div className="pfc-alert">{error}</div>}

              <form onSubmit={submitPost}>
                <textarea
                  className="pfc-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What’s happening with your pet today?"
                  rows={4}
                />

                <div className="pfc-row">
                  <label className="pfc-file">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] || null)}
                    />
                    <span>{image ? "Image selected ✓" : "Add image"}</span>
                  </label>

                  <button className="pfc-postbtn" type="submit" disabled={posting || !canPost}>
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>

                <div className="pfc-char">
                  {content.trim().length}/2000
                </div>
              </form>
            </div>

            {/* Feed */}
            <div className="pfc-card pfc-feed">
              <div className="pfc-card-top">
                <div className="pfc-card-title">Latest posts</div>
                <button className="pfc-refresh" onClick={fetchPosts} disabled={loading}>
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {loading && <div className="pfc-empty">Loading posts…</div>}
              {!loading && posts.length === 0 && <div className="pfc-empty">No posts yet. Be the first 🐾</div>}

              {!loading && posts.length > 0 && (
                <div className="pfc-feedlist">
                  {posts.map((p) => (
                    <div key={p.id} className="pfc-post">
                      <div className="pfc-posthead">
                        <div className="pfc-author">
                          <div className="pfc-author-avatar">{(p?.user?.name?.[0] || "U").toUpperCase()}</div>
                          <div>
                            <div className="pfc-author-name">{p?.user?.name || "User"}</div>
                            <div className="pfc-time">{prettyDate(p.created_at)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="pfc-content">{p.content}</div>

                      {p.image_url && (
                        <div className="pfc-imagewrap">
                          <img src={p.image_url} alt="Post" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}