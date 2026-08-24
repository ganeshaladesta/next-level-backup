/* ============================================================
   Next Level Beauty Bar — App Router & Global Utilities
   ============================================================ */

/* ============================================================
   GLOBAL TOAST
   ============================================================ */

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.className = "toast show toast-" + type;

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

/* ============================================================
     APP LOADING
     ============================================================ */

function _setAppLoading(loading) {
  const el = document.getElementById("appLoading");

  if (!el) return;

  el.classList.toggle("hidden", !loading);
}

/* ============================================================
     DATABASE ERROR
     ============================================================ */

function _showConfigError(message) {
  const el = document.getElementById("appLoading");

  if (!el) return;

  el.innerHTML = `
      <div class="app-loading-error">
        <p>
          <strong>Database connection failed</strong>
        </p>
  
        <p>
          ${message}
        </p>
  
        <p class="text-muted">
          Pastikan:
          <br>
          1. js/config.js sudah berisi Supabase URL dan anon key
          <br>
          2. Supabase project aktif
          <br>
          3. schema.sql sudah dijalankan
          <br>
          4. RLS policy sudah dibuat
        </p>
      </div>
    `;
}

/* ============================================================
     APP
     ============================================================ */

const App = (() => {
  const VIEWS = ["dashboard", "transactions", "services", "promos", "history"];

  const PAGE_TITLES = {
    dashboard: "📊 Dashboard",

    transactions: "💰 Add Transaction",

    services: "💅 Services & Pricing",

    promos: "🎉 Promotions",

    history: "📋 Transaction History",
  };

  /* ==========================================================
       INIT
       ========================================================== */

  async function init() {
    _setAppLoading(true);

    try {
      /*
       * Store.init()
       *
       * Di versi Supabase:
       * - cek koneksi
       * - load services
       * - load promos
       * - load transactions
       * - seed default services jika database kosong
       */

      await Store.init();
    } catch (err) {
      console.error("Supabase initialization error:", err);

      _showConfigError(err?.message || "Could not connect to Supabase.");

      /*
       * Jangan lanjutkan aplikasi
       * kalau database gagal connect.
       */

      return;
    } finally {
      _setAppLoading(false);
    }

    /* ========================================================
         SETUP APPLICATION
         ======================================================== */

    _setupNav();

    _setupMobile();

    _setupExport();

    _updateDateDisplay();

    /* ========================================================
         INITIAL ROUTE
         ======================================================== */

    const hash = window.location.hash.slice(1);

    navigateTo(VIEWS.includes(hash) ? hash : "dashboard");

    /* ========================================================
         HASH ROUTING
         ======================================================== */

    window.addEventListener("hashchange", () => {
      const currentHash = window.location.hash.slice(1);

      navigateTo(VIEWS.includes(currentHash) ? currentHash : "dashboard");
    });
  }

  /* ==========================================================
       NAVIGATION
       ========================================================== */

  function _setupNav() {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();

        const view = item.dataset.view;

        if (!view) return;

        window.location.hash = view;
      });
    });
  }

  /* ==========================================================
       MOBILE SIDEBAR
       ========================================================== */

  function _setupMobile() {
    const toggle = document.getElementById("menuToggle");

    const sidebar = document.getElementById("sidebar");

    const overlay = document.getElementById("sidebarOverlay");

    if (toggle) {
      toggle.addEventListener("click", () => {
        sidebar?.classList.toggle("open");

        overlay?.classList.toggle("show");
      });
    }

    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar?.classList.remove("open");

        overlay?.classList.remove("show");
      });
    }

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", () => {
        sidebar?.classList.remove("open");

        overlay?.classList.remove("show");
      });
    });
  }

  /* ==========================================================
       CSV EXPORT
       ========================================================== */

  function _setupExport() {
    const btn = document.getElementById("exportCsvBtn");

    if (!btn) return;

    btn.addEventListener("click", () => {
      if (
        typeof Transactions !== "undefined" &&
        typeof Transactions.exportCSV === "function"
      ) {
        Transactions.exportCSV();
      }
    });
  }

  /* ==========================================================
       DATE DISPLAY
       ========================================================== */

  function _updateDateDisplay() {
    const el = document.getElementById("dateDisplay");

    if (!el) return;

    const now = new Date();

    el.textContent = now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  /* ==========================================================
       ROUTER
       ========================================================== */

  function navigateTo(viewName) {
    if (!VIEWS.includes(viewName)) {
      viewName = "dashboard";
    }

    /* ========================================================
         TOGGLE VIEW
         ======================================================== */

    VIEWS.forEach((view) => {
      const el = document.getElementById("view-" + view);

      if (!el) return;

      el.classList.toggle("active", view === viewName);
    });

    /* ========================================================
         TOGGLE SIDEBAR ACTIVE
         ======================================================== */

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === viewName);
    });

    /* ========================================================
         PAGE TITLE
         ======================================================== */

    const titleEl = document.getElementById("pageTitle");

    if (titleEl) {
      titleEl.textContent = PAGE_TITLES[viewName] || "Next Level";
    }

    /* ========================================================
         RENDER VIEW
         ======================================================== */

    try {
      switch (viewName) {
        case "dashboard":
          if (typeof Dashboard !== "undefined") {
            Dashboard.render();
          }

          break;

        case "transactions":
          if (typeof Transactions !== "undefined") {
            Transactions.render();
          }

          break;

        case "services":
          if (typeof Services !== "undefined") {
            Services.render();
          }

          break;

        case "promos":
          if (typeof Promos !== "undefined") {
            Promos.render();
          }

          break;

        case "history":
          if (typeof Transactions !== "undefined") {
            Transactions.renderHistory();
          }

          break;
      }
    } catch (err) {
      console.error(`Error rendering ${viewName}:`, err);

      showToast("Gagal memuat halaman. Cek console.", "warning");
    }
  }

  /* ==========================================================
       PUBLIC API
       ========================================================== */

  return {
    init,

    navigateTo,
  };
})();

/* ============================================================
     START APPLICATION
     ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
