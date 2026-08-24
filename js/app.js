/* ============================================================
   Beauty Bar Dashboard — App Router & Global Utilities
   ============================================================ */

/* ---------- Global Toast ---------- */
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

function _setAppLoading(loading) {
  const el = document.getElementById("appLoading");
  if (el) el.classList.toggle("hidden", !loading);
}

function _showConfigError(message) {
  const el = document.getElementById("appLoading");
  if (!el) return;
  el.innerHTML = `
    <div class="app-loading-error">
      <p><strong>Database connection failed</strong></p>
      <p>${message}</p>
      <p class="text-muted">Set up Supabase in <code>js/config.js</code> and run <code>supabase/schema.sql</code>.</p>
    </div>
  `;
}

/* ---------- App ---------- */
const App = (() => {
  const VIEWS = ["dashboard", "transactions", "services", "promos", "history"];
  const PAGE_TITLES = {
    dashboard: "📊 Dashboard",
    transactions: "💰 Add Transaction",
    services: "💅 Services & Pricing",
    promos: "🎉 Promotions",
    history: "📋 Transaction History",
  };

  async function init() {
    _setAppLoading(true);

    try {
      await Store.init();
    } catch (err) {
      console.error(err);
      _showConfigError(err.message || "Could not connect to Supabase.");
      return;
    } finally {
      _setAppLoading(false);
    }

    _setupNav();
    _setupMobile();
    _setupExport();
    _updateDateDisplay();

    const hash = window.location.hash.slice(1);
    navigateTo(VIEWS.includes(hash) ? hash : "dashboard");

    window.addEventListener("hashchange", () => {
      navigateTo(window.location.hash.slice(1) || "dashboard");
    });
  }

  function _setupNav() {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.hash = item.dataset.view;
      });
    });
  }

  function _setupMobile() {
    const toggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (toggle) {
      toggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("show");
      });
    }

    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
      });
    }

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
      });
    });
  }

  function _setupExport() {
    const btn = document.getElementById("exportCsvBtn");
    if (btn) btn.addEventListener("click", () => Transactions.exportCSV());
  }

  function _updateDateDisplay() {
    const el = document.getElementById("dateDisplay");
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function navigateTo(viewName) {
    if (!VIEWS.includes(viewName)) viewName = "dashboard";

    VIEWS.forEach((v) => {
      const el = document.getElementById("view-" + v);
      if (el) el.classList.toggle("active", v === viewName);
    });

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === viewName);
    });

    const titleEl = document.getElementById("pageTitle");
    if (titleEl) titleEl.textContent = PAGE_TITLES[viewName] || "Next Level";

    switch (viewName) {
      case "dashboard":
        Dashboard.render();
        break;
      case "transactions":
        Transactions.render();
        break;
      case "services":
        Services.render();
        break;
      case "promos":
        Promos.render();
        break;
      case "history":
        Transactions.renderHistory();
        break;
    }
  }

  return { init, navigateTo };
})();

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
