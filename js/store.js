/* ============================================================
   Next Level Beauty Bar
   Data Store — Supabase Online
   ============================================================ */

const Store = (() => {
  /* ============================================================
       SUPABASE CLIENT
       ============================================================ */

  let supabaseClient = null;

  function _client() {
    if (supabaseClient) {
      return supabaseClient;
    }

    if (
      !window.APP_CONFIG ||
      !window.APP_CONFIG.supabaseUrl ||
      !window.APP_CONFIG.supabaseAnonKey
    ) {
      console.error("APP_CONFIG Supabase tidak ditemukan.");

      throw new Error(
        "Supabase config tidak ditemukan. Pastikan config.js sudah di-load.",
      );
    }

    if (!window.supabase) {
      console.error("Supabase JS belum di-load.");

      throw new Error("Supabase library belum di-load.");
    }

    supabaseClient = window.supabase.createClient(
      window.APP_CONFIG.supabaseUrl,
      window.APP_CONFIG.supabaseAnonKey,
    );

    return supabaseClient;
  }

  /* ============================================================
       ERROR HANDLER
       ============================================================ */

  function _handleError(error, action = "Database operation") {
    console.error(`[Store] ${action}:`, error);

    if (error) {
      const message =
        error.message ||
        error.details ||
        error.hint ||
        "Terjadi kesalahan database.";

      showToast(message, "warning");
    }

    return null;
  }

  /* ============================================================
       ID
       ============================================================ */

  function _id(prefix) {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}`;
  }

  /* ============================================================
       SERVICES
       ============================================================ */

  async function getServices() {
    try {
      const { data, error } = await _client()
        .from("services")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        return _handleError(error, "Get services");
      }

      return data || [];
    } catch (error) {
      return _handleError(error, "Get services");
    }
  }

  async function getActiveServices() {
    try {
      const { data, error } = await _client()
        .from("services")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) {
        return _handleError(error, "Get active services");
      }

      return data || [];
    } catch (error) {
      return _handleError(error, "Get active services");
    }
  }

  async function getServiceById(id) {
    if (!id) {
      return null;
    }

    try {
      const { data, error } = await _client()
        .from("services")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        return _handleError(error, "Get service");
      }

      return data || null;
    } catch (error) {
      return _handleError(error, "Get service");
    }
  }

  async function addService({ name, price }) {
    try {
      const service = {
        id: _id("svc"),
        name: String(name || "").trim(),
        price: Number(price) || 0,
        active: true,
      };

      const { data, error } = await _client()
        .from("services")
        .insert(service)
        .select()
        .single();

      if (error) {
        _handleError(error, "Add service");

        return null;
      }

      return data;
    } catch (error) {
      return _handleError(error, "Add service");
    }
  }

  async function updateService(id, updates) {
    if (!id) {
      return null;
    }

    try {
      const payload = {
        ...updates,
      };

      if (payload.price !== undefined) {
        payload.price = Number(payload.price) || 0;
      }

      const { data, error } = await _client()
        .from("services")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        _handleError(error, "Update service");

        return null;
      }

      return data;
    } catch (error) {
      return _handleError(error, "Update service");
    }
  }

  async function deleteService(id) {
    if (!id) {
      return false;
    }

    try {
      const { error } = await _client().from("services").delete().eq("id", id);

      if (error) {
        _handleError(error, "Delete service");

        return false;
      }

      return true;
    } catch (error) {
      _handleError(error, "Delete service");

      return false;
    }
  }

  /* ============================================================
       TRANSACTION CALCULATION
       ============================================================ */

  function calculateTransaction({ price, dp = 0, promoDiscount = 0 }) {
    const totalTreatment = Math.max(0, Number(price) || 0);

    const requestedDP = Math.max(0, Number(dp) || 0);

    // DP tidak boleh melebihi harga treatment
    const actualDP = Math.min(requestedDP, totalTreatment);

    const discountPercent = Math.max(0, Number(promoDiscount) || 0);

    // ----------------------------------------------------------
    // SISA SETELAH DP
    // ----------------------------------------------------------

    const remainingBeforePromo = totalTreatment - actualDP;

    // ----------------------------------------------------------
    // DISKON HANYA DARI SISA SETELAH DP
    // ----------------------------------------------------------

    const discountAmount = Math.round(
      remainingBeforePromo * (discountPercent / 100),
    );

    // ----------------------------------------------------------
    // SISA YANG HARUS DIBAYAR
    // ----------------------------------------------------------

    const remainingAmount = Math.max(0, remainingBeforePromo - discountAmount);

    // ----------------------------------------------------------
    // NILAI FINAL TREATMENT
    // ----------------------------------------------------------

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

  /* ============================================================
       GET TRANSACTIONS
       ============================================================ */

  async function getTransactions() {
    try {
      const { data, error } = await _client()
        .from("transactions")
        .select("*")
        .order("date", {
          ascending: false,
        })
        .order("treatment_time", {
          ascending: false,
          nullsFirst: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        _handleError(error, "Get transactions");

        return [];
      }

      return data || [];
    } catch (error) {
      _handleError(error, "Get transactions");

      return [];
    }
  }

  /* ============================================================
       ADD TRANSACTION
       ============================================================ */

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
    try {
      const calculation = calculateTransaction({
        price,
        dp,
        promoDiscount,
      });

      const txn = {
        id: _id("txn"),

        branch: branch || "Kemang",

        service_id: serviceId || null,

        service_name: serviceName || "Unknown",

        // Harga asli
        price: calculation.totalTreatment,

        // Jam treatment
        treatment_time: treatmentTime || null,

        // DP
        dp: calculation.dp,

        // Tanggal
        date: date || getTodayStr(),

        // Catatan
        notes: notes || "",

        // Promo
        promo_id: promoId || null,

        promo_discount: calculation.promoDiscount,
      };

      const { data, error } = await _client()
        .from("transactions")
        .insert(txn)
        .select()
        .single();

      if (error) {
        _handleError(error, "Add transaction");

        return null;
      }

      return data;
    } catch (error) {
      return _handleError(error, "Add transaction");
    }
  }

  /* ============================================================
       UPDATE TRANSACTION
       ============================================================ */

  async function updateTransaction(id, updates) {
    if (!id) {
      return null;
    }

    try {
      // Ambil transaksi lama
      const { data: current, error: getError } = await _client()
        .from("transactions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (getError) {
        _handleError(getError, "Get transaction before update");

        return null;
      }

      if (!current) {
        showToast("Transaksi tidak ditemukan.", "warning");

        return null;
      }

      // --------------------------------------------------------
      // DATA YANG AKAN DIGUNAKAN UNTUK CALCULATION
      // --------------------------------------------------------

      const price =
        updates.price !== undefined
          ? Number(updates.price) || 0
          : Number(current.price) || 0;

      const dp =
        updates.dp !== undefined
          ? Number(updates.dp) || 0
          : Number(current.dp) || 0;

      const promoDiscount =
        updates.promoDiscount !== undefined
          ? Number(updates.promoDiscount) || 0
          : Number(current.promo_discount) || 0;

      const calculation = calculateTransaction({
        price,

        dp,

        promoDiscount,
      });

      // --------------------------------------------------------
      // CONVERT FRONTEND FIELD → SUPABASE FIELD
      // --------------------------------------------------------

      const payload = {};

      if (updates.branch !== undefined) {
        payload.branch = updates.branch;
      }

      if (updates.serviceId !== undefined) {
        payload.service_id = updates.serviceId || null;
      }

      if (updates.serviceName !== undefined) {
        payload.service_name = updates.serviceName;
      }

      if (updates.treatmentTime !== undefined) {
        payload.treatment_time = updates.treatmentTime || null;
      }

      if (updates.date !== undefined) {
        payload.date = updates.date;
      }

      if (updates.notes !== undefined) {
        payload.notes = updates.notes || "";
      }

      if (updates.promoId !== undefined) {
        payload.promo_id = updates.promoId || null;
      }

      // --------------------------------------------------------
      // ALWAYS SAVE CALCULATED VALUES
      // --------------------------------------------------------

      payload.price = calculation.totalTreatment;

      payload.dp = calculation.dp;

      payload.promo_discount = calculation.promoDiscount;

      const { data, error } = await _client()
        .from("transactions")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        _handleError(error, "Update transaction");

        return null;
      }

      return data;
    } catch (error) {
      return _handleError(error, "Update transaction");
    }
  }

  /* ============================================================
       DELETE TRANSACTION
       ============================================================ */

  async function deleteTransaction(id) {
    if (!id) {
      return false;
    }

    try {
      const { error } = await _client()
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) {
        _handleError(error, "Delete transaction");

        return false;
      }

      return true;
    } catch (error) {
      _handleError(error, "Delete transaction");

      return false;
    }
  }

  /* ============================================================
       TRANSACTIONS BY DATE RANGE
       ============================================================ */

  async function getTransactionsByDateRange(start, end) {
    try {
      const { data, error } = await _client()
        .from("transactions")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", {
          ascending: false,
        });

      if (error) {
        _handleError(error, "Get transactions by date");

        return [];
      }

      return data || [];
    } catch (error) {
      _handleError(error, "Get transactions by date");

      return [];
    }
  }

  /* ============================================================
       PROMOS
       ============================================================ */

  async function getPromos() {
    try {
      const { data, error } = await _client()
        .from("promos")
        .select("*")
        .order("start_date", {
          ascending: false,
        });

      if (error) {
        _handleError(error, "Get promos");

        return [];
      }

      return data || [];
    } catch (error) {
      _handleError(error, "Get promos");

      return [];
    }
  }

  async function getActivePromos(dateStr) {
    const d = dateStr || getTodayStr();

    try {
      const { data, error } = await _client()
        .from("promos")
        .select("*")
        .lte("start_date", d)
        .gte("end_date", d)
        .order("discount", {
          ascending: true,
        });

      if (error) {
        _handleError(error, "Get active promos");

        return [];
      }

      return data || [];
    } catch (error) {
      _handleError(error, "Get active promos");

      return [];
    }
  }

  async function addPromo({
    name,

    startDate,

    endDate,

    discount,

    description,
  }) {
    try {
      const promo = {
        id: _id("promo"),

        name: String(name || "").trim(),

        start_date: startDate,

        end_date: endDate,

        discount: Number(discount) || 0,

        description: description || "",
      };

      const { data, error } = await _client()
        .from("promos")
        .insert(promo)
        .select()
        .single();

      if (error) {
        _handleError(error, "Add promo");

        return null;
      }

      return data;
    } catch (error) {
      return _handleError(error, "Add promo");
    }
  }

  async function updatePromo(id, updates) {
    if (!id) {
      return null;
    }

    try {
      const payload = {};

      if (updates.name !== undefined) {
        payload.name = updates.name;
      }

      if (updates.startDate !== undefined) {
        payload.start_date = updates.startDate;
      }

      if (updates.endDate !== undefined) {
        payload.end_date = updates.endDate;
      }

      if (updates.discount !== undefined) {
        payload.discount = Number(updates.discount) || 0;
      }

      if (updates.description !== undefined) {
        payload.description = updates.description || "";
      }

      const { data, error } = await _client()
        .from("promos")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        _handleError(error, "Update promo");

        return null;
      }

      return data;
    } catch (error) {
      return _handleError(error, "Update promo");
    }
  }

  async function deletePromo(id) {
    if (!id) {
      return false;
    }

    try {
      const { error } = await _client().from("promos").delete().eq("id", id);

      if (error) {
        _handleError(error, "Delete promo");

        return false;
      }

      return true;
    } catch (error) {
      _handleError(error, "Delete promo");

      return false;
    }
  }

  /* ============================================================
       INIT
       ============================================================ */

  async function init() {
    try {
      // Test connection
      const { error } = await _client().from("services").select("id").limit(1);

      if (error) {
        console.error("Supabase connection error:", error);

        showToast("Gagal terhubung ke database Supabase.", "warning");

        return false;
      }

      console.log("✅ Supabase connected");

      return true;
    } catch (error) {
      console.error("Supabase init error:", error);

      showToast("Database tidak dapat diakses.", "warning");

      return false;
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

    return (
      `${d.getFullYear()}-` +
      `${String(d.getMonth() + 1).padStart(2, "0")}-` +
      `${String(d.getDate()).padStart(2, "0")}`
    );
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
       PUBLIC API
       ============================================================ */

  return {
    // Supabase
    init,

    // Services
    getServices,
    getActiveServices,
    getServiceById,
    addService,
    updateService,
    deleteService,

    // Transactions
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByDateRange,

    // Calculation
    calculateTransaction,

    // Promos
    getPromos,
    getActivePromos,
    addPromo,
    updatePromo,
    deletePromo,

    // Utility
    formatCurrency,
    getTodayStr,
    formatDate,
  };
})();
