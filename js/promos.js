/* ============================================================
   Beauty Bar Dashboard — Promos Management
   ============================================================ */

const Promos = (() => {
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
    const form = document.getElementById("promoForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await _save();
    });
  }

  async function _save() {
    const nameIn = document.getElementById("promoName");

    const startIn = document.getElementById("promoStart");

    const endIn = document.getElementById("promoEnd");

    const discIn = document.getElementById("promoDiscount");

    const descIn = document.getElementById("promoDesc");

    const name = nameIn.value.trim();

    if (!name) {
      showToast("Nama promo harus diisi!", "warning");
      return;
    }

    if (!startIn.value || !endIn.value) {
      showToast("Tanggal mulai & selesai wajib diisi!", "warning");
      return;
    }

    if (startIn.value > endIn.value) {
      showToast("Tanggal mulai harus sebelum tanggal selesai!", "warning");
      return;
    }

    const data = {
      name,
      startDate: startIn.value,
      endDate: endIn.value,
      discount: Number(discIn.value) || 0,
      description: descIn.value.trim(),
    };

    if (editingId) {
      const result = await Store.updatePromo(editingId, data);

      if (!result) return;

      editingId = null;

      document.getElementById("promoSubmitBtn").textContent = "➕ Tambah Promo";

      showToast("Promo diperbarui!");
    } else {
      const result = await Store.addPromo(data);

      if (!result) return;

      showToast("Promo berhasil ditambahkan! 🎉");
    }

    document.getElementById("promoForm").reset();

    await _renderList();
  }

  async function _renderList() {
    const el = document.getElementById("promosList");

    if (!el) return;

    el.innerHTML = '<p class="empty-state">Loading promo...</p>';

    const promos = await Store.getPromos();

    const today = Store.getTodayStr();

    if (promos.length === 0) {
      el.innerHTML =
        '<p class="empty-state">Belum ada promo. Buat promo pertama! 🎉</p>';
      return;
    }

    const sorted = [...promos].sort((a, b) => {
      const sa = _statusOrder(a, today);

      const sb = _statusOrder(b, today);

      return sa - sb;
    });

    el.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
  
            <thead>
              <tr>
                <th>Promo</th>
                <th>Periode</th>
                <th>Diskon</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
  
            <tbody>
  
              ${sorted
                .map((p) => {
                  const { cls, label } = _statusInfo(p, today);

                  return `
                    <tr>
  
                      <td data-label="Promo">
  
                        <div>
                          <strong>
                            ${p.name}
                          </strong>
                        </div>
  
                        ${
                          p.description
                            ? `
                              <div class="text-muted text-sm">
                                ${p.description}
                              </div>
                            `
                            : ""
                        }
  
                      </td>
  
                      <td data-label="Periode">
                        ${Store.formatDate(p.start_date)}
                        —
                        ${Store.formatDate(p.end_date)}
                      </td>
  
                      <td data-label="Diskon">
                        <span class="discount-tag">
                          −${p.discount}%
                        </span>
                      </td>
  
                      <td data-label="Status">
                        <span class="status-badge ${cls}">
                          ${label}
                        </span>
                      </td>
  
                      <td
                        data-label="Aksi"
                        class="actions"
                      >
  
                        <button
                          class="btn-icon btn-edit"
                          onclick="Promos.editPromo('${p.id}')"
                          title="Edit"
                        >
                          ✏️
                        </button>
  
                        <button
                          class="btn-icon btn-delete"
                          onclick="Promos.deletePromo('${p.id}')"
                          title="Hapus"
                        >
                          🗑️
                        </button>
  
                      </td>
  
                    </tr>
                  `;
                })
                .join("")}
  
            </tbody>
  
          </table>
        </div>
      `;
  }

  function _statusInfo(p, today) {
    if (today >= p.start_date && today <= p.end_date) {
      return {
        cls: "badge-active",
        label: "🟢 Aktif",
      };
    }

    if (today < p.start_date) {
      return {
        cls: "badge-upcoming",
        label: "🔵 Akan Datang",
      };
    }

    return {
      cls: "badge-expired",
      label: "⚫ Berakhir",
    };
  }

  function _statusOrder(p, today) {
    if (today >= p.start_date && today <= p.end_date) {
      return 0;
    }

    if (today < p.start_date) {
      return 1;
    }

    return 2;
  }

  async function editPromo(id) {
    const promos = await Store.getPromos();

    const p = promos.find((x) => x.id === id);

    if (!p) return;

    editingId = id;

    document.getElementById("promoName").value = p.name;

    document.getElementById("promoStart").value = p.start_date;

    document.getElementById("promoEnd").value = p.end_date;

    document.getElementById("promoDiscount").value = p.discount;

    document.getElementById("promoDesc").value = p.description || "";

    document.getElementById("promoSubmitBtn").textContent = "✏️ Update Promo";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deletePromo(id) {
    if (!confirm("Hapus promo ini?")) {
      return;
    }

    const result = await Store.deletePromo(id);

    if (!result) return;

    await _renderList();

    showToast("Promo dihapus!");
  }

  return {
    render,
    editPromo,
    deletePromo,
  };
})();
