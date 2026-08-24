/* ============================================================
   NEXT LEVEL BEAUTY BAR
   Transactions
   ============================================================ */

const Transactions = (() => {
  let initialized = false;

  async function render() {
    if (!initialized) {
      _setup();
      initialized = true;
    }

    await loadServices();
    await loadPromos();
    await renderRecent();
    updatePaymentSummary();
  }

  function _setup() {
    const form = document.getElementById("txnForm");

    if (form) {
      form.addEventListener("submit", handleSubmit);
    }

    const service = document.getElementById("txnService");

    if (service) {
      service.addEventListener("change", async () => {
        const id = service.value;

        if (!id) {
          document.getElementById("txnPrice").value = "";

          updatePaymentSummary();

          return;
        }

        const svc = await Store.getServiceById(id);

        if (svc) {
          document.getElementById("txnPrice").value = svc.price;
        }

        updatePaymentSummary();
      });
    }

    ["txnPrice", "txnDP", "txnPromo"].forEach((id) => {
      document
        .getElementById(id)
        ?.addEventListener("input", updatePaymentSummary);

      document
        .getElementById(id)
        ?.addEventListener("change", updatePaymentSummary);
    });

    const date = document.getElementById("txnDate");

    if (date && !date.value) {
      date.value = Store.getTodayStr();
    }

    const time = document.getElementById("txnTime");

    if (time && !time.value) {
      const now = new Date();

      time.value =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0");
    }
  }

  /* ============================================================
       SERVICES DROPDOWN
       ============================================================ */

  async function loadServices() {
    const select = document.getElementById("txnService");

    if (!select) return;

    const services = await Store.getActiveServices();

    const current = select.value;

    select.innerHTML = `
        <option value="">
          — Pilih Layanan —
        </option>
      `;

    services.forEach((service) => {
      const option = document.createElement("option");

      option.value = service.id;

      option.textContent = `${service.name} — ${Store.formatCurrency(
        service.price,
      )}`;

      select.appendChild(option);
    });

    if (current && services.some((s) => s.id === current)) {
      select.value = current;
    }
  }

  /* ============================================================
       PROMO DROPDOWN
       ============================================================ */

  async function loadPromos() {
    const select = document.getElementById("txnPromo");

    if (!select) return;

    const promos = await Store.getActivePromos();

    select.innerHTML = `
        <option value="">
          Tanpa Promo
        </option>
      `;

    promos.forEach((promo) => {
      const option = document.createElement("option");

      option.value = promo.id;

      option.dataset.discount = promo.discount;

      option.textContent = `${promo.name} — ${promo.discount}%`;

      select.appendChild(option);
    });
  }

  /* ============================================================
       PAYMENT
       ============================================================ */

  function getSelectedPromoDiscount() {
    const select = document.getElementById("txnPromo");

    if (!select) return 0;

    const option = select.options[select.selectedIndex];

    return Number(option?.dataset?.discount || 0);
  }

  function updatePaymentSummary() {
    const price = Number(document.getElementById("txnPrice")?.value || 0);

    const dp = Number(document.getElementById("txnDP")?.value || 0);

    const promoDiscount = getSelectedPromoDiscount();

    const calculation = Store.calculateTransaction({
      price,
      dp,
      promoDiscount,
    });

    _setText(
      "summaryTreatment",
      Store.formatCurrency(calculation.totalTreatment),
    );

    _setText("summaryDP", Store.formatCurrency(calculation.dp));

    _setText(
      "summaryBeforePromo",
      Store.formatCurrency(calculation.remainingBeforePromo),
    );

    _setText(
      "summaryDiscount",
      Store.formatCurrency(calculation.discountAmount),
    );

    _setText(
      "summaryFinalPayment",
      Store.formatCurrency(calculation.remainingAmount),
    );
  }

  /* ============================================================
       SUBMIT
       ============================================================ */

  async function handleSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById("txnSubmitBtn");

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = "⏳ Menyimpan...";
      }

      const branch = document.getElementById("txnBranch").value;

      const serviceId = document.getElementById("txnService").value;

      const service = await Store.getServiceById(serviceId);

      if (!service) {
        throw new Error("Pilih layanan terlebih dahulu.");
      }

      const price = Number(document.getElementById("txnPrice").value || 0);

      const treatmentTime = document.getElementById("txnTime").value;

      const date = document.getElementById("txnDate").value;

      const dp = Number(document.getElementById("txnDP").value || 0);

      const promoSelect = document.getElementById("txnPromo");

      const promoId = promoSelect?.value || null;

      const promoDiscount = getSelectedPromoDiscount();

      const notes = document.getElementById("txnNotes").value.trim();

      if (!branch) {
        throw new Error("Cabang wajib dipilih.");
      }

      if (!date) {
        throw new Error("Tanggal wajib diisi.");
      }

      if (price <= 0) {
        throw new Error("Harga treatment harus lebih dari 0.");
      }

      await Store.addTransaction({
        branch,
        serviceId: service.id,
        serviceName: service.name,
        price,
        date,
        treatmentTime,
        notes,
        promoId,
        promoDiscount,
        dp,
      });

      showToast("Transaksi berhasil disimpan.");

      document.getElementById("txnForm")?.reset();

      document.getElementById("txnDate").value = Store.getTodayStr();

      updatePaymentSummary();

      await renderRecent();
    } catch (err) {
      console.error(err);

      showToast(err.message || "Gagal menyimpan transaksi.", "danger");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "💾 Simpan Transaksi";
      }
    }
  }

  /* ============================================================
       RECENT
       ============================================================ */

  async function renderRecent() {
    const container = document.getElementById("recentTransactions");

    if (!container) return;

    try {
      const txns = await Store.getTransactions();

      const recent = txns.slice(0, 10);

      if (recent.length === 0) {
        container.innerHTML = `
            <p class="empty-state">
              Belum ada transaksi.
            </p>
          `;

        return;
      }

      container.innerHTML = recent
        .map(
          (t) => `
                <div
                  style="
                    padding:14px 0;
                    border-bottom:1px solid var(--border);
                    display:flex;
                    justify-content:space-between;
                    gap:16px;
                    align-items:center;
                  "
                >
  
                  <div>
                    <strong>
                      ${escapeHtml(t.serviceName)}
                    </strong>
  
                    <div class="text-muted">
                      ${escapeHtml(t.branch)}
                      ·
                      ${Store.formatDate(t.date)}
                      ${t.treatmentTime ? " · " + t.treatmentTime : ""}
                    </div>
                  </div>
  
                  <div
                    style="
                      text-align:right;
                    "
                  >
                    <strong>
                      ${Store.formatCurrency(t.price)}
                    </strong>
  
                    <br />
  
                    <button
                      class="btn btn-sm btn-outline"
                      data-delete-txn="${t.id}"
                      style="margin-top:5px"
                    >
                      🗑 Hapus
                    </button>
                  </div>
  
                </div>
              `,
        )
        .join("");

      container.querySelectorAll("[data-delete-txn]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await deleteTransaction(btn.dataset.deleteTxn);
        });
      });
    } catch (err) {
      console.error(err);

      container.innerHTML = `
          <p class="empty-state">
            Gagal memuat transaksi.
          </p>
        `;
    }
  }

  /* ============================================================
       HISTORY
       ============================================================ */

  async function renderHistory() {
    _setupHistory();

    await renderHistoryTable();
  }

  let historyInitialized = false;

  function _setupHistory() {
    if (historyInitialized) return;

    historyInitialized = true;

    ["historySearch", "historyFilterBranch", "historyFilterDate"].forEach(
      (id) => {
        document
          .getElementById(id)
          ?.addEventListener("input", renderHistoryTable);

        document
          .getElementById(id)
          ?.addEventListener("change", renderHistoryTable);
      },
    );

    document
      .getElementById("historyClear")
      ?.addEventListener("click", async () => {
        document.getElementById("historySearch").value = "";

        document.getElementById("historyFilterBranch").value = "";

        document.getElementById("historyFilterDate").value = "";

        await renderHistoryTable();
      });
  }

  async function renderHistoryTable() {
    const container = document.getElementById("historyTable");

    if (!container) return;

    try {
      let txns = await Store.getTransactions();

      const search = (document.getElementById("historySearch")?.value || "")
        .trim()
        .toLowerCase();

      const branch =
        document.getElementById("historyFilterBranch")?.value || "";

      const date = document.getElementById("historyFilterDate")?.value || "";

      if (search) {
        txns = txns.filter(
          (t) =>
            String(t.serviceName || "")
              .toLowerCase()
              .includes(search) ||
            String(t.notes || "")
              .toLowerCase()
              .includes(search),
        );
      }

      if (branch) {
        txns = txns.filter((t) => t.branch === branch);
      }

      if (date) {
        txns = txns.filter((t) => t.date === date);
      }

      const total = txns.reduce((sum, t) => sum + Number(t.price || 0), 0);

      _setText("historyTotal", Store.formatCurrency(total));

      _setText("historyCount", txns.length + " transaksi");

      if (txns.length === 0) {
        container.innerHTML = `
            <p class="empty-state">
              Tidak ada transaksi.
            </p>
          `;

        return;
      }

      container.innerHTML = `
          <div style="overflow-x:auto">
  
            <table
              style="
                width:100%;
                border-collapse:collapse;
              "
            >
  
              <thead>
                <tr>
                  <th style="text-align:left;padding:12px 8px">
                    Tanggal
                  </th>
  
                  <th style="text-align:left;padding:12px 8px">
                    Cabang
                  </th>
  
                  <th style="text-align:left;padding:12px 8px">
                    Layanan
                  </th>
  
                  <th style="text-align:left;padding:12px 8px">
                    Jam
                  </th>
  
                  <th style="text-align:right;padding:12px 8px">
                    Harga
                  </th>
  
                  <th style="text-align:right;padding:12px 8px">
                    DP
                  </th>
  
                  <th style="text-align:right;padding:12px 8px">
                    Sisa
                  </th>
  
                  <th style="padding:12px 8px">
                  </th>
                </tr>
              </thead>
  
              <tbody>
                ${txns
                  .map(
                    (t) => `
                      <tr
                        style="
                          border-top:1px solid var(--border);
                        "
                      >
  
                        <td style="padding:12px 8px">
                          ${Store.formatDate(t.date)}
                        </td>
  
                        <td style="padding:12px 8px">
                          ${escapeHtml(t.branch)}
                        </td>
  
                        <td style="padding:12px 8px">
                          <strong>
                            ${escapeHtml(t.serviceName)}
                          </strong>
  
                          ${
                            t.promoDiscount
                              ? `
                                <br>
                                <small
                                  class="text-muted"
                                >
                                  Promo ${t.promoDiscount}%
                                </small>
                              `
                              : ""
                          }
                        </td>
  
                        <td style="padding:12px 8px">
                          ${t.treatmentTime || "-"}
                        </td>
  
                        <td
                          style="
                            padding:12px 8px;
                            text-align:right;
                          "
                        >
                          ${Store.formatCurrency(t.price)}
                        </td>
  
                        <td
                          style="
                            padding:12px 8px;
                            text-align:right;
                          "
                        >
                          ${Store.formatCurrency(t.dp)}
                        </td>
  
                        <td
                          style="
                            padding:12px 8px;
                            text-align:right;
                            font-weight:700;
                          "
                        >
                          ${Store.formatCurrency(t.remainingAmount)}
                        </td>
  
                        <td
                          style="
                            padding:12px 8px;
                            text-align:right;
                          "
                        >
                          <button
                            class="btn btn-sm btn-outline"
                            data-history-delete="${t.id}"
                          >
                            🗑
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

      container.querySelectorAll("[data-history-delete]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await deleteTransaction(btn.dataset.historyDelete);

          await renderHistoryTable();
        });
      });
    } catch (err) {
      console.error(err);

      container.innerHTML = `
          <p class="empty-state">
            Gagal memuat riwayat transaksi.
          </p>
        `;
    }
  }

  /* ============================================================
       DELETE
       ============================================================ */

  async function deleteTransaction(id) {
    try {
      const ok = confirm("Hapus transaksi ini?");

      if (!ok) return;

      await Store.deleteTransaction(id);

      showToast("Transaksi berhasil dihapus.");

      await renderRecent();
    } catch (err) {
      console.error(err);

      showToast(err.message || "Gagal menghapus transaksi.", "danger");
    }
  }

  /* ============================================================
       EXPORT CSV
       ============================================================ */

  async function exportCSV() {
    try {
      const txns = await Store.getTransactions();

      if (txns.length === 0) {
        showToast("Belum ada transaksi untuk diexport.", "danger");

        return;
      }

      const headers = [
        "ID",
        "Tanggal",
        "Jam Treatment",
        "Cabang",
        "Layanan",
        "Harga",
        "DP",
        "Promo",
        "Diskon %",
        "Diskon Nominal",
        "Sisa Sebelum Promo",
        "Sisa Bayar",
        "Catatan",
        "Created At",
      ];

      const rows = txns.map((t) => [
        t.id,
        t.date,
        t.treatmentTime || "",
        t.branch,
        t.serviceName,
        t.price,
        t.dp,
        t.promoId || "",
        t.promoDiscount,
        t.discountAmount,
        t.remainingBeforePromo,
        t.remainingAmount,
        t.notes || "",
        t.createdAt || "",
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map(csvEscape).join(","))
        .join("\n");

      const blob = new Blob(["\ufeff" + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = "next-level-transactions-" + Store.getTodayStr() + ".csv";

      document.body.appendChild(a);

      a.click();

      a.remove();

      URL.revokeObjectURL(url);

      showToast("CSV berhasil diexport.");
    } catch (err) {
      console.error(err);

      showToast("Gagal export CSV.", "danger");
    }
  }

  function csvEscape(value) {
    const text = String(value ?? "");

    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return '"' + text.replace(/"/g, '""') + '"';
    }

    return text;
  }

  function _setText(id, value) {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = value;
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
    renderHistory,
    exportCSV,
    updatePaymentSummary,
  };
})();
