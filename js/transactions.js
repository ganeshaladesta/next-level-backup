/* ============================================================
   Beauty Bar Dashboard — Transactions & History
   ============================================================ */
const Transactions = (() => {
  let _initTxn = false;
  let _initHist = false;
  let editingId = null;

  /* ==================== Transaction Form ==================== */
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

    dateIn.value = Store.getTodayStr();

    svcSel.addEventListener("change", () => {
      const opt = svcSel.selectedOptions[0];
      if (opt && opt.dataset.price) {
        document.getElementById("txnPrice").value = opt.dataset.price;
      }
      _updatePromoOptions();
    });

    dateIn.addEventListener("change", () => _updatePromoOptions());

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      _saveTransaction();
    });
  }

  function _populateServiceDropdown() {
    const sel = document.getElementById("txnService");
    const svcs = Store.getActiveServices();
    const current = sel.value;
    sel.innerHTML =
      '<option value="">— Choose Service —</option>' +
      svcs
        .map(
          (s) =>
            `<option value="${s.id}" data-price="${s.price}">${s.name} (${Store.formatCurrency(s.price)})</option>`,
        )
        .join("");
    if (current) sel.value = current;
  }

  function _updatePromoOptions() {
    const sel = document.getElementById("txnPromo");
    const dateVal = document.getElementById("txnDate").value;
    const promos = Store.getActivePromos(dateVal);
    sel.innerHTML =
      '<option value="">Tanpa Promo</option>' +
      promos
        .map(
          (p) =>
            `<option value="${p.id}" data-discount="${p.discount}">${p.name} (−${p.discount}%)</option>`,
        )
        .join("");
  }

  function _saveTransaction() {
    const branchSel = document.getElementById("txnBranch");
    const svcSel = document.getElementById("txnService");
    const priceIn = document.getElementById("txnPrice");
    const dateIn = document.getElementById("txnDate");
    const notesIn = document.getElementById("txnNotes");
    const promoSel = document.getElementById("txnPromo");

    if (!svcSel.value) {
      showToast("Pilih layanan terlebih dahulu!", "warning");
      return;
    }
    if (!priceIn.value || Number(priceIn.value) <= 0) {
      showToast("Masukkan harga yang valid!", "warning");
      return;
    }

    const service = Store.getServiceById(svcSel.value);
    let price = Number(priceIn.value);
    let promoId = promoSel.value || null;
    let promoDiscount = 0;

    if (promoId) {
      const opt = promoSel.selectedOptions[0];
      promoDiscount = Number(opt.dataset.discount);
      price = Math.round(price * (1 - promoDiscount / 100));
    }

    const data = {
      branch: branchSel.value,
      serviceId: svcSel.value,
      serviceName: service ? service.name : "Unknown",
      price,
      date: dateIn.value,
      notes: notesIn.value.trim(),
      promoId,
      promoDiscount,
    };

    if (editingId) {
      Store.updateTransaction(editingId, data);
      editingId = null;
      document.getElementById("txnSubmitBtn").textContent =
        "💾 Simpan Transaksi";
      showToast("Transaksi diperbarui!");
    } else {
      Store.addTransaction(data);
      showToast("Transaksi berhasil disimpan!");
    }

    document.getElementById("txnForm").reset();
    document.getElementById("txnDate").value = Store.getTodayStr();
    _updatePromoOptions();
    _renderRecent();
  }

  /* ---------- Recent Transactions Table ---------- */
  function _renderRecent() {
    const el = document.getElementById("recentTransactions");
    const txns = Store.getTransactions().slice(0, 10);

    if (txns.length === 0) {
      el.innerHTML =
        '<p class="empty-state">Belum ada transaksi. Mulai tambahkan transaksi pertama! 💰</p>';
      return;
    }

    el.innerHTML = `
      <div class="table-responsive">
      <table class="data-table">
        <thead><tr>
          <th>Tanggal</th><th>Cabang</th><th>Layanan</th><th>Harga</th><th>Promo</th><th>Aksi</th>
        </tr></thead>
        <tbody>${txns.map(_txnRow).join("")}</tbody>
      </table>
      </div>`;
  }

  function _txnRow(t) {
    return `<tr>
      <td data-label="Tanggal">${Store.formatDate(t.date)}</td>
      <td data-label="Cabang"><strong>${t.branch || "Kemang"}</strong></td>
      <td data-label="Layanan"><span class="service-tag">${t.serviceName}</span></td>
      <td data-label="Harga">${Store.formatCurrency(t.price)}</td>
      <td data-label="Promo">${t.promoDiscount ? '<span class="discount-tag">−' + t.promoDiscount + "%</span>" : "—"}</td>
      <td data-label="Aksi" class="actions">
        <button class="btn-icon btn-edit" onclick="Transactions.edit('${t.id}')" title="Edit">✏️</button>
        <button class="btn-icon btn-delete" onclick="Transactions.remove('${t.id}')" title="Hapus">🗑️</button>
      </td>
    </tr>`;
  }

  function edit(id) {
    const txn = Store.getTransactions().find((t) => t.id === id);
    if (!txn) return;
    editingId = id;

    if (txn.branch) document.getElementById("txnBranch").value = txn.branch;
    document.getElementById("txnService").value = txn.serviceId;
    // Restore original price (before discount)
    const origPrice =
      txn.promoDiscount > 0
        ? Math.round(txn.price / (1 - txn.promoDiscount / 100))
        : txn.price;
    document.getElementById("txnPrice").value = origPrice;
    document.getElementById("txnDate").value = txn.date;
    document.getElementById("txnNotes").value = txn.notes || "";
    document.getElementById("txnSubmitBtn").textContent = "✏️ Update Transaksi";
    _updatePromoOptions();

    window.location.hash = "transactions";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id, fromHistory = false) {
    if (!confirm("Hapus transaksi ini?")) return;
    Store.deleteTransaction(id);
    showToast("Transaksi dihapus!");
    if (fromHistory) renderHistory();
    else _renderRecent();
  }

  /* ==================== History View ==================== */
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

    if (search) search.addEventListener("input", _renderHistoryTable);
    if (branchF) branchF.addEventListener("change", _renderHistoryTable);
    if (dateF) dateF.addEventListener("change", _renderHistoryTable);
    if (clearBtn)
      clearBtn.addEventListener("click", () => {
        if (search) search.value = "";
        if (branchF) branchF.value = "";
        if (dateF) dateF.value = "";
        _renderHistoryTable();
      });
  }

  function _renderHistoryTable() {
    const el = document.getElementById("historyTable");
    const search = (
      document.getElementById("historySearch")?.value || ""
    ).toLowerCase();
    const branchF = document.getElementById("historyFilterBranch")?.value || "";
    const dateF = document.getElementById("historyFilterDate")?.value || "";

    let txns = Store.getTransactions();
    if (search)
      txns = txns.filter(
        (t) =>
          t.serviceName.toLowerCase().includes(search) ||
          (t.notes && t.notes.toLowerCase().includes(search)),
      );
    if (branchF) txns = txns.filter((t) => t.branch === branchF);
    if (dateF) txns = txns.filter((t) => t.date === dateF);

    const total = txns.reduce((s, t) => s + t.price, 0);
    const totalEl = document.getElementById("historyTotal");
    const countEl = document.getElementById("historyCount");
    if (totalEl) totalEl.textContent = Store.formatCurrency(total);
    if (countEl) countEl.textContent = txns.length + " transaksi";

    if (txns.length === 0) {
      el.innerHTML =
        '<p class="empty-state">Tidak ada transaksi ditemukan. 🔍</p>';
      return;
    }

    el.innerHTML = `
      <div class="table-responsive">
      <table class="data-table">
        <thead><tr>
          <th>Tanggal</th><th>Cabang</th><th>Layanan</th><th>Harga</th><th>Promo</th><th>Catatan</th><th>Aksi</th>
        </tr></thead>
        <tbody>${txns
          .map(
            (t) => `<tr>
          <td data-label="Tanggal">${Store.formatDate(t.date)}</td>
          <td data-label="Cabang"><strong>${t.branch || "Kemang"}</strong></td>
          <td data-label="Layanan"><span class="service-tag">${t.serviceName}</span></td>
          <td data-label="Harga">${Store.formatCurrency(t.price)}</td>
          <td data-label="Promo">${t.promoDiscount ? '<span class="discount-tag">−' + t.promoDiscount + "%</span>" : "—"}</td>
          <td data-label="Catatan">${t.notes || "—"}</td>
          <td data-label="Aksi" class="actions">
            <button class="btn-icon btn-edit" onclick="Transactions.edit('${t.id}')" title="Edit">✏️</button>
            <button class="btn-icon btn-delete" onclick="Transactions.remove('${t.id}', true)" title="Hapus">🗑️</button>
          </td>
        </tr>`,
          )
          .join("")}</tbody>
      </table>
      </div>`;
  }

  /* ---------- Export CSV ---------- */
  function exportCSV() {
    const txns = Store.getTransactions();
    if (txns.length === 0) {
      showToast("Tidak ada data untuk di-export!", "warning");
      return;
    }

    const header = "Tanggal,Cabang,Layanan,Harga,Diskon Promo (%),Catatan\n";
    const rows = txns
      .map(
        (t) =>
          `${t.date},"${t.branch || "Kemang"}","${t.serviceName}",${t.price},${t.promoDiscount || 0},"${(t.notes || "").replace(/"/g, '""')}"`,
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `beauty-bar-transaksi-${Store.getTodayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Data berhasil di-export! 📄");
  }

  return { render, renderHistory, edit, remove, exportCSV };
})();
