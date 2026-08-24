/* ============================================================
   Beauty Bar Dashboard — Data Store (Supabase)
   ============================================================ */

const Store = (() => {
  let _client = null;
  let _services = [];
  let _transactions = [];
  let _promos = [];

  /* ---------- Helpers ---------- */

  function _id(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  function _sortTransactions(list) {
    return [...list].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
  }

  function _mapService(row) {
    return {
      id: row.id,
      name: row.name,
      price: Number(row.price),
      active: row.active,
    };
  }

  function _mapTransaction(row) {
    return {
      id: row.id,
      branch: row.branch,
      serviceId: row.service_id,
      serviceName: row.service_name,
      price: Number(row.price),
      date: row.date,
      notes: row.notes || "",
      promoId: row.promo_id,
      promoDiscount: Number(row.promo_discount) || 0,
      createdAt: row.created_at,
    };
  }

  function _mapPromo(row) {
    return {
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      discount: Number(row.discount),
      description: row.description || "",
    };
  }

  function _serviceRow(svc) {
    return {
      id: svc.id,
      name: svc.name,
      price: svc.price,
      active: svc.active,
    };
  }

  function _transactionRow(txn) {
    return {
      id: txn.id,
      branch: txn.branch,
      service_id: txn.serviceId,
      service_name: txn.serviceName,
      price: txn.price,
      date: txn.date,
      notes: txn.notes || "",
      promo_id: txn.promoId,
      promo_discount: txn.promoDiscount || 0,
      created_at: txn.createdAt,
    };
  }

  function _promoRow(promo) {
    return {
      id: promo.id,
      name: promo.name,
      start_date: promo.startDate,
      end_date: promo.endDate,
      discount: promo.discount,
      description: promo.description || "",
    };
  }

  async function _loadAll() {
    const [svcRes, txnRes, promoRes] = await Promise.all([
      _client.from("services").select("*"),
      _client.from("transactions").select("*"),
      _client.from("promos").select("*"),
    ]);

    if (svcRes.error) throw svcRes.error;
    if (txnRes.error) throw txnRes.error;
    if (promoRes.error) throw promoRes.error;

    _services = (svcRes.data || []).map(_mapService);
    _transactions = _sortTransactions((txnRes.data || []).map(_mapTransaction));
    _promos = (promoRes.data || []).map(_mapPromo);
  }

  async function _seedDefaults() {
    const defaults = [
      { name: "Nails", price: 150000 },
      { name: "Manicure", price: 100000 },
      { name: "Pedicure", price: 120000 },
      { name: "Nail Art", price: 200000 },
      { name: "Eyelash Extension", price: 250000 },
      { name: "Eyebrow", price: 75000 },
      { name: "Tooth Gem", price: 100000 },
      { name: "Lash Lift", price: 180000 },
    ];

    for (const s of defaults) {
      await addService(s);
    }
  }

  /* ---------- Init ---------- */

  async function init() {
    const cfg = window.APP_CONFIG;

    if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) {
      throw new Error(
        "Supabase not configured. Fill in js/config.js with your project URL and anon key.",
      );
    }

    if (typeof supabase === "undefined") {
      throw new Error("Supabase client library not loaded.");
    }

    _client = supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    await _loadAll();

    if (_services.length === 0) {
      await _seedDefaults();
    }
  }

  /* ---------- Services (sync reads, async writes) ---------- */

  function getServices() {
    return _services;
  }

  function getActiveServices() {
    return _services.filter((s) => s.active);
  }

  function getServiceById(id) {
    return _services.find((s) => s.id === id) || null;
  }

  async function addService({ name, price }) {
    const svc = {
      id: _id("svc"),
      name,
      price: Number(price),
      active: true,
    };

    const { error } = await _client.from("services").insert(_serviceRow(svc));
    if (error) throw error;

    _services.push(svc);
    return svc;
  }

  async function updateService(id, updates) {
    const idx = _services.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const updated = { ..._services[idx], ...updates };
    if (updates.price !== undefined) updated.price = Number(updates.price);

    const { error } = await _client
      .from("services")
      .update(_serviceRow(updated))
      .eq("id", id);
    if (error) throw error;

    _services[idx] = updated;
    return updated;
  }

  async function deleteService(id) {
    const { error } = await _client.from("services").delete().eq("id", id);
    if (error) throw error;

    _services = _services.filter((s) => s.id !== id);
  }

  /* ---------- Transactions ---------- */

  function getTransactions() {
    return _transactions;
  }

  async function addTransaction({
    branch,
    serviceId,
    serviceName,
    price,
    date,
    notes,
    promoId,
    promoDiscount,
  }) {
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

    const { error } = await _client.from("transactions").insert(_transactionRow(txn));
    if (error) throw error;

    _transactions = _sortTransactions([..._transactions, txn]);
    return txn;
  }

  async function updateTransaction(id, updates) {
    const idx = _transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const updated = { ..._transactions[idx], ...updates };
    if (updates.price !== undefined) updated.price = Number(updates.price);

    const { error } = await _client
      .from("transactions")
      .update(_transactionRow(updated))
      .eq("id", id);
    if (error) throw error;

    _transactions[idx] = updated;
    _transactions = _sortTransactions(_transactions);
    return updated;
  }

  async function deleteTransaction(id) {
    const { error } = await _client.from("transactions").delete().eq("id", id);
    if (error) throw error;

    _transactions = _transactions.filter((t) => t.id !== id);
  }

  function getTransactionsByDateRange(start, end) {
    return _transactions.filter((t) => t.date >= start && t.date <= end);
  }

  /* ---------- Promos ---------- */

  function getPromos() {
    return _promos;
  }

  function getActivePromos(dateStr) {
    const d = dateStr || getTodayStr();
    return _promos.filter((p) => p.startDate <= d && p.endDate >= d);
  }

  async function addPromo({ name, startDate, endDate, discount, description }) {
    const promo = {
      id: _id("promo"),
      name,
      startDate,
      endDate,
      discount: Number(discount),
      description: description || "",
    };

    const { error } = await _client.from("promos").insert(_promoRow(promo));
    if (error) throw error;

    _promos.push(promo);
    return promo;
  }

  async function updatePromo(id, updates) {
    const idx = _promos.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const updated = { ..._promos[idx], ...updates };
    if (updates.discount !== undefined) updated.discount = Number(updates.discount);

    const { error } = await _client
      .from("promos")
      .update(_promoRow(updated))
      .eq("id", id);
    if (error) throw error;

    _promos[idx] = updated;
    return updated;
  }

  async function deletePromo(id) {
    const { error } = await _client.from("promos").delete().eq("id", id);
    if (error) throw error;

    _promos = _promos.filter((p) => p.id !== id);
  }

  /* ---------- Utility ---------- */

  function formatCurrency(amount) {
    return "Rp " + Number(amount).toLocaleString("id-ID");
  }

  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

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
