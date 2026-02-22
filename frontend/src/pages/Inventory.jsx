import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./Dashboard.css";
import "./Inventory.css";

export default function Inventory() {
  const navigate = useNavigate();
  const token = localStorage.getItem("pawfection_token");

  const [userName, setUserName] = useState("User");

  // inventory state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  // create form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Food",
    unit: "g",
    current_quantity: "",
    daily_usage: "",
    remind_before_days: 7,
  });

  // ✅ Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "Food",
    unit: "g",
    current_quantity: "",
    daily_usage: "",
    remind_before_days: 7,
  });

  // load user name like Dashboard
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

  const fetchInventory = async () => {
    if (!token) return navigate("/login");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/inventory", {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setError(data?.message || "Failed to load inventory.");
        setItems([]);
      } else {
        setItems(Array.isArray(data) ? data : data?.items || []);
      }
    } catch {
      setError("Server error. Is your backend running?");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onEditChange = (e) => setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const createItem = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");

    setError("");

    if (!form.name.trim()) return setError("Please enter product name.");
    if (form.current_quantity === "" || Number.isNaN(Number(form.current_quantity)))
      return setError("Please enter current quantity.");
    if (form.daily_usage === "" || Number.isNaN(Number(form.daily_usage)))
      return setError("Please enter daily usage.");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/inventory", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          unit: form.unit,
          current_quantity: Number(form.current_quantity),
          daily_usage: Number(form.daily_usage),
          remind_before_days: Number(form.remind_before_days || 7),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data?.message ||
            (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
            "Failed to add item."
        );
        return;
      }

      setShowForm(false);
      setForm({
        name: "",
        category: "Food",
        unit: "g",
        current_quantity: "",
        daily_usage: "",
        remind_before_days: 7,
      });

      await fetchInventory();
    } catch {
      setError("Failed to create item. Is your backend running?");
    }
  };

  const restockItem = async (id) => {
    if (!token) return navigate("/login");

    const qty = window.prompt("How much did you add (number)?");
    if (qty === null) return;

    const add = Number(qty);
    if (Number.isNaN(add) || add <= 0) return;

    setBusyId(id);
    setError("");

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/inventory/${id}/restock`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity_added: add }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Failed to restock.");
        return;
      }

      await fetchInventory();
    } finally {
      setBusyId(null);
    }
  };

  const deleteItem = async (id, name) => {
    if (!token) return navigate("/login");

    const ok = window.confirm(`Delete "${name}"?`);
    if (!ok) return;

    setBusyId(id);
    setError("");

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/inventory/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to delete item.");
        return;
      }

      setItems((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) setEditingId(null);
    } catch {
      setError("Failed to delete. Is your backend running?");
    } finally {
      setBusyId(null);
    }
  };

  // ✅ Start editing an item (prefill)
  const startEdit = (item) => {
    setError("");
    setEditingId(item.id);
    setShowForm(false); // close add form if open
    setEditForm({
      name: item.name || "",
      category: item.category || "Food",
      unit: item.unit || "g",
      current_quantity: item.current_quantity ?? "",
      daily_usage: item.daily_usage ?? "",
      remind_before_days: item.remind_before_days ?? 7,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    if (!token) return navigate("/login");

    setError("");

    if (!editForm.name.trim()) return setError("Please enter product name.");
    if (editForm.current_quantity === "" || Number.isNaN(Number(editForm.current_quantity)))
      return setError("Please enter current quantity.");
    if (editForm.daily_usage === "" || Number.isNaN(Number(editForm.daily_usage)))
      return setError("Please enter daily usage.");

    setBusyId(id);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/inventory/${id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          category: editForm.category,
          unit: editForm.unit,
          current_quantity: Number(editForm.current_quantity),
          daily_usage: Number(editForm.daily_usage),
          remind_before_days: Number(editForm.remind_before_days || 7),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data?.message ||
            (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
            "Failed to update item."
        );
        return;
      }

      setEditingId(null);
      await fetchInventory();
    } catch {
      setError("Failed to update. Is your backend running?");
    } finally {
      setBusyId(null);
    }
  };

  const badgeFor = (daysLeft) => {
    if (daysLeft === null || daysLeft === undefined) return { label: "N/A", cls: "pfi-badge" };
    if (daysLeft <= 0) return { label: "Overdue", cls: "pfi-badge pfi-badge-danger" };
    if (daysLeft <= 7) return { label: "Soon", cls: "pfi-badge pfi-badge-warn" };
    return { label: "OK", cls: "pfi-badge pfi-badge-ok" };
  };

  const restockSoon = useMemo(() => {
    return (items || [])
      .filter((i) => typeof i.days_left === "number" && i.days_left <= (i.remind_before_days ?? 7))
      .sort((a, b) => (a.days_left ?? 9999) - (b.days_left ?? 9999));
  }, [items]);

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
          <Link className="pf2-nav-item" to="/community">Community</Link>
          <Link className="pf2-nav-item active" to="/inventory">Inventory</Link>
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
            <input placeholder="Search inventory items..." />
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
          <div className="pfi-head">
            <div>
              <h1 className="pfi-title">Inventory</h1>
              <p className="pfi-subtitle">Track supplies and get smart restock reminders.</p>
            </div>

            <div className="pfi-actions">
              <button className="pf2-btn pf2-btn-primary" onClick={() => setShowForm((p) => !p)}>
                + Add Product
              </button>
              <button className="pf2-btn" onClick={fetchInventory} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {error && <div className="pfi-alert">{error}</div>}

          <section className="pfi-grid">
            {/* Left: Inventory list */}
            <div className="pfi-card">
              <div className="pfi-cardtop">
                <div className="pfi-cardtitle">Your items</div>
                <div className="pfi-mini">{items.length} items</div>
              </div>

              {showForm && (
                <form className="pfi-form" onSubmit={createItem}>
                  <div className="pfi-formgrid">
                    <div className="pfi-field">
                      <label>Product name *</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        placeholder="e.g., Dry food"
                      />
                    </div>

                    <div className="pfi-field">
                      <label>Category</label>
                      <select name="category" value={form.category} onChange={onChange}>
                        <option>Food</option>
                        <option>Supplement</option>
                        <option>Medication</option>
                        <option>Accessory</option>
                      </select>
                    </div>

                    <div className="pfi-field">
                      <label>Current quantity *</label>
                      <input
                        name="current_quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.current_quantity}
                        onChange={onChange}
                        placeholder="e.g., 1200"
                      />
                    </div>

                    <div className="pfi-field">
                      <label>Unit</label>
                      <select name="unit" value={form.unit} onChange={onChange}>
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="tablets">tablets</option>
                        <option value="pcs">pcs</option>
                      </select>
                    </div>

                    <div className="pfi-field">
                      <label>Daily usage *</label>
                      <input
                        name="daily_usage"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.daily_usage}
                        onChange={onChange}
                        placeholder="e.g., 50"
                      />
                    </div>

                    <div className="pfi-field">
                      <label>Remind before (days)</label>
                      <input
                        name="remind_before_days"
                        type="number"
                        min="1"
                        step="1"
                        value={form.remind_before_days}
                        onChange={onChange}
                      />
                    </div>
                  </div>

                  <div className="pfi-formactions">
                    <button className="pf2-btn pf2-btn-primary" type="submit">
                      Save
                    </button>
                    <button className="pf2-btn" type="button" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {loading && <div className="pfi-empty">Loading inventory…</div>}
              {!loading && items.length === 0 && (
                <div className="pfi-empty">
                  No items yet. Click <b>+ Add Product</b> to start.
                </div>
              )}

              {!loading && items.length > 0 && (
                <div className="pfi-list">
                  {items.map((i) => {
                    const badge = badgeFor(i.days_left);
                    const isEditing = editingId === i.id;

                    return (
                      <div key={i.id} className="pfi-row">
                        <div className="pfi-left">
                          {isEditing ? (
                            <div className="pfi-editwrap">
                              <div className="pfi-formgrid">
                                <div className="pfi-field">
                                  <label>Name *</label>
                                  <input name="name" value={editForm.name} onChange={onEditChange} />
                                </div>

                                <div className="pfi-field">
                                  <label>Category</label>
                                  <select
                                    name="category"
                                    value={editForm.category}
                                    onChange={onEditChange}
                                  >
                                    <option>Food</option>
                                    <option>Supplement</option>
                                    <option>Medication</option>
                                    <option>Accessory</option>
                                  </select>
                                </div>

                                <div className="pfi-field">
                                  <label>Current quantity *</label>
                                  <input
                                    name="current_quantity"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.current_quantity}
                                    onChange={onEditChange}
                                  />
                                </div>

                                <div className="pfi-field">
                                  <label>Unit</label>
                                  <select name="unit" value={editForm.unit} onChange={onEditChange}>
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="tablets">tablets</option>
                                    <option value="pcs">pcs</option>
                                  </select>
                                </div>

                                <div className="pfi-field">
                                  <label>Daily usage *</label>
                                  <input
                                    name="daily_usage"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.daily_usage}
                                    onChange={onEditChange}
                                  />
                                </div>

                                <div className="pfi-field">
                                  <label>Remind before (days)</label>
                                  <input
                                    name="remind_before_days"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={editForm.remind_before_days}
                                    onChange={onEditChange}
                                  />
                                </div>
                              </div>

                              <div className="pfi-formactions">
                                <button
                                  className="pf2-btn pf2-btn-primary"
                                  type="button"
                                  onClick={() => saveEdit(i.id)}
                                  disabled={busyId === i.id}
                                >
                                  {busyId === i.id ? "Saving..." : "Save"}
                                </button>

                                <button
                                  className="pf2-btn"
                                  type="button"
                                  onClick={cancelEdit}
                                  disabled={busyId === i.id}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="pfi-name">{i.name}</div>
                              <div className="pfi-sub">
                                {i.category} • {i.current_quantity} {i.unit} •{" "}
                                {typeof i.days_left === "number"
                                  ? `${i.days_left} days left`
                                  : "No estimate"}
                              </div>
                            </>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="pfi-right">
                            <div className={badge.cls}>{badge.label}</div>

                            <button
                              className="pf2-btn pf2-btn-small"
                              onClick={() => restockItem(i.id)}
                              disabled={busyId === i.id}
                            >
                              {busyId === i.id ? "..." : "Restocked"}
                            </button>

                            <button
                              className="pf2-btn pf2-btn-small pfi-edit"
                              onClick={() => startEdit(i)}
                              disabled={busyId === i.id}
                            >
                              Edit
                            </button>

                            <button
                              className="pf2-btn pf2-btn-small pfi-delete"
                              onClick={() => deleteItem(i.id, i.name)}
                              disabled={busyId === i.id}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Restock soon + Suggestions */}
            <div className="pfi-stack">
              <div className="pfi-card">
                <div className="pfi-cardtop">
                  <div className="pfi-cardtitle">Restock soon</div>
                  <div className="pfi-mini">Based on usage</div>
                </div>

                {restockSoon.length === 0 ? (
                  <div className="pfi-empty">Nothing urgent right now 🎉</div>
                ) : (
                  <div className="pfi-soonlist">
                    {restockSoon.slice(0, 5).map((i) => (
                      <div key={i.id} className="pfi-soon">
                        <div>
                          <div className="pfi-soonname">{i.name}</div>
                          <div className="pfi-soonsub">{i.days_left} days left</div>
                        </div>
                        <button
                          className="pf2-btn pf2-btn-small"
                          onClick={() => restockItem(i.id)}
                          disabled={busyId === i.id}
                        >
                          {busyId === i.id ? "..." : "Restocked"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pfi-card">
                <div className="pfi-cardtop">
                  <div className="pfi-cardtitle">Suggested deals</div>
                  <div className="pfi-mini">Future monetisation</div>
                </div>

                <div className="pfi-deals">
                  <div className="pfi-deal">
                    <div className="pfi-dealtitle">10% off supplements</div>
                    <div className="pfi-dealsub">Partner store (demo)</div>
                  </div>
                  <div className="pfi-deal">
                    <div className="pfi-dealtitle">Food bundle offer</div>
                    <div className="pfi-dealsub">Local deals (demo)</div>
                  </div>
                  <div className="pfi-deal">
                    <div className="pfi-dealtitle">Medication reminder packs</div>
                    <div className="pfi-dealsub">Coming soon</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}