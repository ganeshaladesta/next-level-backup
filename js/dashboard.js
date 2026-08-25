/* ============================================================
   NEXT LEVEL BEAUTY BAR
   MANAGEMENT DASHBOARD
   ============================================================ */

const Dashboard = (() => {
  let revenueChart = null;
  let serviceChart = null;
  let barChart = null;

  let currentFilter = "monthly";
  let currentBranch = "all";
  let currentChartType = "line";
  let currentMetric = "revenue";
  let currentCompare = "none";

  let selectedStartDate = "";
  let selectedEndDate = "";

  let initialized = false;

  const BRANCHES = [
    "Kemang",
    "LCC",
    "Bintaro",
    "Bandung",
  ];

  const COLORS = [
    "#e30022",
    "#ff1a3d",
    "#990017",
    "#60a5fa",
    "#4ade80",
    "#facc15",
    "#a78bfa",
    "#22d3ee",
    "#fb7185",
    "#c084fc",
    "#94a3b8",
    "#ffffff",
  ];

  /* ==========================================================
     PUBLIC
     ========================================================== */

  async function render() {
    try {
      if (!initialized) {
        setup();
        initialized = true;
      }

      normalizeInitialDates();

      await renderPromoBanner();
      await renderDashboard();
    } catch (error) {
      console.error(
        "Dashboard render error:",
        error,
      );
    }
  }

  async function refresh() {
    await renderDashboard();
  }

  /* ==========================================================
     SETUP
     ========================================================== */

  function setup() {
    setupQuickFilters();
    setupChartType();
    setupMetric();
    setupBranch();
    setupCompare();
    setupDatePicker();
  }

  /* ==========================================================
     QUICK FILTER
     ========================================================== */

  function setupQuickFilters() {
    document
      .querySelectorAll(
        ".filter-btn[data-filter]",
      )
      .forEach((btn) => {
        btn.addEventListener(
          "click",
          async () => {
            document
              .querySelectorAll(
                ".filter-btn[data-filter]",
              )
              .forEach((item) => {
                item.classList.remove(
                  "active",
                );
              });

            btn.classList.add("active");

            currentFilter =
              btn.dataset.filter;

            clearCustomDateRange();

            await renderDashboard();
          },
        );
      });
  }

  /* ==========================================================
     CHART TYPE
     ========================================================== */

  function setupChartType() {
    document
      .querySelectorAll(
        ".chart-type-btn",
      )
      .forEach((btn) => {
        btn.addEventListener(
          "click",
          async () => {
            document
              .querySelectorAll(
                ".chart-type-btn",
              )
              .forEach((item) => {
                item.classList.remove(
                  "active",
                );
              });

            btn.classList.add("active");

            currentChartType =
              btn.dataset.chartType;

            await renderCharts();
          },
        );
      });
  }

  /* ==========================================================
     METRIC
     ========================================================== */

  function setupMetric() {
    const el =
      document.getElementById(
        "dashMetricFilter",
      );

    if (!el) return;

    el.addEventListener(
      "change",
      async (event) => {
        currentMetric =
          event.target.value;

        await renderDashboard();
      },
    );
  }

  /* ==========================================================
     BRANCH
     ========================================================== */

  function setupBranch() {
    const el =
      document.getElementById(
        "dashBranchFilter",
      );

    if (!el) return;

    el.value = "all";

    BRANCHES.forEach((branch) => {
      if (
        !Array.from(el.options).some(
          (option) =>
            option.value === branch,
        )
      ) {
        const option =
          document.createElement(
            "option",
          );

        option.value = branch;
        option.textContent = branch;

        el.appendChild(option);
      }
    });

    el.addEventListener(
      "change",
      async (event) => {
        currentBranch =
          event.target.value;

        await renderDashboard();
      },
    );
  }

  /* ==========================================================
     COMPARE
     ========================================================== */

  function setupCompare() {
    const el =
      document.getElementById(
        "dashCompareFilter",
      );

    if (!el) return;

    el.addEventListener(
      "change",
      async (event) => {
        currentCompare =
          event.target.value;

        await renderDashboard();
      },
    );
  }

  /* ==========================================================
     DATE PICKER
     ========================================================== */

  function setupDatePicker() {
    const start =
      document.getElementById(
        "dashDateStart",
      );

    const end =
      document.getElementById(
        "dashDateEnd",
      );

    const apply =
      document.getElementById(
        "dashDateApply",
      );

    const clear =
      document.getElementById(
        "dashDateClear",
      );

    if (!start || !end) {
      return;
    }

    start.addEventListener(
      "change",
      () => {
        if (start.value) {
          end.min = start.value;
        }

        clearDateError();
      },
    );

    end.addEventListener(
      "change",
      () => {
        clearDateError();

        if (
          start.value &&
          end.value &&
          end.value < start.value
        ) {
          showDateError(
            "End date cannot be earlier than start date.",
          );
        }
      },
    );

    if (apply) {
      apply.addEventListener(
        "click",
        async () => {
          const startValue =
            start.value;

          const endValue =
            end.value;

          if (!startValue || !endValue) {
            showDateError(
              "Please select both dates.",
            );

            return;
          }

          if (endValue < startValue) {
            showDateError(
              "End date cannot be earlier than start date.",
            );

            return;
          }

          selectedStartDate =
            startValue;

          selectedEndDate =
            endValue;

          setQuickFilterActive(
            null,
          );

          await renderDashboard();
        },
      );
    }

    if (clear) {
      clear.addEventListener(
        "click",
        async () => {
          clearCustomDateRange();

          const activeButton =
            document.querySelector(
              `.filter-btn[data-filter="${currentFilter}"]`,
            );

          if (activeButton) {
            setQuickFilterActive(
              currentFilter,
            );
          } else {
            setQuickFilterActive(
              "monthly",
            );
          }

          await renderDashboard();
        },
      );
    }
  }

  /* ==========================================================
     INITIAL DATE
     ========================================================== */

  function normalizeInitialDates() {
    const today =
      Store.getTodayStr();

    const start =
      document.getElementById(
        "dashDateStart",
      );

    const end =
      document.getElementById(
        "dashDateEnd",
      );

    if (!start || !end) {
      return;
    }

    if (
      !start.value &&
      !end.value
    ) {
      start.value = "";
      end.value = "";
    }

    updateFilterStatus();
  }

  /* ==========================================================
     DATE RANGE STATE
     ========================================================== */

  function hasCustomDateRange() {
    return Boolean(
      selectedStartDate &&
      selectedEndDate,
    );
  }

  function clearCustomDateRange() {
    selectedStartDate = "";
    selectedEndDate = "";

    const start =
      document.getElementById(
        "dashDateStart",
      );

    const end =
      document.getElementById(
        "dashDateEnd",
      );

    if (start) {
      start.value = "";
    }

    if (end) {
      end.value = "";
      end.removeAttribute("min");
    }

    clearDateError();
  }

  function setQuickFilterActive(
    filter,
  ) {
    document
      .querySelectorAll(
        ".filter-btn[data-filter]",
      )
      .forEach((btn) => {
        btn.classList.toggle(
          "active",
          btn.dataset.filter ===
          filter,
        );
      });
  }

  function showDateError(
    message,
  ) {
    const el =
      document.getElementById(
        "dashDateError",
      );

    if (el) {
      el.textContent = message;
    }
  }

  function clearDateError() {
    const el =
      document.getElementById(
        "dashDateError",
      );

    if (el) {
      el.textContent = "";
    }
  }

  /* ==========================================================
     DASHBOARD RENDER
     ========================================================== */

  async function renderDashboard() {
    updateFilterStatus();

    await renderSummaryCards();
    await renderCharts();
    await renderPromoPerformance();
    await renderManagerInsights();
  }

  /* ==========================================================
     FILTER STATUS
     ========================================================== */

  function updateFilterStatus() {
    const status =
      document.getElementById(
        "dashboardFilterStatus",
      );

    const label =
      document.getElementById(
        "dashPeriodLabel",
      );

    if (hasCustomDateRange()) {
      const text =
        `${formatDateLabel(
          selectedStartDate,
        )} → ${formatDateLabel(
          selectedEndDate,
        )}`;

      setText(
        "dashboardFilterStatus",
        text,
      );

      setText(
        "dashPeriodLabel",
        text,
      );

      return;
    }

    const labelText =
      getPeriodLabel();

    setText(
      "dashboardFilterStatus",
      labelText,
    );

    setText(
      "dashPeriodLabel",
      labelText,
    );
  }

  /* ==========================================================
     PROMO BANNER
     ========================================================== */

  async function renderPromoBanner() {
    const banner =
      document.getElementById(
        "promoBanner",
      );

    if (!banner) return;

    try {
      const active =
        await Store.getActivePromos();

      if (
        !active ||
        active.length === 0
      ) {
        banner.innerHTML = "";
        banner.style.display =
          "none";

        return;
      }

      banner.innerHTML =
        active
          .map(
            (promo) => `
              <div class="promo-badge-item">
                <span class="promo-badge-icon">
                  🎉
                </span>

                <span>
                  <strong>
                    ${escapeHtml(
              promo.name,
            )}
                  </strong>
                  — ${Number(
              promo.discount || 0,
            )}% Off
                  ${promo.description
                ? ` · ${escapeHtml(
                  promo.description,
                )}`
                : ""
              }
                </span>
              </div>
            `,
          )
          .join("");

      banner.style.display =
        "flex";
    } catch (error) {
      console.error(
        "Promo banner error:",
        error,
      );
    }
  }

  /* ==========================================================
     KPI
     ========================================================== */

  async function renderSummaryCards() {
    let all =
      await getTransactions();

    const today =
      Store.getTodayStr();

    const todayData =
      all.filter(
        (t) =>
          t.date === today,
      );

    const weekRange =
      getCurrentBucketRange(
        today,
      );

    const weekData =
      filterByRange(
        all,
        weekRange,
      );

    const monthStart =
      `${today.substring(
        0,
        7,
      )}-01`;

    const monthData =
      all.filter(
        (t) =>
          t.date >=
          monthStart &&
          t.date <= today,
      );

    const yearStart =
      `${today.substring(
        0,
        4,
      )}-01-01`;

    const yearData =
      all.filter(
        (t) =>
          t.date >=
          yearStart &&
          t.date <= today,
      );

    renderPeriodKPI(
      "today",
      todayData,
    );

    renderPeriodKPI(
      "week",
      weekData,
    );

    renderPeriodKPI(
      "month",
      monthData,
    );

    renderPeriodKPI(
      "year",
      yearData,
    );

    const selected =
      getSelectedPeriodTransactions(
        all,
      );

    const compare =
      getComparisonTransactions(
        all,
      );

    const selectedRevenue =
      sumRevenue(selected);

    const compareRevenue =
      sumRevenue(compare);

    const selectedCount =
      selected.length;

    const avgTicket =
      selectedCount > 0
        ? selectedRevenue /
        selectedCount
        : 0;

    const discount =
      sumDiscount(selected);

    const growth =
      calculateGrowth(
        selectedRevenue,
        compareRevenue,
      );

    setText(
      "dashTotalRevenue",
      formatMetricValue(
        selectedRevenue,
      ),
    );

    setText(
      "dashTotalTransactions",
      selectedCount.toLocaleString(
        "id-ID",
      ),
    );

    setText(
      "dashAverageTicket",
      Store.formatCurrency(
        avgTicket,
      ),
    );

    setText(
      "dashTotalDiscount",
      Store.formatCurrency(
        discount,
      ),
    );

    setGrowthElement(
      "dashGrowth",
      growth,
    );

    setText(
      "dashCompareLabel",
      getComparisonLabel(),
    );
  }

  /* ==========================================================
     KPI CARD
     ========================================================== */

  function renderPeriodKPI(
    prefix,
    transactions,
  ) {
    const revenue =
      sumRevenue(
        transactions,
      );

    const count =
      transactions.length;

    const compare =
      getKpiComparisonData(
        prefix,
      );

    const compareRevenue =
      sumRevenue(compare);

    const growth =
      calculateGrowth(
        revenue,
        compareRevenue,
      );

    if (
      currentMetric ===
      "revenue"
    ) {
      setText(
        `${prefix}Revenue`,
        Store.formatCurrency(
          revenue,
        ),
      );

      setText(
        `${prefix}Count`,
        `${count} transactions`,
      );
    } else {
      setText(
        `${prefix}Revenue`,
        `${count} Transactions`,
      );

      setText(
        `${prefix}Count`,
        `Revenue: ${Store.formatCurrency(
          revenue,
        )}`,
      );
    }

    setGrowthElement(
      `${prefix}Change`,
      growth,
    );
  }

  /* ==========================================================
     KPI COMPARISON
     ========================================================== */

  function getKpiComparisonData(
    prefix,
  ) {
    const today =
      Store.getTodayStr();

    let start = "";
    let end = "";

    if (prefix === "today") {
      start = today;
      end = today;
    } else if (
      prefix === "week"
    ) {
      const range =
        getCurrentBucketRange(
          today,
        );

      start =
        range.start;

      end =
        range.end;
    } else if (
      prefix === "month"
    ) {
      start =
        `${today.substring(
          0,
          7,
        )}-01`;

      end = today;
    } else {
      start =
        `${today.substring(
          0,
          4,
        )}-01-01`;

      end = today;
    }

    const transactions =
      getAllTransactionsSync();

    const current =
      filterByRange(
        transactions,
        {
          start,
          end,
        },
      );

    const currentPeriodStart =
      parseDate(start);

    const currentPeriodEnd =
      parseDate(end);

    let compareRange;

    if (
      prefix === "today"
    ) {
      const d =
        new Date(
          currentPeriodStart,
        );

      d.setDate(
        d.getDate() - 1,
      );

      compareRange = {
        start:
          dateString(d),
        end:
          dateString(d),
      };
    } else {
      compareRange =
        getPreviousPeriodRange(
          start,
          end,
        );
    }

    return filterByRange(
      transactions,
      compareRange,
    );
  }

  /* ==========================================================
     CHARTS
     ========================================================== */

  async function renderCharts() {
    updateChartTitles();

    await renderTrendChart();
    await renderServiceChart();
    await renderServiceComparison();
  }

  /* ==========================================================
     TREND CHART
     ========================================================== */

  async function renderTrendChart() {
    const canvas =
      document.getElementById(
        "revenueChart",
      );

    if (!canvas) return;

    const selected =
      await getSelectedPeriodTransactionsAsync();

    const compare =
      await getComparisonTransactionsAsync();

    const selectedRange =
      getSelectedRange();

    const compareRange =
      getComparisonRange();

    const selectedBuckets =
      buildBuckets(
        selectedRange.start,
        selectedRange.end,
        selected,
      );

    let compareBuckets = [];

    if (
      currentCompare !==
      "none" &&
      compareRange
    ) {
      compareBuckets =
        buildBuckets(
          compareRange.start,
          compareRange.end,
          compare,
        );
    }

    const labels =
      selectedBuckets.map(
        (bucket) =>
          bucket.label,
      );

    const selectedData =
      selectedBuckets.map(
        (bucket) =>
          bucket.value,
      );

    const datasets = [];

    const selectedColor =
      "#e30022";

    datasets.push({
      label:
        getPeriodLabel(),
      data:
        selectedData,
      borderColor:
        selectedColor,
      backgroundColor:
        makeGradient(
          canvas,
          selectedColor,
        ),
      borderWidth:
        2.5,
      tension:
        0.35,
      fill:
        true,
      spanGaps:
        false,
      pointRadius:
        getPointRadius(
          selectedData,
          3,
        ),
      pointHoverRadius:
        6,
      pointBackgroundColor:
        selectedColor,
      pointBorderColor:
        "#ffffff",
      pointBorderWidth:
        2,
    });

    if (
      currentCompare !==
      "none" &&
      compareBuckets.length
    ) {
      const compareData =
        alignComparisonData(
          selectedBuckets,
          compareBuckets,
        );

      datasets.push({
        label:
          getComparisonLabel(),
        data:
          compareData,
        borderColor:
          "#60a5fa",
        backgroundColor:
          "rgba(96,165,250,0.05)",
        borderWidth:
          2,
        tension:
          0.35,
        fill:
          false,
        spanGaps:
          false,
        pointRadius:
          getPointRadius(
            compareData,
            2,
          ),
        pointHoverRadius:
          5,
        pointBackgroundColor:
          "#60a5fa",
        pointBorderColor:
          "#ffffff",
        pointBorderWidth:
          1.5,
        borderDash:
          [6, 5],
      });
    }

    destroyChart(
      "revenue",
    );

    revenueChart =
      new Chart(
        canvas,
        {
          type:
            currentChartType,

          data: {
            labels,
            datasets:
              currentChartType ===
                "bar"
                ? convertTrendToBarDatasets(
                  datasets,
                )
                : datasets,
          },

          options:
            getTrendChartOptions(),
        },
      );

    renderTrendLegend(
      datasets,
    );
  }

  /* ==========================================================
     BAR DATASET CONVERSION
     ========================================================== */

  function convertTrendToBarDatasets(
    datasets,
  ) {
    return datasets.map(
      (dataset, index) => ({
        label:
          dataset.label,

        data:
          dataset.data,

        backgroundColor:
          index === 0
            ? "rgba(227,0,34,0.82)"
            : "rgba(96,165,250,0.72)",

        borderColor:
          index === 0
            ? "#e30022"
            : "#60a5fa",

        borderWidth:
          1,

        borderRadius:
          6,

        borderSkipped:
          false,

        maxBarThickness:
          currentCompare !==
            "none"
            ? 34
            : 48,
      }),
    );
  }

  /* ==========================================================
     SERVICE DONUT
     ========================================================== */

  async function renderServiceChart() {
    const canvas =
      document.getElementById(
        "serviceChart",
      );

    if (!canvas) return;

    const selected =
      await getSelectedPeriodTransactionsAsync();

    const map = {};

    selected.forEach(
      (transaction) => {
        const service =
          transaction.serviceName ||
          "Unknown Service";

        map[service] =
          (map[service] || 0) +
          getMetricValue(
            transaction,
          );
      },
    );

    const entries =
      Object.entries(map)
        .sort(
          (a, b) =>
            b[1] - a[1],
        )
        .slice(0, 10);

    const labels =
      entries.map(
        (item) =>
          item[0],
      );

    const data =
      entries.map(
        (item) =>
          item[1],
      );

    const colors =
      labels.map(
        (_, index) =>
          COLORS[
          index %
          COLORS.length
          ],
      );

    destroyChart(
      "service",
    );

    serviceChart =
      new Chart(
        canvas,
        {
          type:
            "doughnut",

          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor:
                  colors,
                borderColor:
                  "#121214",
                borderWidth:
                  3,
              },
            ],
          },

          options: {
            responsive:
              true,

            maintainAspectRatio:
              false,

            cutout:
              "66%",

            plugins: {
              legend: {
                position:
                  "bottom",

                labels: {
                  color:
                    "#f4f4f5",

                  padding:
                    12,

                  usePointStyle:
                    true,

                  pointStyle:
                    "circle",

                  font: {
                    size:
                      10,
                  },
                },
              },

              tooltip: {
                callbacks: {
                  label:
                    (context) => {
                      const value =
                        context.parsed;

                      const total =
                        data.reduce(
                          (
                            sum,
                            item,
                          ) =>
                            sum +
                            item,
                          0,
                        );

                      const percentage =
                        total
                          ? (
                            (value /
                              total) *
                            100
                          ).toFixed(
                            1,
                          )
                          : "0.0";

                      return currentMetric ===
                        "revenue"
                        ? `${context.label}: ${Store.formatCurrency(
                          value,
                        )} (${percentage}%)`
                        : `${context.label}: ${value} transactions (${percentage}%)`;
                    },
                },
              },
            },
          },
        },
      );
  }

  /* ==========================================================
     SERVICE COMPARISON
     ========================================================== */

  async function renderServiceComparison() {
    const canvas =
      document.getElementById(
        "barChart",
      );

    if (!canvas) return;

    const selected =
      await getSelectedPeriodTransactionsAsync();

    const compare =
      await getComparisonTransactionsAsync();

    const selectedMap =
      groupByService(
        selected,
      );

    const compareMap =
      groupByService(
        compare,
      );

    const allServices =
      Array.from(
        new Set([
          ...Object.keys(
            selectedMap,
          ),
          ...Object.keys(
            compareMap,
          ),
        ]),
      )
        .sort(
          (a, b) =>
            (
              selectedMap[b] ||
              0
            ) -
            (
              selectedMap[a] ||
              0
            ),
        )
        .slice(0, 10);

    const selectedData =
      allServices.map(
        (service) =>
          selectedMap[
          service
          ] || 0,
      );

    const compareData =
      allServices.map(
        (service) =>
          compareMap[
          service
          ] || 0,
      );

    const datasets = [
      {
        label:
          getPeriodLabel(),

        data:
          selectedData,

        backgroundColor:
          "rgba(227,0,34,0.82)",

        borderColor:
          "#e30022",

        borderWidth:
          1,

        borderRadius:
          6,

        borderSkipped:
          false,

        maxBarThickness:
          38,
      },
    ];

    if (
      currentCompare !==
      "none"
    ) {
      datasets.push({
        label:
          getComparisonLabel(),

        data:
          compareData,

        backgroundColor:
          "rgba(96,165,250,0.68)",

        borderColor:
          "#60a5fa",

        borderWidth:
          1,

        borderRadius:
          6,

        borderSkipped:
          false,

        maxBarThickness:
          38,
      });
    }

    destroyChart(
      "bar",
    );

    barChart =
      new Chart(
        canvas,
        {
          type:
            "bar",

          data: {
            labels:
              allServices,

            datasets,
          },

          options:
            getServiceBarOptions(),
        },
      );
  }

  /* ==========================================================
     CHART OPTIONS
     ========================================================== */

  function getTrendChartOptions() {
    const isRevenue =
      currentMetric ===
      "revenue";

    return {
      responsive:
        true,

      maintainAspectRatio:
        false,

      interaction: {
        intersect:
          false,

        mode:
          "index",
      },

      plugins: {
        legend: {
          display:
            false,
        },

        tooltip: {
          backgroundColor:
            "#18181b",

          borderColor:
            "#27272a",

          borderWidth:
            1,

          titleColor:
            "#fff",

          bodyColor:
            "#d4d4d8",

          padding:
            10,

          callbacks: {
            label:
              (context) => {
                const value =
                  context.parsed.y;

                if (
                  value ===
                  null ||
                  value ===
                  undefined
                ) {
                  return "";
                }

                return isRevenue
                  ? `${context.dataset.label}: ${Store.formatCurrency(
                    value,
                  )}`
                  : `${context.dataset.label}: ${value} transactions`;
              },
          },
        },
      },

      scales: {
        y: {
          beginAtZero:
            true,

          ticks: {
            color:
              "#a1a1aa",

            font: {
              size:
                10,
            },

            callback:
              (value) =>
                isRevenue
                  ? shortCurrency(
                    value,
                  )
                  : value,
          },

          grid: {
            color:
              "rgba(255,255,255,0.045)",
          },
        },

        x: {
          ticks: {
            color:
              "#a1a1aa",

            maxRotation:
              0,

            minRotation:
              0,

            autoSkip:
              true,

            maxTicksLimit:
              getXAxisTickLimit(),
          },

          grid: {
            display:
              false,
          },
        },
      },
    };
  }

  function getServiceBarOptions() {
    const isRevenue =
      currentMetric ===
      "revenue";

    return {
      responsive:
        true,

      maintainAspectRatio:
        false,

      interaction: {
        intersect:
          false,

        mode:
          "index",
      },

      plugins: {
        legend: {
          display:
            currentCompare !==
            "none",

          labels: {
            color:
              "#a1a1aa",

            usePointStyle:
              true,

            pointStyle:
              "circle",

            font: {
              size:
                10,
            },
          },
        },

        tooltip: {
          backgroundColor:
            "#18181b",

          callbacks: {
            label:
              (context) =>
                isRevenue
                  ? `${context.dataset.label}: ${Store.formatCurrency(
                    context.parsed.y,
                  )}`
                  : `${context.dataset.label}: ${context.parsed.y} transactions`,
          },
        },
      },

      scales: {
        y: {
          beginAtZero:
            true,

          ticks: {
            color:
              "#a1a1aa",

            font: {
              size:
                10,
            },

            callback:
              (value) =>
                isRevenue
                  ? shortCurrency(
                    value,
                  )
                  : value,
          },

          grid: {
            color:
              "rgba(255,255,255,0.045)",
          },
        },

        x: {
          ticks: {
            color:
              "#a1a1aa",

            font: {
              size:
                9,
            },

            maxRotation:
              35,

            minRotation:
              0,
          },

          grid: {
            display:
              false,
          },
        },
      },
    };
  }

  function getXAxisTickLimit() {
    const range =
      getSelectedRange();

    const days =
      diffDays(
        range.start,
        range.end,
      );

    if (days <= 14) {
      return days;
    }

    if (days <= 31) {
      return 10;
    }

    if (days <= 100) {
      return 12;
    }

    return 14;
  }

  /* ==========================================================
     TREND DATA
     ========================================================== */

  function buildBuckets(
    start,
    end,
    transactions,
  ) {
    const days =
      diffDays(
        start,
        end,
      );

    let mode =
      "daily";

    if (days > 31 && days <= 180) {
      mode =
        "weekly";
    } else if (days > 180) {
      mode =
        "monthly";
    }

    if (days <= 31) {
      return buildDailyBuckets(
        start,
        end,
        transactions,
      );
    }

    if (mode === "weekly") {
      return buildWeeklyBuckets(
        start,
        end,
        transactions,
      );
    }

    return buildMonthlyBuckets(
      start,
      end,
      transactions,
    );
  }

  /* ==========================================================
     DAILY BUCKETS
     ========================================================== */

  function buildDailyBuckets(
    start,
    end,
    transactions,
  ) {
    const buckets = [];

    const map = {};

    let current =
      parseDate(start);

    const finish =
      parseDate(end);

    while (
      current <=
      finish
    ) {
      const key =
        dateString(
          current,
        );

      map[key] = 0;

      buckets.push({
        key,
        label:
          formatShortDate(
            current,
          ),
        value:
          0,
      });

      current =
        addDays(
          current,
          1,
        );
    }

    transactions.forEach(
      (transaction) => {
        const key =
          String(
            transaction.date ||
            "",
          );

        if (
          Object.prototype.hasOwnProperty.call(
            map,
            key,
          )
        ) {
          map[key] +=
            getMetricValue(
              transaction,
            );
        }
      },
    );

    return buckets.map(
      (bucket) => ({
        ...bucket,
        value:
          map[bucket.key],
      }),
    );
  }

  /* ==========================================================
     WEEKLY BUCKETS
     
     SAME BUCKET FOR LINE + BAR
     ========================================================== */

  function buildWeeklyBuckets(
    start,
    end,
    transactions,
  ) {
    const buckets = [];

    let cursor =
      parseDate(start);

    const finish =
      parseDate(end);

    while (
      cursor <=
      finish
    ) {
      const weekStart =
        new Date(
          cursor,
        );

      const weekEnd =
        addDays(
          weekStart,
          6,
        );

      if (
        weekEnd >
        finish
      ) {
        weekEnd.setTime(
          finish.getTime(),
        );
      }

      buckets.push({
        key:
          dateString(
            weekStart,
          ),

        start:
          dateString(
            weekStart,
          ),

        end:
          dateString(
            weekEnd,
          ),

        label:
          `${formatShortDate(
            weekStart,
          )}`,

        value:
          0,
      });

      cursor =
        addDays(
          weekEnd,
          1,
        );
    }

    transactions.forEach(
      (transaction) => {
        const date =
          parseDate(
            transaction.date,
          );

        const bucket =
          buckets.find(
            (item) =>
              date >=
              parseDate(
                item.start,
              ) &&
              date <=
              parseDate(
                item.end,
              ),
          );

        if (bucket) {
          bucket.value +=
            getMetricValue(
              transaction,
            );
        }
      },
    );

    return buckets;
  }

  /* ==========================================================
     MONTHLY BUCKETS
     ========================================================== */

  function buildMonthlyBuckets(
    start,
    end,
    transactions,
  ) {
    const buckets = [];

    const map = {};

    let cursor =
      new Date(
        parseDate(
          start,
        ).getFullYear(),
        parseDate(
          start,
        ).getMonth(),
        1,
      );

    const finish =
      new Date(
        parseDate(
          end,
        ).getFullYear(),
        parseDate(
          end,
        ).getMonth(),
        1,
      );

    while (
      cursor <=
      finish
    ) {
      const key =
        `${cursor.getFullYear()}-${String(
          cursor.getMonth() + 1,
        ).padStart(
          2,
          "0",
        )}`;

      map[key] = 0;

      buckets.push({
        key,
        label:
          cursor.toLocaleDateString(
            "en-US",
            {
              month:
                "short",
              year:
                "numeric",
            },
          ),
        value:
          0,
      });

      cursor =
        new Date(
          cursor.getFullYear(),
          cursor.getMonth() + 1,
          1,
        );
    }

    transactions.forEach(
      (transaction) => {
        const key =
          String(
            transaction.date ||
            "",
          ).substring(
            0,
            7,
          );

        if (
          Object.prototype.hasOwnProperty.call(
            map,
            key,
          )
        ) {
          map[key] +=
            getMetricValue(
              transaction,
            );
        }
      },
    );

    return buckets.map(
      (bucket) => ({
        ...bucket,
        value:
          map[bucket.key],
      }),
    );
  }

  /* ==========================================================
     COMPARISON ALIGNMENT
     ========================================================== */

  function alignComparisonData(
    selectedBuckets,
    compareBuckets,
  ) {
    if (
      selectedBuckets.length ===
      compareBuckets.length
    ) {
      return compareBuckets.map(
        (bucket) =>
          bucket.value,
      );
    }

    const result = [];

    for (
      let i = 0;
      i <
      selectedBuckets.length;
      i++
    ) {
      result.push(
        compareBuckets[
          i
        ]
          ? compareBuckets[i]
            .value
          : null,
      );
    }

    return result;
  }

  /* ==========================================================
     FILTER TRANSACTIONS
     ========================================================== */

  async function getTransactions() {
    let transactions =
      await Store.getTransactions();

    return filterBranch(
      transactions,
    );
  }

  function getAllTransactionsSync() {
    /*
     * Store.getTransactions() is async.
     * KPI comparison uses its own cached-less fallback
     * through an empty array when unavailable.
     *
     * Main dashboard calculations use async versions.
     */
    return [];
  }

  async function getSelectedPeriodTransactionsAsync() {
    const all =
      await getTransactions();

    return filterByRange(
      all,
      getSelectedRange(),
    );
  }

  async function getComparisonTransactionsAsync() {
    const all =
      await getTransactions();

    const range =
      getComparisonRange();

    if (!range) {
      return [];
    }

    return filterByRange(
      all,
      range,
    );
  }

  function getSelectedPeriodTransactions(
    all,
  ) {
    return filterByRange(
      all,
      getSelectedRange(),
    );
  }

  function getSelectedRange() {
    if (
      hasCustomDateRange()
    ) {
      return {
        start:
          selectedStartDate,
        end:
          selectedEndDate,
      };
    }

    return getPresetRange(
      currentFilter,
    );
  }

  function getComparisonRange() {
    if (
      currentCompare ===
      "none"
    ) {
      return null;
    }

    const selected =
      getSelectedRange();

    if (
      currentCompare ===
      "previous_period"
    ) {
      return getPreviousPeriodRange(
        selected.start,
        selected.end,
      );
    }

    if (
      currentCompare ===
      "previous_year"
    ) {
      return getPreviousYearRange(
        selected.start,
        selected.end,
      );
    }

    return null;
  }

  function getComparisonTransactions(
    all,
  ) {
    const range =
      getComparisonRange();

    if (!range) {
      return [];
    }

    return filterByRange(
      all,
      range,
    );
  }

  function filterByRange(
    transactions,
    range,
  ) {
    if (
      !range ||
      !range.start ||
      !range.end
    ) {
      return [];
    }

    return transactions.filter(
      (transaction) => {
        if (!transaction.date) {
          return false;
        }

        const date =
          String(
            transaction.date,
          );

        return (
          date >=
          range.start &&
          date <=
          range.end
        );
      },
    );
  }

  function filterBranch(
    transactions,
  ) {
    if (
      currentBranch ===
      "all"
    ) {
      return transactions;
    }

    return transactions.filter(
      (transaction) =>
        String(
          transaction.branch ||
          "",
        ).toLowerCase() ===
        currentBranch.toLowerCase(),
    );
  }

  /* ==========================================================
     PRESET RANGES
     ========================================================== */

  function getPresetRange(
    filter,
  ) {
    const today =
      parseDate(
        Store.getTodayStr(),
      );

    if (
      filter ===
      "daily"
    ) {
      return {
        start:
          dateString(
            today,
          ),
        end:
          dateString(
            today,
          ),
      };
    }

    if (
      filter ===
      "weekly"
    ) {
      return getCurrentBucketRange(
        Store.getTodayStr(),
      );
    }

    if (
      filter ===
      "yearly"
    ) {
      return {
        start:
          `${today.getFullYear()}-01-01`,
        end:
          dateString(
            today,
          ),
      };
    }

    return {
      start:
        `${today.getFullYear()}-${String(
          today.getMonth() + 1,
        ).padStart(
          2,
          "0",
        )}-01`,

      end:
        dateString(
          today,
        ),
    };
  }

  /* ==========================================================
     WEEKLY BUCKET RANGE
     ========================================================== */

  function getCurrentBucketRange(
    date,
  ) {
    const d =
      parseDate(date);

    const day =
      d.getDate();

    let startDay =
      1;

    if (day <= 7) {
      startDay = 1;
    } else if (
      day <= 14
    ) {
      startDay = 8;
    } else if (
      day <= 21
    ) {
      startDay = 15;
    } else if (
      day <= 28
    ) {
      startDay = 22;
    } else {
      startDay = 29;
    }

    const start =
      new Date(
        d.getFullYear(),
        d.getMonth(),
        startDay,
      );

    const lastDay =
      new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
      ).getDate();

    const endDay =
      Math.min(
        startDay + 6,
        lastDay,
      );

    const end =
      new Date(
        d.getFullYear(),
        d.getMonth(),
        endDay,
      );

    /*
     * KPI weekly = only through today,
     * not future dates.
     */

    if (
      dateString(end) >
      Store.getTodayStr()
    ) {
      return {
        start:
          dateString(
            start,
          ),

        end:
          Store.getTodayStr(),
      };
    }

    return {
      start:
        dateString(
          start,
        ),

      end:
        dateString(
          end,
        ),
    };
  }

  /* ==========================================================
     PREVIOUS PERIOD
     ========================================================== */

  function getPreviousPeriodRange(
    start,
    end,
  ) {
    const startDate =
      parseDate(start);

    const endDate =
      parseDate(end);

    const length =
      diffDays(
        start,
        end,
      ) + 1;

    const previousEnd =
      addDays(
        startDate,
        -1,
      );

    const previousStart =
      addDays(
        previousEnd,
        -(length - 1),
      );

    return {
      start:
        dateString(
          previousStart,
        ),

      end:
        dateString(
          previousEnd,
        ),
    };
  }

  /* ==========================================================
     PREVIOUS YEAR
     ========================================================== */

  function getPreviousYearRange(
    start,
    end,
  ) {
    const s =
      parseDate(start);

    const e =
      parseDate(end);

    return {
      start:
        dateString(
          new Date(
            s.getFullYear() - 1,
            s.getMonth(),
            s.getDate(),
          ),
        ),

      end:
        dateString(
          new Date(
            e.getFullYear() - 1,
            e.getMonth(),
            e.getDate(),
          ),
        ),
    };
  }

  /* ==========================================================
     KPI COMPARISON
     ========================================================== */

  async function renderKpiGrowth(
    prefix,
    range,
  ) {
    const all =
      await getTransactions();

    const current =
      filterByRange(
        all,
        range,
      );

    let compareRange;

    if (
      prefix ===
      "today"
    ) {
      const d =
        parseDate(
          range.start,
        );

      const previous =
        addDays(
          d,
          -1,
        );

      compareRange = {
        start:
          dateString(
            previous,
          ),
        end:
          dateString(
            previous,
          ),
      };
    } else {
      compareRange =
        getPreviousPeriodRange(
          range.start,
          range.end,
        );
    }

    const compare =
      filterByRange(
        all,
        compareRange,
      );

    const currentRevenue =
      sumRevenue(current);

    const compareRevenue =
      sumRevenue(compare);

    setGrowthElement(
      `${prefix}Change`,
      calculateGrowth(
        currentRevenue,
        compareRevenue,
      ),
    );
  }

  /* ==========================================================
     FORMAT KPI
     ========================================================== */

  function formatMetricValue(
    value,
  ) {
    if (
      currentMetric ===
      "revenue"
    ) {
      return Store.formatCurrency(
        value,
      );
    }

    return `${Number(
      value || 0,
    ).toLocaleString(
      "id-ID",
    )} transactions`;
  }

  /* ==========================================================
     MANAGER INSIGHTS
     ========================================================== */

  async function renderManagerInsights() {
    const container =
      document.getElementById(
        "managerInsights",
      );

    if (!container) return;

    const selected =
      await getSelectedPeriodTransactionsAsync();

    const compare =
      await getComparisonTransactionsAsync();

    if (!selected.length) {
      container.innerHTML = `
        <div class="insight-item">
          <div class="insight-icon">
            📌
          </div>

          <div>
            <strong>
              No transaction data
            </strong>

            <span>
              There is no transaction data
              for the selected period.
            </span>
          </div>
        </div>
      `;

      return;
    }

    const selectedRevenue =
      sumRevenue(selected);

    const compareRevenue =
      sumRevenue(compare);

    const selectedAverage =
      selected.length
        ? selectedRevenue /
        selected.length
        : 0;

    const compareAverage =
      compare.length
        ? compareRevenue /
        compare.length
        : 0;

    const growth =
      calculateGrowth(
        selectedRevenue,
        compareRevenue,
      );

    const promoTxns =
      selected.filter(
        isPromoTransaction,
      );

    const promoRevenue =
      sumRevenue(
        promoTxns,
      );

    const promoContribution =
      selectedRevenue
        ? (promoRevenue /
          selectedRevenue) *
        100
        : 0;

    const serviceMap =
      groupByService(
        selected,
      );

    const topService =
      Object.entries(
        serviceMap,
      ).sort(
        (a, b) =>
          b[1] - a[1],
      )[0];

    const insights = [];

    if (
      growth !== null &&
      growth !== 0
    ) {
      insights.push({
        icon:
          growth > 0
            ? "📈"
            : "📉",

        title:
          growth > 0
            ? `Revenue increased ${Math.abs(
              growth,
            ).toFixed(
              1,
            )}%`
            : `Revenue decreased ${Math.abs(
              growth,
            ).toFixed(
              1,
            )}%`,

        text:
          `Compared with ${getComparisonLabel()}.`,
      });
    }

    if (topService) {
      insights.push({
        icon:
          "🏆",

        title:
          `${topService[0]} is the top service`,

        text:
          `${formatMetricValue(
            topService[1],
          )} generated in the selected period.`,
      });
    }

    if (
      currentCompare !==
      "none" &&
      compare.length
    ) {
      const ticketGrowth =
        calculateGrowth(
          selectedAverage,
          compareAverage,
        );

      if (
        ticketGrowth !==
        null
      ) {
        insights.push({
          icon:
            ticketGrowth >= 0
              ? "🎯"
              : "⚠️",

          title:
            `Average ticket ${ticketGrowth >= 0
              ? "increased"
              : "decreased"
            } ${Math.abs(
              ticketGrowth,
            ).toFixed(
              1,
            )}%`,

          text:
            `Current average: ${Store.formatCurrency(
              selectedAverage,
            )}.`,
        });
      }
    }

    if (
      promoContribution > 0
    ) {
      insights.push({
        icon:
          "🎉",

        title:
          `Promo contributes ${promoContribution.toFixed(
            1,
          )}% of revenue`,

        text:
          `${promoTxns.length} transactions used promotions.`,
      });
    } else {
      insights.push({
        icon:
          "💡",

        title:
          "No promo revenue detected",

        text:
          "No promotion-linked transaction was recorded in this period.",
      });
    }

    container.innerHTML =
      insights
        .slice(0, 4)
        .map(
          (insight) => `
            <div class="insight-item">
              <div class="insight-icon">
                ${insight.icon}
              </div>

              <div>
                <strong>
                  ${escapeHtml(
            insight.title,
          )}
                </strong>

                <span>
                  ${escapeHtml(
            insight.text,
          )}
                </span>
              </div>
            </div>
          `,
        )
        .join("");
  }

  /* ==========================================================
     PROMO PERFORMANCE
     ========================================================== */

  async function renderPromoPerformance() {
    const selected =
      await getSelectedPeriodTransactionsAsync();

    const compare =
      await getComparisonTransactionsAsync();

    const promoTxns =
      selected.filter(
        isPromoTransaction,
      );

    const normalTxns =
      selected.filter(
        (t) =>
          !isPromoTransaction(
            t,
          ),
      );

    const promoRevenue =
      sumRevenue(
        promoTxns,
      );

    const normalRevenue =
      sumRevenue(
        normalTxns,
      );

    const totalRevenue =
      promoRevenue +
      normalRevenue;

    const promoContribution =
      totalRevenue
        ? (promoRevenue /
          totalRevenue) *
        100
        : 0;

    const promoAverage =
      promoTxns.length
        ? promoRevenue /
        promoTxns.length
        : 0;

    const normalAverage =
      normalTxns.length
        ? normalRevenue /
        normalTxns.length
        : 0;

    const promoDiscount =
      sumDiscount(
        promoTxns,
      );

    setText(
      "promoRevenue",
      Store.formatCurrency(
        promoRevenue,
      ),
    );

    setText(
      "nonPromoRevenue",
      Store.formatCurrency(
        normalRevenue,
      ),
    );

    setText(
      "promoContribution",
      `${promoContribution.toFixed(
        1,
      )}%`,
    );

    setText(
      "promoTransactionCount",
      promoTxns.length.toLocaleString(
        "id-ID",
      ),
    );

    setText(
      "nonPromoTransactionCount",
      normalTxns.length.toLocaleString(
        "id-ID",
      ),
    );

    setText(
      "promoAverageTicket",
      Store.formatCurrency(
        promoAverage,
      ),
    );

    setText(
      "nonPromoAverageTicket",
      Store.formatCurrency(
        normalAverage,
      ),
    );

    setText(
      "promoDiscountTotal",
      Store.formatCurrency(
        promoDiscount,
      ),
    );

    await renderPromoTable(
      promoTxns,
    );
  }

  /* ==========================================================
     PROMO TABLE
     ========================================================== */

  async function renderPromoTable(
    transactions,
  ) {
    const container =
      document.getElementById(
        "promoPerformance",
      );

    if (!container) return;

    let promos = [];

    try {
      promos =
        await Store.getPromos();
    } catch (error) {
      console.error(
        "Promo fetch error:",
        error,
      );

      container.innerHTML =
        `<div class="empty-state">
          Unable to load promotion data.
        </div>`;

      return;
    }

    const promoMap = {};

    transactions.forEach(
      (transaction) => {
        if (!transaction.promoId) {
          return;
        }

        const promoId =
          transaction.promoId;

        if (
          !promoMap[promoId]
        ) {
          promoMap[promoId] = {
            transactions:
              0,
            revenue:
              0,
            discount:
              0,
          };
        }

        promoMap[
          promoId
        ].transactions += 1;

        promoMap[
          promoId
        ].revenue +=
          Number(
            transaction.price ||
            0,
          );

        promoMap[
          promoId
        ].discount +=
          Number(
            transaction.discountAmount ||
            0,
          );
      },
    );

    const rows =
      promos
        .filter(
          (promo) =>
            promoMap[promo.id],
        )
        .sort(
          (a, b) =>
            promoMap[b.id]
              .revenue -
            promoMap[a.id]
              .revenue,
        )
        .map((promo) => {
          const item =
            promoMap[promo.id];

          const avg =
            item.transactions
              ? item.revenue /
              item.transactions
              : 0;

          return `
            <tr>
              <td data-label="Promotion">
                <span class="discount-tag">
                  🎉 ${escapeHtml(
            promo.name,
          )}
                </span>
              </td>

              <td data-label="Transactions">
                ${item.transactions}
              </td>

              <td data-label="Revenue">
                ${Store.formatCurrency(
            item.revenue,
          )}
              </td>

              <td data-label="Discount">
                ${Store.formatCurrency(
            item.discount,
          )}
              </td>

              <td data-label="Avg Ticket">
                ${Store.formatCurrency(
            avg,
          )}
              </td>
            </tr>
          `;
        })
        .join("");

    if (!rows) {
      container.innerHTML = `
        <div class="empty-state">
          No promotion transactions
          in the selected period.
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Promotion</th>
              <th>Transactions</th>
              <th>Revenue</th>
              <th>Discount</th>
              <th>Avg Ticket</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ==========================================================
     GROUP SERVICE
     ========================================================== */

  function groupByService(
    transactions,
  ) {
    const map = {};

    transactions.forEach(
      (transaction) => {
        const service =
          transaction.serviceName ||
          "Unknown Service";

        map[service] =
          (map[service] || 0) +
          getMetricValue(
            transaction,
          );
      },
    );

    return map;
  }

  /* ==========================================================
     METRIC VALUE
     ========================================================== */

  function getMetricValue(
    transaction,
  ) {
    if (
      currentMetric ===
      "count"
    ) {
      return 1;
    }

    return Number(
      transaction.price ||
      0,
    );
  }

  /* ==========================================================
     DISCOUNT
     ========================================================== */

  function sumDiscount(
    transactions,
  ) {
    return transactions.reduce(
      (sum, transaction) =>
        sum +
        Number(
          transaction.discountAmount ||
          0,
        ),
      0,
    );
  }

  /* ==========================================================
     REVENUE
     ========================================================== */

  function sumRevenue(
    transactions,
  ) {
    return transactions.reduce(
      (sum, transaction) =>
        sum +
        Number(
          transaction.price ||
          0,
        ),
      0,
    );
  }

  /* ==========================================================
     PROMO
     ========================================================== */

  function isPromoTransaction(
    transaction,
  ) {
    return Boolean(
      transaction.promoId ||
      Number(
        transaction.promoDiscount ||
        0,
      ) > 0 ||
      Number(
        transaction.discountAmount ||
        0,
      ) > 0,
    );
  }

  /* ==========================================================
     GROWTH
     ========================================================== */

  function calculateGrowth(
    current,
    previous,
  ) {
    const currentValue =
      Number(current || 0);

    const previousValue =
      Number(previous || 0);

    if (
      previousValue === 0
    ) {
      if (
        currentValue === 0
      ) {
        return 0;
      }

      return null;
    }

    return (
      ((currentValue -
        previousValue) /
        previousValue) *
      100
    );
  }

  /* ==========================================================
     GROWTH UI
     ========================================================== */

  function setGrowthElement(
    id,
    value,
  ) {
    const el =
      document.getElementById(
        id,
      );

    if (!el) return;

    el.classList.remove(
      "positive",
      "negative",
      "neutral",
    );

    if (value === null) {
      el.textContent =
        "New";

      el.classList.add(
        "positive",
      );

      return;
    }

    if (
      Number(value) > 0
    ) {
      el.textContent =
        `↑ ${Math.abs(
          value,
        ).toFixed(
          1,
        )}%`;

      el.classList.add(
        "positive",
      );

      return;
    }

    if (
      Number(value) < 0
    ) {
      el.textContent =
        `↓ ${Math.abs(
          value,
        ).toFixed(
          1,
        )}%`;

      el.classList.add(
        "negative",
      );

      return;
    }

    el.textContent =
      "—";

    el.classList.add(
      "neutral",
    );
  }

  /* ==========================================================
     LABELS
     ========================================================== */

  function getPeriodLabel() {
    if (
      hasCustomDateRange()
    ) {
      return `${formatDateLabel(
        selectedStartDate,
      )} → ${formatDateLabel(
        selectedEndDate,
      )}`;
    }

    if (
      currentFilter ===
      "daily"
    ) {
      return "Today";
    }

    if (
      currentFilter ===
      "weekly"
    ) {
      return "This Week";
    }

    if (
      currentFilter ===
      "yearly"
    ) {
      return "This Year";
    }

    return "This Month";
  }

  function getComparisonLabel() {
    if (
      currentCompare ===
      "none"
    ) {
      return "No comparison";
    }

    const range =
      getComparisonRange();

    if (!range) {
      return "No comparison";
    }

    if (
      currentCompare ===
      "previous_year"
    ) {
      return `${formatDateLabel(
        range.start,
      )} → ${formatDateLabel(
        range.end,
      )}`;
    }

    return `${formatDateLabel(
      range.start,
    )} → ${formatDateLabel(
      range.end,
    )}`;
  }

  /* ==========================================================
     CHART TITLES
     ========================================================== */

  function updateChartTitles() {
    const isRevenue =
      currentMetric ===
      "revenue";

    setText(
      "dashRevenueChartTitle",
      isRevenue
        ? "📈 Revenue Trend"
        : "📈 Transaction Trend",
    );

    setText(
      "dashRevenueChartSubtitle",
      currentCompare ===
        "none"
        ? "Selected period performance"
        : `Selected period vs ${getComparisonLabel()}`,
    );

    setText(
      "dashBarChartTitle",
      isRevenue
        ? "📊 Service Comparison"
        : "📊 Transactions by Service",
    );

    setText(
      "dashBarChartSubtitle",
      currentCompare ===
        "none"
        ? "Top services in selected period"
        : "Selected period vs comparison",
    );

    setText(
      "dashServiceChartTitle",
      isRevenue
        ? "🍩 Revenue by Service"
        : "🍩 Transactions by Service",
    );
  }

  /* ==========================================================
     TREND LEGEND
     ========================================================== */

  function renderTrendLegend(
    datasets,
  ) {
    const container =
      document.getElementById(
        "trendLegend",
      );

    if (!container) return;

    container.innerHTML =
      datasets
        .map(
          (dataset, index) => {
            const color =
              index === 0
                ? "#e30022"
                : "#60a5fa";

            return `
              <span class="custom-legend-item">
                <span
                  class="custom-legend-dot"
                  style="background:${color}"
                ></span>

                ${escapeHtml(
              dataset.label,
            )}
              </span>
            `;
          },
        )
        .join("");
  }

  /* ==========================================================
     CHART DESTROY
     ========================================================== */

  function destroyChart(
    type,
  ) {
    if (
      type ===
      "revenue"
    ) {
      if (revenueChart) {
        revenueChart.destroy();
        revenueChart = null;
      }
    }

    if (
      type ===
      "service"
    ) {
      if (serviceChart) {
        serviceChart.destroy();
        serviceChart = null;
      }
    }

    if (
      type ===
      "bar"
    ) {
      if (barChart) {
        barChart.destroy();
        barChart = null;
      }
    }
  }

  /* ==========================================================
     GRADIENT
     ========================================================== */

  function makeGradient(
    canvas,
    color,
  ) {
    const ctx =
      canvas.getContext(
        "2d",
      );

    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height ||
        300,
      );

    gradient.addColorStop(
      0,
      `${color}55`,
    );

    gradient.addColorStop(
      1,
      `${color}00`,
    );

    return gradient;
  }

  /* ==========================================================
     POINT RADIUS
     ========================================================== */

  function getPointRadius(
    data,
    base,
  ) {
    if (
      !Array.isArray(data)
    ) {
      return base;
    }

    return data.map(
      (value) =>
        value === null
          ? 0
          : base,
    );
  }

  /* ==========================================================
     DATE UTILITIES
     ========================================================== */

  function parseDate(
    value,
  ) {
    if (
      value instanceof Date
    ) {
      return new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
      );
    }

    const parts =
      String(value || "")
        .split("-")
        .map(Number);

    if (
      parts.length !==
      3 ||
      parts.some(
        (item) =>
          Number.isNaN(item),
      )
    ) {
      return new Date(
        "invalid",
      );
    }

    return new Date(
      parts[0],
      parts[1] - 1,
      parts[2],
    );
  }

  function dateString(
    date,
  ) {
    return (
      date.getFullYear() +
      "-" +
      String(
        date.getMonth() + 1,
      ).padStart(
        2,
        "0",
      ) +
      "-" +
      String(
        date.getDate(),
      ).padStart(
        2,
        "0",
      )
    );
  }

  function addDays(
    date,
    amount,
  ) {
    const result =
      new Date(
        date,
      );

    result.setDate(
      result.getDate() +
      amount,
    );

    return result;
  }

  function diffDays(
    start,
    end,
  ) {
    const a =
      parseDate(start);

    const b =
      parseDate(end);

    return Math.floor(
      (
        b.getTime() -
        a.getTime()
      ) /
      86400000,
    );
  }

  function formatShortDate(
    date,
  ) {
    return date.toLocaleDateString(
      "en-US",
      {
        day:
          "numeric",
        month:
          "short",
      },
    );
  }

  function formatDateLabel(
    date,
  ) {
    if (!date) {
      return "—";
    }

    const parsed =
      parseDate(
        date,
      );

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-GB",
      {
        day:
          "2-digit",
        month:
          "short",
        year:
          "numeric",
      },
    );
  }

  /* ==========================================================
     SHORT CURRENCY
     ========================================================== */

  function shortCurrency(
    value,
  ) {
    const n =
      Number(
        value || 0,
      );

    if (
      n >=
      1000000000
    ) {
      return (
        "Rp " +
        (
          n /
          1000000000
        )
          .toFixed(1)
          .replace(
            ".0",
            "",
          ) +
        "B"
      );
    }

    if (
      n >=
      1000000
    ) {
      return (
        "Rp " +
        (
          n /
          1000000
        )
          .toFixed(1)
          .replace(
            ".0",
            "",
          ) +
        "M"
      );
    }

    if (
      n >=
      1000
    ) {
      return (
        "Rp " +
        (
          n /
          1000
        )
          .toFixed(0) +
        "K"
      );
    }

    return (
      "Rp " +
      n.toLocaleString(
        "id-ID",
      )
    );
  }

  /* ==========================================================
     SAFE TEXT
     ========================================================== */

  function setText(
    id,
    value,
  ) {
    const el =
      document.getElementById(
        id,
      );

    if (el) {
      el.textContent =
        value;
    }
  }

  /* ==========================================================
     PUBLIC API
     ========================================================== */

  return {
    render,
    refresh,
  };
})();