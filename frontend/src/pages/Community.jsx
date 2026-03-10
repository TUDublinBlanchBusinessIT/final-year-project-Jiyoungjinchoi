import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./Community.css";

export default function Community() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  // Likes + Comments UI state
  const [openComments, setOpenComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [likeBusy, setLikeBusy] = useState({});
  const [commentBusy, setCommentBusy] = useState({});

  // Delete busy states
  const [deletePostBusy, setDeletePostBusy] = useState({});
  const [deleteCommentBusy, setDeleteCommentBusy] = useState({});

  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const authHeaders = useMemo(() => {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  useEffect(() => {
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

  const resolvePostImage = (post) => {
    const raw =
      post?.image_url ||
      post?.imageUrl ||
      post?.image_path ||
      post?.imagePath ||
      post?.image ||
      null;

    if (!raw) return null;

    if (typeof raw === "string" && (raw.startsWith("http://") || raw.startsWith("https://")))
      return raw;

    if (typeof raw === "string" && raw.startsWith("/")) {
      return `http://127.0.0.1:8000${raw}`;
    }

    if (typeof raw === "string") {
      return `http://127.0.0.1:8000/storage/${raw}`.replace("/storage/storage/", "/storage/");
    }

    return null;
  };

  const fetchPosts = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
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

      setContent("");
      setImage(null);
      await fetchPosts();
    } catch {
      setError("Failed to post. Is the backend running?");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId) => {
    if (!token) return navigate("/login");
    if (likeBusy[postId]) return;

    setLikeBusy((p) => ({ ...p, [postId]: true }));
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
      setLikeBusy((p) => ({ ...p, [postId]: false }));
    }
  };

  const loadComments = async (postId) => {
    if (!token) return navigate("/login");
    if (commentsByPost[postId]) return;

    try {
      const res = await fetch(`${apiBase}/posts/${postId}/comments`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) return;

      setCommentsByPost((prev) => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
    } catch {
      // silent
    }
  };

  const submitComment = async (postId) => {
    if (!token) return navigate("/login");

    const text = (commentDraft[postId] || "").trim();
    if (!text) return;
    if (commentBusy[postId]) return;

    setCommentBusy((p) => ({ ...p, [postId]: true }));
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
        prev.map((p) => (p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p))
      );
    } finally {
      setCommentBusy((p) => ({ ...p, [postId]: false }));
    }
  };

  const deletePost = async (postId) => {
    if (!token) return navigate("/login");
    if (deletePostBusy[postId]) return;

    const ok = window.confirm("Delete this post? This cannot be undone.");
    if (!ok) return;

    setDeletePostBusy((p) => ({ ...p, [postId]: true }));
    setError("");

    const attempts = [
      { method: "DELETE", url: `${apiBase}/posts/${postId}` },
      { method: "POST", url: `${apiBase}/posts/${postId}/delete` },
      { method: "POST", url: `${apiBase}/posts/${postId}`, body: { _method: "DELETE" } },
    ];

    try {
      let lastErr = "Failed to delete post.";

      for (const a of attempts) {
        const res = await fetch(a.url, {
          method: a.method,
          headers:
            a.method === "POST"
              ? { ...authHeaders, "Content-Type": "application/json" }
              : authHeaders,
          body: a.body ? JSON.stringify(a.body) : undefined,
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
      setDeletePostBusy((p) => ({ ...p, [postId]: false }));
    }
  };

  const deleteComment = async (postId, commentId) => {
    if (!token) return navigate("/login");
    if (deleteCommentBusy[commentId]) return;

    const ok = window.confirm("Delete this comment?");
    if (!ok) return;

    setDeleteCommentBusy((p) => ({ ...p, [commentId]: true }));
    setError("");

    const attempts = [
      { method: "DELETE", url: `${apiBase}/comments/${commentId}` },
      { method: "DELETE", url: `${apiBase}/posts/${postId}/comments/${commentId}` },
      { method: "POST", url: `${apiBase}/comments/${commentId}/delete` },
      { method: "POST", url: `${apiBase}/comments/${commentId}`, body: { _method: "DELETE" } },
    ];

    try {
      let lastErr = "Failed to delete comment.";

      for (const a of attempts) {
        const res = await fetch(a.url, {
          method: a.method,
          headers:
            a.method === "POST"
              ? { ...authHeaders, "Content-Type": "application/json" }
              : authHeaders,
          body: a.body ? JSON.stringify(a.body) : undefined,
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setCommentsByPost((prev) => ({
            ...prev,
            [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
          }));

          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) } : p
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
      setDeleteCommentBusy((p) => ({ ...p, [commentId]: false }));
    }
  };

  const prettyDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-IE");
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

                <div className="pfc-char">{content.trim().length}/2000</div>
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
                  {posts.map((p) => {
                    const imgSrc = resolvePostImage(p);

                    return (
                      <div key={p.id} className="pfc-post">
                        <div className="pfc-posthead">
                          <div className="pfc-author">
                            <div className="pfc-author-avatar">
                              {(p?.user?.name?.[0] || "U").toUpperCase()}
                            </div>
                            <div>
                              <div className="pfc-author-name">{p?.user?.name || "User"}</div>
                              <div className="pfc-time">{prettyDate(p.created_at)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="pfc-content">{p.content}</div>

                        {imgSrc && (
                          <div className="pfc-imagewrap">
                            <img
                              src={imgSrc}
                              alt="Post"
                              onError={(e) => {
                                console.log("Image failed to load:", imgSrc);
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        <div className="pfc-actions">
                          <button
                            type="button"
                            className={`pfc-actionbtn ${p.liked_by_me ? "is-liked" : ""}`}
                            onClick={() => toggleLike(p.id)}
                            disabled={!!likeBusy[p.id]}
                            title="Like"
                          >
                            <span className="pfc-actionicon">{p.liked_by_me ? "❤️" : "🤍"}</span>
                            <span>Like</span>
                            <span className="pfc-count">{p.like_count || 0}</span>
                          </button>

                          <button
                            type="button"
                            className={`pfc-actionbtn ${openComments[p.id] ? "is-open" : ""}`}
                            onClick={() => {
                              setOpenComments((prev) => ({ ...prev, [p.id]: !prev[p.id] }));
                              if (!openComments[p.id]) loadComments(p.id);
                            }}
                            title="Comment"
                          >
                            <span className="pfc-actionicon">💬</span>
                            <span>Comment</span>
                            <span className="pfc-count">
                              {p.comment_count || (commentsByPost[p.id]?.length ?? 0)}
                            </span>
                          </button>

                          <button
                            type="button"
                            className="pfc-actionbtn pfc-actionbtn-danger"
                            onClick={() => deletePost(p.id)}
                            disabled={!!deletePostBusy[p.id]}
                            title="Delete post"
                          >
                            <span className="pfc-actionicon">🗑️</span>
                            <span>{deletePostBusy[p.id] ? "Deleting..." : "Delete"}</span>
                          </button>
                        </div>

                        {openComments[p.id] && (
                          <div className="pfc-comments">
                            <div className="pfc-commentbox">
                              <input
                                className="pfc-commentinput"
                                value={commentDraft[p.id] || ""}
                                onChange={(e) =>
                                  setCommentDraft((prev) => ({ ...prev, [p.id]: e.target.value }))
                                }
                                placeholder="Write a comment..."
                              />
                              <button
                                type="button"
                                className="pfc-commentsend"
                                onClick={() => submitComment(p.id)}
                                disabled={!!commentBusy[p.id]}
                              >
                                {commentBusy[p.id] ? "Sending..." : "Send"}
                              </button>
                            </div>

                            {(commentsByPost[p.id] || []).length === 0 ? (
                              <div className="pfc-empty pfc-empty-small">No comments yet.</div>
                            ) : (
                              <div className="pfc-commentlist">
                                {(commentsByPost[p.id] || []).map((c) => (
                                  <div key={c.id} className="pfc-comment">
                                    <div className="pfc-commentavatar">
                                      {(c?.user?.name?.[0] || "U").toUpperCase()}
                                    </div>

                                    <div className="pfc-commentbody">
                                      <div className="pfc-commentname">{c?.user?.name || "User"}</div>
                                      <div className="pfc-commenttext">{c.content}</div>
                                    </div>

                                    <button
                                      type="button"
                                      className="pfc-commentdelete"
                                      onClick={() => deleteComment(p.id, c.id)}
                                      disabled={!!deleteCommentBusy[c.id]}
                                      title="Delete comment"
                                    >
                                      {deleteCommentBusy[c.id] ? "..." : "Delete"}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}