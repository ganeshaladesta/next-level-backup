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
          throw new Error("Promotion name is required.");
        }

        if (discount < 0 || discount > 100) {
          throw new Error("Discount must be between 0% and 100%.");
        }

        if (endDate < startDate) {
          throw new Error("End date cannot be before start date.");
        }

        if (editingId) {
          await Store.updatePromo(editingId, {
            name,
            discount,
            startDate,
            endDate,
            description,
          });

          showToast("Promotion updated successfully.");
        } else {
          await Store.addPromo({
            name,
            discount,
            startDate,
            endDate,
            description,
          });

          showToast("Promotion added successfully.");
        }

        _resetForm();

        await renderList();
      } catch (err) {
        console.error(err);

        showToast(err.message || "Failed to save promotion.", "danger");
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
              No promotions yet.
            </p>
          `;

        return;
      }

      container.innerHTML = promos
        .map((p) => {
          const today = Store.getTodayStr();

          let status = "Upcoming";

          if (today >= p.startDate && today <= p.endDate) {
            status = "Active";
          } else if (today > p.endDate) {
            status = "Expired";
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
                          🗑 Delete
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
            Failed to load promotions.
          </p>
        `;

      showToast(err.message || "Failed to load promotions.", "danger");
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
          btn.textContent = "💾 Save Changes";
        }

        return;
      }

      if (action === "delete") {
        const ok = confirm("Are you sure you want to delete this promotion?");

        if (!ok) return;

        await Store.deletePromo(id);

        showToast("Promotion deleted successfully.");

        await renderList();
      }
    } catch (err) {
      console.error(err);

      showToast(err.message || "Failed to process promotion.", "danger");
    }
  }

  function _resetForm() {
    editingId = null;

    document.getElementById("promoForm")?.reset();

    const btn = document.getElementById("promoSubmitBtn");

    if (btn) {
      btn.textContent = "➕ Add Promotion";
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
