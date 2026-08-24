/* ============================================================
   NEXT LEVEL BEAUTY BAR
   Supabase Data Store
   ============================================================ */

const Store = (() => {
  let supabase = null;

  /* ============================================================
     INIT
     ============================================================ */

  function initClient() {
    if (supabase) return supabase;

    if (!window.APP_CONFIG) {
      throw new Error("APP_CONFIG configuration not found.");
    }

    if (!window.supabase) {
      throw new Error("Supabase JS library is not loaded.");
    }

    const { supabaseUrl, supabaseAnonKey } = window.APP_CONFIG;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Anon Key is missing.");
    }

    supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

    return supabase;
  }

  async function init() {
    initClient();

    // Test connection
    const { error } = await supabase.from("services").select("id").limit(1);

    if (error) {
      console.error("Supabase connection error:", error);
      throw new Error(error.message);
    }

    // Seed services if table is empty
    const { count, error: countError } = await supabase
      .from("services")
      .select("id", { count: "exact", head: true });

    if (countError) {
      throw new Error(countError.message);
    }

    if ((count || 0) === 0) {
      await seedDefaultServices();
    }

    return true;
  }

  /* ============================================================
     HELPERS
     ============================================================ */

  function generateId(prefix) {
    return (
      prefix +
      "-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 8)
    );
  }

  function getTodayStr() {
    const d = new Date();

    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function formatCurrency(amount) {
    return "Rp " + Number(amount || 0).toLocaleString("id-ID");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";

    const d = new Date(dateStr + "T00:00:00");

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function normalizeTransaction(row) {
    if (!row) return null;

    const price = Number(row.price || 0);
    const dp = Number(row.dp || 0);
    const promoDiscount = Number(row.promo_discount || 0);

    const actualDP = Math.min(Math.max(0, dp), Math.max(0, price));

    const remainingBeforePromo = Math.max(0, price - actualDP);

    const discountAmount = Math.round(
      remainingBeforePromo * (Math.max(0, Math.min(100, promoDiscount)) / 100),
    );

    const remainingAmount = Math.max(0, remainingBeforePromo - discountAmount);

    const finalTreatmentAmount = actualDP + remainingAmount;

    return {
      ...row,

      price,
      dp: actualDP,
      promoDiscount,
      discountAmount,
      remainingBeforePromo,
      remainingAmount,
      finalTreatmentAmount,

      // Support camelCase for legacy compatibility
      serviceId: row.service_id,
      serviceName: row.service_name,
      treatmentTime: row.treatment_time,
      promoId: row.promo_id,
      createdAt: row.created_at,
    };
  }

  function normalizeService(row) {
    if (!row) return null;

    return {
      ...row,
      id: row.id,
      name: row.name,
      price: Number(row.price || 0),
      active: row.active !== false,
      createdAt: row.created_at,
    };
  }

  function normalizePromo(row) {
    if (!row) return null;

    return {
      ...row,
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      discount: Number(row.discount || 0),
      description: row.description || "",
      createdAt: row.created_at,
    };
  }

  /* ============================================================
     SERVICES
     ============================================================ */

  async function getServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map(normalizeService);
  }

  async function getActiveServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map(normalizeService);
  }

  async function getServiceById(id) {
    if (!id) return null;

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return normalizeService(data);
  }

  async function addService({ name, price }) {
    const service = {
      id: generateId("svc"),
      name: String(name || "").trim(),
      price: Number(price || 0),
      active: true,
    };

    if (!service.name) {
      throw new Error("Service name is required.");
    }

    const { data, error } = await supabase
      .from("services")
      .insert(service)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return normalizeService(data);
  }

  async function updateService(id, updates) {
    const payload = {};

    if (updates.name !== undefined) {
      payload.name = String(updates.name).trim();
    }

    if (updates.price !== undefined) {
      payload.price = Number(updates.price || 0);
    }

    if (updates.active !== undefined) {
      payload.active = Boolean(updates.active);
    }

    const { data, error } = await supabase
      .from("services")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return normalizeService(data);
  }

  async function deleteService(id) {
    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return true;
  }

  async function seedDefaultServices() {
    const defaults = [
      {
        id: generateId("svc"),
        name: "Nails",
        price: 150000,
        active: true,
      },
      {
        id: generateId("svc"),
        name: "Manicure",
        price: 100000,
        active: true,
      },
      {
        id: generateId("svc"),
        name: "Pedicure",
        price: 120000,
        active: true,
      },
      {
        id: generateId("svc"),
        name: "Nail Art",
        price: 200000,
        active: true,
      },
      {
        id: generateId("svc"),
        name: "Eyelash Extension",
        price: 250000,
        active: true,
      },
      {
        id: generateId("svc"),
        name: "Eyebrow",
        price: 75000,
        active: true,
      },
      {
        id: generateId("svc"),
        name: "Tooth Gem",
        price: 100000,
        active: true,
      },
      {
        id: generateId("svc"),
        name: "Lash Lift",
        price: 180000,
        active: true,
      },
    ];

    const { error } = await supabase.from("services").insert(defaults);

    if (error) throw new Error(error.message);

    return true;
  }

  /* ============================================================
     PROMOS
     ============================================================ */

  async function getPromos() {
    const { data, error } = await supabase
      .from("promos")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(normalizePromo);
  }

  async function getActivePromos(dateStr) {
    const d = dateStr || getTodayStr();

    const { data, error } = await supabase
      .from("promos")
      .select("*")
      .lte("start_date", d)
      .gte("end_date", d)
      .order("discount", { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(normalizePromo);
  }

  async function addPromo({ name, startDate, endDate, discount, description }) {
    const promo = {
      id: generateId("promo"),
      name: String(name || "").trim(),
      start_date: startDate,
      end_date: endDate,
      discount: Number(discount || 0),
      description: description || "",
    };

    if (!promo.name) {
      throw new Error("Promotion name is required.");
    }

    if (!promo.start_date || !promo.end_date) {
      throw new Error("Promotion dates are required.");
    }

    if (promo.end_date < promo.start_date) {
      throw new Error("End date cannot be before start date.");
    }

    const { data, error } = await supabase
      .from("promos")
      .insert(promo)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return normalizePromo(data);
  }

  async function updatePromo(id, updates) {
    const payload = {};

    if (updates.name !== undefined) {
      payload.name = String(updates.name).trim();
    }

    if (updates.startDate !== undefined) {
      payload.start_date = updates.startDate;
    }

    if (updates.endDate !== undefined) {
      payload.end_date = updates.endDate;
    }

    if (updates.discount !== undefined) {
      payload.discount = Number(updates.discount || 0);
    }

    if (updates.description !== undefined) {
      payload.description = updates.description || "";
    }

    const { data, error } = await supabase
      .from("promos")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return normalizePromo(data);
  }

  async function deletePromo(id) {
    const { error } = await supabase.from("promos").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return true;
  }

  /* ============================================================
     TRANSACTION CALCULATION
     ============================================================ */

  function calculateTransaction({ price, dp = 0, promoDiscount = 0 }) {
    const totalTreatment = Math.max(0, Number(price) || 0);

    const requestedDP = Math.max(0, Number(dp) || 0);

    const actualDP = Math.min(requestedDP, totalTreatment);

    const discountPercent = Math.max(
      0,
      Math.min(100, Number(promoDiscount) || 0),
    );

    const remainingBeforePromo = totalTreatment - actualDP;

    const discountAmount = Math.round(
      remainingBeforePromo * (discountPercent / 100),
    );

    const remainingAmount = Math.max(0, remainingBeforePromo - discountAmount);

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
     TRANSACTIONS
     ============================================================ */

  async function getTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("treatment_time", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(normalizeTransaction);
  }

  async function getTransactionById(id) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return normalizeTransaction(data);
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
    const calculation = calculateTransaction({
      price,
      dp,
      promoDiscount,
    });

    const txn = {
      id: generateId("txn"),

      branch: branch || "Kemang",

      service_id: serviceId || null,

      service_name: serviceName || "Service",

      price: calculation.totalTreatment,

      treatment_time: treatmentTime || null,

      dp: calculation.dp,

      date: date || getTodayStr(),

      notes: notes || "",

      promo_id: promoId || null,

      promo_discount: calculation.promoDiscount,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(txn)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return normalizeTransaction(data);
  }

  async function updateTransaction(id, updates) {
    const current = await getTransactionById(id);

    if (!current) {
      throw new Error("Transaction not found.");
    }

    const price =
      updates.price !== undefined
        ? Number(updates.price)
        : Number(current.price || 0);

    const dp =
      updates.dp !== undefined ? Number(updates.dp) : Number(current.dp || 0);

    const promoDiscount =
      updates.promoDiscount !== undefined
        ? Number(updates.promoDiscount)
        : Number(current.promoDiscount || 0);

    const calculation = calculateTransaction({
      price,
      dp,
      promoDiscount,
    });

    const payload = {
      price: calculation.totalTreatment,
      dp: calculation.dp,
      promo_discount: calculation.promoDiscount,
      promo_id:
        updates.promoId !== undefined
          ? updates.promoId || null
          : current.promo_id || null,
    };

    if (updates.branch !== undefined) {
      payload.branch = updates.branch;
    }

    if (updates.serviceId !== undefined) {
      payload.service_id = updates.serviceId || null;
    }

    if (updates.serviceName !== undefined) {
      payload.service_name = updates.serviceName;
    }

    if (updates.date !== undefined) {
      payload.date = updates.date;
    }

    if (updates.treatmentTime !== undefined) {
      payload.treatment_time = updates.treatmentTime || null;
    }

    if (updates.notes !== undefined) {
      payload.notes = updates.notes || "";
    }

    const { data, error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return normalizeTransaction(data);
  }

  async function deleteTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return true;
  }

  async function getTransactionsByDateRange(start, end) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", start)
      .lte("date", end)
      .order("date", {
        ascending: false,
      })
      .order("treatment_time", {
        ascending: false,
      });

    if (error) throw new Error(error.message);

    return (data || []).map(normalizeTransaction);
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */

  return {
    init,

    getServices,
    getActiveServices,
    getServiceById,
    addService,
    updateService,
    deleteService,

    getPromos,
    getActivePromos,
    addPromo,
    updatePromo,
    deletePromo,

    getTransactions,
    getTransactionById,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByDateRange,

    calculateTransaction,

    formatCurrency,
    getTodayStr,
    formatDate,
  };
})();
