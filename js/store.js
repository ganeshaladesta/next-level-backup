/* ============================================================
   Next Level Beauty Bar — Data Store
   Supabase Database
   ============================================================ */

const Store = (() => {
  /* ============================================================
       SUPABASE CONFIG
       ============================================================ */

  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "Supabase configuration belum ditemukan. " +
        "Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY sudah di-set di index.html.",
    );
  }

  if (!window.supabase) {
    console.error(
      "Supabase JS belum dimuat. " +
        "Pastikan CDN @supabase/supabase-js sudah ada sebelum store.js.",
    );
  }

  const supabaseClient =
    window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
      ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;

  /* ============================================================
       LOCAL CACHE
       
       LocalStorage sekarang HANYA dipakai sebagai cache sementara.
       Database utama = Supabase.
       ============================================================ */

  const SERVICES_CACHE_KEY = "bb_services_cache";
  const TRANSACTIONS_CACHE_KEY = "bb_transactions_cache";
  const PROMOS_CACHE_KEY = "bb_promos_cache";

  let servicesCache = [];
  let transactionsCache = [];
  let promosCache = [];

  let initialized = false;

  /* ============================================================
       HELPERS
       ============================================================ */

  function _id(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  function _loadCache(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  function _saveCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn("Gagal menyimpan cache:", err);
    }
  }

  function _cacheAll() {
    _saveCache(SERVICES_CACHE_KEY, servicesCache);
    _saveCache(TRANSACTIONS_CACHE_KEY, transactionsCache);
    _saveCache(PROMOS_CACHE_KEY, promosCache);
  }

  function _ensureSupabase() {
    if (!supabaseClient) {
      throw new Error(
        "Supabase belum terhubung. Periksa SUPABASE_URL dan SUPABASE_ANON_KEY.",
      );
    }
  }

  function _handleError(error, context) {
    console.error(`[Supabase] ${context}`, error);

    if (typeof showToast === "function") {
      showToast(`Gagal ${context}. Cek koneksi/database.`, "danger");
    }
  }

  /* ============================================================
       DATABASE → APP FORMAT
       
       Supabase menggunakan snake_case.
       JavaScript menggunakan camelCase.
       ============================================================ */

  function _serviceFromDB(row) {
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      price: Number(row.price) || 0,
      active: row.active !== false,
      createdAt: row.created_at || null,
    };
  }

  function _transactionFromDB(row) {
    if (!row) return null;

    return {
      id: row.id,

      branch: row.branch || "Kemang",

      serviceId: row.service_id || null,

      serviceName: row.service_name || "Unknown",

      // Harga treatment asli
      price: Number(row.price) || 0,

      date: row.date || getTodayStr(),

      // Jam treatment
      treatmentTime: row.treatment_time || "",

      notes: row.notes || "",

      promoId: row.promo_id || null,

      promoDiscount: Number(row.promo_discount) || 0,

      dp: Number(row.dp) || 0,

      createdAt: row.created_at || null,

      /*
       * Nilai berikut dihitung ulang oleh calculateTransaction()
       * karena belum disimpan sebagai kolom database.
       */
      ...calculateTransaction({
        price: Number(row.price) || 0,
        dp: Number(row.dp) || 0,
        promoDiscount: Number(row.promo_discount) || 0,
      }),
    };
  }

  function _promoFromDB(row) {
    if (!row) return null;

    return {
      id: row.id,

      name: row.name,

      startDate: row.start_date,

      endDate: row.end_date,

      discount: Number(row.discount) || 0,

      description: row.description || "",

      createdAt: row.created_at || null,
    };
  }

  /* ============================================================
       APP → DATABASE FORMAT
       ============================================================ */

  function _serviceToDB(service) {
    return {
      id: service.id,
      name: service.name,
      price: Number(service.price) || 0,
      active: service.active !== false,
    };
  }

  function _transactionToDB(txn) {
    return {
      id: txn.id,

      branch: txn.branch || "Kemang",

      service_id: txn.serviceId || null,

      service_name: txn.serviceName || "Unknown",

      price: Number(txn.price) || 0,

      date: txn.date || getTodayStr(),

      treatment_time: txn.treatmentTime || null,

      notes: txn.notes || "",

      promo_id: txn.promoId || null,

      promo_discount: Number(txn.promoDiscount) || 0,

      dp: Number(txn.dp) || 0,
    };
  }

  function _promoToDB(promo) {
    return {
      id: promo.id,

      name: promo.name,

      start_date: promo.startDate,

      end_date: promo.endDate,

      discount: Number(promo.discount) || 0,

      description: promo.description || "",
    };
  }

  /* ============================================================
       INITIALIZE
       ============================================================ */

  async function init() {
    if (initialized) {
      return true;
    }

    /*
     * Load cache dulu supaya UI tidak blank.
     */
    servicesCache = _loadCache(SERVICES_CACHE_KEY);

    transactionsCache = _loadCache(TRANSACTIONS_CACHE_KEY);

    promosCache = _loadCache(PROMOS_CACHE_KEY);

    if (!supabaseClient) {
      console.warn("Supabase tidak tersedia. Menggunakan cache lokal.");

      initialized = true;

      return false;
    }

    try {
      await _loadFromSupabase();

      /*
       * Kalau database benar-benar kosong,
       * buat service default.
       */
      if (servicesCache.length === 0) {
        await _seedDefaultServices();
      }

      initialized = true;

      return true;
    } catch (error) {
      console.error("Gagal initialize Supabase:", error);

      initialized = true;

      if (typeof showToast === "function") {
        showToast(
          "Database tidak bisa diakses. Menggunakan cache lokal.",
          "warning",
        );
      }

      return false;
    }
  }

  /* ============================================================
       LOAD FROM SUPABASE
       ============================================================ */

  async function _loadFromSupabase() {
    _ensureSupabase();

    const [servicesResult, transactionsResult, promosResult] =
      await Promise.all([
        supabaseClient.from("services").select("*").order("created_at", {
          ascending: true,
        }),

        supabaseClient
          .from("transactions")
          .select("*")
          .order("date", {
            ascending: false,
          })
          .order("treatment_time", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),

        supabaseClient.from("promos").select("*").order("start_date", {
          ascending: false,
        }),
      ]);

    if (servicesResult.error) {
      throw servicesResult.error;
    }

    if (transactionsResult.error) {
      throw transactionsResult.error;
    }

    if (promosResult.error) {
      throw promosResult.error;
    }

    servicesCache = (servicesResult.data || []).map(_serviceFromDB);

    transactionsCache = (transactionsResult.data || []).map(_transactionFromDB);

    promosCache = (promosResult.data || []).map(_promoFromDB);

    _cacheAll();

    console.log("Supabase loaded:", {
      services: servicesCache.length,
      transactions: transactionsCache.length,
      promos: promosCache.length,
    });
  }

  /* ============================================================
       SERVICES
       ============================================================ */

  function getServices() {
    return [...servicesCache];
  }

  function getActiveServices() {
    return servicesCache.filter((s) => s.active);
  }

  function getServiceById(id) {
    return servicesCache.find((s) => s.id === id) || null;
  }

  async function addService({ name, price }) {
    _ensureSupabase();

    const svc = {
      id: _id("svc"),
      name,
      price: Number(price) || 0,
      active: true,
    };

    const { data, error } = await supabaseClient
      .from("services")
      .insert(_serviceToDB(svc))
      .select()
      .single();

    if (error) {
      _handleError(error, "menambahkan layanan");
      throw error;
    }

    const saved = _serviceFromDB(data);

    servicesCache.push(saved);

    _saveCache(SERVICES_CACHE_KEY, servicesCache);

    return saved;
  }

  async function updateService(id, updates) {
    _ensureSupabase();

    const current = getServiceById(id);

    if (!current) {
      return null;
    }

    const updated = {
      ...current,
      ...updates,
    };

    if (updates.price !== undefined) {
      updated.price = Number(updates.price) || 0;
    }

    const { data, error } = await supabaseClient
      .from("services")
      .update(_serviceToDB(updated))
      .eq("id", id)
      .select()
      .single();

    if (error) {
      _handleError(error, "memperbarui layanan");
      throw error;
    }

    const saved = _serviceFromDB(data);

    const idx = servicesCache.findIndex((s) => s.id === id);

    if (idx !== -1) {
      servicesCache[idx] = saved;
    }

    _saveCache(SERVICES_CACHE_KEY, servicesCache);

    return saved;
  }

  async function deleteService(id) {
    _ensureSupabase();

    const { error } = await supabaseClient
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      _handleError(error, "menghapus layanan");
      throw error;
    }

    servicesCache = servicesCache.filter((s) => s.id !== id);

    _saveCache(SERVICES_CACHE_KEY, servicesCache);
  }

  /* ============================================================
       TRANSACTIONS
       ============================================================ */

  function getTransactions() {
    return [...transactionsCache].sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }

      if ((b.treatmentTime || "") !== (a.treatmentTime || "")) {
        return (b.treatmentTime || "").localeCompare(a.treatmentTime || "");
      }

      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
  }

  /* ============================================================
       PAYMENT CALCULATION
  
       Total Treatment = harga asli
  
       DP = pembayaran awal
  
       Sisa sebelum promo
         = Total Treatment - DP
  
       Diskon
         = Sisa sebelum promo × promo%
  
       Sisa bayar
         = Sisa sebelum promo - Diskon
  
       Contoh:
  
       Treatment       200.000
       DP               100.000
       Promo                50%
  
       Sisa sebelum promo
         = 200.000 - 100.000
         = 100.000
  
       Diskon
         = 100.000 × 50%
         = 50.000
  
       Sisa bayar
         = 100.000 - 50.000
         = 50.000
  
       TOTAL CUSTOMER BAYAR = 50.000
       ============================================================ */

  function calculateTransaction({ price, dp = 0, promoDiscount = 0 }) {
    const totalTreatment = Math.max(0, Number(price) || 0);

    const requestedDP = Math.max(0, Number(dp) || 0);

    const actualDP = Math.min(requestedDP, totalTreatment);

    const discountPercent = Math.max(0, Number(promoDiscount) || 0);

    const remainingBeforePromo = totalTreatment - actualDP;

    const discountAmount = Math.round(
      remainingBeforePromo * (discountPercent / 100),
    );

    const remainingAmount = Math.max(0, remainingBeforePromo - discountAmount);

    /*
     * Ini bukan "uang customer harus bayar".
     *
     * Ini adalah nilai treatment setelah
     * memperhitungkan DP + diskon.
     */
    const finalTreatmentAmount = actualDP + remainingAmount;

    return {
      totalTreatment,

      dp: actualDP,

      promoDiscount: discountPercent,

      discountAmount,

      remainingBeforePromo,

      remainingAmount,

      finalTreatmentAmount,
    };
  }

  async function addTransaction({
    branch,
    serviceId,
    serviceName,
    price,
    date,
    treatmentTime,
    notes,
    promoId,
    promoDiscount,
    dp,
  }) {
    _ensureSupabase();

    const calculation = calculateTransaction({
      price,
      dp,
      promoDiscount,
    });

    const txn = {
      id: _id("txn"),

      branch: branch || "Kemang",

      serviceId,

      serviceName,

      price: calculation.totalTreatment,

      date: date || getTodayStr(),

      treatmentTime: treatmentTime || "",

      notes: notes || "",

      dp: calculation.dp,

      promoId: promoId || null,

      promoDiscount: calculation.promoDiscount,

      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabaseClient
      .from("transactions")
      .insert(_transactionToDB(txn))
      .select()
      .single();

    if (error) {
      _handleError(error, "menyimpan transaksi");

      throw error;
    }

    const saved = _transactionFromDB(data);

    transactionsCache.push(saved);

    _saveCache(TRANSACTIONS_CACHE_KEY, transactionsCache);

    return saved;
  }

  async function updateTransaction(id, updates) {
    _ensureSupabase();

    const current = transactionsCache.find((t) => t.id === id);

    if (!current) {
      return null;
    }

    const price =
      updates.price !== undefined
        ? Number(updates.price)
        : Number(current.price) || 0;

    const dp =
      updates.dp !== undefined ? Number(updates.dp) : Number(current.dp) || 0;

    const promoDiscount =
      updates.promoDiscount !== undefined
        ? Number(updates.promoDiscount)
        : Number(current.promoDiscount) || 0;

    const calculation = calculateTransaction({
      price,
      dp,
      promoDiscount,
    });

    const updated = {
      ...current,
      ...updates,

      price: calculation.totalTreatment,

      dp: calculation.dp,

      promoDiscount: calculation.promoDiscount,

      treatmentTime:
        updates.treatmentTime !== undefined
          ? updates.treatmentTime
          : current.treatmentTime,

      date: updates.date !== undefined ? updates.date : current.date,

      branch: updates.branch !== undefined ? updates.branch : current.branch,

      serviceId:
        updates.serviceId !== undefined ? updates.serviceId : current.serviceId,

      serviceName:
        updates.serviceName !== undefined
          ? updates.serviceName
          : current.serviceName,

      notes: updates.notes !== undefined ? updates.notes : current.notes,

      promoId:
        updates.promoId !== undefined ? updates.promoId : current.promoId,
    };

    const { data, error } = await supabaseClient
      .from("transactions")
      .update(_transactionToDB(updated))
      .eq("id", id)
      .select()
      .single();

    if (error) {
      _handleError(error, "memperbarui transaksi");

      throw error;
    }

    const saved = _transactionFromDB(data);

    const idx = transactionsCache.findIndex((t) => t.id === id);

    if (idx !== -1) {
      transactionsCache[idx] = saved;
    }

    _saveCache(TRANSACTIONS_CACHE_KEY, transactionsCache);

    return saved;
  }

  async function deleteTransaction(id) {
    _ensureSupabase();

    const { error } = await supabaseClient
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      _handleError(error, "menghapus transaksi");

      throw error;
    }

    transactionsCache = transactionsCache.filter((t) => t.id !== id);

    _saveCache(TRANSACTIONS_CACHE_KEY, transactionsCache);
  }

  function getTransactionsByDateRange(start, end) {
    return getTransactions().filter((t) => t.date >= start && t.date <= end);
  }

  /* ============================================================
       PROMOS
       ============================================================ */

  function getPromos() {
    return [...promosCache];
  }

  function getActivePromos(dateStr) {
    const d = dateStr || getTodayStr();

    return promosCache.filter((p) => p.startDate <= d && p.endDate >= d);
  }

  async function addPromo({ name, startDate, endDate, discount, description }) {
    _ensureSupabase();

    const promo = {
      id: _id("promo"),

      name,

      startDate,

      endDate,

      discount: Number(discount) || 0,

      description: description || "",
    };

    const { data, error } = await supabaseClient
      .from("promos")
      .insert(_promoToDB(promo))
      .select()
      .single();

    if (error) {
      _handleError(error, "menambahkan promo");

      throw error;
    }

    const saved = _promoFromDB(data);

    promosCache.push(saved);

    _saveCache(PROMOS_CACHE_KEY, promosCache);

    return saved;
  }

  async function updatePromo(id, updates) {
    _ensureSupabase();

    const current = promosCache.find((p) => p.id === id);

    if (!current) {
      return null;
    }

    const updated = {
      ...current,
      ...updates,
    };

    if (updates.discount !== undefined) {
      updated.discount = Number(updates.discount) || 0;
    }

    const { data, error } = await supabaseClient
      .from("promos")
      .update(_promoToDB(updated))
      .eq("id", id)
      .select()
      .single();

    if (error) {
      _handleError(error, "memperbarui promo");

      throw error;
    }

    const saved = _promoFromDB(data);

    const idx = promosCache.findIndex((p) => p.id === id);

    if (idx !== -1) {
      promosCache[idx] = saved;
    }

    _saveCache(PROMOS_CACHE_KEY, promosCache);

    return saved;
  }

  async function deletePromo(id) {
    _ensureSupabase();

    const { error } = await supabaseClient.from("promos").delete().eq("id", id);

    if (error) {
      _handleError(error, "menghapus promo");

      throw error;
    }

    promosCache = promosCache.filter((p) => p.id !== id);

    _saveCache(PROMOS_CACHE_KEY, promosCache);
  }

  /* ============================================================
       SEED DEFAULT SERVICES
       ============================================================ */

  async function _seedDefaultServices() {
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

    for (const service of defaults) {
      await addService(service);
    }
  }

  /* ============================================================
       UTILITY
       ============================================================ */

  function formatCurrency(amount) {
    return "Rp " + Number(amount || 0).toLocaleString("id-ID");
  }

  function getTodayStr() {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) {
      return "-";
    }

    const d = new Date(dateStr + "T00:00:00");

    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  /* ============================================================
       REFRESH DATABASE
       
       Bisa dipanggil kapan saja kalau mau mengambil
       data terbaru dari Supabase.
       ============================================================ */

  async function refresh() {
    if (!supabaseClient) {
      return false;
    }

    try {
      await _loadFromSupabase();

      return true;
    } catch (error) {
      console.error("Refresh Supabase gagal:", error);

      return false;
    }
  }

  /* ============================================================
       PUBLIC API
       ============================================================ */

  return {
    init,
    refresh,

    /* Services */
    getServices,
    getActiveServices,
    getServiceById,

    addService,
    updateService,
    deleteService,

    /* Transactions */
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,

    getTransactionsByDateRange,

    calculateTransaction,

    /* Promos */
    getPromos,
    getActivePromos,

    addPromo,
    updatePromo,
    deletePromo,

    /* Utility */
    formatCurrency,
    getTodayStr,
    formatDate,
  };
})();
