/* ============================================================
   Beauty Bar Dashboard — Services Management
   ============================================================ */

const Services = (() => {
  let _initialized = false;
  let editingId = null;

  async function render() {
    if (!_initialized) {
      _setup();
      _initialized = true;
    }

    await _renderList();
  }

  function _setup() {
    const form = document.getElementById("serviceForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await _save();
    });
  }

  async function _save() {
    const nameIn = document.getElementById("svcName");

    const priceIn = document.getElementById("svcPrice");

    const name = nameIn.value.trim();

    const price = Number(priceIn.value);

    if (!name) {
      showToast("Nama layanan harus diisi!", "warning");
      return;
    }

    if (!price || price <= 0) {
      showToast("Masukkan harga yang valid!", "warning");
      return;
    }

    if (editingId) {
      const result = await Store.updateService(editingId, {
        name,
        price,
      });

      if (!result) return;

      editingId = null;

      document.getElementById("svcSubmitBtn").textContent = "➕ Tambah Layanan";

      showToast("Layanan diperbarui!");
    } else {
      const result = await Store.addService({
        name,
        price,
      });

      if (!result) return;

      showToast("Layanan berhasil ditambahkan!");
    }

    nameIn.value = "";
    priceIn.value = "";

    await _renderList();
  }

  async function _renderList() {
    const el = document.getElementById("servicesList");

    if (!el) return;

    el.innerHTML = '<p class="empty-state">Loading layanan...</p>';

    const svcs = await Store.getServices();

    if (svcs.length === 0) {
      el.innerHTML =
        '<p class="empty-state">Belum ada layanan. Tambahkan layanan pertama! 💅</p>';
      return;
    }

    el.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Layanan</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
  
            <tbody>
              ${svcs
                .map(
                  (s) => `
                  <tr class="${s.active ? "" : "row-inactive"}">
  
                    <td data-label="Layanan">
                      <strong>
                        ${s.name}
                      </strong>
                    </td>
  
                    <td data-label="Harga">
                      ${Store.formatCurrency(s.price)}
                    </td>
  
                    <td data-label="Status">
                      <span class="status-badge ${
                        s.active ? "badge-active" : "badge-inactive"
                      }">
                        ${s.active ? "✅ Aktif" : "⛔ Nonaktif"}
                      </span>
                    </td>
  
                    <td
                      data-label="Aksi"
                      class="actions"
                    >
  
                      <button
                        class="btn-icon btn-edit"
                        onclick="Services.editSvc('${s.id}')"
                        title="Edit"
                      >
                        ✏️
                      </button>
  
                      <button
                        class="btn-icon"
                        onclick="Services.toggleSvc('${s.id}')"
                        title="${s.active ? "Nonaktifkan" : "Aktifkan"}"
                      >
                        ${s.active ? "🚫" : "✅"}
                      </button>
  
                      <button
                        class="btn-icon btn-delete"
                        onclick="Services.deleteSvc('${s.id}')"
                        title="Hapus"
                      >
                        🗑️
                      </button>
  
                    </td>
                  </tr>
                `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
  }

  async function editSvc(id) {
    const s = await Store.getServiceById(id);

    if (!s) return;

    editingId = id;

    document.getElementById("svcName").value = s.name;

    document.getElementById("svcPrice").value = s.price;

    document.getElementById("svcSubmitBtn").textContent = "✏️ Update Layanan";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function toggleSvc(id) {
    const s = await Store.getServiceById(id);

    if (!s) return;

    const result = await Store.updateService(id, {
      active: !s.active,
    });

    if (!result) return;

    await _renderList();

    showToast(s.active ? "Layanan dinonaktifkan" : "Layanan diaktifkan");
  }

  async function deleteSvc(id) {
    if (
      !confirm("Hapus layanan ini? Transaksi yang sudah ada tidak terpengaruh.")
    ) {
      return;
    }

    const result = await Store.deleteService(id);

    if (!result) return;

    await _renderList();

    showToast("Layanan dihapus!");
  }

  return {
    render,
    editSvc,
    toggleSvc,
    deleteSvc,
  };
})();
