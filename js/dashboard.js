/* ============================================================
   Beauty Bar Dashboard — Dashboard View (Charts & Summary)
   ============================================================ */
const Dashboard = (() => {
  let revenueChart = null;
  let serviceChart = null;
  let barChart = null;
  let currentFilter = 'monthly';
  let currentBranch = 'all';
  let currentChartType = 'line';
  let _initialized = false;

  function render() {
    if (!_initialized) {
      _setup();
      _initialized = true;
    }
    renderPromoBanner();
    renderSummaryCards();
    renderCharts();
  }

  function _setup() {
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderCharts();
      });
    });

    document.querySelectorAll('.chart-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentChartType = btn.dataset.chartType;
        renderCharts();
      });
    });

    const branchFilter = document.getElementById('dashBranchFilter');
    if (branchFilter) {
      branchFilter.addEventListener('change', (e) => {
        currentBranch = e.target.value;
        renderSummaryCards();
        renderCharts();
      });
    }

    const exportBtn = document.getElementById('exportPdfBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportPDF);
  }

  /* ---------- Promo Banner ---------- */
  function renderPromoBanner() {
    const banner = document.getElementById('promoBanner');
    const active = Store.getActivePromos();
    if (active.length > 0) {
      banner.innerHTML = active.map(p =>
        `<div class="promo-badge-item">
          <span class="promo-badge-icon">🎉</span>
          <span><strong>${p.name}</strong> — Diskon ${p.discount}%${p.description ? ' · ' + p.description : ''}</span>
        </div>`
      ).join('');
      banner.style.display = 'block';
    } else {
      banner.innerHTML = '';
      banner.style.display = 'none';
    }
  }

  /* ---------- Summary Cards ---------- */
  function renderSummaryCards() {
    const today = Store.getTodayStr();
    let all = Store.getTransactions();
    if (currentBranch !== 'all') {
      all = all.filter(t => t.branch === currentBranch);
    }

    const todayTxns  = all.filter(t => t.date === today);
    const monthStart = today.substring(0, 7) + '-01';
    const monthTxns  = all.filter(t => t.date >= monthStart && t.date <= today);
    const yearStart  = today.substring(0, 4) + '-01-01';
    const yearTxns   = all.filter(t => t.date >= yearStart  && t.date <= today);

    const sum = arr => arr.reduce((s, t) => s + t.price, 0);

    _setText('todayRevenue',      Store.formatCurrency(sum(todayTxns)));
    _setText('todayCount',        todayTxns.length + ' transaksi');
    _setText('monthRevenue',      Store.formatCurrency(sum(monthTxns)));
    _setText('monthCount',        monthTxns.length + ' transaksi');
    _setText('yearRevenue',       Store.formatCurrency(sum(yearTxns)));
    _setText('yearCount',         yearTxns.length + ' transaksi');
    _setText('totalTransactions', all.length);
    _setText('totalServices',     Store.getActiveServices().length + ' layanan aktif');
  }

  function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ---------- Charts ---------- */
  function renderCharts() {
    _renderRevenueChart();
    _renderServiceChart();
    _renderBarChart();
  }

  function _chartColors() {
    return [
      '#e30022', '#ff1a3d', '#990017', '#b0b0b0',
      '#ffffff', '#808080', '#4d4d4d', '#ff4d66',
      '#cc001f', '#e60000', '#cccccc', '#333333'
    ];
  }

  /* — Revenue Chart (line / column) — */
  function _renderRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    const { labels, data } = _getRevenueData();

    if (revenueChart) revenueChart.destroy();

    const isLine = currentChartType === 'line';
    revenueChart = new Chart(ctx, {
      type: currentChartType,
      data: {
        labels,
        datasets: [{
          label: 'Pendapatan',
          data,
          ...(isLine ? {
            borderColor: '#e30022',
            backgroundColor: _gradient(ctx, '#e30022'),
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#e30022',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6
          } : {
            backgroundColor: '#e30022',
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 48
          })
        }]
      },
      options: _axisChartOptions()
    });
  }

  /* — Service Doughnut Chart — */
  function _renderServiceChart() {
    const ctx = document.getElementById('serviceChart');
    if (!ctx) return;
    const { labels, data, colors } = _getServiceData();

    if (serviceChart) serviceChart.destroy();

    serviceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#121214' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#f4f4f5', padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } },
          tooltip: { callbacks: { label: c => `${c.label}: ${Store.formatCurrency(c.parsed)}` } }
        }
      }
    });
  }

  /* — Service Comparison Chart (line / column) — */
  function _renderBarChart() {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;
    const { labels, data, colors } = _getServiceData();

    if (barChart) barChart.destroy();

    const isLine = currentChartType === 'line';
    barChart = new Chart(ctx, {
      type: currentChartType,
      data: {
        labels,
        datasets: [{
          label: 'Pendapatan',
          data,
          ...(isLine ? {
            borderColor: '#e30022',
            backgroundColor: _gradient(ctx, '#e30022'),
            fill: true,
            tension: 0.4,
            pointBackgroundColor: colors,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          } : {
            backgroundColor: colors,
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 48
          })
        }]
      },
      options: _axisChartOptions()
    });
  }

  function _axisChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => Store.formatCurrency(c.parsed.y) } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#a1a1aa', callback: v => _shortCurrency(v) }, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { ticks: { color: '#a1a1aa' }, grid: { display: false } }
      }
    };
  }

  /* ---------- Data Helpers ---------- */
  function _getRevenueData() {
    let all = Store.getTransactions();
    if (currentBranch !== 'all') {
      all = all.filter(t => t.branch === currentBranch);
    }
    const today = new Date();
    const labels = [];
    const map = {};
    const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

    if (currentFilter === 'daily') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const key = _dateStr(d);
        labels.push(`${d.getDate()}/${d.getMonth()+1}`);
        map[key] = 0;
      }
      all.forEach(t => { if (map[t.date] !== undefined) map[t.date] += t.price; });
    } else if (currentFilter === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        labels.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
        map[key] = 0;
      }
      all.forEach(t => { const k = t.date.substring(0,7); if (map[k] !== undefined) map[k] += t.price; });
    } else {
      for (let i = 4; i >= 0; i--) {
        const y = today.getFullYear() - i;
        labels.push(String(y));
        map[String(y)] = 0;
      }
      all.forEach(t => { const k = t.date.substring(0,4); if (map[k] !== undefined) map[k] += t.price; });
    }

    return { labels, data: Object.values(map) };
  }

  function _getServiceData() {
    const txns = _filteredTransactions();
    const smap = {};
    txns.forEach(t => { smap[t.serviceName] = (smap[t.serviceName] || 0) + t.price; });

    const entries = Object.entries(smap).sort((a,b) => b[1]-a[1]);
    const colors = _chartColors();

    return {
      labels: entries.map(([n]) => n),
      data:   entries.map(([,v]) => v),
      colors: entries.map((_,i) => colors[i % colors.length])
    };
  }

  function _filteredTransactions() {
    let all = Store.getTransactions();
    if (currentBranch !== 'all') {
      all = all.filter(t => t.branch === currentBranch);
    }
    const today = Store.getTodayStr();

    if (currentFilter === 'daily') {
      return all.filter(t => t.date === today);
    } else if (currentFilter === 'monthly') {
      const start = today.substring(0,7) + '-01';
      return all.filter(t => t.date >= start && t.date <= today);
    } else {
      const start = today.substring(0,4) + '-01-01';
      return all.filter(t => t.date >= start && t.date <= today);
    }
  }

  /* ---------- Misc ---------- */
  function _gradient(canvas, color) {
    try {
      const ctx2d = (canvas.getContext ? canvas : canvas).getContext('2d');
      const g = ctx2d.createLinearGradient(0, 0, 0, 300);
      g.addColorStop(0, color + '33');
      g.addColorStop(1, color + '00');
      return g;
    } catch { return color + '22'; }
  }

  function _shortCurrency(v) {
    if (v >= 1_000_000) return 'Rp ' + (v / 1_000_000).toFixed(1) + 'jt';
    if (v >= 1_000) return 'Rp ' + (v / 1_000).toFixed(0) + 'rb';
    return 'Rp ' + v;
  }

  function _dateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  async function exportPDF() {
    const btn = document.getElementById('exportPdfBtn');
    const target = document.getElementById('dashboardExport');
    if (!target || typeof html2canvas === 'undefined' || !window.jspdf) {
      showToast('PDF export libraries not loaded', 'danger');
      return;
    }

    const originalLabel = btn?.textContent;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Exporting...';
    }

    try {
      const snapshot = await html2canvas(target, {
        backgroundColor: '#09090a',
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (doc) => {
          doc.querySelectorAll('canvas').forEach(canvas => {
            const chart = Chart.getChart(canvas);
            if (!chart) return;
            const img = doc.createElement('img');
            img.src = chart.toBase64Image('image/png', 1);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.display = 'block';
            canvas.replaceWith(img);
          });
        }
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (snapshot.height * contentWidth) / snapshot.width;
      const imgData = snapshot.toDataURL('image/png');

      pdf.setFontSize(14);
      pdf.text('Next Level Beauty Bar — Dashboard', margin, 14);
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text(_exportMetaLine(), margin, 20);
      pdf.setTextColor(0);

      let heightLeft = imgHeight;
      let y = 26;

      pdf.addImage(imgData, 'PNG', margin, y, contentWidth, imgHeight);
      heightLeft -= pageHeight - y;

      while (heightLeft > 0) {
        pdf.addPage();
        y = heightLeft - imgHeight + margin;
        pdf.addImage(imgData, 'PNG', margin, y, contentWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStamp = Store.getTodayStr();
      pdf.save(`next-level-dashboard-${dateStamp}.pdf`);
      showToast('Dashboard exported to PDF');
    } catch (err) {
      console.error(err);
      showToast('Failed to export PDF', 'danger');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    }
  }

  function _exportMetaLine() {
    const periodLabels = { daily: 'Daily', monthly: 'Monthly', yearly: 'Yearly' };
    const branchEl = document.getElementById('dashBranchFilter');
    const branch = branchEl?.selectedOptions?.[0]?.textContent || currentBranch;
    const period = periodLabels[currentFilter] || currentFilter;
    const chartType = currentChartType === 'bar' ? 'Bar' : 'Line';
    const generated = new Date().toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return `Generated ${generated} · Branch: ${branch} · Period: ${period} · Chart: ${chartType}`;
  }

  return { render, exportPDF };
})();
