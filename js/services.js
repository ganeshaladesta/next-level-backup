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
            throw new Error("Service name is required.");
          }

          if (price < 0) {
            throw new Error("Price cannot be negative.");
          }

          if (editingId) {
            await Store.updateService(editingId, {
              name,
              price,
            });

            showToast("Service updated successfully.");
          } else {
            await Store.addService({
              name,
              price,
            });

            showToast("Service added successfully.");
          }

          _resetForm();

          await renderList();
        } catch (err) {
          console.error(err);

          showToast(err.message || "Failed to save service.", "danger");
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
              No services yet.
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
  
                      ${s.active ? " · Active" : " · Inactive"}
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
                      ${s.active ? "⏸ Deactivate" : "▶ Activate"}
                    </button>
  
                    <button
                      class="btn btn-sm btn-outline"
                      data-action="delete"
                      data-id="${s.id}"
                    >
                      🗑 Delete
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
            Failed to load services.
          </p>
        `;

      showToast(err.message || "Failed to load services.", "danger");
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
          btn.textContent = "💾 Save Changes";
        }

        return;
      }

      if (action === "toggle") {
        const service = await Store.getServiceById(id);

        if (!service) return;

        await Store.updateService(id, {
          active: !service.active,
        });

        showToast("Service status updated.");

        await renderList();

        return;
      }

      if (action === "delete") {
        const ok = confirm("Are you sure you want to delete this service?");

        if (!ok) return;

        await Store.deleteService(id);

        showToast("Service deleted successfully.");

        await renderList();
      }
    } catch (err) {
      console.error(err);

      showToast(err.message || "Failed to process service.", "danger");
    }
  }

  function _resetForm() {
    editingId = null;

    document.getElementById("serviceForm")?.reset();

    const btn = document.getElementById("svcSubmitBtn");

    if (btn) {
      btn.textContent = "➕ Add Service";
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
