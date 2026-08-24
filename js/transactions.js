/* ============================================================
   Beauty Bar Dashboard — Transactions & History
   ============================================================ */

const Transactions = (() => {
  let _initTxn = false;
  let _initHist = false;
  let editingId = null;

  /* ============================================================
       TRANSACTION FORM
       ============================================================ */

  function render() {
    if (!_initTxn) {
      _setupTxnForm();
      _initTxn = true;
    }

    _populateServiceDropdown();
    _updatePromoOptions();
    _renderRecent();
  }

  function _setupTxnForm() {
    const form = document.getElementById("txnForm");

    const svcSel = document.getElementById("txnService");

    const dateIn = document.getElementById("txnDate");

    const timeIn = document.getElementById("txnTreatmentTime");

    const dpIn = document.getElementById("txnDP");

    const promoSel = document.getElementById("txnPromo");

    if (dateIn) {
      dateIn.value = Store.getTodayStr();
    }

    /*
     * Default jam treatment = sekarang
     */
    if (timeIn && !timeIn.value) {
      const now = new Date();

      timeIn.value =
        `${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}`;
    }

    /*
     * Saat pilih service:
     * otomatis isi harga treatment
     */
    if (svcSel) {
      svcSel.addEventListener("change", () => {
        const opt = svcSel.selectedOptions[0];

        if (opt && opt.dataset.price) {
          document.getElementById("txnPrice").value = opt.dataset.price;
        }

        _updatePaymentSummary();
      });
    }

    /*
     * Saat DP berubah
     */
    if (dpIn) {
      dpIn.addEventListener("input", _updatePaymentSummary);
    }

    /*
     * Saat promo berubah
     */
    if (promoSel) {
      promoSel.addEventListener("change", _updatePaymentSummary);
    }

    /*
     * Saat harga berubah
     */
    const priceIn = document.getElementById("txnPrice");

    if (priceIn) {
      priceIn.addEventListener("input", _updatePaymentSummary);
    }

    /*
     * Saat tanggal berubah,
     * promo aktif ikut berubah.
     */
    if (dateIn) {
      dateIn.addEventListener("change", () => {
        _updatePromoOptions();
        _updatePaymentSummary();
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        _saveTransaction();
      });
    }
  }

  /* ============================================================
       SERVICE DROPDOWN
       ============================================================ */

  function _populateServiceDropdown() {
    const sel = document.getElementById("txnService");

    if (!sel) return;

    const svcs = Store.getActiveServices();

    const current = sel.value;

    sel.innerHTML =
      '<option value="">— Choose Service —</option>' +
      svcs
        .map(
          (s) =>
            `<option value="${s.id}" data-price="${s.price}">
                ${s.name} (${Store.formatCurrency(s.price)})
              </option>`,
        )
        .join("");

    if (current) {
      sel.value = current;
    }
  }

  /* ============================================================
       PROMO DROPDOWN
       ============================================================ */

  function _updatePromoOptions() {
    const sel = document.getElementById("txnPromo");

    const dateIn = document.getElementById("txnDate");

    if (!sel || !dateIn) return;

    const dateVal = dateIn.value;

    const promos = Store.getActivePromos(dateVal);

    const current = sel.value;

    sel.innerHTML =
      '<option value="">Tanpa Promo</option>' +
      promos
        .map(
          (p) =>
            `<option value="${p.id}" data-discount="${p.discount}">
                ${p.name} (−${p.discount}%)
              </option>`,
        )
        .join("");

    if (current && promos.some((p) => p.id === current)) {
      sel.value = current;
    }

    _updatePaymentSummary();
  }

  /* ============================================================
       PAYMENT CALCULATION
       ============================================================ */

  function _getFormCalculation() {
    const price = Number(document.getElementById("txnPrice")?.value) || 0;

    const dp = Number(document.getElementById("txnDP")?.value) || 0;

    const promoSel = document.getElementById("txnPromo");

    let promoDiscount = 0;

    if (promoSel && promoSel.value) {
      const opt = promoSel.selectedOptions[0];

      promoDiscount = Number(opt?.dataset?.discount) || 0;
    }

    return Store.calculateTransaction({
      price,
      dp,
      promoDiscount,
    });
  }

  function _updatePaymentSummary() {
    const calc = _getFormCalculation();

    /*
     * ID ini nanti kita pasang di HTML.
     * Kalau belum ada, tidak error.
     */

    _setText("txnTotalTreatment", Store.formatCurrency(calc.totalTreatment));

    _setText("txnDPSummary", Store.formatCurrency(calc.dp));

    _setText(
      "txnRemainingBeforePromo",
      Store.formatCurrency(calc.remainingBeforePromo),
    );

    _setText("txnDiscountAmount", Store.formatCurrency(calc.discountAmount));

    _setText("txnRemainingAmount", Store.formatCurrency(calc.remainingAmount));

    _setText(
      "txnFinalTreatmentAmount",
      Store.formatCurrency(calc.finalTreatmentAmount),
    );
  }

  function _setText(id, value) {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = value;
    }
  }

  /* ============================================================
       SAVE TRANSACTION
       ============================================================ */

  function _saveTransaction() {
    const branchSel = document.getElementById("txnBranch");

    const svcSel = document.getElementById("txnService");

    const priceIn = document.getElementById("txnPrice");

    const dateIn = document.getElementById("txnDate");

    const timeIn = document.getElementById("txnTreatmentTime");

    const notesIn = document.getElementById("txnNotes");

    const promoSel = document.getElementById("txnPromo");

    const dpIn = document.getElementById("txnDP");

    /* ---------- Validation ---------- */

    if (!svcSel?.value) {
      showToast("Pilih layanan terlebih dahulu!", "warning");
      return;
    }

    const totalTreatment = Number(priceIn?.value) || 0;

    if (!totalTreatment || totalTreatment <= 0) {
      showToast("Masukkan harga yang valid!", "warning");
      return;
    }

    const dp = Number(dpIn?.value) || 0;

    if (dp < 0) {
      showToast("DP tidak boleh kurang dari 0!", "warning");
      return;
    }

    if (dp > totalTreatment) {
      showToast("DP tidak boleh lebih besar dari total treatment!", "warning");
      return;
    }

    const service = Store.getServiceById(svcSel.value);

    /* ---------- Promo ---------- */

    let promoId = promoSel?.value || null;

    let promoDiscount = 0;

    if (promoId) {
      const opt = promoSel.selectedOptions[0];

      promoDiscount = Number(opt?.dataset?.discount) || 0;
    }

    /* ---------- Calculation ---------- */

    const calculation = Store.calculateTransaction({
      price: totalTreatment,
      dp,
      promoDiscount,
    });

    /* ---------- Data ---------- */

    const data = {
      branch: branchSel?.value || "Kemang",

      serviceId: svcSel.value,

      serviceName: service ? service.name : "Unknown",

      /*
       * Harga treatment asli
       */
      price: calculation.totalTreatment,

      /*
       * Jam treatment
       */
      treatmentTime: timeIn?.value || "",

      date: dateIn?.value || Store.getTodayStr(),

      notes: notesIn?.value.trim() || "",

      /*
       * DP
       */
      dp: calculation.dp,

      /*
       * Promo
       */
      promoId,

      promoDiscount: calculation.promoDiscount,

      /*
       * Hasil perhitungan
       */
      discountAmount: calculation.discountAmount,

      remainingBeforePromo: calculation.remainingBeforePromo,

      remainingAmount: calculation.remainingAmount,

      finalTreatmentAmount: calculation.finalTreatmentAmount,
    };

    /* ---------- Edit ---------- */

    if (editingId) {
      Store.updateTransaction(editingId, data);

      editingId = null;

      const submitBtn = document.getElementById("txnSubmitBtn");

      if (submitBtn) {
        submitBtn.textContent = "💾 Simpan Transaksi";
      }

      showToast("Transaksi diperbarui!");
    } else {

    /* ---------- New ---------- */
      Store.addTransaction(data);

      showToast("Transaksi berhasil disimpan!");
    }

    /* ---------- Reset ---------- */

    const form = document.getElementById("txnForm");

    if (form) {
      form.reset();
    }

    if (dateIn) {
      dateIn.value = Store.getTodayStr();
    }

    if (timeIn) {
      const now = new Date();

      timeIn.value =
        `${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}`;
    }

    if (dpIn) {
      dpIn.value = "";
    }

    _updatePromoOptions();

    _updatePaymentSummary();

    _renderRecent();
  }

  /* ============================================================
       RECENT TRANSACTIONS
       ============================================================ */

  function _renderRecent() {
    const el = document.getElementById("recentTransactions");

    if (!el) return;

    const txns = Store.getTransactions().slice(0, 10);

    if (txns.length === 0) {
      el.innerHTML =
        '<p class="empty-state">Belum ada transaksi. Mulai tambahkan transaksi pertama! 💰</p>';
      return;
    }

    el.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jam</th>
                <th>Cabang</th>
                <th>Layanan</th>
                <th>Total</th>
                <th>DP</th>
                <th>Promo</th>
                <th>Sisa Bayar</th>
                <th>Aksi</th>
              </tr>
            </thead>
  
            <tbody>
              ${txns.map(_txnRow).join("")}
            </tbody>
          </table>
        </div>`;
  }

  function _txnRow(t) {
    return `
        <tr>
  
          <td data-label="Tanggal">
            ${Store.formatDate(t.date)}
          </td>
  
          <td data-label="Jam">
            <strong>
              ${t.treatmentTime || "—"}
            </strong>
          </td>
  
          <td data-label="Cabang">
            <strong>
              ${t.branch || "Kemang"}
            </strong>
          </td>
  
          <td data-label="Layanan">
            <span class="service-tag">
              ${t.serviceName}
            </span>
          </td>
  
          <td data-label="Total">
            ${Store.formatCurrency(t.price)}
          </td>
  
          <td data-label="DP">
            ${Number(t.dp) > 0 ? Store.formatCurrency(t.dp) : "—"}
          </td>
  
          <td data-label="Promo">
            ${
              Number(t.promoDiscount) > 0
                ? `
                  <span class="discount-tag">
                    −${t.promoDiscount}%
                  </span>
                `
                : "—"
            }
          </td>
  
          <td data-label="Sisa Bayar">
            <strong>
              ${Store.formatCurrency(t.remainingAmount ?? t.price)}
            </strong>
          </td>
  
          <td
            data-label="Aksi"
            class="actions"
          >
  
            <button
              class="btn-icon btn-edit"
              onclick="Transactions.edit('${t.id}')"
              title="Edit"
            >
              ✏️
            </button>
  
            <button
              class="btn-icon btn-delete"
              onclick="Transactions.remove('${t.id}')"
              title="Hapus"
            >
              🗑️
            </button>
  
          </td>
  
        </tr>`;
  }

  /* ============================================================
       EDIT TRANSACTION
       ============================================================ */

  function edit(id) {
    const txn = Store.getTransactions().find((t) => t.id === id);

    if (!txn) return;

    editingId = id;

    /* ---------- Branch ---------- */

    if (txn.branch) {
      const branchEl = document.getElementById("txnBranch");

      if (branchEl) {
        branchEl.value = txn.branch;
      }
    }

    /* ---------- Service ---------- */

    const svcSel = document.getElementById("txnService");

    if (svcSel) {
      svcSel.value = txn.serviceId;
    }

    /* ---------- Price ---------- */

    const priceEl = document.getElementById("txnPrice");

    if (priceEl) {
      priceEl.value = txn.price;
    }

    /* ---------- DP ---------- */

    const dpEl = document.getElementById("txnDP");

    if (dpEl) {
      dpEl.value = Number(txn.dp) || "";
    }

    /* ---------- Date ---------- */

    const dateEl = document.getElementById("txnDate");

    if (dateEl) {
      dateEl.value = txn.date || Store.getTodayStr();
    }

    /* ---------- Treatment Time ---------- */

    const timeEl = document.getElementById("txnTreatmentTime");

    if (timeEl) {
      timeEl.value = txn.treatmentTime || "";
    }

    /* ---------- Notes ---------- */

    const notesEl = document.getElementById("txnNotes");

    if (notesEl) {
      notesEl.value = txn.notes || "";
    }

    /* ---------- Promo ---------- */

    _updatePromoOptions();

    const promoEl = document.getElementById("txnPromo");

    if (promoEl) {
      promoEl.value = txn.promoId || "";
    }

    /* ---------- Button ---------- */

    const submitBtn = document.getElementById("txnSubmitBtn");

    if (submitBtn) {
      submitBtn.textContent = "✏️ Update Transaksi";
    }

    /* ---------- Summary ---------- */

    _updatePaymentSummary();

    window.location.hash = "transactions";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* ============================================================
       DELETE
       ============================================================ */

  function remove(id, fromHistory = false) {
    if (!confirm("Hapus transaksi ini?")) {
      return;
    }

    Store.deleteTransaction(id);

    showToast("Transaksi dihapus!");

    if (fromHistory) {
      renderHistory();
    } else {
      _renderRecent();
    }
  }

  /* ============================================================
       HISTORY
       ============================================================ */

  function renderHistory() {
    if (!_initHist) {
      _setupHistory();
      _initHist = true;
    }

    _renderHistoryTable();
  }

  function _setupHistory() {
    const search = document.getElementById("historySearch");

    const branchF = document.getElementById("historyFilterBranch");

    const dateF = document.getElementById("historyFilterDate");

    const clearBtn = document.getElementById("historyClear");

    if (search) {
      search.addEventListener("input", _renderHistoryTable);
    }

    if (branchF) {
      branchF.addEventListener("change", _renderHistoryTable);
    }

    if (dateF) {
      dateF.addEventListener("change", _renderHistoryTable);
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (search) {
          search.value = "";
        }

        if (branchF) {
          branchF.value = "";
        }

        if (dateF) {
          dateF.value = "";
        }

        _renderHistoryTable();
      });
    }
  }

  function _renderHistoryTable() {
    const el = document.getElementById("historyTable");

    if (!el) return;

    const search = (
      document.getElementById("historySearch")?.value || ""
    ).toLowerCase();

    const branchF = document.getElementById("historyFilterBranch")?.value || "";

    const dateF = document.getElementById("historyFilterDate")?.value || "";

    let txns = Store.getTransactions();

    /* ---------- Search ---------- */

    if (search) {
      txns = txns.filter(
        (t) =>
          (t.serviceName || "").toLowerCase().includes(search) ||
          (t.notes || "").toLowerCase().includes(search),
      );
    }

    /* ---------- Branch ---------- */

    if (branchF) {
      txns = txns.filter((t) => t.branch === branchF);
    }

    /* ---------- Date ---------- */

    if (dateF) {
      txns = txns.filter((t) => t.date === dateF);
    }

    /* ---------- Summary ---------- */

    const totalTreatment = txns.reduce((s, t) => s + (Number(t.price) || 0), 0);

    const totalDP = txns.reduce((s, t) => s + (Number(t.dp) || 0), 0);

    const totalDiscount = txns.reduce(
      (s, t) => s + (Number(t.discountAmount) || 0),
      0,
    );

    const totalRemaining = txns.reduce(
      (s, t) => s + (Number(t.remainingAmount) || Number(t.price) || 0),
      0,
    );

    const totalEl = document.getElementById("historyTotal");

    const countEl = document.getElementById("historyCount");

    if (totalEl) {
      totalEl.textContent = Store.formatCurrency(totalTreatment);
    }

    if (countEl) {
      countEl.textContent = txns.length + " transaksi";
    }

    /* ---------- Empty ---------- */

    if (txns.length === 0) {
      el.innerHTML =
        '<p class="empty-state">Tidak ada transaksi ditemukan. 🔍</p>';

      return;
    }

    /* ---------- Table ---------- */

    el.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
  
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jam</th>
                <th>Cabang</th>
                <th>Layanan</th>
                <th>Total</th>
                <th>DP</th>
                <th>Promo</th>
                <th>Diskon</th>
                <th>Sisa Bayar</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
  
            <tbody>
  
              ${txns
                .map(
                  (t) => `
                    <tr>
  
                      <td data-label="Tanggal">
                        ${Store.formatDate(t.date)}
                      </td>
  
                      <td data-label="Jam">
                        <strong>
                          ${t.treatmentTime || "—"}
                        </strong>
                      </td>
  
                      <td data-label="Cabang">
                        <strong>
                          ${t.branch || "Kemang"}
                        </strong>
                      </td>
  
                      <td data-label="Layanan">
                        <span class="service-tag">
                          ${t.serviceName}
                        </span>
                      </td>
  
                      <td data-label="Total">
                        ${Store.formatCurrency(t.price)}
                      </td>
  
                      <td data-label="DP">
                        ${Number(t.dp) > 0 ? Store.formatCurrency(t.dp) : "—"}
                      </td>
  
                      <td data-label="Promo">
                        ${
                          Number(t.promoDiscount) > 0
                            ? `
                              <span class="discount-tag">
                                −${t.promoDiscount}%
                              </span>
                            `
                            : "—"
                        }
                      </td>
  
                      <td data-label="Diskon">
                        ${
                          Number(t.discountAmount) > 0
                            ? Store.formatCurrency(t.discountAmount)
                            : "—"
                        }
                      </td>
  
                      <td data-label="Sisa Bayar">
                        <strong>
                          ${Store.formatCurrency(t.remainingAmount ?? t.price)}
                        </strong>
                      </td>
  
                      <td data-label="Catatan">
                        ${t.notes || "—"}
                      </td>
  
                      <td
                        data-label="Aksi"
                        class="actions"
                      >
  
                        <button
                          class="btn-icon btn-edit"
                          onclick="Transactions.edit('${t.id}')"
                          title="Edit"
                        >
                          ✏️
                        </button>
  
                        <button
                          class="btn-icon btn-delete"
                          onclick="Transactions.remove('${t.id}', true)"
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

    /*
     * Optional summary tambahan.
     * Kalau element-nya belum ada, tidak masalah.
     */

    _setText("historyTotalTreatment", Store.formatCurrency(totalTreatment));

    _setText("historyTotalDP", Store.formatCurrency(totalDP));

    _setText("historyTotalDiscount", Store.formatCurrency(totalDiscount));

    _setText("historyTotalRemaining", Store.formatCurrency(totalRemaining));
  }

  /* ============================================================
       EXPORT CSV
       ============================================================ */

  function exportCSV() {
    const txns = Store.getTransactions();

    if (txns.length === 0) {
      showToast("Tidak ada data untuk di-export!", "warning");

      return;
    }

    const header =
      "Tanggal,Jam,Cabang,Layanan,Total Treatment,DP,Sisa Sebelum Promo,Diskon Promo (%),Nominal Diskon,Sisa Bayar,Catatan\n";

    const rows = txns
      .map(
        (t) =>
          `${t.date},"${t.treatmentTime || ""}","${t.branch || "Kemang"}","${
            t.serviceName
          }",${Number(t.price) || 0},${Number(t.dp) || 0},${
            Number(t.remainingBeforePromo) || 0
          },${Number(t.promoDiscount) || 0},${Number(t.discountAmount) || 0},${
            Number(t.remainingAmount ?? t.price) || 0
          },"${(t.notes || "").replace(/"/g, '""')}"`,
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + header + rows], {
      type: "text/csv;charset=utf-8;",
    });

    const a = document.createElement("a");

    const url = URL.createObjectURL(blob);

    a.href = url;

    a.download = `beauty-bar-transaksi-${Store.getTodayStr()}.csv`;

    a.click();

    URL.revokeObjectURL(url);

    showToast("Data berhasil di-export! 📄");
  }

  /* ============================================================
       PUBLIC API
       ============================================================ */

  return {
    render,
    renderHistory,
    edit,
    remove,
    exportCSV,
  };
})();
