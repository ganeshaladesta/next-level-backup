/* ============================================================
   Beauty Bar Dashboard — Data Store (LocalStorage)
   ============================================================ */

const Store = (() => {
  const SERVICES_KEY = "bb_services";
  const TRANSACTIONS_KEY = "bb_transactions";
  const PROMOS_KEY = "bb_promos";

  /* ---------- Helpers ---------- */

  function _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  function _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function _id(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  /* ---------- Services ---------- */

  function getServices() {
    return _get(SERVICES_KEY);
  }

  function getActiveServices() {
    return getServices().filter((s) => s.active);
  }

  function getServiceById(id) {
    return getServices().find((s) => s.id === id) || null;
  }

  function addService({ name, price }) {
    const list = getServices();

    const svc = {
      id: _id("svc"),
      name,
      price: Number(price),
      active: true,
    };

    list.push(svc);

    _set(SERVICES_KEY, list);

    return svc;
  }

  function updateService(id, updates) {
    const list = getServices();

    const idx = list.findIndex((s) => s.id === id);

    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates,
    };

    if (updates.price !== undefined) {
      list[idx].price = Number(updates.price);
    }

    _set(SERVICES_KEY, list);

    return list[idx];
  }

  function deleteService(id) {
    _set(
      SERVICES_KEY,
      getServices().filter((s) => s.id !== id),
    );
  }

  /* ---------- Transactions ---------- */

  function getTransactions() {
    return _get(TRANSACTIONS_KEY).sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }

      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
  }

  function addTransaction({
    branch,
    serviceId,
    serviceName,
    price,
    date,
    notes,
    promoId,
    promoDiscount,
  }) {
    const list = _get(TRANSACTIONS_KEY);

    const txn = {
      id: _id("txn"),
      branch: branch || "Kemang",
      serviceId,
      serviceName,
      price: Number(price),
      date: date || getTodayStr(),
      notes: notes || "",
      promoId: promoId || null,
      promoDiscount: Number(promoDiscount) || 0,
      createdAt: new Date().toISOString(),
    };

    list.push(txn);

    _set(TRANSACTIONS_KEY, list);

    return txn;
  }

  function updateTransaction(id, updates) {
    const list = _get(TRANSACTIONS_KEY);

    const idx = list.findIndex((t) => t.id === id);

    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates,
    };

    if (updates.price !== undefined) {
      list[idx].price = Number(updates.price);
    }

    _set(TRANSACTIONS_KEY, list);

    return list[idx];
  }

  function deleteTransaction(id) {
    _set(
      TRANSACTIONS_KEY,
      _get(TRANSACTIONS_KEY).filter((t) => t.id !== id),
    );
  }

  function getTransactionsByDateRange(start, end) {
    return getTransactions().filter((t) => t.date >= start && t.date <= end);
  }

  /* ---------- Promos ---------- */

  function getPromos() {
    return _get(PROMOS_KEY);
  }

  function getActivePromos(dateStr) {
    const d = dateStr || getTodayStr();

    return getPromos().filter((p) => p.startDate <= d && p.endDate >= d);
  }

  function addPromo({ name, startDate, endDate, discount, description }) {
    const list = getPromos();

    const promo = {
      id: _id("promo"),
      name,
      startDate,
      endDate,
      discount: Number(discount),
      description: description || "",
    };

    list.push(promo);

    _set(PROMOS_KEY, list);

    return promo;
  }

  function updatePromo(id, updates) {
    const list = getPromos();

    const idx = list.findIndex((p) => p.id === id);

    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates,
    };

    if (updates.discount !== undefined) {
      list[idx].discount = Number(updates.discount);
    }

    _set(PROMOS_KEY, list);

    return list[idx];
  }

  function deletePromo(id) {
    _set(
      PROMOS_KEY,
      getPromos().filter((p) => p.id !== id),
    );
  }

  /* ---------- Init / Seed ---------- */

  function init() {
    if (getServices().length === 0) {
      const defaults = [
        {
          name: "Nails",
          price: 150000,
        },
        {
          name: "Manicure",
          price: 100000,
        },
        {
          name: "Pedicure",
          price: 120000,
        },
        {
          name: "Nail Art",
          price: 200000,
        },
        {
          name: "Eyelash Extension",
          price: 250000,
        },
        {
          name: "Eyebrow",
          price: 75000,
        },
        {
          name: "Tooth Gem",
          price: 100000,
        },
        {
          name: "Lash Lift",
          price: 180000,
        },
      ];

      defaults.forEach((s) => addService(s));
    }
  }

  /* ---------- Utility ---------- */

  function formatCurrency(amount) {
    return "Rp " + Number(amount).toLocaleString("id-ID");
  }

  function getTodayStr() {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");

    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  /* ---------- Public API ---------- */

  return {
    getServices,
    getActiveServices,
    getServiceById,

    addService,
    updateService,
    deleteService,

    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,

    getTransactionsByDateRange,

    getPromos,
    getActivePromos,
    addPromo,
    updatePromo,
    deletePromo,

    init,
    formatCurrency,
    getTodayStr,
    formatDate,
  };
})();
