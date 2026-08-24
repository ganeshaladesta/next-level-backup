/* ============================================================
   Next Level Beauty Bar
   Dashboard View — Supabase / Online Version
   ============================================================ */

const Dashboard = (() => {
  let revenueChart = null;
  let serviceChart = null;
  let barChart = null;

  let currentFilter = "monthly";
  let currentBranch = "all";
  let currentChartType = "line";

  let _initialized = false;

  /* ============================================================
       RENDER
       ============================================================ */

  function render() {
    if (!_initialized) {
      _setup();
      _initialized = true;
    }

    renderPromoBanner();
    renderSummaryCards();
    renderCharts();
  }

  /* ============================================================
       SETUP
       ============================================================ */

  function _setup() {
    /* ---------- Period Filter ---------- */

    document.querySelectorAll(".filter-btn[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-btn[data-filter]")
          .forEach((b) => b.classList.remove("active"));

        btn.classList.add("active");

        currentFilter = btn.dataset.filter;

        renderSummaryCards();
        renderCharts();
      });
    });

    /* ---------- Chart Type ---------- */

    document.querySelectorAll(".chart-type-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".chart-type-btn")
          .forEach((b) => b.classList.remove("active"));

        btn.classList.add("active");

        currentChartType = btn.dataset.chartType;

        renderCharts();
      });
    });

    /* ---------- Branch ---------- */

    const branchFilter = document.getElementById("dashBranchFilter");

    if (branchFilter) {
      branchFilter.addEventListener("change", (e) => {
        currentBranch = e.target.value;

        renderSummaryCards();
        renderCharts();
      });
    }

    /* ---------- PDF ---------- */

    const exportBtn = document.getElementById("exportPdfBtn");

    if (exportBtn) {
      exportBtn.addEventListener("click", exportPDF);
    }
  }

  /* ============================================================
       PROMO BANNER
       ============================================================ */

  function renderPromoBanner() {
    const banner = document.getElementById("promoBanner");

    if (!banner) return;

    const active = Store.getActivePromos();

    if (active.length > 0) {
      banner.innerHTML = active
        .map(
          (p) => `
              <div class="promo-badge-item">
                <span class="promo-badge-icon">🎉</span>
  
                <span>
                  <strong>${_escapeHtml(p.name)}</strong>
                  — ${Number(p.discount) || 0}% Off
                  ${p.description ? " · " + _escapeHtml(p.description) : ""}
                </span>
              </div>
            `,
        )
        .join("");

      banner.style.display = "block";
    } else {
      banner.innerHTML = "";
      banner.style.display = "none";
    }
  }

  /* ============================================================
       SUMMARY CARDS
       ============================================================ */

  function renderSummaryCards() {
    const today = Store.getTodayStr();

    let all = Store.getTransactions();

    if (currentBranch !== "all") {
      all = all.filter((t) => t.branch === currentBranch);
    }

    /* ---------- Today ---------- */

    const todayTxns = all.filter((t) => t.date === today);

    /* ---------- Month ---------- */

    const monthStart = today.substring(0, 7) + "-01";

    const monthTxns = all.filter(
      (t) => t.date >= monthStart && t.date <= today,
    );

    /* ---------- Year ---------- */

    const yearStart = today.substring(0, 4) + "-01-01";

    const yearTxns = all.filter((t) => t.date >= yearStart && t.date <= today);

    /* ---------- Revenue ---------- */

    const sumRevenue = (arr) => {
      return arr.reduce((sum, t) => {
        return sum + _getRevenueValue(t);
      }, 0);
    };

    const todayRevenue = sumRevenue(todayTxns);
    const monthRevenue = sumRevenue(monthTxns);
    const yearRevenue = sumRevenue(yearTxns);

    /* ---------- Cards ---------- */

    _setText("todayRevenue", Store.formatCurrency(todayRevenue));

    _setText("todayCount", todayTxns.length + " Transaksi");

    _setText("monthRevenue", Store.formatCurrency(monthRevenue));

    _setText("monthCount", monthTxns.length + " Transaksi");

    _setText("yearRevenue", Store.formatCurrency(yearRevenue));

    _setText("yearCount", yearTxns.length + " Transaksi");

    _setText("totalTransactions", all.length);

    _setText(
      "totalServices",
      Store.getActiveServices().length + " Layanan Aktif",
    );
  }

  /* ============================================================
       REVENUE VALUE
       ============================================================ */

  /*
   * Revenue dashboard menggunakan nilai transaksi
   * setelah DP + promo.
   *
   * Contoh:
   *
   * Treatment       200.000
   * DP              100.000
   * Sisa            100.000
   * Diskon 50%       50.000
   * Sisa Bayar       50.000
   *
   * Total revenue treatment:
   *
   * 100.000 DP
   * + 50.000 sisa
   * = 150.000
   *
   * Prioritas:
   *
   * 1. finalTreatmentAmount
   * 2. hitung ulang dari price + dp + promo
   * 3. fallback price
   */

  function _getRevenueValue(t) {
    if (
      t.finalTreatmentAmount !== undefined &&
      t.finalTreatmentAmount !== null
    ) {
      return Number(t.finalTreatmentAmount) || 0;
    }

    if (t.price !== undefined && t.price !== null) {
      const price = Number(t.price) || 0;
      const dp = Math.min(Math.max(Number(t.dp) || 0, 0), price);

      const discount = Math.max(0, Math.min(Number(t.promoDiscount) || 0, 100));

      const remaining = price - dp;

      const discountAmount = Math.round(remaining * (discount / 100));

      const finalAmount = dp + Math.max(0, remaining - discountAmount);

      return finalAmount;
    }

    return 0;
  }

  /* ============================================================
       TEXT HELPER
       ============================================================ */

  function _setText(id, value) {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = value;
    }
  }

  /* ============================================================
       CHARTS
       ============================================================ */

  function renderCharts() {
    _renderRevenueChart();
    _renderServiceChart();
    _renderBarChart();
  }

  /* ============================================================
       CHART COLORS
       ============================================================ */

  function _chartColors() {
    return [
      "#e30022",
      "#ff1a3d",
      "#990017",
      "#b0b0b0",
      "#ffffff",
      "#808080",
      "#4d4d4d",
      "#ff4d66",
      "#cc001f",
      "#e60000",
      "#cccccc",
      "#333333",
    ];
  }

  /* ============================================================
       REVENUE CHART
       ============================================================ */

  function _renderRevenueChart() {
    const canvas = document.getElementById("revenueChart");

    if (!canvas) return;

    const { labels, data } = _getRevenueData();

    if (revenueChart) {
      revenueChart.destroy();
      revenueChart = null;
    }

    const isLine = currentChartType === "line";

    revenueChart = new Chart(canvas, {
      type: currentChartType,

      data: {
        labels,

        datasets: [
          {
            label: "Revenue",

            data,

            ...(isLine
              ? {
                  borderColor: "#e30022",

                  backgroundColor: _gradient(canvas, "#e30022"),

                  fill: true,

                  tension: 0.4,

                  pointBackgroundColor: "#e30022",

                  pointBorderColor: "#fff",

                  pointBorderWidth: 2,

                  pointRadius: 3,

                  pointHoverRadius: 6,
                }
              : {
                  backgroundColor: "#e30022",

                  borderRadius: 8,

                  borderSkipped: false,

                  maxBarThickness: 48,
                }),
          },
        ],
      },

      options: _axisChartOptions(),
    });
  }

  /* ============================================================
       SERVICE DOUGHNUT
       ============================================================ */

  function _renderServiceChart() {
    const canvas = document.getElementById("serviceChart");

    if (!canvas) return;

    const { labels, data, colors } = _getServiceData();

    if (serviceChart) {
      serviceChart.destroy();
      serviceChart = null;
    }

    serviceChart = new Chart(canvas, {
      type: "doughnut",

      data: {
        labels,

        datasets: [
          {
            data,

            backgroundColor: colors,

            borderWidth: 2,

            borderColor: "#121214",
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        cutout: "65%",

        plugins: {
          legend: {
            position: "bottom",

            labels: {
              color: "#f4f4f5",

              padding: 12,

              usePointStyle: true,

              pointStyle: "circle",

              font: {
                size: 11,
              },
            },
          },

          tooltip: {
            callbacks: {
              label: (c) => `${c.label}: ${Store.formatCurrency(c.parsed)}`,
            },
          },
        },
      },
    });
  }

  /* ============================================================
       SERVICE COMPARISON
       ============================================================ */

  function _renderBarChart() {
    const canvas = document.getElementById("barChart");

    if (!canvas) return;

    const { labels, data, colors } = _getServiceData();

    if (barChart) {
      barChart.destroy();
      barChart = null;
    }

    const isLine = currentChartType === "line";

    barChart = new Chart(canvas, {
      type: currentChartType,

      data: {
        labels,

        datasets: [
          {
            label: "Revenue",

            data,

            ...(isLine
              ? {
                  borderColor: "#e30022",

                  backgroundColor: _gradient(canvas, "#e30022"),

                  fill: true,

                  tension: 0.4,

                  pointBackgroundColor: colors,

                  pointBorderColor: "#fff",

                  pointBorderWidth: 2,

                  pointRadius: 5,

                  pointHoverRadius: 7,
                }
              : {
                  backgroundColor: colors,

                  borderRadius: 8,

                  borderSkipped: false,

                  maxBarThickness: 48,
                }),
          },
        ],
      },

      options: _axisChartOptions(),
    });
  }

  /* ============================================================
       AXIS OPTIONS
       ============================================================ */

  function _axisChartOptions() {
    return {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          callbacks: {
            label: (c) => {
              const value = c.parsed.y !== undefined ? c.parsed.y : c.parsed;

              return Store.formatCurrency(value);
            },
          },
        },
      },

      scales: {
        y: {
          beginAtZero: true,

          ticks: {
            color: "#a1a1aa",

            callback: (v) => _shortCurrency(v),
          },

          grid: {
            color: "rgba(255,255,255,0.05)",
          },
        },

        x: {
          ticks: {
            color: "#a1a1aa",
          },

          grid: {
            display: false,
          },
        },
      },
    };
  }

  /* ============================================================
       REVENUE DATA
       ============================================================ */

  function _getRevenueData() {
    let all = Store.getTransactions();

    if (currentBranch !== "all") {
      all = all.filter((t) => t.branch === currentBranch);
    }

    const today = new Date();

    const labels = [];

    const map = {};

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    /* ---------- DAILY ---------- */

    if (currentFilter === "daily") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);

        d.setDate(d.getDate() - i);

        const key = _dateStr(d);

        labels.push(`${d.getDate()}/${d.getMonth() + 1}`);

        map[key] = 0;
      }

      all.forEach((t) => {
        if (map[t.date] !== undefined) {
          map[t.date] += _getRevenueValue(t);
        }
      });
    } else if (currentFilter === "monthly") {

    /* ---------- MONTHLY ---------- */
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);

        const key =
          `${d.getFullYear()}-` +
          `${String(d.getMonth() + 1).padStart(2, "0")}`;

        labels.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);

        map[key] = 0;
      }

      all.forEach((t) => {
        const key = t.date?.substring(0, 7);

        if (map[key] !== undefined) {
          map[key] += _getRevenueValue(t);
        }
      });
    } else {

    /* ---------- YEARLY ---------- */
      for (let i = 4; i >= 0; i--) {
        const year = today.getFullYear() - i;

        const key = String(year);

        labels.push(key);

        map[key] = 0;
      }

      all.forEach((t) => {
        const key = t.date?.substring(0, 4);

        if (map[key] !== undefined) {
          map[key] += _getRevenueValue(t);
        }
      });
    }

    return {
      labels,
      data: Object.values(map),
    };
  }

  /* ============================================================
       SERVICE DATA
       ============================================================ */

  function _getServiceData() {
    const txns = _filteredTransactions();

    const serviceMap = {};

    txns.forEach((t) => {
      const serviceName = t.serviceName || "Unknown";

      if (!serviceMap[serviceName]) {
        serviceMap[serviceName] = 0;
      }

      serviceMap[serviceName] += _getRevenueValue(t);
    });

    const entries = Object.entries(serviceMap).sort((a, b) => b[1] - a[1]);

    const colors = _chartColors();

    return {
      labels: entries.map(([name]) => name),

      data: entries.map(([, value]) => value),

      colors: entries.map((_, index) => colors[index % colors.length]),
    };
  }

  /* ============================================================
       FILTERED TRANSACTIONS
       ============================================================ */

  function _filteredTransactions() {
    let all = Store.getTransactions();

    if (currentBranch !== "all") {
      all = all.filter((t) => t.branch === currentBranch);
    }

    const today = Store.getTodayStr();

    /* ---------- DAILY ---------- */

    if (currentFilter === "daily") {
      return all.filter((t) => t.date === today);
    }

    /* ---------- MONTHLY ---------- */

    if (currentFilter === "monthly") {
      const start = today.substring(0, 7) + "-01";

      return all.filter((t) => t.date >= start && t.date <= today);
    }

    /* ---------- YEARLY ---------- */

    const start = today.substring(0, 4) + "-01-01";

    return all.filter((t) => t.date >= start && t.date <= today);
  }

  /* ============================================================
       GRADIENT
       ============================================================ */

  function _gradient(canvas, color) {
    try {
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, 0, 300);

      gradient.addColorStop(0, color + "33");

      gradient.addColorStop(1, color + "00");

      return gradient;
    } catch {
      return color + "22";
    }
  }

  /* ============================================================
       SHORT CURRENCY
       ============================================================ */

  function _shortCurrency(v) {
    if (v >= 1_000_000) {
      return "Rp " + (v / 1_000_000).toFixed(1) + "M";
    }

    if (v >= 1_000) {
      return "Rp " + (v / 1_000).toFixed(0) + "K";
    }

    return "Rp " + v;
  }

  /* ============================================================
       DATE STRING
       ============================================================ */

  function _dateStr(d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  /* ============================================================
       PDF EXPORT
       ============================================================ */

  async function exportPDF() {
    const btn = document.getElementById("exportPdfBtn");

    const target = document.getElementById("dashboardExport");

    if (!target || typeof html2canvas === "undefined" || !window.jspdf) {
      showToast("PDF export libraries not loaded", "danger");

      return;
    }

    const originalLabel = btn?.textContent;

    if (btn) {
      btn.disabled = true;

      btn.textContent = "Exporting...";
    }

    try {
      const snapshot = await html2canvas(target, {
        backgroundColor: "#09090a",

        scale: 2,

        useCORS: true,

        logging: false,

        onclone: (doc) => {
          doc.querySelectorAll("canvas").forEach((canvas) => {
            const chart = Chart.getChart(canvas);

            if (!chart) return;

            const img = doc.createElement("img");

            img.src = chart.toBase64Image("image/png", 1);

            img.style.width = "100%";

            img.style.height = "100%";

            img.style.display = "block";

            canvas.replaceWith(img);
          });
        },
      });

      const { jsPDF } = window.jspdf;

      const pdf = new jsPDF("p", "mm", "a4");

      const margin = 10;

      const pageWidth = pdf.internal.pageSize.getWidth();

      const pageHeight = pdf.internal.pageSize.getHeight();

      const contentWidth = pageWidth - margin * 2;

      const imgHeight = (snapshot.height * contentWidth) / snapshot.width;

      const imgData = snapshot.toDataURL("image/png");

      pdf.setFontSize(14);

      pdf.text("Next Level Beauty Bar — Dashboard", margin, 14);

      pdf.setFontSize(9);

      pdf.setTextColor(120);

      pdf.text(_exportMetaLine(), margin, 20);

      pdf.setTextColor(0);

      let heightLeft = imgHeight;

      let y = 26;

      pdf.addImage(imgData, "PNG", margin, y, contentWidth, imgHeight);

      heightLeft -= pageHeight - y;

      while (heightLeft > 0) {
        pdf.addPage();

        y = heightLeft - imgHeight + margin;

        pdf.addImage(imgData, "PNG", margin, y, contentWidth, imgHeight);

        heightLeft -= pageHeight;
      }

      const dateStamp = Store.getTodayStr();

      pdf.save(`next-level-dashboard-${dateStamp}.pdf`);

      showToast("Dashboard exported to PDF");
    } catch (err) {
      console.error(err);

      showToast("Failed to export PDF", "danger");
    } finally {
      if (btn) {
        btn.disabled = false;

        btn.textContent = originalLabel;
      }
    }
  }

  /* ============================================================
       PDF META
       ============================================================ */

  function _exportMetaLine() {
    const periodLabels = {
      daily: "Daily",
      monthly: "Monthly",
      yearly: "Yearly",
    };

    const branchEl = document.getElementById("dashBranchFilter");

    const branch = branchEl?.selectedOptions?.[0]?.textContent || currentBranch;

    const period = periodLabels[currentFilter] || currentFilter;

    const chartType = currentChartType === "bar" ? "Bar" : "Line";

    const generated = new Date().toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      `Generated ${generated}` +
      ` · Branch: ${branch}` +
      ` · Period: ${period}` +
      ` · Chart: ${chartType}`
    );
  }

  /* ============================================================
       HTML ESCAPE
       ============================================================ */

  function _escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ============================================================
       PUBLIC API
       ============================================================ */

  return {
    render,
    exportPDF,
  };
})();
