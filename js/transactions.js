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

  async function render() {
    if (!_initTxn) {
      _setupTxnForm();
      _initTxn = true;
    }

    await _populateServiceDropdown();
    await _updatePromoOptions();
    await _renderRecent();
  }

  function _setupTxnForm() {
    const form = document.getElementById("txnForm");

    const svcSel = document.getElementById("txnService");

    const dateIn = document.getElementById("txnDate");

    if (!form || !svcSel || !dateIn) {
      console.error("Transaction form tidak ditemukan.");
      return;
    }

    dateIn.value = Store.getTodayStr();

    svcSel.addEventListener("change", async () => {
      const opt = svcSel.selectedOptions[0];

      if (opt && opt.dataset.price) {
        document.getElementById("txnPrice").value = opt.dataset.price;
      }

      await _updatePromoOptions();
      _updatePaymentPreview();
    });

    dateIn.addEventListener("change", async () => {
      await _updatePromoOptions();
    });

    const promoSel = document.getElementById("txnPromo");

    if (promoSel) {
      promoSel.addEventListener("change", () => {
        _updatePaymentPreview();
      });
    }

    const dpIn = document.getElementById("txnDP");

    if (dpIn) {
      dpIn.addEventListener("input", () => {
        _updatePaymentPreview();
      });
    }

    const priceIn = document.getElementById("txnPrice");

    if (priceIn) {
      priceIn.addEventListener("input", () => {
        _updatePaymentPreview();
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      await _saveTransaction();
    });
  }

  /* ============================================================
       SERVICE DROPDOWN
       ============================================================ */

  async function _populateServiceDropdown(selectedId = null) {
    const sel = document.getElementById("txnService");

    if (!sel) return;

    sel.innerHTML = '<option value="">Loading service...</option>';

    const svcs = await Store.getActiveServices();

    if (!svcs.length) {
      sel.innerHTML = '<option value="">— Tidak ada service aktif —</option>';

      console.warn("Tidak ada service aktif di Supabase.");

      return;
    }

    sel.innerHTML =
      '<option value="">— Choose Service —</option>' +
      svcs
        .map(
          (s) => `
              <option
                value="${s.id}"
                data-price="${s.price}"
              >
                ${s.name}
                (${Store.formatCurrency(s.price)})
              </option>
            `,
        )
        .join("");

    if (selectedId) {
      sel.value = selectedId;
    }
  }

  /* ============================================================
       PROMO DROPDOWN
       ============================================================ */

  async function _updatePromoOptions(selectedPromoId = null) {
    const sel = document.getElementById("txnPromo");

    const dateEl = document.getElementById("txnDate");

    if (!sel || !dateEl) {
      return;
    }

    const dateVal = dateEl.value || Store.getTodayStr();

    const promos = await Store.getActivePromos(dateVal);

    sel.innerHTML =
      '<option value="">Tanpa Promo</option>' +
      promos
        .map(
          (p) => `
              <option
                value="${p.id}"
                data-discount="${p.discount}"
              >
                ${p.name}
                (−${p.discount}%)
              </option>
            `,
        )
        .join("");

    if (selectedPromoId) {
      sel.value = selectedPromoId;
    }

    _updatePaymentPreview();
  }

  /* ============================================================
       CALCULATION
       ============================================================ */

  function _getCurrentCalculation() {
    const priceIn = document.getElementById("txnPrice");

    const dpIn = document.getElementById("txnDP");

    const promoSel = document.getElementById("txnPromo");

    const price = Number(priceIn?.value) || 0;

    const dp = Number(dpIn?.value) || 0;

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

  function _updatePaymentPreview() {
    const calc = _getCurrentCalculation();

    const totalEl = document.getElementById("txnPreviewTotal");

    const dpEl = document.getElementById("txnPreviewDP");

    const beforePromoEl = document.getElementById("txnPreviewBeforePromo");

    const discountEl = document.getElementById("txnPreviewDiscount");

    const remainingEl = document.getElementById("txnPreviewRemaining");

    const finalEl = document.getElementById("txnPreviewFinal");

    if (totalEl) {
      totalEl.textContent = Store.formatCurrency(calc.totalTreatment);
    }

    if (dpEl) {
      dpEl.textContent = Store.formatCurrency(calc.dp);
    }

    if (beforePromoEl) {
      beforePromoEl.textContent = Store.formatCurrency(
        calc.remainingBeforePromo,
      );
    }

    if (discountEl) {
      discountEl.textContent = `−${calc.promoDiscount}% (${Store.formatCurrency(
        calc.discountAmount,
      )})`;
    }

    if (remainingEl) {
      remainingEl.textContent = Store.formatCurrency(calc.remainingAmount);
    }

    if (finalEl) {
      finalEl.textContent = Store.formatCurrency(calc.finalTreatmentAmount);
    }
  }

  /* ============================================================
       SAVE TRANSACTION
       ============================================================ */

  async function _saveTransaction() {
    const branchSel = document.getElementById("txnBranch");

    const svcSel = document.getElementById("txnService");

    const priceIn = document.getElementById("txnPrice");

    const dateIn = document.getElementById("txnDate");

    const timeIn = document.getElementById("txnTreatmentTime");

    const notesIn = document.getElementById("txnNotes");

    const promoSel = document.getElementById("txnPromo");

    const dpIn = document.getElementById("txnDP");

    if (!svcSel?.value) {
      showToast("Pilih layanan terlebih dahulu!", "warning");
      return;
    }

    if (!priceIn?.value || Number(priceIn.value) <= 0) {
      showToast("Masukkan harga yang valid!", "warning");
      return;
    }

    const service = await Store.getServiceById(svcSel.value);

    if (!service) {
      showToast("Service tidak ditemukan!", "warning");
      return;
    }

    const price = Number(priceIn.value);

    const dp = Number(dpIn?.value) || 0;

    let promoId = promoSel?.value || null;

    let promoDiscount = 0;

    if (promoId) {
      const opt = promoSel.selectedOptions[0];

      promoDiscount = Number(opt?.dataset?.discount) || 0;
    }

    const calculation = Store.calculateTransaction({
      price,
      dp,
      promoDiscount,
    });

    const data = {
      branch: branchSel?.value || "Kemang",

      serviceId: svcSel.value,

      serviceName: service.name,

      price: calculation.totalTreatment,

      date: dateIn?.value || Store.getTodayStr(),

      treatmentTime: timeIn?.value || null,

      notes: notesIn?.value.trim() || "",

      promoId,

      promoDiscount: calculation.promoDiscount,

      dp: calculation.dp,
    };

    let result = null;

    if (editingId) {
      result = await Store.updateTransaction(editingId, data);

      if (!result) return;

      editingId = null;

      document.getElementById("txnSubmitBtn").textContent =
        "💾 Simpan Transaksi";

      showToast("Transaksi diperbarui!");
    } else {
      result = await Store.addTransaction(data);

      if (!result) return;

      showToast("Transaksi berhasil disimpan!");
    }

    _resetForm();

    await _updatePromoOptions();

    await _renderRecent();
  }

  /* ============================================================
       RESET FORM
       ============================================================ */

  function _resetForm() {
    const form = document.getElementById("txnForm");

    if (form) {
      form.reset();
    }

    const dateIn = document.getElementById("txnDate");

    if (dateIn) {
      dateIn.value = Store.getTodayStr();
    }

    editingId = null;

    const btn = document.getElementById("txnSubmitBtn");

    if (btn) {
      btn.textContent = "💾 Simpan Transaksi";
    }

    _updatePaymentPreview();
  }

  /* ============================================================
       RECENT TRANSACTIONS
       ============================================================ */

  async function _renderRecent() {
    const el = document.getElementById("recentTransactions");

    if (!el) return;

    el.innerHTML = '<p class="empty-state">Loading transaksi...</p>';

    const txns = (await Store.getTransactions()).slice(0, 10);

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
  
        </div>
      `;
  }

  function _txnRow(t) {
    const calc = Store.calculateTransaction({
      price: Number(t.price) || 0,

      dp: Number(t.dp) || 0,

      promoDiscount: Number(t.promo_discount) || 0,
    });

    return `
        <tr>
  
          <td data-label="Tanggal">
            ${Store.formatDate(t.date)}
          </td>
  
          <td data-label="Jam">
            ${t.treatment_time ? Store.formatTime(t.treatment_time) : "—"}
          </td>
  
          <td data-label="Cabang">
            <strong>
              ${t.branch || "Kemang"}
            </strong>
          </td>
  
          <td data-label="Layanan">
            <span class="service-tag">
              ${t.service_name}
            </span>
          </td>
  
          <td data-label="Total">
            ${Store.formatCurrency(calc.totalTreatment)}
          </td>
  
          <td data-label="DP">
            ${Store.formatCurrency(calc.dp)}
          </td>
  
          <td data-label="Promo">
            ${
              calc.promoDiscount
                ? `
                  <span class="discount-tag">
                    −${calc.promoDiscount}%
                  </span>
                `
                : "—"
            }
          </td>
  
          <td data-label="Sisa Bayar">
            <strong>
              ${Store.formatCurrency(calc.remainingAmount)}
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
  
        </tr>
      `;
  }

  /* ============================================================
       EDIT
       ============================================================ */

  async function edit(id) {
    const txns = await Store.getTransactions();

    const txn = txns.find((t) => t.id === id);

    if (!txn) return;

    editingId = id;

    await _populateServiceDropdown(txn.service_id);

    document.getElementById("txnBranch").value = txn.branch || "Kemang";

    document.getElementById("txnService").value = txn.service_id || "";

    document.getElementById("txnPrice").value = txn.price || 0;

    document.getElementById("txnDate").value = txn.date;

    const timeIn = document.getElementById("txnTreatmentTime");

    if (timeIn) {
      timeIn.value = txn.treatment_time
        ? String(txn.treatment_time).slice(0, 5)
        : "";
    }

    const dpIn = document.getElementById("txnDP");

    if (dpIn) {
      dpIn.value = txn.dp || 0;
    }

    document.getElementById("txnNotes").value = txn.notes || "";

    await _updatePromoOptions(txn.promo_id);

    document.getElementById("txnSubmitBtn").textContent = "✏️ Update Transaksi";

    _updatePaymentPreview();

    window.location.hash = "transactions";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* ============================================================
       DELETE
       ============================================================ */

  async function remove(id, fromHistory = false) {
    if (!confirm("Hapus transaksi ini?")) {
      return;
    }

    const result = await Store.deleteTransaction(id);

    if (!result) return;

    showToast("Transaksi dihapus!");

    if (fromHistory) {
      await renderHistory();
    } else {
      await _renderRecent();
    }
  }

  /* ============================================================
       HISTORY
       ============================================================ */

  async function renderHistory() {
    if (!_initHist) {
      _setupHistory();
      _initHist = true;
    }

    await _renderHistoryTable();
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
      clearBtn.addEventListener("click", async () => {
        if (search) search.value = "";

        if (branchF) branchF.value = "";

        if (dateF) dateF.value = "";

        await _renderHistoryTable();
      });
    }
  }

  async function _renderHistoryTable() {
    const el = document.getElementById("historyTable");

    if (!el) return;

    const search = (
      document.getElementById("historySearch")?.value || ""
    ).toLowerCase();

    const branchF = document.getElementById("historyFilterBranch")?.value || "";

    const dateF = document.getElementById("historyFilterDate")?.value || "";

    let txns = await Store.getTransactions();

    if (search) {
      txns = txns.filter(
        (t) =>
          (t.service_name || "").toLowerCase().includes(search) ||
          (t.notes || "").toLowerCase().includes(search),
      );
    }

    if (branchF) {
      txns = txns.filter((t) => t.branch === branchF);
    }

    if (dateF) {
      txns = txns.filter((t) => t.date === dateF);
    }

    const total = txns.reduce((sum, t) => {
      const calc = Store.calculateTransaction({
        price: t.price,

        dp: t.dp,

        promoDiscount: t.promo_discount,
      });

      // Revenue treatment setelah promo
      return sum + calc.finalTreatmentAmount;
    }, 0);

    const totalEl = document.getElementById("historyTotal");

    const countEl = document.getElementById("historyCount");

    if (totalEl) {
      totalEl.textContent = Store.formatCurrency(total);
    }

    if (countEl) {
      countEl.textContent = txns.length + " transaksi";
    }

    if (txns.length === 0) {
      el.innerHTML =
        '<p class="empty-state">Tidak ada transaksi ditemukan. 🔍</p>';

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
                <th>Total Treatment</th>
                <th>DP</th>
                <th>Promo</th>
                <th>Sisa Bayar</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
  
            <tbody>
  
              ${txns
                .map((t) => {
                  const calc = Store.calculateTransaction({
                    price: t.price,

                    dp: t.dp,

                    promoDiscount: t.promo_discount,
                  });

                  return `
                      <tr>
  
                        <td data-label="Tanggal">
                          ${Store.formatDate(t.date)}
                        </td>
  
                        <td data-label="Jam">
                          ${
                            t.treatment_time
                              ? Store.formatTime(t.treatment_time)
                              : "—"
                          }
                        </td>
  
                        <td data-label="Cabang">
                          <strong>
                            ${t.branch || "Kemang"}
                          </strong>
                        </td>
  
                        <td data-label="Layanan">
                          <span class="service-tag">
                            ${t.service_name}
                          </span>
                        </td>
  
                        <td data-label="Total Treatment">
                          ${Store.formatCurrency(calc.totalTreatment)}
                        </td>
  
                        <td data-label="DP">
                          ${Store.formatCurrency(calc.dp)}
                        </td>
  
                        <td data-label="Promo">
                          ${
                            calc.promoDiscount
                              ? `
                                <span class="discount-tag">
                                  −${calc.promoDiscount}%
                                </span>
                              `
                              : "—"
                          }
                        </td>
  
                        <td data-label="Sisa Bayar">
                          <strong>
                            ${Store.formatCurrency(calc.remainingAmount)}
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
                    `;
                })
                .join("")}
  
            </tbody>
  
          </table>
  
        </div>
      `;
  }

  /* ============================================================
       EXPORT CSV
       ============================================================ */

  async function exportCSV() {
    const txns = await Store.getTransactions();

    if (txns.length === 0) {
      showToast("Tidak ada data untuk di-export!", "warning");
      return;
    }

    const header =
      "Tanggal,Jam,Cabang,Layanan,Total Treatment,DP,Diskon Promo (%),Sisa Bayar,Catatan\n";

    const rows = txns
      .map((t) => {
        const calc = Store.calculateTransaction({
          price: t.price,

          dp: t.dp,

          promoDiscount: t.promo_discount,
        });

        return [
          t.date,

          `"${t.treatment_time || ""}"`,

          `"${t.branch || "Kemang"}"`,

          `"${(t.service_name || "").replace(/"/g, '""')}"`,

          calc.totalTreatment,

          calc.dp,

          calc.promoDiscount,

          calc.remainingAmount,

          `"${(t.notes || "").replace(/"/g, '""')}"`,
        ].join(",");
      })
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
