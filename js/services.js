/* ============================================================
   SERVICES
   ============================================================ */

const Services = (() => {
  let initialized = false;
  let editingId = null;

  async function render() {
    if (!initialized) {
      _setup();
      initialized = true;
    }

    await renderList();
  }

  function _setup() {
    const form = document.getElementById("serviceForm");

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("svcName").value.trim();

        const price = Number(document.getElementById("svcPrice").value);

        try {
          if (!name) {
            throw new Error("Nama layanan wajib diisi.");
          }

          if (price < 0) {
            throw new Error("Harga tidak valid.");
          }

          if (editingId) {
            await Store.updateService(editingId, {
              name,
              price,
            });

            showToast("Layanan berhasil diperbarui.");
          } else {
            await Store.addService({
              name,
              price,
            });

            showToast("Layanan berhasil ditambahkan.");
          }

          _resetForm();

          await renderList();
        } catch (err) {
          console.error(err);

          showToast(err.message || "Gagal menyimpan layanan.", "danger");
        }
      });
    }
  }

  async function renderList() {
    const container = document.getElementById("servicesList");

    if (!container) return;

    try {
      const services = await Store.getServices();

      if (services.length === 0) {
        container.innerHTML = `
            <p class="empty-state">
              Belum ada layanan.
            </p>
          `;

        return;
      }

      container.innerHTML = services
        .map(
          (s) => `
                <div class="service-list-item"
                     style="
                       display:flex;
                       justify-content:space-between;
                       align-items:center;
                       gap:16px;
                       padding:14px 0;
                       border-bottom:1px solid var(--border);
                     ">
  
                  <div>
                    <strong>
                      ${escapeHtml(s.name)}
                    </strong>
  
                    <div class="text-muted">
                      ${Store.formatCurrency(s.price)}
  
                      ${s.active ? " · Aktif" : " · Nonaktif"}
                    </div>
                  </div>
  
                  <div style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                  ">
  
                    <button
                      class="btn btn-sm btn-outline"
                      data-action="edit"
                      data-id="${s.id}"
                    >
                      ✏️ Edit
                    </button>
  
                    <button
                      class="btn btn-sm btn-outline"
                      data-action="toggle"
                      data-id="${s.id}"
                    >
                      ${s.active ? "⏸ Nonaktifkan" : "▶ Aktifkan"}
                    </button>
  
                    <button
                      class="btn btn-sm btn-outline"
                      data-action="delete"
                      data-id="${s.id}"
                    >
                      🗑 Hapus
                    </button>
  
                  </div>
                </div>
              `,
        )
        .join("");

      container.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;

          const action = btn.dataset.action;

          await handleAction(action, id);
        });
      });
    } catch (err) {
      console.error(err);

      container.innerHTML = `
          <p class="empty-state">
            Gagal memuat layanan.
          </p>
        `;

      showToast(err.message || "Gagal memuat layanan.", "danger");
    }
  }

  async function handleAction(action, id) {
    try {
      if (action === "edit") {
        const service = await Store.getServiceById(id);

        if (!service) return;

        editingId = id;

        document.getElementById("svcName").value = service.name;

        document.getElementById("svcPrice").value = service.price;

        const btn = document.getElementById("svcSubmitBtn");

        if (btn) {
          btn.textContent = "💾 Simpan Perubahan";
        }

        return;
      }

      if (action === "toggle") {
        const service = await Store.getServiceById(id);

        if (!service) return;

        await Store.updateService(id, {
          active: !service.active,
        });

        showToast("Status layanan diperbarui.");

        await renderList();

        return;
      }

      if (action === "delete") {
        const ok = confirm("Hapus layanan ini?");

        if (!ok) return;

        await Store.deleteService(id);

        showToast("Layanan berhasil dihapus.");

        await renderList();
      }
    } catch (err) {
      console.error(err);

      showToast(err.message || "Gagal memproses layanan.", "danger");
    }
  }

  function _resetForm() {
    editingId = null;

    document.getElementById("serviceForm")?.reset();

    const btn = document.getElementById("svcSubmitBtn");

    if (btn) {
      btn.textContent = "➕ Tambah Layanan";
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return {
    render,
  };
})();
