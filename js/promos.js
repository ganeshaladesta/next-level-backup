/* ============================================================
   Beauty Bar Dashboard — Promos Management
   ============================================================ */

const Promos = (() => {
  let _initialized = false;
  let editingId = null;

  function render() {
    if (!_initialized) {
      _setup();
      _initialized = true;
    }

    _renderList();
  }

  function _setup() {
    document.getElementById("promoForm").addEventListener("submit", (e) => {
      e.preventDefault();
      _save();
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
      showToast("Promo name is required!", "warning");
      return;
    }

    if (!startIn.value || !endIn.value) {
      showToast("Start date and end date are required!", "warning");
      return;
    }

    if (startIn.value > endIn.value) {
      showToast("Start date must be before the end date!", "warning");
      return;
    }

    const data = {
      name,
      startDate: startIn.value,
      endDate: endIn.value,
      discount: Number(discIn.value) || 0,
      description: descIn.value.trim(),
    };

    try {
      if (editingId) {
        await Store.updatePromo(editingId, data);
        editingId = null;
        document.getElementById("promoSubmitBtn").textContent = "➕ Add Promo";
        showToast("Promo updated!");
      } else {
        await Store.addPromo(data);
        showToast("Promo successfully added! 🎉");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save promo", "danger");
      return;
    }

    document.getElementById("promoForm").reset();

    _renderList();
  }

  function _renderList() {
    const el = document.getElementById("promosList");
    const promos = Store.getPromos();
    const today = Store.getTodayStr();

    if (promos.length === 0) {
      el.innerHTML =
        '<p class="empty-state">No promos yet. Create your first promo! 🎉</p>';

      return;
    }

    // Sort: active first, then upcoming, then expired
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
                <th>Period</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Actions</th>
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
                          <strong>${p.name}</strong>
                        </div>
  
                        ${
                          p.description
                            ? `<div class="text-muted text-sm">${p.description}</div>`
                            : ""
                        }
                      </td>
  
                      <td data-label="Period">
                        ${Store.formatDate(p.startDate)} — ${Store.formatDate(
                          p.endDate,
                        )}
                      </td>
  
                      <td data-label="Discount">
                        <span class="discount-tag">
                          −${p.discount}%
                        </span>
                      </td>
  
                      <td data-label="Status">
                        <span class="status-badge ${cls}">
                          ${label}
                        </span>
                      </td>
  
                      <td data-label="Actions" class="actions">
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
                          title="Delete"
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
    if (today >= p.startDate && today <= p.endDate) {
      return {
        cls: "badge-active",
        label: "🟢 Active",
      };
    }

    if (today < p.startDate) {
      return {
        cls: "badge-upcoming",
        label: "🔵 Upcoming",
      };
    }

    return {
      cls: "badge-expired",
      label: "⚫ Expired",
    };
  }

  function _statusOrder(p, today) {
    if (today >= p.startDate && today <= p.endDate) {
      return 0;
    }

    if (today < p.startDate) {
      return 1;
    }

    return 2;
  }

  function editPromo(id) {
    const p = Store.getPromos().find((x) => x.id === id);

    if (!p) return;

    editingId = id;

    document.getElementById("promoName").value = p.name;
    document.getElementById("promoStart").value = p.startDate;
    document.getElementById("promoEnd").value = p.endDate;
    document.getElementById("promoDiscount").value = p.discount;
    document.getElementById("promoDesc").value = p.description;

    document.getElementById("promoSubmitBtn").textContent = "✏️ Update Promo";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deletePromo(id) {
    if (!confirm("Delete this promo?")) return;

    try {
      await Store.deletePromo(id);
      _renderList();
      showToast("Promo deleted!");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete promo", "danger");
    }
  }

  return {
    render,
    editPromo,
    deletePromo,
  };
})();
