/* ============================================================
   PROMOS
   ============================================================ */

const Promos = (() => {
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
    const form = document.getElementById("promoForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("promoName").value.trim();

      const discount = Number(document.getElementById("promoDiscount").value);

      const startDate = document.getElementById("promoStart").value;

      const endDate = document.getElementById("promoEnd").value;

      const description = document.getElementById("promoDesc").value.trim();

      try {
        if (!name) {
          throw new Error("Nama promo wajib diisi.");
        }

        if (discount < 0 || discount > 100) {
          throw new Error("Diskon harus 0-100%.");
        }

        if (endDate < startDate) {
          throw new Error("Tanggal selesai tidak boleh sebelum tanggal mulai.");
        }

        if (editingId) {
          await Store.updatePromo(editingId, {
            name,
            discount,
            startDate,
            endDate,
            description,
          });

          showToast("Promo berhasil diperbarui.");
        } else {
          await Store.addPromo({
            name,
            discount,
            startDate,
            endDate,
            description,
          });

          showToast("Promo berhasil ditambahkan.");
        }

        _resetForm();

        await renderList();
      } catch (err) {
        console.error(err);

        showToast(err.message || "Gagal menyimpan promo.", "danger");
      }
    });
  }

  async function renderList() {
    const container = document.getElementById("promosList");

    if (!container) return;

    try {
      const promos = await Store.getPromos();

      if (promos.length === 0) {
        container.innerHTML = `
            <p class="empty-state">
              Belum ada promo.
            </p>
          `;

        return;
      }

      container.innerHTML = promos
        .map((p) => {
          const today = Store.getTodayStr();

          let status = "Upcoming";

          if (today >= p.startDate && today <= p.endDate) {
            status = "Aktif";
          } else if (today > p.endDate) {
            status = "Berakhir";
          }

          return `
                  <div
                    style="
                      padding:16px 0;
                      border-bottom:1px solid var(--border);
                    "
                  >
  
                    <div
                      style="
                        display:flex;
                        justify-content:space-between;
                        gap:16px;
                        align-items:flex-start;
                      "
                    >
  
                      <div>
  
                        <strong>
                          ${escapeHtml(p.name)}
                        </strong>
  
                        <div
                          style="
                            margin-top:5px;
                            font-size:18px;
                            font-weight:700;
                          "
                        >
                          ${p.discount}%
                        </div>
  
                        <div class="text-muted">
                          ${Store.formatDate(p.startDate)}
                          -
                          ${Store.formatDate(p.endDate)}
                          · ${status}
                        </div>
  
                        ${
                          p.description
                            ? `
                              <div
                                class="text-muted"
                                style="margin-top:5px"
                              >
                                ${escapeHtml(p.description)}
                              </div>
                            `
                            : ""
                        }
  
                      </div>
  
                      <div
                        style="
                          display:flex;
                          gap:8px;
                          flex-wrap:wrap;
                        "
                      >
  
                        <button
                          class="btn btn-sm btn-outline"
                          data-action="edit"
                          data-id="${p.id}"
                        >
                          ✏️ Edit
                        </button>
  
                        <button
                          class="btn btn-sm btn-outline"
                          data-action="delete"
                          data-id="${p.id}"
                        >
                          🗑 Hapus
                        </button>
  
                      </div>
  
                    </div>
  
                  </div>
                `;
        })
        .join("");

      container.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await handleAction(btn.dataset.action, btn.dataset.id);
        });
      });
    } catch (err) {
      console.error(err);

      container.innerHTML = `
          <p class="empty-state">
            Gagal memuat promo.
          </p>
        `;

      showToast(err.message || "Gagal memuat promo.", "danger");
    }
  }

  async function handleAction(action, id) {
    try {
      if (action === "edit") {
        const promo = (await Store.getPromos()).find((p) => p.id === id);

        if (!promo) return;

        editingId = id;

        document.getElementById("promoName").value = promo.name;

        document.getElementById("promoDiscount").value = promo.discount;

        document.getElementById("promoStart").value = promo.startDate;

        document.getElementById("promoEnd").value = promo.endDate;

        document.getElementById("promoDesc").value = promo.description || "";

        const btn = document.getElementById("promoSubmitBtn");

        if (btn) {
          btn.textContent = "💾 Simpan Perubahan";
        }

        return;
      }

      if (action === "delete") {
        const ok = confirm("Hapus promo ini?");

        if (!ok) return;

        await Store.deletePromo(id);

        showToast("Promo berhasil dihapus.");

        await renderList();
      }
    } catch (err) {
      console.error(err);

      showToast(err.message || "Gagal memproses promo.", "danger");
    }
  }

  function _resetForm() {
    editingId = null;

    document.getElementById("promoForm")?.reset();

    const btn = document.getElementById("promoSubmitBtn");

    if (btn) {
      btn.textContent = "➕ Tambah Promo";
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
