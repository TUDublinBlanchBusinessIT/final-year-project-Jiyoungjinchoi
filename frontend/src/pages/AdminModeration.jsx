import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminModeration() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState({
    type: "loading",
    message: "Loading reported posts...",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [actionBusy, setActionBusy] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("pawfection_token");
    const role = localStorage.getItem("pawfection_role");

    if (!token) {
      navigate("/login");
      return;
    }

    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }

    fetchReportedPosts();
  }, [navigate]);

  async function fetchReportedPosts() {
    const token = localStorage.getItem("pawfection_token");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/reported-posts", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load reported posts.");
      }

      setPosts(Array.isArray(data) ? data : []);
      setStatus({
        type: "success",
        message: data.length === 0 ? "No reported posts found." : "",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong while loading reported posts.",
      });
    }
  }

  async function handleApprove(postId) {
    const token = localStorage.getItem("pawfection_token");
    setActionBusy((prev) => ({ ...prev, [postId]: true }));

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/posts/${postId}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to approve post.");
      }

      await fetchReportedPosts();
    } catch (error) {
      alert(error.message || "Approve failed.");
    } finally {
      setActionBusy((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleRemove(postId) {
    const token = localStorage.getItem("pawfection_token");

    const confirmed = window.confirm("Are you sure you want to remove this post?");
    if (!confirmed) return;

    setActionBusy((prev) => ({ ...prev, [postId]: true }));

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/posts/${postId}/remove`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove post.");
      }

      if (data.user_banned) {
        alert("Post removed and user has been banned for repeat offences.");
      }

      await fetchReportedPosts();
    } catch (error) {
      alert(error.message || "Remove failed.");
    } finally {
      setActionBusy((prev) => ({ ...prev, [postId]: false }));
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc, #fdf2f8, #ecfeff)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 42,
                fontWeight: 900,
                color: "#111827",
              }}
            >
              Community Moderation
            </h1>
            <p
              style={{
                marginTop: 10,
                color: "#64748b",
                fontSize: 18,
              }}
            >
              Review reported posts in a clean moderation feed.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/dashboard")}
            style={{
              border: "none",
              background: "#111827",
              color: "#fff",
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </div>

        {status.type === "error" && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#9a3412",
              padding: 16,
              borderRadius: 16,
              marginBottom: 20,
              fontWeight: 700,
            }}
          >
            {status.message}
          </div>
        )}

        {status.type === "success" && posts.length === 0 && (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              padding: 16,
              borderRadius: 16,
              fontWeight: 700,
            }}
          >
            {status.message}
          </div>
        )}

        <div style={{ display: "grid", gap: 22 }}>
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 12px 28px rgba(0,0,0,.06)",
              }}
            >
              <div style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      {post.user?.name || "Unknown User"}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#64748b",
                        marginTop: 4,
                      }}
                    >
                      Reports: {post.report_count} · Status: {post.status}
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: "#fff7ed",
                      color: "#9a3412",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    Reported
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 16,
                    color: "#334155",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {post.content}
                </p>
              </div>

              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="Reported post"
                  onClick={() => setPreviewImage(post.image_url)}
                  style={{
                    width: "100%",
                    maxHeight: 560,
                    objectFit: "cover",
                    display: "block",
                    cursor: "pointer",
                    borderTop: "1px solid #e5e7eb",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                />
              )}

              <div
                style={{
                  padding: 18,
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                  background: "#fcfcfd",
                }}
              >
                <button
                  onClick={() => handleApprove(post.id)}
                  disabled={!!actionBusy[post.id]}
                  style={{
                    border: "none",
                    background: "#16a34a",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "12px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: actionBusy[post.id] ? 0.7 : 1,
                  }}
                >
                  {actionBusy[post.id] ? "Working..." : "Approve"}
                </button>

                <button
                  onClick={() => handleRemove(post.id)}
                  disabled={!!actionBusy[post.id]}
                  style={{
                    border: "none",
                    background: "#dc2626",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "12px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: actionBusy[post.id] ? 0.7 : 1,
                  }}
                >
                  {actionBusy[post.id] ? "Working..." : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 9999,
          }}
        >
          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: "92vw",
              maxHeight: "90vh",
              borderRadius: 20,
              boxShadow: "0 24px 60px rgba(0,0,0,.35)",
            }}
          />
        </div>
      )}
    </div>
  );
}