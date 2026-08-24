/* ============================================================
   NEXT LEVEL BEAUTY BAR
   Dashboard
   ============================================================ */

const Dashboard = (() => {
  let revenueChart = null;
  let serviceChart = null;
  let barChart = null;

  let currentFilter = "monthly";
  let currentBranch = "all";
  let currentChartType = "line";
  let currentMetric = "revenue"; // "revenue" | "count"

  let initialized = false;

  const BRANCHES = ["Kemang", "LCC", "Bintaro", "Bandung"];

  async function render() {
    if (!initialized) {
      _setup();
      initialized = true;
    }

    await renderPromoBanner();
    await renderSummaryCards();
    await renderCharts();
  }

  function _setup() {
    // Timeframe filters (daily, monthly, yearly)
    document.querySelectorAll(".filter-btn[data-filter]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document
          .querySelectorAll(".filter-btn[data-filter]")
          .forEach((b) => b.classList.remove("active"));

        btn.classList.add("active");

        currentFilter = btn.dataset.filter;

        await renderCharts();
        await renderSummaryCards();
      });
    });

    // Chart type (line, bar)
    document.querySelectorAll(".chart-type-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document
          .querySelectorAll(".chart-type-btn")
          .forEach((b) => b.classList.remove("active"));

        btn.classList.add("active");

        currentChartType = btn.dataset.chartType;

        await renderCharts();
      });
    });

    // Metric dropdown filter (Revenue vs Transaction Count)
    const metricFilter = document.getElementById("dashMetricFilter");
    if (metricFilter) {
      metricFilter.addEventListener("change", async (e) => {
        currentMetric = e.target.value;

        await renderSummaryCards();
        await renderCharts();
      });
    }

    // Branch dropdown filter
    const branchFilter = document.getElementById("dashBranchFilter");
    if (branchFilter) {
      // Ensure Bandung is present
      if (![...branchFilter.options].some((o) => o.value === "Bandung")) {
        const option = document.createElement("option");
        option.value = "Bandung";
        option.textContent = "Bandung";
        branchFilter.appendChild(option);
      }

      branchFilter.addEventListener("change", async (e) => {
        currentBranch = e.target.value;

        await renderSummaryCards();
        await renderCharts();
      });
    }
  }

  /* ============================================================
     PROMOTIONS BANNER
     ============================================================ */

  async function renderPromoBanner() {
    const banner = document.getElementById("promoBanner");

    if (!banner) return;

    const active = await Store.getActivePromos();

    if (active.length === 0) {
      banner.innerHTML = "";
      banner.style.display = "none";
      return;
    }

    banner.innerHTML = active
      .map(
        (p) => `
          <div class="promo-badge-item">
            <span class="promo-badge-icon">
              🎉
            </span>

            <span>
              <strong>
                ${escapeHtml(p.name)}
              </strong>

              — ${p.discount}% Off

              ${p.description ? " · " + escapeHtml(p.description) : ""}
            </span>
          </div>
        `,
      )
      .join("");

    banner.style.display = "block";
  }

  /* ============================================================
     SUMMARY CARDS
     ============================================================ */

  async function renderSummaryCards() {
    let all = await Store.getTransactions();

    all = filterBranch(all);

    const today = Store.getTodayStr();
    const monthStart = today.substring(0, 7) + "-01";
    const yearStart = today.substring(0, 4) + "-01-01";

    const todayTxns = all.filter((t) => t.date === today);
    const monthTxns = all.filter(
      (t) => t.date >= monthStart && t.date <= today,
    );
    const yearTxns = all.filter((t) => t.date >= yearStart && t.date <= today);

    const sum = (arr) =>
      arr.reduce((total, t) => total + Number(t.price || 0), 0);

    const isRevenue = currentMetric === "revenue";

    if (isRevenue) {
      _setText("todayRevenue", Store.formatCurrency(sum(todayTxns)));
      _setText("todayCount", `${todayTxns.length} transactions`);

      _setText("monthRevenue", Store.formatCurrency(sum(monthTxns)));
      _setText("monthCount", `${monthTxns.length} transactions`);

      _setText("yearRevenue", Store.formatCurrency(sum(yearTxns)));
      _setText("yearCount", `${yearTxns.length} transactions`);
    } else {
      _setText("todayRevenue", `${todayTxns.length} Transactions`);
      _setText("todayCount", `Revenue: ${Store.formatCurrency(sum(todayTxns))}`);

      _setText("monthRevenue", `${monthTxns.length} Transactions`);
      _setText("monthCount", `Revenue: ${Store.formatCurrency(sum(monthTxns))}`);

      _setText("yearRevenue", `${yearTxns.length} Transactions`);
      _setText("yearCount", `Revenue: ${Store.formatCurrency(sum(yearTxns))}`);
    }

    _setText("totalTransactions", all.length);

    const services = await Store.getActiveServices();
    _setText("totalServices", `${services.length} active services`);
  }

  /* ============================================================
     CHARTS
     ============================================================ */

  async function renderCharts() {
    _updateChartTitles();
    await _renderRevenueChart();
    await _renderServiceChart();
    await _renderBarChart();
  }

  function _updateChartTitles() {
    const isRevenue = currentMetric === "revenue";

    const revTitle = document.getElementById("dashRevenueChartTitle");
    if (revTitle) {
      revTitle.textContent = isRevenue
        ? "📈 Revenue Trend"
        : "📈 Transaction Count Trend";
    }

    const svcTitle = document.getElementById("dashServiceChartTitle");
    if (svcTitle) {
      svcTitle.textContent = isRevenue
        ? "🍩 Revenue by Service"
        : "🍩 Transactions by Service";
    }

    const barTitle = document.getElementById("dashBarChartTitle");
    if (barTitle) {
      barTitle.textContent = isRevenue
        ? "📊 Service Comparison (Revenue)"
        : "📊 Service Comparison (Transactions)";
    }
  }

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

  async function _renderRevenueChart() {
    const canvas = document.getElementById("revenueChart");

    if (!canvas) return;

    const { labels, data } = await _getRevenueData();

    if (revenueChart) {
      revenueChart.destroy();
    }

    const isLine = currentChartType === "line";
    const isRevenue = currentMetric === "revenue";
    const datasetLabel = isRevenue ? "Revenue" : "Transactions";

    revenueChart = new Chart(canvas, {
      type: currentChartType,

      data: {
        labels,

        datasets: [
          {
            label: datasetLabel,
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

      options: _axisChartOptions(isRevenue),
    });
  }

  async function _renderServiceChart() {
    const canvas = document.getElementById("serviceChart");

    if (!canvas) return;

    const { labels, data, colors } = await _getServiceData();

    if (serviceChart) {
      serviceChart.destroy();
    }

    const isRevenue = currentMetric === "revenue";

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
              label: (c) =>
                isRevenue
                  ? `${c.label}: ${Store.formatCurrency(c.parsed)}`
                  : `${c.label}: ${c.parsed} transactions`,
            },
          },
        },
      },
    });
  }

  async function _renderBarChart() {
    const canvas = document.getElementById("barChart");

    if (!canvas) return;

    const { labels, data, colors } = await _getServiceData();

    if (barChart) {
      barChart.destroy();
    }

    const isLine = currentChartType === "line";
    const isRevenue = currentMetric === "revenue";
    const datasetLabel = isRevenue ? "Revenue" : "Transactions";

    barChart = new Chart(canvas, {
      type: currentChartType,

      data: {
        labels,

        datasets: [
          {
            label: datasetLabel,
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

      options: _axisChartOptions(isRevenue),
    });
  }

  function _axisChartOptions(isRevenue = true) {
    return {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          callbacks: {
            label: (c) =>
              isRevenue
                ? Store.formatCurrency(c.parsed.y)
                : `${c.parsed.y} transactions`,
          },
        },
      },

      scales: {
        y: {
          beginAtZero: true,

          ticks: {
            color: "#a1a1aa",
            callback: (v) =>
              isRevenue
                ? _shortCurrency(v)
                : Number.isInteger(v)
                  ? `${v}`
                  : null,
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
     DATA AGGREGATION
     ============================================================ */

  async function _getRevenueData() {
    let all = await Store.getTransactions();

    all = filterBranch(all);

    const today = new Date();
    const isRevenue = currentMetric === "revenue";

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

    if (currentFilter === "daily") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);

        const key = _dateStr(d);
        labels.push(`${d.getDate()} ${monthNames[d.getMonth()]}`);
        map[key] = 0;
      }

      all.forEach((t) => {
        if (map[t.date] !== undefined) {
          map[t.date] += isRevenue ? Number(t.price || 0) : 1;
        }
      });
    } else if (currentFilter === "monthly") {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);

        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0",
        )}`;

        labels.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
        map[key] = 0;
      }

      all.forEach((t) => {
        const key = String(t.date).substring(0, 7);

        if (map[key] !== undefined) {
          map[key] += isRevenue ? Number(t.price || 0) : 1;
        }
      });
    } else {
      for (let i = 4; i >= 0; i--) {
        const year = today.getFullYear() - i;
        labels.push(String(year));
        map[String(year)] = 0;
      }

      all.forEach((t) => {
        const key = String(t.date).substring(0, 4);

        if (map[key] !== undefined) {
          map[key] += isRevenue ? Number(t.price || 0) : 1;
        }
      });
    }

    return {
      labels,
      data: Object.values(map),
    };
  }

  async function _getServiceData() {
    let txns = await Store.getTransactions();

    txns = filterBranch(txns);

    const today = Store.getTodayStr();
    const isRevenue = currentMetric === "revenue";

    if (currentFilter === "daily") {
      txns = txns.filter((t) => t.date === today);
    }

    if (currentFilter === "monthly") {
      const start = today.substring(0, 7) + "-01";
      txns = txns.filter((t) => t.date >= start && t.date <= today);
    }

    if (currentFilter === "yearly") {
      const start = today.substring(0, 4) + "-01-01";
      txns = txns.filter((t) => t.date >= start && t.date <= today);
    }

    const map = {};

    txns.forEach((t) => {
      const name = t.serviceName || t.service_name || "Service";
      const value = isRevenue ? Number(t.price || 0) : 1;
      map[name] = (map[name] || 0) + value;
    });

    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const colors = _chartColors();

    return {
      labels: entries.map(([name]) => name),
      data: entries.map(([, value]) => value),
      colors: entries.map((_, i) => colors[i % colors.length]),
    };
  }

  function filterBranch(data) {
    if (currentBranch === "all") {
      return data;
    }

    return data.filter((t) => t.branch === currentBranch);
  }

  /* ============================================================
     HELPERS
     ============================================================ */

  function _setText(id, value) {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = value;
    }
  }

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

  function _shortCurrency(value) {
    value = Number(value || 0);

    if (value >= 1000000) {
      return "Rp " + (value / 1000000).toFixed(1) + "M";
    }

    if (value >= 1000) {
      return "Rp " + (value / 1000).toFixed(0) + "K";
    }

    return "Rp " + value;
  }

  function _dateStr(d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
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
