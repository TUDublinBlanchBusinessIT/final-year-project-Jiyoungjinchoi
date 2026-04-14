import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
import "./PremiumDashboard.css";
import "./PremiumInventory.css";

const FILTERS = ["All", "Urgent", "Low Stock", "Out of Stock", "Healthy"];

function formatQuantity(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return String(Math.round(num));
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function categoryIcon(category) {
  const c = (category || "").toLowerCase();
  if (c === "food") return "🍖";
  if (c === "supplement") return "🧴";
  if (c === "medication") return "💊";
  if (c === "accessory") return "🦴";
  return "📦";
}

function statusInfo(item) {
  const qty = Number(item?.current_quantity || 0);
  const daysLeft = item?.days_left;
  const threshold = Number(item?.remind_before_days ?? 7);

  if (qty <= 0) {
    return { label: "Out of stock", cls: "out", priority: 1 };
  }

  if (typeof daysLeft === "number" && daysLeft <= 0) {
    return { label: "Critical", cls: "critical", priority: 1 };
  }

  if (typeof daysLeft === "number" && daysLeft <= threshold) {
    return { label: "Low stock", cls: "low", priority: 2 };
  }

  return { label: "Healthy", cls: "healthy", priority: 3 };
}

function canLogUsage(category) {
  return ["food", "supplement", "medication"].includes(
    String(category || "").toLowerCase()
  );
}

function getSliderStep() {
  return 1;
}

function getInitialUsageValue(item) {
  const stock = Math.round(Number(item?.current_quantity || 0));
  const daily = Math.round(Number(item?.daily_usage || 0));

  if (stock <= 0) return "0";
  if (daily > 0) return String(Math.min(daily, 5000, stock));

  return "1";
}

function getInsightText({ outOfStock, lowStock, healthy, mostUrgent }) {
  if (mostUrgent) {
    const icon = categoryIcon(mostUrgent.category);
    const status = statusInfo(mostUrgent).label;
    return `${icon} ${mostUrgent.name} is your most urgent inventory item right now (${status}).`;
  }

  if (outOfStock.length > 0) {
    return `You have ${outOfStock.length} item${
      outOfStock.length > 1 ? "s" : ""
    } out of stock. Restocking these first will keep care routines uninterrupted.`;
  }

  if (lowStock.length > 0) {
    return `${lowStock.length} item${
      lowStock.length > 1 ? "s are" : " is"
    } running low. This is a good time to plan your next restock.`;
  }

  if (healthy.length > 0) {
    return "Inventory levels look healthy right now. Everything appears well stocked.";
  }

  return "No inventory items yet. Add products to start tracking stock levels.";
}

export default function PremiumInventory() {
  const navigate = useNavigate();
  const token = localStorage.getItem("pawfection_token");
  const apiBase = "http://127.0.0.1:8000/api";

  const [userName, setUserName] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Food",
    unit: "g",
    current_quantity: "",
    daily_usage: "",
    remind_before_days: 7,
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "Food",
    unit: "g",
    current_quantity: "",
    daily_usage: "",
    remind_before_days: 7,
  });

  const [usageOpenId, setUsageOpenId] = useState(null);
  const [usageAmount, setUsageAmount] = useState("");

  const authHeaders = useMemo(() => {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const loadUserName = () => {
    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name && typeof userObj.name === "string") {
          setUserName(userObj.name);
          return;
        }
      }

      const fallbackName =
        localStorage.getItem("pawfection_user_name") ||
        localStorage.getItem("user_name") ||
        localStorage.getItem("name");

      if (fallbackName) setUserName(fallbackName);
    } catch {
      setUserName("User");
    }
  };

  const fetchInventory = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/inventory`, {
        headers: authHeaders,
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
    const savedToken = localStorage.getItem("pawfection_token");
    const savedRole = String(
      localStorage.getItem("pawfection_role") || ""
    ).toLowerCase();

    if (!savedToken) {
      navigate("/login");
      return;
    }

    if (savedRole === "admin") {
      navigate("/admin-dashboard");
      return;
    }

    localStorage.setItem("pawfection_account_type", "premium");
    loadUserName();
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onEditChange = (e) =>
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const createItem = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");

    setError("");
    setSuccess("");

    if (!form.name.trim()) return setError("Please enter product name.");
    if (
      form.current_quantity === "" ||
      Number.isNaN(Number(form.current_quantity))
    ) {
      return setError("Please enter current quantity.");
    }
    if (form.daily_usage === "" || Number.isNaN(Number(form.daily_usage))) {
      return setError("Please enter daily usage.");
    }

    try {
      const res = await fetch(`${apiBase}/inventory`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          unit: form.unit,
          current_quantity: Math.round(Number(form.current_quantity)),
          daily_usage: Math.round(Number(form.daily_usage)),
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

      setSuccess("Item added successfully!");
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

    const add = Math.round(Number(qty));
    if (Number.isNaN(add) || add <= 0) return;

    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/inventory/${id}/restock`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity_added: add }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to restock.");
        return;
      }

      setSuccess("Item restocked successfully!");
      await fetchInventory();
    } finally {
      setBusyId(null);
    }
  };

  const openUsageForm = (item) => {
    setError("");
    setSuccess("");
    setEditingId(null);
    setShowForm(false);
    setUsageOpenId(item.id);
    setUsageAmount(getInitialUsageValue(item));
  };

  const cancelUsageForm = () => {
    setUsageOpenId(null);
    setUsageAmount("");
  };

  const consumeItem = async (id) => {
    if (!token) return navigate("/login");

    const used = Math.round(Number(usageAmount));

    if (usageAmount === "" || Number.isNaN(used) || used <= 0) {
      setError("Please choose a valid amount used today.");
      return;
    }

    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/inventory/${id}/consume`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity_used: used }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data?.message ||
            (data?.errors ? Object.values(data.errors).flat().join(" ") : "") ||
            "Failed to log usage."
        );
        return;
      }

      setSuccess("Usage logged successfully!");
      setUsageOpenId(null);
      setUsageAmount("");
      await fetchInventory();
    } catch {
      setError("Failed to log usage. Is your backend running?");
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
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/inventory/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to delete item.");
        return;
      }

      setSuccess("Item deleted successfully!");
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) setEditingId(null);
      if (usageOpenId === id) setUsageOpenId(null);
    } catch {
      setError("Failed to delete. Is your backend running?");
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (item) => {
    setError("");
    setSuccess("");
    setEditingId(item.id);
    setShowForm(false);
    setUsageOpenId(null);
    setEditForm({
      name: item.name || "",
      category: item.category || "Food",
      unit: item.unit || "g",
      current_quantity: Math.round(Number(item.current_quantity ?? 0)),
      daily_usage: Math.round(Number(item.daily_usage ?? 0)),
      remind_before_days: item.remind_before_days ?? 7,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    if (!token) return navigate("/login");

    setError("");
    setSuccess("");

    if (!editForm.name.trim()) return setError("Please enter product name.");
    if (
      editForm.current_quantity === "" ||
      Number.isNaN(Number(editForm.current_quantity))
    ) {
      return setError("Please enter current quantity.");
    }
    if (editForm.daily_usage === "" || Number.isNaN(Number(editForm.daily_usage))) {
      return setError("Please enter daily usage.");
    }

    setBusyId(id);

    try {
      const res = await fetch(`${apiBase}/inventory/${id}`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          category: editForm.category,
          unit: editForm.unit,
          current_quantity: Math.round(Number(editForm.current_quantity)),
          daily_usage: Math.round(Number(editForm.daily_usage)),
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

      setSuccess("Item updated successfully!");
      setEditingId(null);
      await fetchInventory();
    } catch {
      setError("Failed to update. Is your backend running?");
    } finally {
      setBusyId(null);
    }
  };

  const groupedItems = useMemo(() => {
    const outOfStock = [];
    const lowStock = [];
    const healthy = [];

    (items || []).forEach((item) => {
      const status = statusInfo(item);

      if (status.cls === "out" || status.cls === "critical") {
        outOfStock.push(item);
      } else if (status.cls === "low") {
        lowStock.push(item);
      } else {
        healthy.push(item);
      }
    });

    const sorter = (a, b) => {
      const aStatus = statusInfo(a);
      const bStatus = statusInfo(b);

      if (aStatus.priority !== bStatus.priority) {
        return aStatus.priority - bStatus.priority;
      }

      const aDays = typeof a?.days_left === "number" ? a.days_left : 9999;
      const bDays = typeof b?.days_left === "number" ? b.days_left : 9999;
      return aDays - bDays;
    };

    outOfStock.sort(sorter);
    lowStock.sort(sorter);
    healthy.sort(sorter);

    return { outOfStock, lowStock, healthy };
  }, [items]);

  const searchedGroups = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return groupedItems;

    const matches = (item) => {
      const hay =
        `${item?.name || ""} ${item?.category || ""} ${item?.unit || ""}`.toLowerCase();
      return hay.includes(q);
    };

    return {
      outOfStock: groupedItems.outOfStock.filter(matches),
      lowStock: groupedItems.lowStock.filter(matches),
      healthy: groupedItems.healthy.filter(matches),
    };
  }, [groupedItems, searchTerm]);

  const mostUrgentItem = useMemo(() => {
    const sourceGroups = searchTerm.trim() ? searchedGroups : groupedItems;

    if (sourceGroups.outOfStock.length > 0) return sourceGroups.outOfStock[0];
    if (sourceGroups.lowStock.length > 0) return sourceGroups.lowStock[0];
    if (sourceGroups.healthy.length > 0) return sourceGroups.healthy[0];
    return null;
  }, [groupedItems, searchedGroups, searchTerm]);

  const visibleSections = useMemo(() => {
    if (filter === "Urgent") {
      return [
        { title: "Most Urgent", items: mostUrgentItem ? [mostUrgentItem] : [] },
      ];
    }

    if (filter === "Low Stock") {
      return [{ title: "Low Stock", items: searchedGroups.lowStock }];
    }

    if (filter === "Out of Stock") {
      return [{ title: "Out of Stock", items: searchedGroups.outOfStock }];
    }

    if (filter === "Healthy") {
      return [{ title: "Healthy Stock", items: searchedGroups.healthy }];
    }

    return [
      { title: "Out of Stock", items: searchedGroups.outOfStock },
      { title: "Low Stock", items: searchedGroups.lowStock },
      { title: "Healthy Stock", items: searchedGroups.healthy },
    ];
  }, [filter, searchedGroups, mostUrgentItem]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      low: groupedItems.lowStock.length,
      out: groupedItems.outOfStock.length,
      healthy: groupedItems.healthy.length,
    };
  }, [items.length, groupedItems]);

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-IE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const insightText = getInsightText({
    outOfStock: groupedItems.outOfStock,
    lowStock: groupedItems.lowStock,
    healthy: groupedItems.healthy,
    mostUrgent: mostUrgentItem,
  });

  return (
    <div className="pfd-shell pfi-premium-shell">
      <header className="pfd-site-header">
        <div
          className="pfd-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img className="pfd-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pfd-brand-copy">
            <div className="pfd-brand-title">Pawfection</div>
            <div className="pfd-brand-sub">Premium Inventory</div>
          </div>
        </div>

        <nav className="pfd-topnav">
          <Link className="pfd-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pfd-topnav-item" to="/premium-mypets">
            My Pets
          </Link>
          <Link className="pfd-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="pfd-topnav-item" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="pfd-topnav-item" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pfd-topnav-item" to="/premium/community">
            Community
          </Link>
          <Link className="pfd-topnav-item active" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="pfd-topnav-item" to="/premium/vet-chat">
            AI Pet Assistant
          </Link>
          <Link className="pfd-topnav-item" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="pfd-header-side">
          <div className="pfd-header-meta">
            <div className="pfd-date-pill">{todayText}</div>

            <div className="pfd-userchip" title={userName}>
              <div className="pfd-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
              <div className="pfd-userchip-text">
                <div className="pfd-userchip-name">{userName}</div>
                <div className="pfd-userchip-sub">Premium User</div>
              </div>
            </div>
          </div>

          <div className="pfd-search">
            <input
              type="text"
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="pfd-main">
        <section className="pfi-hero-card">
          <div className="pfi-hero-copy">
            <div className="pfi-kicker">Pawfection Premium Supplies</div>
            <h1 className="pfi-title">Inventory</h1>
            <p className="pfi-subtitle">
              Track urgent stock, monitor usage, and manage pet supplies in one
              premium workspace.
            </p>

            <div className="pfi-hero-actions">
              <button
                className="pfd-btn pfd-btn-primary"
                onClick={() => {
                  setShowForm((prev) => !prev);
                  setEditingId(null);
                  setUsageOpenId(null);
                }}
              >
                {showForm ? "Close Form" : "+ Add Product"}
              </button>

              <button
                className="pfd-btn"
                onClick={fetchInventory}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="pfi-insight-card">
            <div className="pfi-insight-label">Smart Insight</div>
            <div className="pfi-insight-text">{insightText}</div>
          </div>
        </section>

        {mostUrgentItem && (
          <section className="pfi-urgent-card">
            <div className="pfi-urgent-left">
              <div className="pfi-urgent-kicker">Most Urgent Item</div>
              <h2 className="pfi-urgent-title">
                {categoryIcon(mostUrgentItem.category)} {mostUrgentItem.name}
              </h2>
              <p className="pfi-urgent-text">
                {mostUrgentItem.category} • Stock:{" "}
                {formatQuantity(mostUrgentItem.current_quantity)} {mostUrgentItem.unit} •
                Daily use: {formatQuantity(mostUrgentItem.daily_usage)}{" "}
                {mostUrgentItem.unit}
              </p>

              <div className="pfi-urgent-meta">
                <span className={`pfi-status-badge ${statusInfo(mostUrgentItem).cls}`}>
                  {statusInfo(mostUrgentItem).label}
                </span>
                <span className="pfi-meta-pill">
                  Days left:{" "}
                  {typeof mostUrgentItem.days_left === "number"
                    ? mostUrgentItem.days_left
                    : "N/A"}
                </span>
                <span className="pfi-meta-pill">
                  Est. depletion: {formatDate(mostUrgentItem.estimated_depletion_date)}
                </span>
              </div>
            </div>

            <div className="pfi-urgent-actions">
              <button
                className="pfd-btn pfd-btn-small"
                onClick={() => restockItem(mostUrgentItem.id)}
                disabled={busyId === mostUrgentItem.id}
              >
                Restock
              </button>

              {canLogUsage(mostUrgentItem.category) && (
                <button
                  className="pfd-btn pfd-btn-small"
                  onClick={() => {
                    setSearchTerm("");
                    setFilter("All");
                    openUsageForm(mostUrgentItem);
                  }}
                  disabled={busyId === mostUrgentItem.id}
                >
                  Log Usage
                </button>
              )}

              <button
                className="pfd-btn pfd-btn-small pfd-btn-primary"
                onClick={() => {
                  setSearchTerm("");
                  setFilter("All");
                  startEdit(mostUrgentItem);
                }}
                disabled={busyId === mostUrgentItem.id}
              >
                Edit Item
              </button>
            </div>
          </section>
        )}

        {error && <div className="pfi-alert pfi-alert-error">{error}</div>}
        {success && <div className="pfi-alert pfi-alert-success">{success}</div>}

        <section className="pfi-summary-grid">
          <article className="pfi-summary-card">
            <div className="pfi-summary-label">Total Items</div>
            <div className="pfi-summary-value">{stats.total}</div>
          </article>

          <article className="pfi-summary-card pfi-summary-card-low">
            <div className="pfi-summary-label">Low Stock</div>
            <div className="pfi-summary-value">{stats.low}</div>
          </article>

          <article className="pfi-summary-card pfi-summary-card-out">
            <div className="pfi-summary-label">Out of Stock</div>
            <div className="pfi-summary-value">{stats.out}</div>
          </article>

          <article className="pfi-summary-card pfi-summary-card-healthy">
            <div className="pfi-summary-label">Healthy Stock</div>
            <div className="pfi-summary-value">{stats.healthy}</div>
          </article>
        </section>

        {showForm && (
          <section className="pfi-form-card">
            <div className="pfi-section-kicker">Add Inventory Item</div>
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
                    step="1"
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
                    step="1"
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
                <button className="pfd-btn pfd-btn-primary" type="submit">
                  Save
                </button>
                <button
                  className="pfd-btn"
                  type="button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="pfi-filter-row">
          {FILTERS.map((item) => (
            <button
              key={item}
              className={`pfi-filter-pill ${filter === item ? "active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </section>

        {loading && <div className="pfi-empty">Loading inventory…</div>}

        {!loading && items.length === 0 && (
          <div className="pfi-empty">
            No items yet. Click <b>+ Add Product</b> to start.
          </div>
        )}

        {!loading && items.length > 0 && (
          <section className="pfi-sections">
            {visibleSections.map((section) => (
              <article className="pfi-section-card" key={section.title}>
                <div className="pfi-section-head">
                  <div>
                    <div className="pfi-section-kicker">Inventory Group</div>
                    <h2>{section.title}</h2>
                  </div>
                  <span className="pfi-section-count">{section.items.length}</span>
                </div>

                {section.items.length === 0 ? (
                  <div className="pfi-empty-inline">No items in this section.</div>
                ) : (
                  <div className="pfi-item-list">
                    {section.items.map((i) => {
                      const status = statusInfo(i);
                      const isEditing = editingId === i.id;
                      const isUsing = usageOpenId === i.id;
                      const stock = Math.round(Number(i.current_quantity || 0));
                      const sliderStep = getSliderStep(i);
                      const currentUsageValue =
                        usageOpenId === i.id ? Math.round(Number(usageAmount || 0)) : 0;
                      const noStock = stock <= 0;

                      return (
                        <div key={i.id} className="pfi-item-card">
                          {isEditing ? (
                            <div className="pfi-editwrap">
                              <div className="pfi-formgrid">
                                <div className="pfi-field">
                                  <label>Name *</label>
                                  <input
                                    name="name"
                                    value={editForm.name}
                                    onChange={onEditChange}
                                  />
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
                                    step="1"
                                    value={editForm.current_quantity}
                                    onChange={onEditChange}
                                  />
                                </div>

                                <div className="pfi-field">
                                  <label>Unit</label>
                                  <select
                                    name="unit"
                                    value={editForm.unit}
                                    onChange={onEditChange}
                                  >
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
                                    step="1"
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
                                  className="pfd-btn pfd-btn-primary"
                                  type="button"
                                  onClick={() => saveEdit(i.id)}
                                  disabled={busyId === i.id}
                                >
                                  {busyId === i.id ? "Saving..." : "Save"}
                                </button>

                                <button
                                  className="pfd-btn"
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
                              <div className="pfi-item-top">
                                <div>
                                  <div className="pfi-item-title-row">
                                    <h3>
                                      <span className="pfi-inline-icon">
                                        {categoryIcon(i.category)}
                                      </span>
                                      {i.name}
                                    </h3>
                                    <span className="pfi-category-badge">
                                      {i.category}
                                    </span>
                                  </div>

                                  <p className="pfi-item-text">
                                    Stock: {formatQuantity(i.current_quantity)} {i.unit} • Daily
                                    use: {formatQuantity(i.daily_usage)} {i.unit}
                                  </p>
                                </div>

                                <span className={`pfi-status-badge ${status.cls}`}>
                                  {status.label}
                                </span>
                              </div>

                              <div className="pfi-item-meta">
                                <span>
                                  Days left:{" "}
                                  {typeof i.days_left === "number" ? i.days_left : "N/A"}
                                </span>
                                <span>
                                  Est. depletion: {formatDate(i.estimated_depletion_date)}
                                </span>
                                <span>
                                  Last restocked: {formatDate(i.last_restocked_at)}
                                </span>
                              </div>

                              <div className="pfi-item-actions">
                                {canLogUsage(i.category) && (
                                  <button
                                    className="pfd-btn pfd-btn-small"
                                    onClick={() => openUsageForm(i)}
                                    disabled={busyId === i.id}
                                  >
                                    Log Usage
                                  </button>
                                )}

                                <button
                                  className="pfd-btn pfd-btn-small"
                                  onClick={() => restockItem(i.id)}
                                  disabled={busyId === i.id}
                                >
                                  {busyId === i.id ? "..." : "Restock"}
                                </button>

                                <button
                                  className="pfd-btn pfd-btn-small"
                                  onClick={() => startEdit(i)}
                                  disabled={busyId === i.id}
                                >
                                  Edit
                                </button>

                                <button
                                  className="pfd-btn pfd-btn-small pfi-delete-btn"
                                  onClick={() => deleteItem(i.id, i.name)}
                                  disabled={busyId === i.id}
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}

                          {!isEditing && isUsing && (
                            <div className="pfi-usage-box">
                              <div className="pfi-usage-title">
                                Did your pet use this product today?
                              </div>

                              <div className="pfi-usage-text">
                                Saved daily usage: <b>{formatQuantity(i.daily_usage)}</b> {i.unit}
                              </div>

                              {noStock ? (
                                <div className="pfi-usage-empty">
                                  This item is currently out of stock, so usage cannot be logged.
                                </div>
                              ) : (
                                <div className="pfi-field">
                                  <label>Actual amount used today</label>

                                  <div className="pfi-slider-wrap">
                                    <div className="pfi-slider-value">
                                      {formatQuantity(currentUsageValue)} {i.unit}
                                    </div>

                                    <input
                                      className="pfi-slider"
                                      type="range"
                                      min="0"
                                      max="5000"
                                      step={sliderStep}
                                      value={usageAmount}
                                      onChange={(e) => setUsageAmount(e.target.value)}
                                    />

                                    <div className="pfi-slider-scale">
                                      <span>0 {i.unit}</span>
                                      <span>5000 {i.unit}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="pfi-formactions">
                                <button
                                  className="pfd-btn pfd-btn-primary"
                                  type="button"
                                  onClick={() => consumeItem(i.id)}
                                  disabled={
                                    busyId === i.id || noStock || Number(usageAmount) <= 0
                                  }
                                >
                                  {busyId === i.id ? "Saving..." : "Yes, Reduce Stock"}
                                </button>

                                <button
                                  className="pfd-btn"
                                  type="button"
                                  onClick={cancelUsageForm}
                                  disabled={busyId === i.id}
                                >
                                  No, Not Today
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}