import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PawfectionLogo from "../assets/PawfectionLogo.png";
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
      outOfStock.length === 1 ? "" : "s"
    } out of stock. Restocking these first will keep care routines uninterrupted.`;
  }

  if (lowStock.length > 0) {
    return `${lowStock.length} item${
      lowStock.length === 1 ? " is" : "s are"
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
  const role = String(localStorage.getItem("pawfection_role") || "").toLowerCase();
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

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (role === "admin") {
      navigate("/admin-dashboard");
      return;
    }

    localStorage.setItem("pawfection_account_type", "premium");

    try {
      const savedUser = localStorage.getItem("pawfection_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.name) {
          setUserName(userObj.name);
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
    }

    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, token, role]);

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
        return;
      }

      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setError("Server error. Is your backend running?");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetCreateForm = () => {
    setForm({
      name: "",
      category: "Food",
      unit: "g",
      current_quantity: "",
      daily_usage: "",
      remind_before_days: 7,
    });
  };

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
      resetCreateForm();
      setShowForm(false);
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
    } catch {
      setError("Failed to restock. Is your backend running?");
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

    if (
      editForm.daily_usage === "" ||
      Number.isNaN(Number(editForm.daily_usage))
    ) {
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
      const hay = `${item?.name || ""} ${item?.category || ""} ${
        item?.unit || ""
      } ${statusInfo(item).label} ${formatDate(
        item?.estimated_depletion_date
      )}`.toLowerCase();

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
        {
          title: "Most Urgent",
          items: mostUrgentItem ? [mostUrgentItem] : [],
        },
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

  const filteredCount = useMemo(() => {
    return (
      searchedGroups.outOfStock.length +
      searchedGroups.lowStock.length +
      searchedGroups.healthy.length
    );
  }, [searchedGroups]);

  const insightText = getInsightText({
    outOfStock: groupedItems.outOfStock,
    lowStock: groupedItems.lowStock,
    healthy: groupedItems.healthy,
    mostUrgent: mostUrgentItem,
  });

  const inventorySliderItems = useMemo(() => {
    return [
      {
        icon: "➕",
        title: "Add Product",
        text: "Add food, supplements, medication, or accessories to your premium inventory.",
        action: "Open form",
        onClick: () => {
          setShowForm(true);
          setEditingId(null);
          setUsageOpenId(null);
          setError("");
          setSuccess("");
        },
      },
      {
        icon: "⚠️",
        title: "Urgent Stock",
        text: mostUrgentItem
          ? `${mostUrgentItem.name} needs the most attention right now.`
          : "No urgent item right now.",
        action: "View urgent",
        onClick: () => {
          setFilter("Urgent");
          document.querySelector(".pfi-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        icon: "📉",
        title: "Low Stock",
        text:
          stats.low > 0
            ? `${stats.low} item${stats.low === 1 ? "" : "s"} running low.`
            : "No low stock items right now.",
        action: "Check low stock",
        onClick: () => {
          setFilter("Low Stock");
          document.querySelector(".pfi-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        icon: "📦",
        title: "Out of Stock",
        text:
          stats.out > 0
            ? `${stats.out} item${stats.out === 1 ? "" : "s"} out of stock.`
            : "Nothing is out of stock.",
        action: "View empty stock",
        onClick: () => {
          setFilter("Out of Stock");
          document.querySelector(".pfi-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        icon: "✅",
        title: "Healthy Stock",
        text:
          stats.healthy > 0
            ? `${stats.healthy} item${stats.healthy === 1 ? "" : "s"} well stocked.`
            : "Healthy stock items will appear here.",
        action: "View healthy",
        onClick: () => {
          setFilter("Healthy");
          document.querySelector(".pfi-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        icon: "🔎",
        title: "Smart Search",
        text: "Search products by name, category, stock status, or estimated depletion date.",
        action: "Search",
        onClick: () => {
          document.querySelector(".pfi-grid")?.scrollIntoView({ behavior: "smooth" });
        },
      },
    ];
  }, [mostUrgentItem, stats]);

  return (
    <div className="pfi-shell">
      <header className="pfi-site-header">
        <div
          className="pfi-brand"
          onClick={() => navigate("/premium-dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/premium-dashboard");
          }}
        >
          <img className="pfi-brand-logo" src={PawfectionLogo} alt="Pawfection" />
          <div className="pfi-brand-copy">
            <div className="pfi-brand-title">Pawfection</div>
            <div className="pfi-brand-sub">Premium Inventory</div>
          </div>
        </div>

        <nav className="pfi-topnav">
          <Link className="pfi-topnav-item" to="/premium-dashboard">
            Premium Dashboard
          </Link>
          <Link className="pfi-topnav-item" to="/premium-mypets">
            My Pet
          </Link>
          <Link className="pfi-topnav-item" to="/premium/appointments">
            Appointments
          </Link>
          <Link className="pfi-topnav-item" to="/premium/reminders">
            Reminders
          </Link>
          <Link className="pfi-topnav-item" to="/premium/lostfound">
            Lost &amp; Found
          </Link>
          <Link className="pfi-topnav-item" to="/premium/community">
            Community
          </Link>
          <Link className="pfi-topnav-item active" to="/premium/inventory">
            Inventory
          </Link>
          <Link className="pfi-topnav-item" to="/premium/vet-chat">
            AI Pet Assistant
          </Link>
          <Link className="pfi-topnav-item" to="/premium/profile">
            Profile
          </Link>
        </nav>

        <div className="pfi-header-side">
          <div className="pfi-date-pill">{todayText}</div>
          <div className="pfi-userchip">
            <div className="pfi-avatar">{(userName?.[0] || "U").toUpperCase()}</div>
            <div>
              <div className="pfi-userchip-name">{userName}</div>
              <div className="pfi-userchip-sub">Premium User</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pfi-main">
        <section className="pfi-hero">
          <div className="pfi-hero-copy">
            <div className="pfi-kicker">Pawfection Premium Supplies</div>
            <h1 className="pfi-hero-title">
              {getGreeting()}, {userName}
            </h1>
            <p className="pfi-hero-text">
              Track pet food, supplements, medication, and accessories in one polished
              premium space. Monitor stock levels, log usage, restock products, and spot
              urgent supplies before they run out.
            </p>

            <div className="pfi-selector-wrap">
              <label htmlFor="inventoryFocusSelect" className="pfi-selector-label">
                Inventory Focus
              </label>
              <select
                id="inventoryFocusSelect"
                className="pfi-selector"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {FILTERS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="pfi-hero-actions">
              <button
                className="pfi-btn pfi-btn-primary"
                type="button"
                onClick={() => {
                  setShowForm((prev) => !prev);
                  setEditingId(null);
                  setUsageOpenId(null);
                  setError("");
                  setSuccess("");
                }}
              >
                {showForm ? "Close Form" : "Add Product"}
              </button>

              <button
                className="pfi-btn"
                type="button"
                onClick={fetchInventory}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Inventory"}
              </button>

              <button
                className="pfi-btn"
                type="button"
                onClick={() => navigate("/premium-dashboard")}
              >
                Back to Dashboard
              </button>
            </div>

            {error && <div className="pfi-form-message pfi-form-error">{error}</div>}
            {success && (
              <div className="pfi-form-message pfi-form-success">{success}</div>
            )}

            {showForm && (
              <form className="pfi-form-card" onSubmit={createItem}>
                <div className="pfi-form-grid">
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
                    <label>Remind before days</label>
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

                <div className="pfi-form-actions">
                  <button className="pfi-btn pfi-btn-primary" type="submit">
                    Save Product
                  </button>
                  <button
                    className="pfi-btn"
                    type="button"
                    onClick={() => {
                      resetCreateForm();
                      setShowForm(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="pfi-hero-card">
            <div className="pfi-hero-card-top">
              <div className="pfi-premium-badge">Premium Active</div>
              <h2>Inventory</h2>
              <p>Smart stock tracking for your pet care routine</p>
            </div>

            <div className="pfi-stat-row">
              <div className="pfi-stat-pill">Total: {stats.total}</div>
              <div className="pfi-stat-pill">Low: {stats.low}</div>
              <div className="pfi-stat-pill">Out: {stats.out}</div>
              <div className="pfi-stat-pill">Healthy: {stats.healthy}</div>
            </div>

            <div className="pfi-quick-box">
              <strong>SMART INSIGHT</strong>
              <span>{insightText}</span>
            </div>

            <div className="pfi-quick-box">
              <strong>MOST URGENT</strong>
              <span>
                {mostUrgentItem
                  ? `${categoryIcon(mostUrgentItem.category)} ${
                      mostUrgentItem.name
                    } • ${statusInfo(mostUrgentItem).label}`
                  : "No urgent inventory item right now"}
              </span>
            </div>

            <div className="pfi-quick-box">
              <strong>PREMIUM BENEFIT</strong>
              <span>
                Track usage, monitor depletion dates, and organise pet supplies in one
                place.
              </span>
            </div>
          </div>
        </section>

        <section className="pfi-auto-section">
          <div className="pfi-auto-head">
            <div>
              <div className="pfi-card-kicker">Premium inventory shortcuts</div>
              <h2>Your pet supplies sliding automatically</h2>
            </div>
          </div>

          <div className="pfi-slider-mask">
            <div className="pfi-slider-track">
              {[0, 1].map((groupIndex) => (
                <div className="pfi-slider-group" key={groupIndex}>
                  {inventorySliderItems.map((item, index) => (
                    <button
                      key={`${groupIndex}-${index}`}
                      type="button"
                      className="pfi-slide-card"
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

          <div className="pfi-slider-dots">
            <span></span>
            <span className="active"></span>
            <span></span>
            <span></span>
          </div>
        </section>

        <section className="pfi-grid">
          <article className="pfi-card">
            <div className="pfi-card-kicker">Premium Search</div>
            <h3>Find Your Product Fast</h3>

            <div className="pfi-field" style={{ marginTop: "14px" }}>
              <label>Search</label>
              <input
                type="text"
                placeholder="Search by product, category, unit, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="pfi-filter-pills">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`pfi-filter-pill ${filter === item ? "active" : ""}`}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="pfi-search-meta">
              {!searchTerm.trim() ? (
                <span>
                  Showing inventory items: <strong>{stats.total}</strong>
                </span>
              ) : (
                <span>
                  Results for "<strong>{searchTerm}</strong>":{" "}
                  <strong>{filteredCount}</strong>
                </span>
              )}
            </div>

            {searchTerm.trim() && (
              <>
                <div style={{ marginTop: "12px" }}>
                  <button
                    type="button"
                    className="pfi-btn pfi-btn-small"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </button>
                </div>

                <div className="pfi-search-results">
                  {filteredCount === 0 ? (
                    <div className="pfi-empty" style={{ marginTop: "14px" }}>
                      No inventory items match "{searchTerm}".
                    </div>
                  ) : (
                    Object.entries(searchedGroups).flatMap(([groupName, groupItems]) =>
                      groupItems.map((item) => (
                        <div
                          key={`search-${groupName}-${item.id}`}
                          className="pfi-search-card"
                        >
                          <div className="pfi-search-card-head">
                            <div className="pfi-search-card-title">
                              {categoryIcon(item.category)} {item.name}
                            </div>

                            <div className="pfi-chip-wrap">
                              <span className="pfi-chip">{item.category}</span>
                              <span className={`pfi-status-badge ${statusInfo(item).cls}`}>
                                {statusInfo(item).label}
                              </span>
                            </div>
                          </div>

                          <div className="pfi-search-detail-grid">
                            <div>
                              <strong>Stock:</strong>{" "}
                              {formatQuantity(item.current_quantity)} {item.unit}
                            </div>
                            <div>
                              <strong>Daily use:</strong>{" "}
                              {formatQuantity(item.daily_usage)} {item.unit}
                            </div>
                            <div>
                              <strong>Days left:</strong>{" "}
                              {typeof item.days_left === "number"
                                ? item.days_left
                                : "N/A"}
                            </div>
                            <div>
                              <strong>Estimated depletion:</strong>{" "}
                              {formatDate(item.estimated_depletion_date)}
                            </div>
                          </div>

                          <div className="pfi-timeline-actions">
                            <button
                              className="pfi-btn pfi-btn-small"
                              type="button"
                              onClick={() => restockItem(item.id)}
                              disabled={busyId === item.id}
                            >
                              Restock
                            </button>

                            {canLogUsage(item.category) && (
                              <button
                                className="pfi-btn pfi-btn-small"
                                type="button"
                                onClick={() => openUsageForm(item)}
                                disabled={busyId === item.id}
                              >
                                Log Usage
                              </button>
                            )}

                            <button
                              className="pfi-btn pfi-btn-primary pfi-btn-small"
                              type="button"
                              onClick={() => startEdit(item)}
                              disabled={busyId === item.id}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </>
            )}
          </article>

          <article className="pfi-card">
            <div className="pfi-card-kicker">Inventory Snapshot</div>
            <h3>Quick Summary</h3>

            <div className="pfi-analytics-grid">
              <div className="pfi-analytics-box">
                <span>Total Items</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="pfi-analytics-box">
                <span>Low Stock</span>
                <strong>{stats.low}</strong>
              </div>
              <div className="pfi-analytics-box">
                <span>Out of Stock</span>
                <strong>{stats.out}</strong>
              </div>
              <div className="pfi-analytics-box">
                <span>Healthy</span>
                <strong>{stats.healthy}</strong>
              </div>
            </div>
          </article>

          <article className="pfi-card pfi-card-wide">
            <div className="pfi-card-kicker">Inventory Timeline</div>
            <h3>Your Premium Inventory</h3>

            {loading ? (
              <div className="pfi-empty">Loading inventory...</div>
            ) : items.length === 0 ? (
              <div className="pfi-empty">
                No items yet. Click <b>Add Product</b> to start tracking your pet
                supplies.
              </div>
            ) : (
              <div className="pfi-sections">
                {visibleSections.map((section) => (
                  <div className="pfi-section-block" key={section.title}>
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
                      <div className="pfi-timeline">
                        {section.items.map((item, index) => {
                          const status = statusInfo(item);
                          const isEditing = editingId === item.id;
                          const isUsing = usageOpenId === item.id;
                          const stock = Math.round(Number(item.current_quantity || 0));
                          const currentUsageValue =
                            usageOpenId === item.id
                              ? Math.round(Number(usageAmount || 0))
                              : 0;
                          const noStock = stock <= 0;

                          return (
                            <div key={item.id || index} className="pfi-timeline-item">
                              <div className="pfi-timeline-dot" />

                              <div className="pfi-timeline-content">
                                {!isEditing ? (
                                  <>
                                    <div className="pfi-timeline-top">
                                      <div>
                                        <div className="pfi-timeline-title">
                                          {categoryIcon(item.category)} {item.name}
                                        </div>
                                        <div className="pfi-timeline-text">
                                          Stock: {formatQuantity(item.current_quantity)}{" "}
                                          {item.unit} • Daily use:{" "}
                                          {formatQuantity(item.daily_usage)} {item.unit}
                                        </div>
                                        <div className="pfi-timeline-sub">
                                          Est. depletion:{" "}
                                          {formatDate(item.estimated_depletion_date)}
                                        </div>
                                      </div>

                                      <div className="pfi-chip-wrap">
                                        <span className="pfi-chip">{item.category}</span>
                                        <span
                                          className={`pfi-status-badge ${status.cls}`}
                                        >
                                          {status.label}
                                        </span>
                                        <span className="pfi-chip">
                                          Days left:{" "}
                                          {typeof item.days_left === "number"
                                            ? item.days_left
                                            : "N/A"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="pfi-inventory-meta">
                                      <div>
                                        <strong>Last restocked:</strong>{" "}
                                        {formatDate(item.last_restocked_at)}
                                      </div>
                                      <div>
                                        <strong>Reminder threshold:</strong>{" "}
                                        {item.remind_before_days ?? 7} days
                                      </div>
                                    </div>

                                    <div className="pfi-timeline-actions">
                                      {canLogUsage(item.category) && (
                                        <button
                                          className="pfi-btn pfi-btn-small"
                                          type="button"
                                          onClick={() => openUsageForm(item)}
                                          disabled={busyId === item.id}
                                        >
                                          Log Usage
                                        </button>
                                      )}

                                      <button
                                        className="pfi-btn pfi-btn-small"
                                        type="button"
                                        onClick={() => restockItem(item.id)}
                                        disabled={busyId === item.id}
                                      >
                                        {busyId === item.id ? "..." : "Restock"}
                                      </button>

                                      <button
                                        className="pfi-btn pfi-btn-small"
                                        type="button"
                                        onClick={() => startEdit(item)}
                                        disabled={busyId === item.id}
                                      >
                                        Edit
                                      </button>

                                      <button
                                        className="pfi-btn pfi-btn-danger pfi-btn-small"
                                        type="button"
                                        onClick={() => deleteItem(item.id, item.name)}
                                        disabled={busyId === item.id}
                                      >
                                        Delete
                                      </button>
                                    </div>

                                    {isUsing && (
                                      <div className="pfi-usage-box">
                                        <div className="pfi-usage-title">
                                          Did your pet use this product today?
                                        </div>

                                        <div className="pfi-usage-text">
                                          Saved daily usage:{" "}
                                          <b>{formatQuantity(item.daily_usage)}</b>{" "}
                                          {item.unit}
                                        </div>

                                        {noStock ? (
                                          <div className="pfi-usage-empty">
                                            This item is currently out of stock, so usage
                                            cannot be logged.
                                          </div>
                                        ) : (
                                          <div className="pfi-field">
                                            <label>Actual amount used today</label>

                                            <div className="pfi-slider-wrap">
                                              <div className="pfi-slider-value">
                                                {formatQuantity(currentUsageValue)}{" "}
                                                {item.unit}
                                              </div>

                                              <input
                                                className="pfi-slider"
                                                type="range"
                                                min="0"
                                                max="5000"
                                                step={getSliderStep(item)}
                                                value={usageAmount}
                                                onChange={(e) =>
                                                  setUsageAmount(e.target.value)
                                                }
                                              />

                                              <div className="pfi-slider-scale">
                                                <span>0 {item.unit}</span>
                                                <span>5000 {item.unit}</span>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        <div className="pfi-form-actions">
                                          <button
                                            className="pfi-btn pfi-btn-primary"
                                            type="button"
                                            onClick={() => consumeItem(item.id)}
                                            disabled={
                                              busyId === item.id ||
                                              noStock ||
                                              Number(usageAmount) <= 0
                                            }
                                          >
                                            {busyId === item.id
                                              ? "Saving..."
                                              : "Yes, Reduce Stock"}
                                          </button>

                                          <button
                                            className="pfi-btn"
                                            type="button"
                                            onClick={cancelUsageForm}
                                            disabled={busyId === item.id}
                                          >
                                            No, Not Today
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="pfi-form-grid">
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
                                        <label>Remind before days</label>
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

                                    <div className="pfi-timeline-actions">
                                      <button
                                        className="pfi-btn pfi-btn-primary pfi-btn-small"
                                        type="button"
                                        onClick={() => saveEdit(item.id)}
                                        disabled={busyId === item.id}
                                      >
                                        {busyId === item.id ? "Saving..." : "Save"}
                                      </button>

                                      <button
                                        className="pfi-btn pfi-btn-small"
                                        type="button"
                                        onClick={cancelEdit}
                                        disabled={busyId === item.id}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
