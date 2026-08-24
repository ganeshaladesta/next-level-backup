/* ============================================================
   Beauty Bar Dashboard — Services Management
   ============================================================ */

const Services = (() => {
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
    document.getElementById("serviceForm").addEventListener("submit", (e) => {
      e.preventDefault();
      _save();
    });
  }

  function _save() {
    const nameIn = document.getElementById("svcName");
    const priceIn = document.getElementById("svcPrice");

    const name = nameIn.value.trim();
    const price = Number(priceIn.value);

    if (!name) {
      showToast("Service name is required!", "warning");
      return;
    }

    if (!price || price <= 0) {
      showToast("Please enter a valid price!", "warning");
      return;
    }

    if (editingId) {
      Store.updateService(editingId, {
        name,
        price,
      });

      editingId = null;

      document.getElementById("svcSubmitBtn").textContent = "➕ Add Service";

      showToast("Service updated!");
    } else {
      Store.addService({
        name,
        price,
      });

      showToast("Service successfully added!");
    }

    nameIn.value = "";
    priceIn.value = "";

    _renderList();
  }

  function _renderList() {
    const el = document.getElementById("servicesList");
    const svcs = Store.getServices();

    if (svcs.length === 0) {
      el.innerHTML =
        '<p class="empty-state">No services yet. Add your first service! 💅</p>';

      return;
    }

    el.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
  
            <thead>
              <tr>
                <th>Service</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
  
            <tbody>
              ${svcs
                .map(
                  (s) => `
                    <tr class="${s.active ? "" : "row-inactive"}">
  
                      <td data-label="Service">
                        <strong>${s.name}</strong>
                      </td>
  
                      <td data-label="Price">
                        ${Store.formatCurrency(s.price)}
                      </td>
  
                      <td data-label="Status">
                        <span class="status-badge ${
                          s.active ? "badge-active" : "badge-inactive"
                        }">
                          ${s.active ? "✅ Active" : "⛔ Inactive"}
                        </span>
                      </td>
  
                      <td data-label="Actions" class="actions">
  
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
                          title="${s.active ? "Deactivate" : "Activate"}"
                        >
                          ${s.active ? "🚫" : "✅"}
                        </button>
  
                        <button
                          class="btn-icon btn-delete"
                          onclick="Services.deleteSvc('${s.id}')"
                          title="Delete"
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

  function editSvc(id) {
    const s = Store.getServiceById(id);

    if (!s) return;

    editingId = id;

    document.getElementById("svcName").value = s.name;
    document.getElementById("svcPrice").value = s.price;

    document.getElementById("svcSubmitBtn").textContent = "✏️ Update Service";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function toggleSvc(id) {
    const s = Store.getServiceById(id);

    if (!s) return;

    Store.updateService(id, {
      active: !s.active,
    });

    _renderList();

    showToast(s.active ? "Service deactivated" : "Service activated");
  }

  function deleteSvc(id) {
    if (
      !confirm(
        "Delete this service? Existing transactions will not be affected.",
      )
    ) {
      return;
    }

    Store.deleteService(id);

    _renderList();

    showToast("Service deleted!");
  }

  return {
    render,
    editSvc,
    toggleSvc,
    deleteSvc,
  };
})();
