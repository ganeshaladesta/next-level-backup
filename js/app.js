/* ============================================================
   Beauty Bar Dashboard — App Router & Global Utilities
   ============================================================ */

/* ---------- Global Toast ---------- */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show toast-' + type;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

/* ---------- App ---------- */
const App = (() => {
  const VIEWS = ['dashboard', 'transactions', 'services', 'promos', 'history'];
  const PAGE_TITLES = {
    dashboard:    '📊 Dashboard',
    transactions: '💰 Tambah Transaksi',
    services:     '💅 Layanan & Harga',
    promos:       '🎉 Promo',
    history:      '📋 Riwayat Transaksi'
  };

  function init() {
    Store.init();
    _setupNav();
    _setupMobile();
    _setupExport();
    _updateDateDisplay();

    // Navigate to current hash or default
    const hash = window.location.hash.slice(1);
    navigateTo(VIEWS.includes(hash) ? hash : 'dashboard');
    window.addEventListener('hashchange', () => {
      navigateTo(window.location.hash.slice(1) || 'dashboard');
    });
  }

  function _setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        window.location.hash = item.dataset.view;
      });
    });
  }

  function _setupMobile() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (toggle) toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });

    if (overlay) overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });

    // Close sidebar on nav click (mobile)
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
      });
    });
  }

  function _setupExport() {
    const btn = document.getElementById('exportCsvBtn');
    if (btn) btn.addEventListener('click', () => Transactions.exportCSV());
  }

  function _updateDateDisplay() {
    const el = document.getElementById('dateDisplay');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function navigateTo(viewName) {
    if (!VIEWS.includes(viewName)) viewName = 'dashboard';

    // Toggle views
    VIEWS.forEach(v => {
      const el = document.getElementById('view-' + v);
      if (el) el.classList.toggle('active', v === viewName);
    });

    // Toggle nav active
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Page title
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = PAGE_TITLES[viewName] || 'Next Level';

    // Render view
    switch (viewName) {
      case 'dashboard':    Dashboard.render(); break;
      case 'transactions': Transactions.render(); break;
      case 'services':     Services.render(); break;
      case 'promos':       Promos.render(); break;
      case 'history':      Transactions.renderHistory(); break;
    }
  }

  return { init, navigateTo };
})();

document.addEventListener('DOMContentLoaded', App.init);
