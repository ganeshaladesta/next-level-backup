/* ============================================================
   NEXT LEVEL BEAUTY BAR
   App Router
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

function _setAppLoading(loading) {
  const el = document.getElementById("appLoading");

  if (el) {
    el.classList.toggle("hidden", !loading);
  }
}

function _showConfigError(message) {
  const el = document.getElementById("appLoading");

  if (!el) {
    console.error(message);
    return;
  }

  el.innerHTML = `
      <div class="app-loading-error">
        <p>
          <strong>Database connection failed</strong>
        </p>
  
        <p>${message}</p>
  
        <p class="text-muted">
          Please check Supabase configuration and schema.
        </p>
      </div>
    `;
}

const App = (() => {
  const VIEWS = ["dashboard", "transactions", "services", "promos", "history"];

  const PAGE_TITLES = {
    dashboard: "📊 Dashboard",
    transactions: "💰 Add Transaction",
    services: "💅 Services & Pricing",
    promos: "🎉 Promotions",
    history: "📋 History",
  };

  let initialized = false;

  async function init() {
    if (initialized) return;

    initialized = true;

    _setAppLoading(true);

    try {
      await Store.init();

      console.log("Supabase connected successfully.");
    } catch (err) {
      console.error("Store initialization failed:", err);

      _showConfigError(err.message || "Unable to connect to Supabase database.");

      _setAppLoading(false);

      return;
    }

    _setupNav();
    _setupMobile();
    _setupExport();
    _updateDateDisplay();

    window.addEventListener("hashchange", async () => {
      await navigateTo(window.location.hash.slice(1) || "dashboard");
    });

    const hash = window.location.hash.slice(1);

    await navigateTo(VIEWS.includes(hash) ? hash : "dashboard");

    _setAppLoading(false);
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
        sidebar?.classList.toggle("open");

        overlay?.classList.toggle("show");
      });
    }

    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar?.classList.remove("open");

        overlay.classList.remove("show");
      });
    }
  }

  function _setupExport() {
    const btn = document.getElementById("exportCsvBtn");

    if (btn) {
      btn.addEventListener("click", () => {
        Transactions.exportCSV();
      });
    }
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

  async function navigateTo(viewName) {
    if (!VIEWS.includes(viewName)) {
      viewName = "dashboard";
    }

    VIEWS.forEach((v) => {
      const el = document.getElementById("view-" + v);

      if (el) {
        el.classList.toggle("active", v === viewName);
      }
    });

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === viewName);
    });

    const titleEl = document.getElementById("pageTitle");

    if (titleEl) {
      titleEl.textContent = PAGE_TITLES[viewName] || "Next Level";
    }

    try {
      switch (viewName) {
        case "dashboard":
          await Dashboard.render();
          break;

        case "transactions":
          await Transactions.render();
          break;

        case "services":
          await Services.render();
          break;

        case "promos":
          await Promos.render();
          break;

        case "history":
          await Transactions.renderHistory();
          break;
      }
    } catch (err) {
      console.error("Navigation render error:", err);

      showToast("Failed to load page. Check console for details.", "danger");
    }

    const sidebar = document.getElementById("sidebar");

    const overlay = document.getElementById("sidebarOverlay");

    sidebar?.classList.remove("open");
    overlay?.classList.remove("show");
  }

  return {
    init,
    navigateTo,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
