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
     PUBLIC
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

      normalizeInitialDateInputs();

      updateFilterUI();


      /* --------------------------------------------------------
         PROMO BANNER
         -------------------------------------------------------- */

      try {
        await renderPromoBanner();
      } catch (error) {
        console.error(
          "Promo banner error:",
          error,
        );
      }


      /* --------------------------------------------------------
         KPI
         -------------------------------------------------------- */

      try {
        await renderSummaryCards();
      } catch (error) {
        console.error(
          "Summary cards error:",
          error,
        );
      }


      /* --------------------------------------------------------
         CHARTS
         -------------------------------------------------------- */

      try {
        await renderCharts();
      } catch (error) {
        console.error(
          "Charts error:",
          error,
        );
      }


      /* --------------------------------------------------------
         PROMO PERFORMANCE
         -------------------------------------------------------- */

      try {
        await renderPromoPerformance();
      } catch (error) {
        console.error(
          "Promo performance error:",
          error,
        );
      }


      /* --------------------------------------------------------
         MANAGER INSIGHTS
         -------------------------------------------------------- */

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
     QUICK FILTER
     ============================================================ */

  function setupQuickFilters() {

    document
      .querySelectorAll(
        ".filter-btn[data-filter]",
      )
      .forEach((button) => {

        button.addEventListener(
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


            button.classList.add(
              "active",
            );


            currentFilter =
              button.dataset.filter;


            clearCustomDateRange();


            await render();
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
      .forEach((button) => {

        button.addEventListener(
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


            button.classList.add(
              "active",
            );


            currentChartType =
              button.dataset.chartType;


            await renderCharts();
          },
        );

      });
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


    element.value = "all";


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


        clearDateError();
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

          return;
        }


        clearDateError();
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
     INITIAL DATE INPUTS
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


  /* ============================================================
     CUSTOM RANGE
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
      .forEach((button) => {

        button.classList.toggle(
          "active",
          button.dataset.filter ===
          filter,
        );

      });
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
      element.textContent = "";
    }
  }


  /* ============================================================
     FILTER UI
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


    let promos = [];


    try {

      promos =
        await Store.getActivePromos();

    } catch (error) {

      console.error(
        "Active promo error:",
        error,
      );


      banner.style.display =
        "none";


      return;
    }


    if (
      !Array.isArray(
        promos,
      ) ||
      promos.length === 0
    ) {

      banner.innerHTML = "";

      banner.style.display =
        "none";


      return;
    }


    banner.innerHTML =
      promos
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
  }


  /* ============================================================
     SAFE TRANSACTION LOADER
     ============================================================ */

  function getSafeTransactions() {

    try {

      const result =
        Store.getTransactions();


      if (
        Array.isArray(
          result,
        )
      ) {
        return result;
      }


      return [];

    } catch (error) {

      console.error(
        "Store.getTransactions() error:",
        error,
      );


      return [];
    }
  }


  /* ============================================================
     FILTER BY BRANCH
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


    const iso =
      raw.match(
        /^(\d{4}-\d{2}-\d{2})/,
      );


    if (iso) {
      return iso[1];
    }


    const parsed =
      new Date(
        raw,
      );


    if (
      !Number.isNaN(
        parsed.getTime(),
      )
    ) {

      return toDateString(
        parsed,
      );
    }


    return "";
  }


  /* ============================================================
     FILTER RANGE
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
     CURRENT WEEK
     1-7
     8-14
     15-21
     22-28
     29-END
     ============================================================ */

  function getCurrentWeekRange(
    date,
  ) {

    const current =
      parseDate(
        date,
      );


    const day =
      current.getDate();


    let startDay = 1;


    if (
      day <= 7
    ) {

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
        current.getFullYear(),
        current.getMonth(),
        startDay,
      );


    const lastDay =
      new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0,
      ).getDate();


    let end =
      new Date(
        current.getFullYear(),
        current.getMonth(),
        Math.min(
          startDay + 6,
          lastDay,
        ),
      );


    if (
      end >
      current
    ) {

      end =
        new Date(
          current,
        );
    }


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


    const totalDays =
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
        -(totalDays - 1),
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
     SUMMARY CARDS
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
      sumSales(
        selected,
      );


    const comparisonRevenue =
      sumSales(
        comparison,
      );


    const count =
      selected.length;


    const average =
      count
        ? revenue / count
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
      sumSales(
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


    const all =
      filterBranch(
        getSafeTransactions(),
      );


    let comparisonRange;


    if (
      prefix ===
      "today"
    ) {

      const previous =
        addDays(
          parseDate(
            range.start,
          ),
          -1,
        );


      comparisonRange = {

        start:
          toDateString(
            previous,
          ),

        end:
          toDateString(
            previous,
          ),

      };

    } else {

      comparisonRange =
        getPreviousPeriodRange(
          range.start,
          range.end,
        );

    }


    const comparison =
      filterRange(
        all,
        comparisonRange,
      );


    setGrowthElement(
      `${prefix}Change`,
      calculateGrowth(
        revenue,
        sumSales(
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


    if (!canvas) {
      return;
    }


    const selected =
      getSelectedTransactions();


    const comparison =
      getComparisonTransactions();


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


    const selectedValues =
      selectedBuckets.map(
        (bucket) =>
          bucket.value,
      );


    const datasets = [];


    datasets.push({

      label:
        getPeriodLabel(),

      data:
        selectedValues,

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
          selectedValues,
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
      comparisonBuckets.length
    ) {

      const comparisonValues =
        alignComparison(
          selectedBuckets,
          comparisonBuckets,
        );


      datasets.push({

        label:
          getComparisonLabel(),

        data:
          comparisonValues,

        borderColor:
          "#60a5fa",

        backgroundColor:
          "rgba(96,165,250,0.05)",

        borderWidth:
          2,

        borderDash:
          [
            6,
            5,
          ],

        tension:
          0.35,

        fill:
          false,

        spanGaps:
          false,

        pointRadius:
          getPointRadius(
            comparisonValues,
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

      });
    }


    destroyChart(
      "revenue",
    );


    const chartDatasets =
      currentChartType ===
        "bar"

        ? datasets.map(
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
                ? "rgba(227,0,34,0.85)"
                : "rgba(96,165,250,0.72)",

            borderColor:
              index ===
                0
                ? "#e30022"
                : "#60a5fa",

            borderWidth:
              1,

            borderRadius:
              6,

            borderSkipped:
              false,

            maxBarThickness:
              42,

          }),
        )

        : datasets;


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

          options:
            trendOptions(),

        },
      );


    renderTrendLegend(
      datasets,
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


    if (!canvas) {
      return;
    }


    const selected =
      getSelectedTransactions();


    const map = {};


    selected.forEach(
      (transaction) => {

        const service =
          String(
            transaction.serviceName ||
            "Unknown Service",
          ).trim() ||
          "Unknown Service";


        if (!map[service]) {
          map[service] = 0;
        }


        map[service] +=
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


    if (!canvas) {
      return;
    }


    const selected =
      getSelectedTransactions();


    const comparison =
      getComparisonTransactions();


    const selectedMap =
      serviceMap(
        selected,
      );


    const comparisonMap =
      serviceMap(
        comparison,
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
          6,

        borderSkipped:
          false,

        maxBarThickness:
          40,

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
          comparisonValues,

        backgroundColor:
          "rgba(96,165,250,0.72)",

        borderColor:
          "#60a5fa",

        borderWidth:
          1,

        borderRadius:
          6,

        borderSkipped:
          false,

        maxBarThickness:
          40,

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
              services,

            datasets,

          },

          options:
            serviceComparisonOptions(),

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
          map[bucket.key] ||
          0,

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
          map[bucket.key] ||
          0,

      }),
    );
  }


  /* ============================================================
     ALIGN COMPARISON
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
          : 0,
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
          (map[service] ||
            0) +
          metricValue(
            transaction,
          );

      },
    );


    return map;
  }


  /* ============================================================
     SALES VALUE
     ============================================================ */

  function salesValue(
    transaction,
  ) {

    return Number(
      transaction.price ||
      0,
    );
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


    return salesValue(
      transaction,
    );
  }


  /* ============================================================
     SUM SALES
     ============================================================ */

  function sumSales(
    transactions,
  ) {

    return transactions.reduce(
      (
        total,
        transaction,
      ) =>
        total +
        salesValue(
          transaction,
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
      ) > 0 ||

      Number(
        transaction.discountAmount ||
        0,
      ) > 0

    );
  }


  /* ============================================================
     PROMO PERFORMANCE
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
      sumSales(
        promoTransactions,
      );


    const normalRevenue =
      sumSales(
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
      !promoTransactions.length
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


      if (
        !Array.isArray(
          promos,
        )
      ) {
        promos = [];
      }

    } catch (error) {

      console.error(
        "Promo list error:",
        error,
      );


      promos = [];
    }


    const promoMap = {};


    promoTransactions.forEach(
      (transaction) => {

        if (
          !transaction.promoId
        ) {
          return;
        }


        const id =
          transaction.promoId;


        if (
          !promoMap[id]
        ) {

          promoMap[id] = {

            transactions:
              0,

            revenue:
              0,

            discount:
              0,

          };

        }


        promoMap[id]
          .transactions += 1;


        promoMap[id]
          .revenue +=
          salesValue(
            transaction,
          );


        promoMap[id]
          .discount +=
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
      sumSales(
        selected,
      );


    const comparisonRevenue =
      sumSales(
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
      sumSales(
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
      "none"
    ) {

      if (
        growth !== null
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
        averageGrowth !==
        null
      ) {

        insights.push({

          icon:
            averageGrowth >= 0
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

    } else {

      insights.push({

        icon:
          "💡",

        title:
          "No promo-driven revenue",

        text:
          "Consider whether current promotions are reaching customers.",

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
          "No significant movement detected for the selected period.",

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
     CHART OPTIONS
     ============================================================ */

  function trendOptions() {

    const revenue =
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
                  revenue
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


            callback:
              (value) =>
                revenue
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
              getXAxisLimit(),

          },


          grid: {

            display:
              false,

          },

        },

      },

    };
  }


  /* ============================================================
     SERVICE BAR OPTIONS
     ============================================================ */

  function serviceComparisonOptions() {

    const revenue =
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

                if (
                  revenue
                ) {

                  return `${context.dataset.label}: ${Store.formatCurrency(
                    context.parsed.y,
                  )}`;

                }


                return `${context.dataset.label}: ${context.parsed.y} transactions`;

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
                revenue
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


  /* ============================================================
     X AXIS LIMIT
     ============================================================ */

  function getXAxisLimit() {

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
      return 15;
    }


    if (
      days <= 31
    ) {
      return 10;
    }


    if (
      days <= 180
    ) {
      return 12;
    }


    return 14;
  }


  /* ============================================================
     CHART TITLES
     ============================================================ */

  function updateChartTitles() {

    const revenue =
      currentMetric ===
      "revenue";


    setText(
      "dashRevenueChartTitle",

      revenue
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

      revenue
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

      revenue
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
     DESTROY CHART
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

    const context =
      canvas.getContext(
        "2d",
      );


    const gradient =
      context.createLinearGradient(
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


  /* ============================================================
     POINT RADIUS
     ============================================================ */

  function getPointRadius(
    values,
    base,
  ) {

    return values.map(
      (value) =>
        value ===
          null

          ? 0

          : base,
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
      value > 0
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
      value < 0
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
     SHORT CURRENCY
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
     DATE LABEL
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
      value ?? "",
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