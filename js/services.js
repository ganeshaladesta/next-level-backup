/* ============================================================
   Beauty Bar Dashboard — Services Management
   ============================================================ */
const Services = (() => {
  let _initialized = false;
  let editingId = null;

  function render() {
    if (!_initialized) { _setup(); _initialized = true; }
    _renderList();
  }

  function _setup() {
    document.getElementById('serviceForm').addEventListener('submit', e => {
      e.preventDefault();
      _save();
    });
  }

  function _save() {
    const nameIn  = document.getElementById('svcName');
    const priceIn = document.getElementById('svcPrice');

    const name  = nameIn.value.trim();
    const price = Number(priceIn.value);

    if (!name) { showToast('Nama layanan harus diisi!', 'warning'); return; }
    if (!price || price <= 0) { showToast('Masukkan harga yang valid!', 'warning'); return; }

    if (editingId) {
      Store.updateService(editingId, { name, price });
      editingId = null;
      document.getElementById('svcSubmitBtn').textContent = '➕ Tambah Layanan';
      showToast('Layanan diperbarui!');
    } else {
      Store.addService({ name, price });
      showToast('Layanan berhasil ditambahkan!');
    }

    nameIn.value = '';
    priceIn.value = '';
    _renderList();
  }

  function _renderList() {
    const el = document.getElementById('servicesList');
    const svcs = Store.getServices();

    if (svcs.length === 0) {
      el.innerHTML = '<p class="empty-state">Belum ada layanan. Tambahkan layanan pertama! 💅</p>';
      return;
    }

    el.innerHTML = `
      <div class="table-responsive">
      <table class="data-table">
        <thead><tr>
          <th>Layanan</th><th>Harga</th><th>Status</th><th>Aksi</th>
        </tr></thead>
        <tbody>${svcs.map(s => `<tr class="${s.active ? '' : 'row-inactive'}">
          <td data-label="Layanan"><strong>${s.name}</strong></td>
          <td data-label="Harga">${Store.formatCurrency(s.price)}</td>
          <td data-label="Status">
            <span class="status-badge ${s.active ? 'badge-active' : 'badge-inactive'}">
              ${s.active ? '✅ Aktif' : '⛔ Nonaktif'}
            </span>
          </td>
          <td data-label="Aksi" class="actions">
            <button class="btn-icon btn-edit" onclick="Services.editSvc('${s.id}')" title="Edit">✏️</button>
            <button class="btn-icon" onclick="Services.toggleSvc('${s.id}')" title="${s.active ? 'Nonaktifkan' : 'Aktifkan'}">
              ${s.active ? '🚫' : '✅'}
            </button>
            <button class="btn-icon btn-delete" onclick="Services.deleteSvc('${s.id}')" title="Hapus">🗑️</button>
          </td>
        </tr>`).join('')}</tbody>
      </table>
      </div>`;
  }

  function editSvc(id) {
    const s = Store.getServiceById(id);
    if (!s) return;
    editingId = id;
    document.getElementById('svcName').value = s.name;
    document.getElementById('svcPrice').value = s.price;
    document.getElementById('svcSubmitBtn').textContent = '✏️ Update Layanan';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleSvc(id) {
    const s = Store.getServiceById(id);
    if (!s) return;
    Store.updateService(id, { active: !s.active });
    _renderList();
    showToast(s.active ? 'Layanan dinonaktifkan' : 'Layanan diaktifkan');
  }

  function deleteSvc(id) {
    if (!confirm('Hapus layanan ini? Transaksi yang sudah ada tidak terpengaruh.')) return;
    Store.deleteService(id);
    _renderList();
    showToast('Layanan dihapus!');
  }

  return { render, editSvc, toggleSvc, deleteSvc };
})();
