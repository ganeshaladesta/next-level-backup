/* ============================================================
   NEXT LEVEL BEAUTY BAR
   MANAGEMENT DASHBOARD
   FULL DASHBOARD.JS
   ============================================================ */

const Dashboard = (() => {

  /* ============================================================
     CHART INSTANCES
     ============================================================ */

  let revenueChart = null;
  let serviceChart = null;
  let barChart = null;


  /* ============================================================
     STATE
     ============================================================ */

  let currentFilter = "monthly";
  let currentBranch = "all";
  let currentChartType = "line";
  let currentMetric = "revenue";
  let currentCompare = "none";

  let selectedStartDate = "";
  let selectedEndDate = "";

  let transactionCache = [];

  let initialized = false;
  let rendering = false;


  /* ============================================================
     CONSTANTS
     ============================================================ */

  const BRANCHES = [
    "Kemang",
    "LCC",
    "Bintaro",
    "Bandung",
  ];

  const CHART_COLORS = [
    "#e30022",
    "#ff1a3d",
    "#60a5fa",
    "#4ade80",
    "#facc15",
    "#a78bfa",
    "#22d3ee",
    "#fb7185",
    "#c084fc",
    "#94a3b8",
    "#ffffff",
    "#990017",
  ];


  /* ============================================================
     PUBLIC RENDER
     ============================================================ */

  async function render() {

    if (rendering) {
      return;
    }

    rendering = true;

    try {

      if (!initialized) {
        setup();
        initialized = true;
      }


      /* ========================================================
         LOAD TRANSACTIONS
         ======================================================== */

      try {

        const result =
          await Store.getTransactions();

        transactionCache =
          Array.isArray(result)
            ? result
            : [];

        console.log(
          "Dashboard transactions:",
          transactionCache.length,
          transactionCache,
        );

      } catch (error) {

        console.error(
          "Dashboard transaction load error:",
          error,
        );

        transactionCache = [];

      }


      normalizeInitialDateInputs();

      updateFilterUI();


      /* ========================================================
         PROMO BANNER
         ======================================================== */

      try {

        await renderPromoBanner();

      } catch (error) {

        console.error(
          "Promo banner error:",
          error,
        );

      }


      /* ========================================================
         KPI
         ======================================================== */

      try {

        await renderSummaryCards();

      } catch (error) {

        console.error(
          "Summary cards error:",
          error,
        );

      }


      /* ========================================================
         CHARTS
         ======================================================== */

      try {

        await renderCharts();

      } catch (error) {

        console.error(
          "Charts error:",
          error,
        );

      }


      /* ========================================================
         PROMOTION PERFORMANCE
         ======================================================== */

      try {

        await renderPromoPerformance();

      } catch (error) {

        console.error(
          "Promo performance error:",
          error,
        );

      }


      /* ========================================================
         MANAGEMENT INSIGHTS
         ======================================================== */

      try {

        await renderManagerInsights();

      } catch (error) {

        console.error(
          "Manager insights error:",
          error,
        );

      }

    } catch (error) {

      console.error(
        "Dashboard fatal error:",
        error,
      );

    } finally {

      rendering = false;

    }
  }


  async function refresh() {
    await render();
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
     QUICK FILTERS
     ============================================================ */

  function setupQuickFilters() {

    document
      .querySelectorAll(
        ".filter-btn[data-filter]",
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            async () => {

              document
                .querySelectorAll(
                  ".filter-btn[data-filter]",
                )
                .forEach(
                  (item) => {

                    item.classList.remove(
                      "active",
                    );

                  },
                );


              button.classList.add(
                "active",
              );


              currentFilter =
                button.dataset.filter;


              clearCustomDateRange();


              await render();

            },
          );

        },
      );

  }


  /* ============================================================
     CHART TYPE
     ============================================================ */

  function setupChartType() {

    document
      .querySelectorAll(
        ".chart-type-btn",
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            async () => {

              document
                .querySelectorAll(
                  ".chart-type-btn",
                )
                .forEach(
                  (item) => {

                    item.classList.remove(
                      "active",
                    );

                  },
                );


              button.classList.add(
                "active",
              );


              currentChartType =
                button.dataset.chartType;


              await renderCharts();

            },
          );

        },
      );

  }


  /* ============================================================
     METRIC
     ============================================================ */

  function setupMetric() {

    const element =
      document.getElementById(
        "dashMetricFilter",
      );


    if (!element) {
      return;
    }


    currentMetric =
      element.value ||
      "revenue";


    element.addEventListener(
      "change",
      async (event) => {

        currentMetric =
          event.target.value;


        await render();

      },
    );

  }


  /* ============================================================
     BRANCH
     ============================================================ */

  function setupBranch() {

    const element =
      document.getElementById(
        "dashBranchFilter",
      );


    if (!element) {
      return;
    }


    currentBranch =
      element.value ||
      "all";


    BRANCHES.forEach(
      (branch) => {

        const exists =
          Array.from(
            element.options,
          ).some(
            (option) =>
              option.value ===
              branch,
          );


        if (!exists) {

          const option =
            document.createElement(
              "option",
            );


          option.value =
            branch;


          option.textContent =
            branch;


          element.appendChild(
            option,
          );

        }

      },
    );


    element.addEventListener(
      "change",
      async (event) => {

        currentBranch =
          event.target.value ||
          "all";


        await render();

      },
    );

  }


  /* ============================================================
     COMPARE
     ============================================================ */

  function setupCompare() {

    const element =
      document.getElementById(
        "dashCompareFilter",
      );


    if (!element) {
      return;
    }


    currentCompare =
      element.value ||
      "none";


    element.addEventListener(
      "change",
      async (event) => {

        currentCompare =
          event.target.value ||
          "none";


        await render();

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
          end.min =
            start.value;
        }


        if (
          start.value &&
          end.value &&
          end.value <
          start.value
        ) {

          showDateError(
            "End date cannot be earlier than start date.",
          );

        } else {

          clearDateError();

        }

      },
    );


    end.addEventListener(
      "change",
      () => {

        if (
          start.value &&
          end.value &&
          end.value <
          start.value
        ) {

          showDateError(
            "End date cannot be earlier than start date.",
          );

        } else {

          clearDateError();

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


          if (
            !startValue ||
            !endValue
          ) {

            showDateError(
              "Please select both dates.",
            );

            return;

          }


          if (
            endValue <
            startValue
          ) {

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


          await render();

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

          await render();

        },
      );

    }

  }


  /* ============================================================
     DATE PICKER HELPERS
     ============================================================ */

  function normalizeInitialDateInputs() {

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
      end.min =
        start.value;
    }

  }


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

      end.removeAttribute(
        "min",
      );

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
      .forEach(
        (button) => {

          button.classList.toggle(
            "active",
            button.dataset.filter ===
            filter,
          );

        },
      );

  }


  function showDateError(
    message,
  ) {

    const element =
      document.getElementById(
        "dashDateError",
      );


    if (element) {
      element.textContent =
        message;
    }

  }


  function clearDateError() {

    const element =
      document.getElementById(
        "dashDateError",
      );


    if (element) {
      element.textContent =
        "";
    }

  }


  /* ============================================================
     UI STATE
     ============================================================ */

  function updateFilterUI() {

    setText(
      "dashboardFilterStatus",
      getPeriodLabel(),
    );


    setText(
      "dashPeriodLabel",
      getPeriodLabel(),
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


    if (!banner) {
      return;
    }


    let active = [];


    try {

      active =
        await Store.getActivePromos();

    } catch (error) {

      console.error(
        "Active promotion error:",
        error,
      );


      banner.innerHTML = "";

      banner.style.display =
        "none";


      return;

    }


    if (
      !Array.isArray(
        active,
      ) ||
      active.length ===
      0
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
              ? " · " +
              escapeHtml(
                promo.description,
              )
              : ""
            }

              </span>

            </div>

          `,
        )
        .join("");


    banner.style.display =
      "flex";

  }


  /* ============================================================
     SAFE TRANSACTION LOADER
     ============================================================ */

  function getSafeTransactions() {

    return Array.isArray(
      transactionCache,
    )
      ? transactionCache
      : [];

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


    const branch =
      String(
        currentBranch ||
        "",
      )
        .trim()
        .toLowerCase();


    return transactions.filter(
      (transaction) =>
        String(
          transaction.branch ||
          "",
        )
          .trim()
          .toLowerCase() ===
        branch,
    );

  }


  /* ============================================================
     DATE NORMALIZER
     ============================================================ */

  function normalizeDate(
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


      return toDateString(
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


    const isoMatch =
      raw.match(
        /^(\d{4}-\d{2}-\d{2})/,
      );


    if (isoMatch) {

      return isoMatch[1];

    }


    const parsed =
      new Date(
        raw,
      );


    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {

      return "";

    }


    return toDateString(
      parsed,
    );

  }


  /* ============================================================
     RANGE FILTER
     ============================================================ */

  function filterRange(
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

        const date =
          normalizeDate(
            transaction.date,
          );


        if (!date) {
          return false;
        }


        return (
          date >=
          range.start &&
          date <=
          range.end
        );

      },
    );

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


    const today =
      Store.getTodayStr();


    if (
      currentFilter ===
      "daily"
    ) {

      return {

        start:
          today,

        end:
          today,

      };

    }


    if (
      currentFilter ===
      "weekly"
    ) {

      return getCurrentWeekRange(
        today,
      );

    }


    if (
      currentFilter ===
      "yearly"
    ) {

      return {

        start:
          `${today.substring(
            0,
            4,
          )}-01-01`,

        end:
          today,

      };

    }


    return {

      start:
        `${today.substring(
          0,
          7,
        )}-01`,

      end:
        today,

    };

  }


  /* ============================================================
   WEEKLY RANGE

   THIS WEEK = 7 HARI TERAKHIR
   TERMASUK HARI INI.

   Contoh:
   29 Aug 2026

   Start = 23 Aug 2026
   End   = 29 Aug 2026
   ============================================================ */

  function getCurrentWeekRange(
    date,
  ) {

    const current =
      parseDate(
        date,
      );


    /* ==========================================================
       INVALID DATE SAFETY
       ========================================================== */

    if (
      Number.isNaN(
        current.getTime(),
      )
    ) {

      return {

        start:
          date,

        end:
          date,

      };

    }


    /* ==========================================================
       END DATE
       
       = TODAY
       ========================================================== */

    const end =
      new Date(
        current,
      );


    end.setHours(
      23,
      59,
      59,
      999,
    );


    /* ==========================================================
       START DATE
       
       = 6 HARI SEBELUM HARI INI
       
       Jadi total 7 hari:
       
       23
       24
       25
       26
       27
       28
       29
       ========================================================== */

    const start =
      new Date(
        current,
      );


    start.setDate(
      start.getDate() - 6,
    );


    start.setHours(
      0,
      0,
      0,
      0,
    );


    /* ==========================================================
       RETURN
       ========================================================== */

    return {

      start:
        toDateString(
          start,
        ),

      end:
        toDateString(
          end,
        ),

    };

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
     PREVIOUS PERIOD
     ============================================================ */

  function getPreviousPeriodRange(
    start,
    end,
  ) {

    const startDate =
      parseDate(
        start,
      );


    const days =
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
        -(
          days -
          1
        ),
      );


    return {

      start:
        toDateString(
          previousStart,
        ),

      end:
        toDateString(
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

    const first =
      parseDate(
        start,
      );


    const last =
      parseDate(
        end,
      );


    return {

      start:
        toDateString(
          new Date(
            first.getFullYear() - 1,
            first.getMonth(),
            first.getDate(),
          ),
        ),

      end:
        toDateString(
          new Date(
            last.getFullYear() - 1,
            last.getMonth(),
            last.getDate(),
          ),
        ),

    };

  }


  /* ============================================================
     SELECTED TRANSACTIONS
     ============================================================ */

  function getSelectedTransactions() {

    const transactions =
      filterBranch(
        getSafeTransactions(),
      );


    return filterRange(
      transactions,
      getSelectedRange(),
    );

  }


  /* ============================================================
     COMPARISON TRANSACTIONS
     ============================================================ */

  function getComparisonTransactions() {

    const range =
      getComparisonRange();


    if (!range) {
      return [];
    }


    const transactions =
      filterBranch(
        getSafeTransactions(),
      );


    return filterRange(
      transactions,
      range,
    );

  }


  /* ============================================================
     SUMMARY / KPI
     ============================================================ */

  async function renderSummaryCards() {

    const transactions =
      filterBranch(
        getSafeTransactions(),
      );


    const today =
      Store.getTodayStr();


    const todayRange = {

      start:
        today,

      end:
        today,

    };


    const weekRange =
      getCurrentWeekRange(
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


    await renderSingleKPI(
      "today",
      filterRange(
        transactions,
        todayRange,
      ),
      todayRange,
    );


    await renderSingleKPI(
      "week",
      filterRange(
        transactions,
        weekRange,
      ),
      weekRange,
    );


    await renderSingleKPI(
      "month",
      filterRange(
        transactions,
        monthRange,
      ),
      monthRange,
    );


    await renderSingleKPI(
      "year",
      filterRange(
        transactions,
        yearRange,
      ),
      yearRange,
    );


    const selected =
      filterRange(
        transactions,
        getSelectedRange(),
      );


    const comparison =
      filterRange(
        transactions,
        getComparisonRange(),
      );


    const revenue =
      sumRevenue(
        selected,
      );


    const comparisonRevenue =
      sumRevenue(
        comparison,
      );


    const count =
      selected.length;


    const average =
      count
        ? revenue /
        count
        : 0;


    setText(
      "dashTotalRevenue",
      Store.formatCurrency(
        revenue,
      ),
    );


    setText(
      "dashTotalTransactions",
      count.toLocaleString(
        "id-ID",
      ),
    );


    setText(
      "dashAverageTicket",
      Store.formatCurrency(
        average,
      ),
    );


    setText(
      "dashTotalDiscount",
      Store.formatCurrency(
        sumDiscount(
          selected,
        ),
      ),
    );


    setGrowthElement(
      "dashGrowth",
      calculateGrowth(
        revenue,
        comparisonRevenue,
      ),
    );

  }


  /* ============================================================
     SINGLE KPI
     ============================================================ */

  async function renderSingleKPI(
    prefix,
    currentData,
    range,
  ) {

    const revenue =
      sumRevenue(
        currentData,
      );


    const count =
      currentData.length;


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


    const comparisonRange =
      getPreviousPeriodRange(
        range.start,
        range.end,
      );


    const comparison =
      filterRange(
        filterBranch(
          getSafeTransactions(),
        ),
        comparisonRange,
      );


    setGrowthElement(
      `${prefix}Change`,
      calculateGrowth(
        revenue,
        sumRevenue(
          comparison,
        ),
      ),
    );

  }


  /* ============================================================
     CHARTS
     ============================================================ */

  async function renderCharts() {

    updateChartTitles();


    await _renderRevenueChart();


    await _renderServiceChart();


    await _renderBarChart();

  }


  /* ============================================================
     REVENUE / TREND CHART
     ============================================================ */

  async function _renderRevenueChart() {

    const canvas =
      document.getElementById(
        "revenueChart",
      );


    if (!canvas) {

      console.warn(
        "revenueChart canvas not found",
      );

      return;

    }


    const dataResult =
      await _getRevenueData();


    const labels =
      dataResult.labels ||
      [];


    const data =
      dataResult.data ||
      [];


    const comparisonData =
      dataResult.comparisonData ||
      [];


    const comparisonLabel =
      dataResult.comparisonLabel ||
      "";


    if (revenueChart) {

      revenueChart.destroy();

      revenueChart = null;

    }


    const container =
      canvas.parentElement;


    if (container) {

      container.style.position =
        "relative";

      container.style.width =
        "100%";

      container.style.height =
        "320px";

    }


    canvas.style.display =
      "block";

    canvas.style.width =
      "100%";

    canvas.style.height =
      "100%";


    const isRevenue =
      currentMetric ===
      "revenue";


    const isLine =
      currentChartType ===
      "line";


    const datasets = [];


    datasets.push({

      label:
        getPeriodLabel(),

      data:

        data,

      borderColor:
        "#e30022",

      backgroundColor:

        isLine
          ? _gradient(
            canvas,
            "#e30022",
          )
          : "#e30022",

      borderWidth:
        3,

      fill:
        isLine,

      tension:
        0.35,

      spanGaps:
        false,

      borderRadius:
        isLine
          ? 0
          : 7,

      pointBackgroundColor:
        "#e30022",

      pointBorderColor:
        "#ffffff",

      pointBorderWidth:
        2,

      pointRadius:
        data.map(
          (value) =>
            value === null
              ? 0
              : 3,
        ),

      pointHoverRadius:
        6,

      maxBarThickness:
        48,

    });


    if (
      Array.isArray(
        comparisonData,
      ) &&
      comparisonData.length >
      0 &&
      currentCompare !==
      "none"
    ) {

      datasets.push({

        label:
          comparisonLabel ||
          "Comparison",

        data:
          comparisonData,

        borderColor:
          "#60a5fa",

        backgroundColor:
          "transparent",

        borderWidth:
          2,

        borderDash:
          [
            6,
            5,
          ],

        fill:
          false,

        tension:
          0.35,

        spanGaps:
          false,

        pointBackgroundColor:
          "#60a5fa",

        pointBorderColor:
          "#ffffff",

        pointBorderWidth:
          1.5,

        pointRadius:
          comparisonData.map(
            (value) =>
              value ===
                null
                ? 0
                : 2,
          ),

      });

    }


    console.log(
      "TREND CHART:",
      {
        labels,
        data,
        comparisonData,
      },
    );


    const chartDatasets =
      isLine
        ? datasets
        : datasets.map(
          (
            dataset,
            index,
          ) => ({

            label:
              dataset.label,

            data:
              dataset.data,

            backgroundColor:
              index ===
                0
                ? "#e30022"
                : "#60a5fa",

            borderColor:
              index ===
                0
                ? "#e30022"
                : "#60a5fa",

            borderWidth:
              1,

            borderRadius:
              7,

            borderSkipped:
              false,

            maxBarThickness:
              48,

          }),
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
              chartDatasets,

          },


          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,


            animation: {

              duration:
                500,

            },


            interaction: {

              intersect:
                false,

              mode:
                "index",

            },


            plugins: {

              legend: {

                display:
                  datasets.length >
                  1,

                labels: {

                  color:
                    "#f4f4f5",

                  usePointStyle:
                    true,

                  padding:
                    15,

                },

              },


              tooltip: {

                backgroundColor:
                  "#18181b",

                borderColor:
                  "#27272a",

                borderWidth:
                  1,

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

                  callback:
                    (value) =>

                      isRevenue
                        ? _shortCurrency(
                          value,
                        )
                        : value,

                },


                grid: {

                  color:
                    "rgba(255,255,255,0.05)",

                },

              },


              x: {

                ticks: {

                  color:
                    "#a1a1aa",

                  autoSkip:
                    true,

                  maxTicksLimit:
                    currentFilter ===
                      "daily"
                      ? 10
                      : 12,

                  maxRotation:
                    0,

                  minRotation:
                    0,

                },


                grid: {

                  display:
                    false,

                },

              },

            },

          },

        },
      );


    renderTrendLegend(
      datasets,
    );

  }


  /* ============================================================
     REVENUE DATA
     ============================================================ */

  async function _getRevenueData() {

    const all =
      filterBranch(
        getSafeTransactions(),
      );


    const selectedRange =
      getSelectedRange();


    const selected =
      filterRange(
        all,
        selectedRange,
      );


    const comparisonRange =
      getComparisonRange();


    const comparison =
      comparisonRange
        ? filterRange(
          all,
          comparisonRange,
        )
        : [];


    const selectedBuckets =
      buildBuckets(
        selectedRange.start,
        selectedRange.end,
        selected,
      );


    const comparisonBuckets =
      comparisonRange
        ? buildBuckets(
          comparisonRange.start,
          comparisonRange.end,
          comparison,
        )
        : [];


    const labels =
      selectedBuckets.map(
        (bucket) =>
          bucket.label,
      );


    const data =
      selectedBuckets.map(
        (bucket) =>
          bucket.value,
      );


    let comparisonData =
      [];


    if (
      comparisonBuckets.length >
      0
    ) {

      comparisonData =
        alignComparison(
          selectedBuckets,
          comparisonBuckets,
        );

    }


    return {

      labels,

      data,

      comparisonData,

      comparisonLabel:
        getComparisonLabel(),

    };

  }


  /* ============================================================
     SERVICE DOUGHNUT
     ============================================================ */

  async function _renderServiceChart() {

    const canvas =
      document.getElementById(
        "serviceChart",
      );


    if (!canvas) {

      console.warn(
        "serviceChart canvas not found",
      );

      return;

    }


    const {
      labels,
      data,
      colors,
    } =
      await _getServiceData();


    if (serviceChart) {

      serviceChart.destroy();

      serviceChart = null;

    }


    const container =
      canvas.parentElement;


    if (container) {

      container.style.position =
        "relative";

      container.style.width =
        "100%";

      container.style.height =
        "300px";

    }


    canvas.style.display =
      "block";

    canvas.style.width =
      "100%";

    canvas.style.height =
      "100%";


    console.log(
      "SERVICE CHART:",
      {
        labels,
        data,
      },
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
                  colors.length
                    ? colors
                    : [
                      "#e30022",
                      "#60a5fa",
                      "#4ade80",
                      "#facc15",
                    ],

                borderColor:
                  "#121214",

                borderWidth:
                  3,

                hoverOffset:
                  6,

              },

            ],

          },


          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            cutout:
              "64%",


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

                backgroundColor:
                  "#18181b",

                borderColor:
                  "#27272a",

                borderWidth:
                  1,


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


                      const percent =
                        total >
                          0
                          ? (
                            (
                              value /
                              total
                            ) *
                            100
                          ).toFixed(
                            1,
                          )
                          : "0.0";


                      return currentMetric ===
                        "revenue"

                        ? `${context.label}: ${Store.formatCurrency(
                          value,
                        )} (${percent}%)`

                        : `${context.label}: ${value} transactions (${percent}%)`;

                    },

                },

              },

            },

          },

        },
      );

  }


  /* ============================================================
     SERVICE DATA
     ============================================================ */

  async function _getServiceData() {

    const selected =
      getSelectedTransactions();


    const map = {};


    selected.forEach(
      (transaction) => {

        const name =
          String(
            transaction.serviceName ||
            "Unknown Service",
          ).trim() ||
          "Unknown Service";


        if (!map[name]) {

          map[name] =
            0;

        }


        map[name] +=
          metricValue(
            transaction,
          );

      },
    );


    const entries =
      Object.entries(
        map,
      )
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
          CHART_COLORS[
          index %
          CHART_COLORS.length
          ],
      );


    return {

      labels,

      data,

      colors,

    };

  }


  /* ============================================================
     SERVICE COMPARISON
     ============================================================ */

  async function _renderBarChart() {

    const canvas =
      document.getElementById(
        "barChart",
      );


    if (!canvas) {

      console.warn(
        "barChart canvas not found",
      );

      return;

    }


    const {
      labels,
      data,
      colors,
    } =
      await _getServiceData();


    if (barChart) {

      barChart.destroy();

      barChart = null;

    }


    const container =
      canvas.parentElement;


    if (container) {

      container.style.position =
        "relative";

      container.style.width =
        "100%";

      container.style.height =
        "320px";

    }


    canvas.style.display =
      "block";

    canvas.style.width =
      "100%";

    canvas.style.height =
      "100%";


    const isRevenue =
      currentMetric ===
      "revenue";


    console.log(
      "BAR CHART:",
      {
        labels,
        data,
      },
    );


    const selectedMap =
      serviceMap(
        getSelectedTransactions(),
      );


    const comparisonMap =
      serviceMap(
        getComparisonTransactions(),
      );


    const services =
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


    const selectedValues =
      services.map(
        (service) =>
          selectedMap[
          service
          ] || 0,
      );


    const comparisonValues =
      services.map(
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
          selectedValues,

        backgroundColor:
          "rgba(227,0,34,0.85)",

        borderColor:
          "#e30022",

        borderWidth:
          1,

        borderRadius:
          7,

        borderSkipped:
          false,

        maxBarThickness:
          48,

      },

    ];


    if (
      currentCompare !==
      "none" &&
      comparisonValues.length >
      0
    ) {

      datasets.push({

        label:
          getComparisonLabel(),

        data:
          comparisonValues,

        backgroundColor:
          "rgba(96,165,250,0.72)",

        borderColor:
          "#60a5fa",

        borderWidth:
          1,

        borderRadius:
          7,

        borderSkipped:
          false,

        maxBarThickness:
          48,

      });

    }


    barChart =
      new Chart(
        canvas,
        {

          type:
            "bar",


          data: {

            labels:
              services,

            datasets,

          },


          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            animation: {

              duration:
                500,

            },


            interaction: {

              intersect:
                false,

              mode:
                "index",

            },


            plugins: {

              legend: {

                display:
                  datasets.length >
                  1,


                labels: {

                  color:
                    "#a1a1aa",

                  usePointStyle:
                    true,

                  pointStyle:
                    "circle",

                },

              },


              tooltip: {

                backgroundColor:
                  "#18181b",

                borderColor:
                  "#27272a",

                borderWidth:
                  1,


                callbacks: {

                  label:
                    (context) => {

                      return isRevenue

                        ? `${context.dataset.label}: ${Store.formatCurrency(
                          context.parsed.y,
                        )}`

                        : `${context.dataset.label}: ${context.parsed.y} transactions`;

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

                  callback:
                    (value) =>

                      isRevenue
                        ? _shortCurrency(
                          value,
                        )
                        : value,

                },


                grid: {

                  color:
                    "rgba(255,255,255,0.05)",

                },

              },


              x: {

                ticks: {

                  color:
                    "#a1a1aa",

                  autoSkip:
                    true,

                  maxTicksLimit:
                    10,

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

          },

        },
      );

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
      days <=
      31
    ) {

      return buildDailyBuckets(
        start,
        end,
        transactions,
      );

    }


    if (
      days <=
      180
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
      parseDate(
        start,
      );


    const finish =
      parseDate(
        end,
      );


    while (
      cursor <=
      finish
    ) {

      const key =
        toDateString(
          cursor,
        );


      map[key] =
        0;


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

        const date =
          normalizeDate(
            transaction.date,
          );


        if (
          date &&
          Object.prototype.hasOwnProperty.call(
            map,
            date,
          )
        ) {

          map[date] +=
            metricValue(
              transaction,
            );

        }

      },
    );


    return buckets.map(
      (bucket) => ({

        ...bucket,

        value:
          map[
          bucket.key
          ] || 0,

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
      parseDate(
        start,
      );


    const finish =
      parseDate(
        end,
      );


    while (
      cursor <=
      finish
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
        weekEnd >
        finish
      ) {

        weekEnd =
          new Date(
            finish,
          );

      }


      buckets.push({

        key:
          toDateString(
            weekStart,
          ),

        start:
          toDateString(
            weekStart,
          ),

        end:
          toDateString(
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
          normalizeDate(
            transaction.date,
          );


        if (!normalized) {
          return;
        }


        const date =
          parseDate(
            normalized,
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
            metricValue(
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
      parseDate(
        start,
      );


    const finish =
      parseDate(
        end,
      );


    let cursor =
      new Date(
        first.getFullYear(),
        first.getMonth(),
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


      map[key] =
        0;


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
          normalizeDate(
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
            metricValue(
              transaction,
            );

        }

      },
    );


    return buckets.map(
      (bucket) => ({

        ...bucket,

        value:
          map[
          bucket.key
          ] || 0,

      }),
    );

  }


  /* ============================================================
     COMPARISON ALIGNMENT
     ============================================================ */

  function alignComparison(
    selectedBuckets,
    comparisonBuckets,
  ) {

    return selectedBuckets.map(
      (_, index) =>
        comparisonBuckets[index]
          ? comparisonBuckets[index]
            .value
          : null,
    );

  }


  /* ============================================================
     SERVICE MAP
     ============================================================ */

  function serviceMap(
    transactions,
  ) {

    const map = {};


    transactions.forEach(
      (transaction) => {

        const service =
          String(
            transaction.serviceName ||
            "Unknown Service",
          ).trim() ||
          "Unknown Service";


        map[service] =
          (
            map[service] ||
            0
          ) +
          metricValue(
            transaction,
          );

      },
    );


    return map;

  }


  /* ============================================================
     METRIC VALUE
     ============================================================ */

  function metricValue(
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
     SUM REVENUE
     ============================================================ */

  function sumRevenue(
    transactions,
  ) {

    if (
      !Array.isArray(
        transactions,
      )
    ) {

      return 0;

    }


    return transactions.reduce(
      (
        total,
        transaction,
      ) =>
        total +
        Number(
          transaction.price ||
          0,
        ),

      0,
    );

  }


  /* ============================================================
     SUM DISCOUNT
     ============================================================ */

  function sumDiscount(
    transactions,
  ) {

    if (
      !Array.isArray(
        transactions,
      )
    ) {

      return 0;

    }


    return transactions.reduce(
      (
        total,
        transaction,
      ) =>
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
      ) >
      0 ||

      Number(
        transaction.discountAmount ||
        0,
      ) >
      0

    );

  }


  /* ============================================================
     PROMOTION PERFORMANCE
     ============================================================ */

  async function renderPromoPerformance() {

    const container =
      document.getElementById(
        "promoPerformance",
      );


    const selected =
      getSelectedTransactions();


    const promoTransactions =
      selected.filter(
        isPromoTransaction,
      );


    const normalTransactions =
      selected.filter(
        (transaction) =>
          !isPromoTransaction(
            transaction,
          ),
      );


    const promoRevenue =
      sumRevenue(
        promoTransactions,
      );


    const normalRevenue =
      sumRevenue(
        normalTransactions,
      );


    const totalRevenue =
      promoRevenue +
      normalRevenue;


    const contribution =
      totalRevenue
        ? (
          promoRevenue /
          totalRevenue
        ) *
        100
        : 0;


    const promoAverage =
      promoTransactions.length
        ? promoRevenue /
        promoTransactions.length
        : 0;


    const normalAverage =
      normalTransactions.length
        ? normalRevenue /
        normalTransactions.length
        : 0;


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
      `${contribution.toFixed(
        1,
      )}%`,
    );


    setText(
      "promoTransactionCount",
      promoTransactions.length.toLocaleString(
        "id-ID",
      ),
    );


    setText(
      "nonPromoTransactionCount",
      normalTransactions.length.toLocaleString(
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
        sumDiscount(
          promoTransactions,
        ),
      ),
    );


    if (!container) {
      return;
    }


    if (
      promoTransactions.length ===
      0
    ) {

      container.innerHTML = `

        <div class="empty-state">

          No promotion transactions
          in the selected period.

        </div>

      `;

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

      promos = [];

    }


    if (
      !Array.isArray(
        promos,
      )
    ) {

      promos = [];

    }


    const promoMap = {};


    promoTransactions.forEach(
      (transaction) => {

        const promoId =
          transaction.promoId;


        if (!promoId) {
          return;
        }


        if (
          !promoMap[
          promoId
          ]
        ) {

          promoMap[
            promoId
          ] = {

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
        ].transactions +=
          1;


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
            promoMap[
            promo.id
            ],
        )
        .sort(
          (a, b) =>
            promoMap[
              b.id
            ].revenue -
            promoMap[
              a.id
            ].revenue,
        )
        .map(
          (promo) => {

            const item =
              promoMap[
              promo.id
              ];


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

          Promotion transactions exist,
          but no matching promotion record
          was found.

        </div>

      `;

      return;

    }


    container.innerHTML = `

      <div class="table-responsive">

        <table class="data-table">

          <thead>

            <tr>

              <th>
                Promotion
              </th>

              <th>
                Transactions
              </th>

              <th>
                Revenue
              </th>

              <th>
                Discount
              </th>

              <th>
                Avg Ticket
              </th>

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
     MANAGEMENT INSIGHTS
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
      getSelectedTransactions();


    const comparison =
      getComparisonTransactions();


    if (
      selected.length ===
      0
    ) {

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
              in the selected period.
            </span>

          </div>

        </div>

      `;

      return;

    }


    const revenue =
      sumRevenue(
        selected,
      );


    const comparisonRevenue =
      sumRevenue(
        comparison,
      );


    const growth =
      calculateGrowth(
        revenue,
        comparisonRevenue,
      );


    const average =
      selected.length
        ? revenue /
        selected.length
        : 0;


    const comparisonAverage =
      comparison.length
        ? comparisonRevenue /
        comparison.length
        : 0;


    const averageGrowth =
      calculateGrowth(
        average,
        comparisonAverage,
      );


    const promoTransactions =
      selected.filter(
        isPromoTransaction,
      );


    const promoRevenue =
      sumRevenue(
        promoTransactions,
      );


    const promoContribution =
      revenue
        ? (
          promoRevenue /
          revenue
        ) *
        100
        : 0;


    const services =
      serviceMap(
        selected,
      );


    const topService =
      Object.entries(
        services,
      ).sort(
        (a, b) =>
          b[1] -
          a[1],
      )[0];


    const insights = [];


    if (
      currentCompare !==
      "none" &&
      growth !==
      null
    ) {

      insights.push({

        icon:
          growth >= 0
            ? "📈"
            : "📉",

        title:
          growth >= 0
            ? `Revenue up ${growth.toFixed(
              1,
            )}%`
            : `Revenue down ${Math.abs(
              growth,
            ).toFixed(
              1,
            )}%`,

        text:
          `Compared with ${getComparisonLabel()}.`,

      });

    }


    if (
      currentCompare !==
      "none" &&
      averageGrowth !==
      null
    ) {

      insights.push({

        icon:
          averageGrowth >=
            0
            ? "🎯"
            : "⚠️",

        title:
          `Average ticket ${averageGrowth >=
            0
            ? "up"
            : "down"
          } ${Math.abs(
            averageGrowth,
          ).toFixed(
            1,
          )}%`,

        text:
          `Current average: ${Store.formatCurrency(
            average,
          )}.`,

      });

    }


    if (topService) {

      insights.push({

        icon:
          "🏆",

        title:
          `${topService[0]} leads service sales`,

        text:
          `${formatMetric(
            topService[1],
          )} in the selected period.`,

      });

    }


    if (
      promoContribution >
      0
    ) {

      insights.push({

        icon:
          "🎉",

        title:
          `Promos contribute ${promoContribution.toFixed(
            1,
          )}% of revenue`,

        text:
          `${promoTransactions.length} promo transactions recorded.`,

      });

    }


    if (
      insights.length ===
      0
    ) {

      insights.push({

        icon:
          "📊",

        title:
          "Performance is stable",

        text:
          "No comparison selected. Use Compare With to analyze movement.",

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
     UPDATE TITLES
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
              index ===
                0
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
     GRADIENT
     ============================================================ */

  function _gradient(
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
      color + "55",
    );


    gradient.addColorStop(
      1,
      color + "00",
    );


    return gradient;

  }


  /* ============================================================
     SHORT CURRENCY
     ============================================================ */

  function _shortCurrency(
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
      previousValue ===
      0
    ) {

      if (
        currentValue ===
        0
      ) {

        return 0;

      }


      return null;

    }


    return (
      (
        (
          currentValue -
          previousValue
        ) /
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

    const element =
      document.getElementById(
        id,
      );


    if (!element) {
      return;
    }


    element.classList.remove(
      "positive",
      "negative",
      "neutral",
    );


    if (
      value ===
      null
    ) {

      element.textContent =
        "New";


      element.classList.add(
        "positive",
      );


      return;

    }


    if (
      value >
      0
    ) {

      element.textContent =
        `↑ ${Math.abs(
          value,
        ).toFixed(
          1,
        )}%`;


      element.classList.add(
        "positive",
      );


      return;

    }


    if (
      value <
      0
    ) {

      element.textContent =
        `↓ ${Math.abs(
          value,
        ).toFixed(
          1,
        )}%`;


      element.classList.add(
        "negative",
      );


      return;

    }


    element.textContent =
      "—";


    element.classList.add(
      "neutral",
    );

  }


  /* ============================================================
     PERIOD LABEL
     ============================================================ */

  function getPeriodLabel() {

    if (
      hasCustomDateRange()
    ) {

      return `${formatDate(
        selectedStartDate,
      )} → ${formatDate(
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


  /* ============================================================
     COMPARISON LABEL
     ============================================================ */

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


    return `${formatDate(
      range.start,
    )} → ${formatDate(
      range.end,
    )}`;

  }


  /* ============================================================
     FORMAT METRIC
     ============================================================ */

  function formatMetric(
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
        value ||
        "",
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
      new Date(
        raw,
      );


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

  function toDateString(
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


  /* ============================================================
     DIFFERENCE DAYS
     ============================================================ */

  function diffDays(
    start,
    end,
  ) {

    const first =
      parseDate(
        start,
      );


    const last =
      parseDate(
        end,
      );


    if (
      Number.isNaN(
        first.getTime(),
      ) ||
      Number.isNaN(
        last.getTime(),
      )
    ) {

      return 0;

    }


    return Math.floor(
      (
        last.getTime() -
        first.getTime()
      ) /
      86400000,
    );

  }


  /* ============================================================
     SHORT DATE
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


  /* ============================================================
     DATE DISPLAY
     ============================================================ */

  function formatDate(
    value,
  ) {

    const date =
      parseDate(
        value,
      );


    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {

      return "—";

    }


    return date.toLocaleDateString(
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
     ESCAPE HTML
     ============================================================ */

  function escapeHtml(
    value,
  ) {

    return String(
      value ??
      "",
    )

      .replace(
        /&/g,
        "&amp;",
      )

      .replace(
        /</g,
        "&lt;",
      )

      .replace(
        />/g,
        "&gt;",
      )

      .replace(
        /"/g,
        "&quot;",
      )

      .replace(
        /'/g,
        "&#039;",
      );

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