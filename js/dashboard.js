/* ============================================================
   NEXT LEVEL BEAUTY BAR
   MANAGEMENT DASHBOARD
   ============================================================ */

const Dashboard = (() => {
  /* ============================================================
     CHART INSTANCES
     ============================================================ */

  let revenueChart = null;
  let serviceChart = null;
  let barChart = null;

  /* ============================================================
     DASHBOARD STATE
     ============================================================ */

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

  /* ============================================================
     PUBLIC
     ============================================================ */

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

  /* ============================================================
     SETUP
     ============================================================ */

  function setup() {
    setupQuickFilters();
    setupChartType();
    setupMetric();
    setupBranch();
    setupCompare();
    setupDatePicker();
  }

  /* ============================================================
     QUICK FILTER
     ============================================================ */

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

  /* ============================================================
     CHART TYPE
     ============================================================ */

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

  /* ============================================================
     METRIC
     ============================================================ */

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

  /* ============================================================
     BRANCH
     ============================================================ */

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

  /* ============================================================
     COMPARE
     ============================================================ */

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

  /* ============================================================
     DATE PICKER
     ============================================================ */

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

          clearDateError();

          await renderDashboard();
        },
      );
    }

    if (clear) {
      clear.addEventListener(
        "click",
        async () => {
          clearCustomDateRange();

          setQuickFilterActive(
            currentFilter,
          );

          await renderDashboard();
        },
      );
    }
  }

  /* ============================================================
     INITIAL DATE
     ============================================================ */

  function normalizeInitialDates() {
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

    if (start.value) {
      end.min = start.value;
    }

    updateFilterStatus();
  }

  /* ============================================================
     CUSTOM DATE STATE
     ============================================================ */

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
          btn.dataset.filter === filter,
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

  /* ============================================================
     DASHBOARD
     ============================================================ */

  async function renderDashboard() {
    updateFilterStatus();

    await renderSummaryCards();
    await renderCharts();
    await renderPromoPerformance();
    await renderManagerInsights();
  }

  /* ============================================================
     FILTER STATUS
     ============================================================ */

  function updateFilterStatus() {
    const label =
      getPeriodLabel();

    setText(
      "dashboardFilterStatus",
      label,
    );

    setText(
      "dashPeriodLabel",
      label,
    );

    setText(
      "dashCompareLabel",
      getComparisonLabel(),
    );
  }

  /* ============================================================
     PROMO BANNER
     ============================================================ */

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

  /* ============================================================
     SUMMARY CARDS
     ============================================================ */

  async function renderSummaryCards() {
    const all =
      await getTransactions();

    const today =
      Store.getTodayStr();

    const todayRange = {
      start: today,
      end: today,
    };

    const weekRange =
      getCurrentBucketRange(
        today,
      );

    const monthRange = {
      start:
        `${today.substring(
          0,
          7,
        )}-01`,
      end:
        today,
    };

    const yearRange = {
      start:
        `${today.substring(
          0,
          4,
        )}-01-01`,
      end:
        today,
    };

    const todayData =
      filterByRange(
        all,
        todayRange,
      );

    const weekData =
      filterByRange(
        all,
        weekRange,
      );

    const monthData =
      filterByRange(
        all,
        monthRange,
      );

    const yearData =
      filterByRange(
        all,
        yearRange,
      );

    await renderPeriodKPI(
      "today",
      todayData,
      todayRange,
    );

    await renderPeriodKPI(
      "week",
      weekData,
      weekRange,
    );

    await renderPeriodKPI(
      "month",
      monthData,
      monthRange,
    );

    await renderPeriodKPI(
      "year",
      yearData,
      yearRange,
    );

    const selected =
      filterByRange(
        all,
        getSelectedRange(),
      );

    const compare =
      getComparisonRange()
        ? filterByRange(
          all,
          getComparisonRange(),
        )
        : [];

    const selectedRevenue =
      sumRevenue(
        selected,
      );

    const compareRevenue =
      sumRevenue(
        compare,
      );

    const selectedCount =
      selected.length;

    const averageTicket =
      selectedCount > 0
        ? selectedRevenue /
        selectedCount
        : 0;

    const discount =
      sumDiscount(
        selected,
      );

    const growth =
      calculateGrowth(
        selectedRevenue,
        compareRevenue,
      );

    setText(
      "dashTotalRevenue",
      Store.formatCurrency(
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
        averageTicket,
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
  }

  /* ============================================================
     PERIOD KPI
     ============================================================ */

  async function renderPeriodKPI(
    prefix,
    transactions,
    range,
  ) {
    const revenue =
      sumRevenue(
        transactions,
      );

    const count =
      transactions.length;

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

    if (!range) {
      setGrowthElement(
        `${prefix}Change`,
        0,
      );

      return;
    }

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
      const currentDate =
        parseDate(
          range.start,
        );

      const previousDate =
        addDays(
          currentDate,
          -1,
        );

      compareRange = {
        start:
          dateString(
            previousDate,
          ),
        end:
          dateString(
            previousDate,
          ),
      };
    } else {
      compareRange =
        getPreviousPeriodRange(
          range.start,
          range.end,
        );
    }

    const previous =
      filterByRange(
        all,
        compareRange,
      );

    const currentRevenue =
      sumRevenue(
        current,
      );

    const previousRevenue =
      sumRevenue(
        previous,
      );

    setGrowthElement(
      `${prefix}Change`,
      calculateGrowth(
        currentRevenue,
        previousRevenue,
      ),
    );
  }

  /* ============================================================
     CHARTS
     ============================================================ */

  async function renderCharts() {
    updateChartTitles();

    await renderTrendChart();
    await renderServiceChart();
    await renderServiceComparison();
  }

  /* ============================================================
     TREND CHART
     ============================================================ */

  async function renderTrendChart() {
    const canvas =
      document.getElementById(
        "revenueChart",
      );

    if (!canvas) return;

    const selected =
      await getSelectedPeriodTransactionsAsync();

    const comparison =
      await getComparisonTransactionsAsync();

    const selectedRange =
      getSelectedRange();

    const comparisonRange =
      getComparisonRange();

    const selectedBuckets =
      buildBuckets(
        selectedRange.start,
        selectedRange.end,
        selected,
      );

    let comparisonBuckets = [];

    if (
      comparisonRange &&
      currentCompare !==
      "none"
    ) {
      comparisonBuckets =
        buildBuckets(
          comparisonRange.start,
          comparisonRange.end,
          comparison,
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

    datasets.push({
      label:
        getPeriodLabel(),

      data:
        selectedData,

      borderColor:
        "#e30022",

      backgroundColor:
        makeGradient(
          canvas,
          "#e30022",
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
        "#e30022",

      pointBorderColor:
        "#ffffff",

      pointBorderWidth:
        2,
    });

    if (
      comparisonBuckets.length > 0
    ) {
      const comparisonData =
        alignComparisonData(
          selectedBuckets,
          comparisonBuckets,
        );

      datasets.push({
        label:
          getComparisonLabel(),

        data:
          comparisonData,

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
            comparisonData,
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

  /* ============================================================
     BAR DATASET
     ============================================================ */

  function convertTrendToBarDatasets(
    datasets,
  ) {
    return datasets.map(
      (
        dataset,
        index,
      ) => ({
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

  /* ============================================================
     SERVICE DONUT
     ============================================================ */

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
            b[1] -
            a[1],
        )
        .slice(
          0,
          10,
        );

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

                      if (
                        currentMetric ===
                        "revenue"
                      ) {
                        return `${context.label}: ${Store.formatCurrency(
                          value,
                        )} (${percentage}%)`;
                      }

                      return `${context.label}: ${value} transactions (${percentage}%)`;
                    },
                },
              },
            },
          },
        },
      );
  }

  /* ============================================================
     SERVICE COMPARISON
     ============================================================ */

  async function renderServiceComparison() {
    const canvas =
      document.getElementById(
        "barChart",
      );

    if (!canvas) return;

    const selected =
      await getSelectedPeriodTransactionsAsync();

    const comparison =
      await getComparisonTransactionsAsync();

    const selectedMap =
      groupByService(
        selected,
      );

    const comparisonMap =
      groupByService(
        comparison,
      );

    const allServices =
      Array.from(
        new Set([
          ...Object.keys(
            selectedMap,
          ),
          ...Object.keys(
            comparisonMap,
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
        .slice(
          0,
          10,
        );

    const selectedData =
      allServices.map(
        (service) =>
          selectedMap[
          service
          ] || 0,
      );

    const comparisonData =
      allServices.map(
        (service) =>
          comparisonMap[
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
          comparisonData,

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

  /* ============================================================
     CHART OPTIONS
     ============================================================ */

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

                if (
                  isRevenue
                ) {
                  return `${context.dataset.label}: ${Store.formatCurrency(
                    value,
                  )}`;
                }

                return `${context.dataset.label}: ${value} transactions`;
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

    if (
      days <= 14
    ) {
      return days + 1;
    }

    if (
      days <= 31
    ) {
      return 10;
    }

    if (
      days <= 100
    ) {
      return 12;
    }

    return 14;
  }

  /* ============================================================
     BUCKET ENGINE
     ============================================================ */

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

    if (
      days <= 31
    ) {
      return buildDailyBuckets(
        start,
        end,
        transactions,
      );
    }

    if (
      days <= 180
    ) {
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

  /* ============================================================
     DAILY BUCKETS
     ============================================================ */

  function buildDailyBuckets(
    start,
    end,
    transactions,
  ) {
    const buckets = [];

    const map = {};

    let cursor =
      parseDate(start);

    const finish =
      parseDate(end);

    while (
      cursor <= finish
    ) {
      const key =
        dateString(
          cursor,
        );

      map[key] = 0;

      buckets.push({
        key,

        label:
          formatShortDate(
            cursor,
          ),

        value:
          0,
      });

      cursor =
        addDays(
          cursor,
          1,
        );
    }

    transactions.forEach(
      (transaction) => {
        const normalized =
          normalizeTransactionDate(
            transaction.date,
          );

        if (
          normalized &&
          Object.prototype.hasOwnProperty.call(
            map,
            normalized,
          )
        ) {
          map[
            normalized
          ] +=
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
          map[bucket.key] || 0,
      }),
    );
  }

  /* ============================================================
     WEEKLY BUCKETS
     ============================================================ */

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
      cursor <= finish
    ) {
      const weekStart =
        new Date(
          cursor,
        );

      let weekEnd =
        addDays(
          weekStart,
          6,
        );

      if (
        weekEnd > finish
      ) {
        weekEnd =
          new Date(
            finish,
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
          formatShortDate(
            weekStart,
          ),

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
        const normalized =
          normalizeTransactionDate(
            transaction.date,
          );

        if (!normalized) {
          return;
        }

        const transactionDate =
          parseDate(
            normalized,
          );

        const bucket =
          buckets.find(
            (item) =>
              transactionDate >=
              parseDate(
                item.start,
              ) &&
              transactionDate <=
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

  /* ============================================================
     MONTHLY BUCKETS
     ============================================================ */

  function buildMonthlyBuckets(
    start,
    end,
    transactions,
  ) {
    const buckets = [];

    const map = {};

    const first =
      parseDate(start);

    const finish =
      parseDate(end);

    let cursor =
      new Date(
        first.getFullYear(),
        first.getMonth(),
        1,
      );

    while (
      cursor <= finish
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
        const normalized =
          normalizeTransactionDate(
            transaction.date,
          );

        if (!normalized) {
          return;
        }

        const key =
          normalized.substring(
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
          map[bucket.key] || 0,
      }),
    );
  }

  /* ============================================================
     COMPARISON ALIGNMENT
     ============================================================ */

  function alignComparisonData(
    selectedBuckets,
    comparisonBuckets,
  ) {
    if (
      selectedBuckets.length ===
      comparisonBuckets.length
    ) {
      return comparisonBuckets.map(
        (bucket) =>
          bucket.value,
      );
    }

    const output = [];

    for (
      let i = 0;
      i <
      selectedBuckets.length;
      i++
    ) {
      output.push(
        comparisonBuckets[i]
          ? comparisonBuckets[i]
            .value
          : null,
      );
    }

    return output;
  }

  /* ============================================================
     TRANSACTION GETTERS
     ============================================================ */

  async function getTransactions() {
    const raw =
      await Store.getTransactions();

    if (!Array.isArray(raw)) {
      console.warn(
        "Store.getTransactions() did not return an array:",
        raw,
      );

      return [];
    }

    return filterBranch(
      raw,
    );
  }

  async function
    getSelectedPeriodTransactionsAsync() {
    const all =
      await getTransactions();

    return filterByRange(
      all,
      getSelectedRange(),
    );
  }

  async function
    getComparisonTransactionsAsync() {
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

  /* ============================================================
     DATE NORMALIZER
     ============================================================ */

  function normalizeTransactionDate(
    value,
  ) {
    if (!value) {
      return "";
    }

    if (
      value instanceof Date
    ) {
      if (
        Number.isNaN(
          value.getTime(),
        )
      ) {
        return "";
      }

      return dateString(
        value,
      );
    }

    const raw =
      String(
        value,
      ).trim();

    if (!raw) {
      return "";
    }

    /*
     * Handles:
     *
     * 2026-08-25
     * 2026-08-25T19:43:00
     * 2026-08-25T19:43:00.000Z
     */

    const isoMatch =
      raw.match(
        /^(\d{4}-\d{2}-\d{2})/,
      );

    if (isoMatch) {
      return isoMatch[1];
    }

    const parsed =
      new Date(raw);

    if (
      !Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return dateString(
        parsed,
      );
    }

    return "";
  }

  /* ============================================================
     RANGE FILTER
     ============================================================ */

  function filterByRange(
    transactions,
    range,
  ) {
    if (
      !Array.isArray(
        transactions,
      ) ||
      !range ||
      !range.start ||
      !range.end
    ) {
      return [];
    }

    return transactions.filter(
      (transaction) => {
        const transactionDate =
          normalizeTransactionDate(
            transaction.date,
          );

        if (!transactionDate) {
          return false;
        }

        return (
          transactionDate >=
          range.start &&
          transactionDate <=
          range.end
        );
      },
    );
  }

  /* ============================================================
     BRANCH FILTER
     ============================================================ */

  function filterBranch(
    transactions,
  ) {
    if (
      !Array.isArray(
        transactions,
      )
    ) {
      return [];
    }

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
        )
          .trim()
          .toLowerCase() ===
        String(
          currentBranch ||
          "",
        )
          .trim()
          .toLowerCase(),
    );
  }

  /* ============================================================
     PRESET RANGE
     ============================================================ */

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

  /* ============================================================
     SELECTED RANGE
     ============================================================ */

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

  /* ============================================================
     COMPARISON RANGE
     ============================================================ */

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

  /* ============================================================
     WEEK BUCKET RANGE
     ============================================================ */

  function getCurrentBucketRange(
    date,
  ) {
    const d =
      parseDate(date);

    const day =
      d.getDate();

    let startDay = 1;

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

    let endDay =
      Math.min(
        startDay + 6,
        lastDay,
      );

    let end =
      new Date(
        d.getFullYear(),
        d.getMonth(),
        endDay,
      );

    const today =
      parseDate(
        Store.getTodayStr(),
      );

    if (
      end > today
    ) {
      end =
        new Date(
          today,
        );
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

  /* ============================================================
     PREVIOUS PERIOD
     ============================================================ */

  function getPreviousPeriodRange(
    start,
    end,
  ) {
    const startDate =
      parseDate(start);

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

  /* ============================================================
     PREVIOUS YEAR
     ============================================================ */

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

  /* ============================================================
     MANAGER INSIGHTS
     ============================================================ */

  async function renderManagerInsights() {
    const container =
      document.getElementById(
        "managerInsights",
      );

    if (!container) {
      return;
    }

    const selected =
      await getSelectedPeriodTransactionsAsync();

    const comparison =
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
      sumRevenue(
        selected,
      );

    const comparisonRevenue =
      sumRevenue(
        comparison,
      );

    const selectedAverage =
      selected.length
        ? selectedRevenue /
        selected.length
        : 0;

    const comparisonAverage =
      comparison.length
        ? comparisonRevenue /
        comparison.length
        : 0;

    const growth =
      calculateGrowth(
        selectedRevenue,
        comparisonRevenue,
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
          b[1] -
          a[1],
      )[0];

    const insights = [];

    if (
      growth !== null
    ) {
      if (
        growth > 0
      ) {
        insights.push({
          icon: "📈",

          title:
            `Revenue increased ${growth.toFixed(
              1,
            )}%`,

          text:
            `Compared with ${getComparisonLabel()}.`,
        });
      } else if (
        growth < 0
      ) {
        insights.push({
          icon: "📉",

          title:
            `Revenue decreased ${Math.abs(
              growth,
            ).toFixed(
              1,
            )}%`,

          text:
            `Compared with ${getComparisonLabel()}.`,
        });
      }
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
      comparison.length
    ) {
      const ticketGrowth =
        calculateGrowth(
          selectedAverage,
          comparisonAverage,
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
      promoContribution >
      0
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
    }

    if (!insights.length) {
      insights.push({
        icon:
          "📊",

        title:
          "Performance is stable",

        text:
          "No significant comparison change detected.",
      });
    }

    container.innerHTML =
      insights
        .slice(
          0,
          4,
        )
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

  /* ============================================================
     PROMOTION PERFORMANCE
     ============================================================ */

  async function renderPromoPerformance() {
    const selected =
      await getSelectedPeriodTransactionsAsync();

    const promoTxns =
      selected.filter(
        isPromoTransaction,
      );

    const normalTxns =
      selected.filter(
        (transaction) =>
          !isPromoTransaction(
            transaction,
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

  /* ============================================================
     PROMO TABLE
     ============================================================ */

  async function renderPromoTable(
    transactions,
  ) {
    const container =
      document.getElementById(
        "promoPerformance",
      );

    if (!container) {
      return;
    }

    let promos = [];

    try {
      promos =
        await Store.getPromos();
    } catch (error) {
      console.error(
        "Promo fetch error:",
        error,
      );

      container.innerHTML = `
        <div class="empty-state">
          Unable to load promotion data.
        </div>
      `;

      return;
    }

    const promoMap = {};

    transactions.forEach(
      (transaction) => {
        const promoId =
          transaction.promoId;

        if (!promoId) {
          return;
        }

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
        .map(
          (promo) => {
            const item =
              promoMap[promo.id];

            const average =
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
              average,
            )}
                </td>
              </tr>
            `;
          },
        )
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

  /* ============================================================
     SERVICE MAP
     ============================================================ */

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

  /* ============================================================
     METRIC VALUE
     ============================================================ */

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

  /* ============================================================
     REVENUE
     ============================================================ */

  function sumRevenue(
    transactions,
  ) {
    return transactions.reduce(
      (total, transaction) =>
        total +
        Number(
          transaction.price ||
          0,
        ),
      0,
    );
  }

  /* ============================================================
     DISCOUNT
     ============================================================ */

  function sumDiscount(
    transactions,
  ) {
    return transactions.reduce(
      (total, transaction) =>
        total +
        Number(
          transaction.discountAmount ||
          0,
        ),
      0,
    );
  }

  /* ============================================================
     PROMO CHECK
     ============================================================ */

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

  /* ============================================================
     GROWTH
     ============================================================ */

  function calculateGrowth(
    current,
    previous,
  ) {
    const currentValue =
      Number(
        current || 0,
      );

    const previousValue =
      Number(
        previous || 0,
      );

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
      (
        (currentValue -
          previousValue) /
        previousValue
      ) *
      100
    );
  }

  /* ============================================================
     GROWTH UI
     ============================================================ */

  function setGrowthElement(
    id,
    value,
  ) {
    const el =
      document.getElementById(
        id,
      );

    if (!el) {
      return;
    }

    el.classList.remove(
      "positive",
      "negative",
      "neutral",
    );

    if (
      value === null
    ) {
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

  /* ============================================================
     LABELS
     ============================================================ */

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

  /* ============================================================
     CHART TITLES
     ============================================================ */

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

  /* ============================================================
     LEGEND
     ============================================================ */

  function renderTrendLegend(
    datasets,
  ) {
    const container =
      document.getElementById(
        "trendLegend",
      );

    if (!container) {
      return;
    }

    container.innerHTML =
      datasets
        .map(
          (
            dataset,
            index,
          ) => {
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

  /* ============================================================
     CHART DESTROY
     ============================================================ */

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

  /* ============================================================
     GRADIENT
     ============================================================ */

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
        canvas.height || 300,
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

  /* ============================================================
     POINT RADIUS
     ============================================================ */

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

  /* ============================================================
     DATE PARSER
     ============================================================ */

  function parseDate(
    value,
  ) {
    if (
      value instanceof Date
    ) {
      if (
        Number.isNaN(
          value.getTime(),
        )
      ) {
        return new Date(
          "invalid",
        );
      }

      return new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
      );
    }

    const raw =
      String(
        value || "",
      ).trim();

    if (!raw) {
      return new Date(
        "invalid",
      );
    }

    const match =
      raw.match(
        /^(\d{4})-(\d{2})-(\d{2})/,
      );

    if (match) {
      return new Date(
        Number(
          match[1],
        ),
        Number(
          match[2],
        ) - 1,
        Number(
          match[3],
        ),
      );
    }

    const parsed =
      new Date(raw);

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return new Date(
        "invalid",
      );
    }

    return new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
    );
  }

  /* ============================================================
     DATE STRING
     ============================================================ */

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

  /* ============================================================
     ADD DAYS
     ============================================================ */

  function addDays(
    date,
    amount,
  ) {
    const output =
      new Date(
        date,
      );

    output.setDate(
      output.getDate() +
      amount,
    );

    return output;
  }

  /* ============================================================
     DIFF DAYS
     ============================================================ */

  function diffDays(
    start,
    end,
  ) {
    const a =
      parseDate(start);

    const b =
      parseDate(end);

    if (
      Number.isNaN(
        a.getTime(),
      ) ||
      Number.isNaN(
        b.getTime(),
      )
    ) {
      return 0;
    }

    return Math.floor(
      (
        b.getTime() -
        a.getTime()
      ) /
      86400000,
    );
  }

  /* ============================================================
     DATE FORMAT
     ============================================================ */

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
      parseDate(date);

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

  /* ============================================================
     CURRENCY
     ============================================================ */

  function shortCurrency(
    value,
  ) {
    const number =
      Number(
        value || 0,
      );

    if (
      number >=
      1000000000
    ) {
      return (
        "Rp " +
        (
          number /
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
      number >=
      1000000
    ) {
      return (
        "Rp " +
        (
          number /
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
      number >=
      1000
    ) {
      return (
        "Rp " +
        (
          number /
          1000
        )
          .toFixed(0) +
        "K"
      );
    }

    return (
      "Rp " +
      number.toLocaleString(
        "id-ID",
      )
    );
  }

  /* ============================================================
     METRIC FORMAT
     ============================================================ */

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

  /* ============================================================
     SET TEXT
     ============================================================ */

  function setText(
    id,
    value,
  ) {
    const element =
      document.getElementById(
        id,
      );

    if (element) {
      element.textContent =
        value;
    }
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */

  return {
    render,
    refresh,
  };
})();