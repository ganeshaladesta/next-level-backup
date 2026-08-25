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
  let currentMetric = "revenue";

  let initialized = false;

  const BRANCHES = [
    "Kemang",
    "LCC",
    "Bintaro",
    "Bandung",
  ];

  /* ============================================================
     PUBLIC RENDER
     ============================================================ */

  async function render() {
    try {
      if (!initialized) {
        _setup();
        initialized = true;
      }

      await renderPromoBanner();
      await renderSummaryCards();
      await renderCharts();
      await renderPromoPerformance();

    } catch (error) {
      console.error(
        "Dashboard render error:",
        error,
      );
    }
  }

  /* ============================================================
     SETUP
     ============================================================ */

  function _setup() {

    /* ----------------------------------------------------------
       TIMEFRAME
       ---------------------------------------------------------- */

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
              .forEach((b) => {
                b.classList.remove(
                  "active",
                );
              });

            btn.classList.add(
              "active",
            );

            currentFilter =
              btn.dataset.filter;

            await refreshDashboard();
          },
        );
      });


    /* ----------------------------------------------------------
       CHART TYPE
       ---------------------------------------------------------- */

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
              .forEach((b) => {
                b.classList.remove(
                  "active",
                );
              });

            btn.classList.add(
              "active",
            );

            currentChartType =
              btn.dataset.chartType;

            await renderCharts();
          },
        );
      });


    /* ----------------------------------------------------------
       METRIC
       ---------------------------------------------------------- */

    const metricFilter =
      document.getElementById(
        "dashMetricFilter",
      );

    if (metricFilter) {

      metricFilter.addEventListener(
        "change",
        async (e) => {

          currentMetric =
            e.target.value;

          await refreshDashboard();
        },
      );
    }


    /* ----------------------------------------------------------
       BRANCH
       ---------------------------------------------------------- */

    const branchFilter =
      document.getElementById(
        "dashBranchFilter",
      );

    if (branchFilter) {

      BRANCHES.forEach(
        (branch) => {

          if (
            ![
              ...branchFilter.options,
            ].some(
              (option) =>
                option.value ===
                branch,
            )
          ) {

            const option =
              document.createElement(
                "option",
              );

            option.value =
              branch;

            option.textContent =
              branch;

            branchFilter.appendChild(
              option,
            );
          }
        },
      );


      branchFilter.addEventListener(
        "change",
        async (e) => {

          currentBranch =
            e.target.value;

          await refreshDashboard();
        },
      );
    }
  }

  /* ============================================================
     REFRESH
     ============================================================ */

  async function refreshDashboard() {

    await renderSummaryCards();

    await renderCharts();

    await renderPromoPerformance();
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
          (p) => `
            <div class="promo-badge-item">

              <span class="promo-badge-icon">
                🎉
              </span>

              <span>

                <strong>
                  ${escapeHtml(
            p.name,
          )}
                </strong>

                — ${Number(
            p.discount || 0,
          )}% Off

                ${p.description
              ? " · " +
              escapeHtml(
                p.description,
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
     SUMMARY / KPI
     
     ORDER:
     TODAY
     THIS WEEK
     THIS MONTH
     THIS YEAR
     
     NOTE:
     KPI tidak mengikuti currentFilter.
     Masing-masing card selalu menunjukkan
     periodenya sendiri.
     ============================================================ */

  async function renderSummaryCards() {

    let all =
      await Store.getTransactions();

    all =
      filterBranch(all);

    const today =
      Store.getTodayStr();

    const todayDate =
      new Date(
        `${today}T00:00:00`,
      );


    /* ==========================================================
       TODAY
       ========================================================== */

    const todayTxns =
      all.filter(
        (t) =>
          t.date === today,
      );


    /* ==========================================================
       THIS WEEK

       Weekly system:

       1 - 7
       8 - 14
       15 - 21
       22 - 28
       29 - end of month
       ========================================================== */

    const currentDay =
      todayDate.getDate();

    let weekStartDay;

    if (
      currentDay <= 7
    ) {

      weekStartDay = 1;

    } else if (
      currentDay <= 14
    ) {

      weekStartDay = 8;

    } else if (
      currentDay <= 21
    ) {

      weekStartDay = 15;

    } else if (
      currentDay <= 28
    ) {

      weekStartDay = 22;

    } else {

      weekStartDay = 29;
    }


    const weekStart =
      new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        weekStartDay,
      );


    const weekEnd =
      new Date(
        todayDate.getFullYear(),
        todayDate.getMonth() + 1,
        0,
      );


    const weekStartStr =
      _dateStr(
        weekStart,
      );

    const weekEndStr =
      _dateStr(
        weekEnd,
      );


    const weekTxns =
      all.filter(
        (t) =>
          t.date >=
          weekStartStr &&
          t.date <=
          weekEndStr,
      );


    /* ==========================================================
       THIS MONTH
       ========================================================== */

    const monthStart =
      today.substring(
        0,
        7,
      ) + "-01";


    const monthTxns =
      all.filter(
        (t) =>
          t.date >=
          monthStart &&
          t.date <=
          today,
      );


    /* ==========================================================
       THIS YEAR
       ========================================================== */

    const yearStart =
      today.substring(
        0,
        4,
      ) + "-01-01";


    const yearTxns =
      all.filter(
        (t) =>
          t.date >=
          yearStart &&
          t.date <=
          today,
      );


    /* ==========================================================
       REVENUE
       ========================================================== */

    const todayRevenue =
      sumRevenue(
        todayTxns,
      );

    const weekRevenue =
      sumRevenue(
        weekTxns,
      );

    const monthRevenue =
      sumRevenue(
        monthTxns,
      );

    const yearRevenue =
      sumRevenue(
        yearTxns,
      );


    /* ==========================================================
       CURRENT METRIC
       ========================================================== */

    const isRevenue =
      currentMetric ===
      "revenue";


    /* ==========================================================
       TODAY KPI
       ========================================================== */

    if (isRevenue) {

      _setText(
        "todayRevenue",
        Store.formatCurrency(
          todayRevenue,
        ),
      );

      _setText(
        "todayCount",
        `${todayTxns.length} transactions`,
      );

    } else {

      _setText(
        "todayRevenue",
        `${todayTxns.length} Transactions`,
      );

      _setText(
        "todayCount",
        `Revenue: ${Store.formatCurrency(
          todayRevenue,
        )}`,
      );
    }


    /* ==========================================================
       THIS WEEK KPI
       ========================================================== */

    if (isRevenue) {

      _setText(
        "weekRevenue",
        Store.formatCurrency(
          weekRevenue,
        ),
      );

      _setText(
        "weekCount",
        `${weekTxns.length} transactions`,
      );

    } else {

      _setText(
        "weekRevenue",
        `${weekTxns.length} Transactions`,
      );

      _setText(
        "weekCount",
        `Revenue: ${Store.formatCurrency(
          weekRevenue,
        )}`,
      );
    }


    /* ==========================================================
       THIS MONTH KPI
       ========================================================== */

    if (isRevenue) {

      _setText(
        "monthRevenue",
        Store.formatCurrency(
          monthRevenue,
        ),
      );

      _setText(
        "monthCount",
        `${monthTxns.length} transactions`,
      );

    } else {

      _setText(
        "monthRevenue",
        `${monthTxns.length} Transactions`,
      );

      _setText(
        "monthCount",
        `Revenue: ${Store.formatCurrency(
          monthRevenue,
        )}`,
      );
    }


    /* ==========================================================
       THIS YEAR KPI
       ========================================================== */

    if (isRevenue) {

      _setText(
        "yearRevenue",
        Store.formatCurrency(
          yearRevenue,
        ),
      );

      _setText(
        "yearCount",
        `${yearTxns.length} transactions`,
      );

    } else {

      _setText(
        "yearRevenue",
        `${yearTxns.length} Transactions`,
      );

      _setText(
        "yearCount",
        `Revenue: ${Store.formatCurrency(
          yearRevenue,
        )}`,
      );
    }


    /* ==========================================================
       SELECTED PERIOD KPI
       
       Kalau masih ada element lama,
       dikosongkan supaya tidak muncul.
       ========================================================== */

    _setText(
      "totalTransactions",
      "",
    );

    _setText(
      "totalServices",
      "",
    );

    _setText(
      "dashPeriodLabel",
      getPeriodLabel(),
    );


    /* ==========================================================
       NEW KPI DATA
       
       Tetap dipertahankan karena mungkin
       dipakai bagian dashboard lain.
       ========================================================== */

    const filtered =
      getPeriodTransactions(
        all,
      );

    const revenue =
      sumRevenue(
        filtered,
      );

    const count =
      filtered.length;

    const averageTicket =
      count > 0
        ? revenue / count
        : 0;


    const discount =
      filtered.reduce(
        (total, t) =>
          total +
          Number(
            t.discountAmount ||
            0,
          ),
        0,
      );


    const promoTransactions =
      filtered.filter(
        isPromoTransaction,
      );


    const promoRevenue =
      sumRevenue(
        promoTransactions,
      );


    const promoDiscount =
      promoTransactions.reduce(
        (total, t) =>
          total +
          Number(
            t.discountAmount ||
            0,
          ),
        0,
      );


    _setText(
      "dashTotalRevenue",
      Store.formatCurrency(
        revenue,
      ),
    );


    _setText(
      "dashTotalTransactions",
      count.toLocaleString(
        "id-ID",
      ),
    );


    _setText(
      "dashAverageTicket",
      Store.formatCurrency(
        averageTicket,
      ),
    );


    _setText(
      "dashTotalDiscount",
      Store.formatCurrency(
        discount,
      ),
    );


    _setText(
      "dashPromoTransactions",
      promoTransactions.length.toLocaleString(
        "id-ID",
      ),
    );


    _setText(
      "dashPromoRevenue",
      Store.formatCurrency(
        promoRevenue,
      ),
    );


    _setText(
      "dashPromoDiscount",
      Store.formatCurrency(
        promoDiscount,
      ),
    );


    /* ----------------------------------------------------------
       CARD LABELS
       ---------------------------------------------------------- */

    _setText(
      "todayCardLabel",
      "Today",
    );

    _setText(
      "weekCardLabel",
      "This Week",
    );

    _setText(
      "monthCardLabel",
      "This Month",
    );

    _setText(
      "yearCardLabel",
      "This Year",
    );
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

  /* ============================================================
     CHART TITLES
     ============================================================ */

  function _updateChartTitles() {

    const isRevenue =
      currentMetric ===
      "revenue";


    const revTitle =
      document.getElementById(
        "dashRevenueChartTitle",
      );

    if (revTitle) {

      revTitle.textContent =
        isRevenue
          ? "📈 Revenue Trend"
          : "📈 Transaction Count Trend";
    }


    const svcTitle =
      document.getElementById(
        "dashServiceChartTitle",
      );

    if (svcTitle) {

      svcTitle.textContent =
        isRevenue
          ? "🍩 Revenue by Service"
          : "🍩 Transactions by Service";
    }


    const barTitle =
      document.getElementById(
        "dashBarChartTitle",
      );

    if (barTitle) {

      barTitle.textContent =
        isRevenue
          ? "📊 Service Comparison (Revenue)"
          : "📊 Service Comparison (Transactions)";
    }
  }

  /* ============================================================
     REVENUE / TRANSACTION TREND
     ============================================================ */

  async function _renderRevenueChart() {

    const canvas =
      document.getElementById(
        "revenueChart",
      );

    if (!canvas) {
      return;
    }


    const {
      labels,
      data,
    } =
      await _getRevenueData();


    if (revenueChart) {

      revenueChart.destroy();

      revenueChart = null;
    }


    const isLine =
      currentChartType ===
      "line";

    const isRevenue =
      currentMetric ===
      "revenue";


    const datasetLabel =
      isRevenue
        ? "Revenue"
        : "Transactions";


    revenueChart =
      new Chart(
        canvas,
        {
          type:
            currentChartType,

          data: {

            labels,

            datasets: [
              {

                label:
                  datasetLabel,

                data,

                spanGaps:
                  false,

                ...(isLine
                  ? {

                    borderColor:
                      "#e30022",

                    backgroundColor:
                      _gradient(
                        canvas,
                        "#e30022",
                      ),

                    fill:
                      true,

                    tension:
                      0.4,

                    pointBackgroundColor:
                      "#e30022",

                    pointBorderColor:
                      "#ffffff",

                    pointBorderWidth:
                      2,

                    pointRadius:
                      3,

                    pointHoverRadius:
                      6,

                  }
                  : {

                    backgroundColor:
                      "#e30022",

                    borderRadius:
                      8,

                    borderSkipped:
                      false,

                    maxBarThickness:
                      48,
                  }),
              },
            ],
          },

          options:
            _axisChartOptions(
              isRevenue,
            ),
        },
      );
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


    const isRevenue =
      currentMetric ===
      "revenue";


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

                borderWidth:
                  2,

                borderColor:
                  "#121214",
              },
            ],
          },

          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            cutout:
              "65%",

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
                      11,
                  },
                },
              },

              tooltip: {

                callbacks: {

                  label: (c) =>
                    isRevenue
                      ? `${c.label}: ${Store.formatCurrency(
                        c.parsed,
                      )}`
                      : `${c.label}: ${c.parsed} transactions`,
                },
              },
            },
          },
        },
      );
  }

  /* ============================================================
     SERVICE BAR / LINE
     ============================================================ */

  async function _renderBarChart() {

    const canvas =
      document.getElementById(
        "barChart",
      );

    if (!canvas) {
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


    const isLine =
      currentChartType ===
      "line";

    const isRevenue =
      currentMetric ===
      "revenue";


    const datasetLabel =
      isRevenue
        ? "Revenue"
        : "Transactions";


    barChart =
      new Chart(
        canvas,
        {

          type:
            currentChartType,

          data: {

            labels,

            datasets: [
              {

                label:
                  datasetLabel,

                data,

                ...(isLine
                  ? {

                    borderColor:
                      "#e30022",

                    backgroundColor:
                      _gradient(
                        canvas,
                        "#e30022",
                      ),

                    fill:
                      true,

                    tension:
                      0.4,

                    pointBackgroundColor:
                      colors,

                    pointBorderColor:
                      "#ffffff",

                    pointBorderWidth:
                      2,

                    pointRadius:
                      5,

                    pointHoverRadius:
                      7,

                  }
                  : {

                    backgroundColor:
                      colors,

                    borderRadius:
                      8,

                    borderSkipped:
                      false,

                    maxBarThickness:
                      48,
                  }),
              },
            ],
          },

          options:
            _axisChartOptions(
              isRevenue,
            ),
        },
      );
  }

  /* ============================================================
     AXIS OPTIONS
     ============================================================ */

  function _axisChartOptions(
    isRevenue = true,
  ) {

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

          callbacks: {

            label: (c) => {

              const value =
                c.parsed.y;

              if (
                value ===
                null ||
                value ===
                undefined
              ) {
                return "";
              }

              return isRevenue
                ? Store.formatCurrency(
                  value,
                )
                : `${value} transactions`;
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

            callback: (v) =>
              isRevenue
                ? _shortCurrency(
                  v,
                )
                : Number.isInteger(
                  v,
                )
                  ? `${v}`
                  : null,
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
                "weekly"
                ? 12
                : undefined,

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
    };
  }

  /* ============================================================
     REVENUE DATA
     ============================================================ */

  async function _getRevenueData() {

    let all =
      await Store.getTransactions();

    all =
      filterBranch(all);


    const today =
      new Date();


    const isRevenue =
      currentMetric ===
      "revenue";


    const labels = [];

    const data = [];


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


    /* ==========================================================
       DAILY
       30 DAYS
       ========================================================== */

    if (
      currentFilter ===
      "daily"
    ) {

      const map = {};


      for (
        let i = 29;
        i >= 0;
        i--
      ) {

        const d =
          new Date(
            today,
          );

        d.setDate(
          d.getDate() -
          i,
        );


        const key =
          _dateStr(d);


        labels.push(
          `${d.getDate()} ${monthNames[d.getMonth()]}`,
        );


        map[key] = 0;
      }


      all.forEach(
        (t) => {

          if (
            map[t.date] !==
            undefined
          ) {

            map[t.date] +=
              isRevenue
                ? Number(
                  t.price ||
                  0,
                )
                : 1;
          }
        },
      );


      return {

        labels,

        data:
          Object.values(
            map,
          ),
      };
    }


    /* ==========================================================
       WEEKLY
       ========================================================== */

    if (
      currentFilter ===
      "weekly"
    ) {

      return _getWeeklyRevenueData(
        all,
        today,
        isRevenue,
        monthNames,
      );
    }


    /* ==========================================================
       MONTHLY
       ========================================================== */

    if (
      currentFilter ===
      "monthly"
    ) {

      const map = {};


      for (
        let i = 11;
        i >= 0;
        i--
      ) {

        const d =
          new Date(
            today.getFullYear(),
            today.getMonth() -
            i,
            1,
          );


        const key =
          `${d.getFullYear()}-${String(
            d.getMonth() + 1,
          ).padStart(2, "0")}`;


        labels.push(
          `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        );


        map[key] = 0;
      }


      all.forEach(
        (t) => {

          const key =
            String(
              t.date,
            ).substring(
              0,
              7,
            );


          if (
            map[key] !==
            undefined
          ) {

            map[key] +=
              isRevenue
                ? Number(
                  t.price ||
                  0,
                )
                : 1;
          }
        },
      );


      return {

        labels,

        data:
          Object.values(
            map,
          ),
      };
    }


    /* ==========================================================
       YEARLY
       ========================================================== */

    const map = {};


    for (
      let i = 4;
      i >= 0;
      i--
    ) {

      const year =
        today.getFullYear() -
        i;


      labels.push(
        String(year),
      );


      map[
        String(year)
      ] = 0;
    }


    all.forEach(
      (t) => {

        const key =
          String(
            t.date,
          ).substring(
            0,
            4,
          );


        if (
          map[key] !==
          undefined
        ) {

          map[key] +=
            isRevenue
              ? Number(
                t.price ||
                0,
              )
              : 1;
        }
      },
    );


    return {

      labels,

      data:
        Object.values(
          map,
        ),
    };
  }

  /* ============================================================
     WEEKLY DATA
     
     BUCKET:
     1-7
     8-14
     15-21
     22-28
     29-END MONTH

     EMPTY BUCKET = null
     ADA DATA = VALUE
     ============================================================ */

  function _getWeeklyRevenueData(
    all,
    today,
    isRevenue,
    monthNames,
  ) {

    const tempBuckets = [];


    for (
      let monthOffset = -5;
      monthOffset <= 1;
      monthOffset++
    ) {

      const monthDate =
        new Date(
          today.getFullYear(),
          today.getMonth() +
          monthOffset,
          1,
        );


      const year =
        monthDate.getFullYear();


      const month =
        monthDate.getMonth();


      const lastDay =
        new Date(
          year,
          month + 1,
          0,
        ).getDate();


      const starts = [
        1,
        8,
        15,
        22,
        29,
      ];


      starts.forEach(
        (day) => {

          if (
            day >
            lastDay
          ) {
            return;
          }


          const start =
            new Date(
              year,
              month,
              day,
            );


          let endDay =
            day + 6;


          if (
            endDay >
            lastDay
          ) {

            endDay =
              lastDay;
          }


          const end =
            new Date(
              year,
              month,
              endDay,
            );


          tempBuckets.push({

            start,

            end,

            key:
              _dateStr(
                start,
              ),

            value:
              0,
          });
        },
      );
    }


    const todayTime =
      today.getTime();


    const validBuckets =
      tempBuckets
        .filter(
          (b) =>
            b.start.getTime() <=
            todayTime,
        )
        .sort(
          (a, b) =>
            a.start -
            b.start,
        );


    const selectedBuckets =
      validBuckets.slice(
        -12,
      );


    /* ----------------------------------------------------------
       TRANSACTIONS → BUCKET
       ---------------------------------------------------------- */

    all.forEach(
      (t) => {

        if (!t.date) {
          return;
        }


        const date =
          new Date(
            `${t.date}T00:00:00`,
          );


        if (
          Number.isNaN(
            date.getTime(),
          )
        ) {
          return;
        }


        const bucket =
          selectedBuckets.find(
            (b) =>
              date >=
              b.start &&
              date <=
              b.end,
          );


        if (!bucket) {
          return;
        }


        bucket.value +=
          isRevenue
            ? Number(
              t.price ||
              0,
            )
            : 1;
      },
    );


    /* ----------------------------------------------------------
       LABELS
       ---------------------------------------------------------- */

    const labels =
      selectedBuckets.map(
        (bucket) => {

          const d =
            bucket.start;

          return `${d.getDate()} ${monthNames[d.getMonth()]}`;
        },
      );


    /* ----------------------------------------------------------
       DATA

       IMPORTANT:

       EMPTY = null

       Jadi Chart.js tidak membuat
       titik merah di minggu kosong.

       Contoh:

       1 Jul  = 0
       8 Jul  = 50.000
       15 Jul = 0

       hasil:

       null
       50000
       null
       ---------------------------------------------------------- */

    const data =
      selectedBuckets.map(
        (bucket) =>
          bucket.value > 0
            ? bucket.value
            : null,
      );


    return {

      labels,

      data,
    };
  }

  /* ============================================================
     SERVICE DATA
     ============================================================ */

  async function _getServiceData() {

    let txns =
      await Store.getTransactions();


    txns =
      filterBranch(
        txns,
      );


    txns =
      getPeriodTransactions(
        txns,
      );


    const map = {};


    txns.forEach(
      (t) => {

        const name =
          t.serviceName ||
          "Unknown Service";


        if (!map[name]) {
          map[name] = 0;
        }


        map[name] +=
          currentMetric ===
            "revenue"
            ? Number(
              t.price ||
              0,
            )
            : 1;
      },
    );


    const entries =
      Object.entries(
        map,
      ).sort(
        (a, b) =>
          b[1] -
          a[1],
      );


    const labels =
      entries.map(
        (x) =>
          x[0],
      );


    const data =
      entries.map(
        (x) =>
          x[1],
      );


    const palette =
      _chartColors();


    const colors =
      labels.map(
        (_, i) =>
          palette[
          i %
          palette.length
          ],
      );


    return {

      labels,

      data,

      colors,
    };
  }

  /* ============================================================
     PROMO PERFORMANCE
     ============================================================ */

  async function renderPromoPerformance() {

    let txns =
      await Store.getTransactions();


    txns =
      filterBranch(
        txns,
      );


    txns =
      getPeriodTransactions(
        txns,
      );


    const promoTxns =
      txns.filter(
        isPromoTransaction,
      );


    const normalTxns =
      txns.filter(
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


    const promoDiscount =
      promoTxns.reduce(
        (sum, t) =>
          sum +
          Number(
            t.discountAmount ||
            0,
          ),
        0,
      );


    const normalAverage =
      normalTxns.length
        ? normalRevenue /
        normalTxns.length
        : 0;


    const promoAverage =
      promoTxns.length
        ? promoRevenue /
        promoTxns.length
        : 0;


    _setText(
      "promoRevenue",
      Store.formatCurrency(
        promoRevenue,
      ),
    );


    _setText(
      "nonPromoRevenue",
      Store.formatCurrency(
        normalRevenue,
      ),
    );


    _setText(
      "promoTransactionCount",
      promoTxns.length,
    );


    _setText(
      "nonPromoTransactionCount",
      normalTxns.length,
    );


    _setText(
      "promoAverageTicket",
      Store.formatCurrency(
        promoAverage,
      ),
    );


    _setText(
      "nonPromoAverageTicket",
      Store.formatCurrency(
        normalAverage,
      ),
    );


    _setText(
      "promoDiscountTotal",
      Store.formatCurrency(
        promoDiscount,
      ),
    );


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
    }


    const promoMap = {};


    promoTxns.forEach(
      (t) => {

        const promoId =
          t.promoId;


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
        ].transactions++;


        promoMap[
          promoId
        ].revenue +=
          Number(
            t.price ||
            0,
          );


        promoMap[
          promoId
        ].discount +=
          Number(
            t.discountAmount ||
            0,
          );
      },
    );


    const rows =
      promos
        .filter(
          (p) =>
            promoMap[p.id],
        )
        .map(
          (p) => {

            const item =
              promoMap[p.id];


            return `
              <tr>

                <td data-label="Promotion">

                  <span class="discount-tag">

                    🎉
                    ${escapeHtml(
              p.name,
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
              item.revenue /
              item.transactions,
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
     FILTER HELPERS
     ============================================================ */

  function filterBranch(
    data,
  ) {

    if (
      currentBranch ===
      "all"
    ) {
      return data;
    }


    return data.filter(
      (t) =>
        String(
          t.branch || "",
        ).toLowerCase() ===
        String(
          currentBranch,
        ).toLowerCase(),
    );
  }

  /* ============================================================
     PERIOD TRANSACTIONS
     ============================================================ */

  function getPeriodTransactions(
    data,
  ) {

    const today =
      Store.getTodayStr();


    /* ----------------------------------------------------------
       DAILY
       ---------------------------------------------------------- */

    if (
      currentFilter ===
      "daily"
    ) {

      return data.filter(
        (t) =>
          t.date ===
          today,
      );
    }


    /* ----------------------------------------------------------
       WEEKLY

       1-7
       8-14
       15-21
       22-28
       29-end
       ---------------------------------------------------------- */

    if (
      currentFilter ===
      "weekly"
    ) {

      const now =
        new Date();


      const year =
        now.getFullYear();


      const month =
        now.getMonth();


      const day =
        now.getDate();


      let startDay;


      if (
        day <= 7
      ) {

        startDay =
          1;

      } else if (
        day <= 14
      ) {

        startDay =
          8;

      } else if (
        day <= 21
      ) {

        startDay =
          15;

      } else if (
        day <= 28
      ) {

        startDay =
          22;

      } else {

        startDay =
          29;
      }


      const start =
        new Date(
          year,
          month,
          startDay,
        );


      start.setHours(
        0,
        0,
        0,
        0,
      );


      const end =
        new Date(
          year,
          month + 1,
          0,
        );


      end.setHours(
        23,
        59,
        59,
        999,
      );


      return data.filter(
        (t) => {

          const d =
            new Date(
              `${t.date}T00:00:00`,
            );


          return (
            d >= start &&
            d <= end
          );
        },
      );
    }


    /* ----------------------------------------------------------
       MONTHLY
       ---------------------------------------------------------- */

    if (
      currentFilter ===
      "monthly"
    ) {

      const start =
        today.substring(
          0,
          7,
        ) + "-01";


      return data.filter(
        (t) =>
          t.date >=
          start &&
          t.date <=
          today,
      );
    }


    /* ----------------------------------------------------------
       YEARLY
       ---------------------------------------------------------- */

    if (
      currentFilter ===
      "yearly"
    ) {

      const start =
        today.substring(
          0,
          4,
        ) + "-01-01";


      return data.filter(
        (t) =>
          t.date >=
          start &&
          t.date <=
          today,
      );
    }


    return data;
  }

  /* ============================================================
     PROMO HELPER
     ============================================================ */

  function isPromoTransaction(
    t,
  ) {

    return Boolean(

      t.promoId ||

      Number(
        t.promoDiscount ||
        0,
      ) > 0 ||

      Number(
        t.discountAmount ||
        0,
      ) > 0

    );
  }

  /* ============================================================
     REVENUE HELPER
     ============================================================ */

  function sumRevenue(
    transactions,
  ) {

    return transactions.reduce(
      (total, t) =>
        total +
        Number(
          t.price ||
          0,
        ),
      0,
    );
  }

  /* ============================================================
     PERIOD LABEL
     ============================================================ */

  function getPeriodLabel() {

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
      "monthly"
    ) {

      return "This Month";
    }


    if (
      currentFilter ===
      "yearly"
    ) {

      return "This Year";
    }


    return "Selected Period";
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
      color + "66",
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

  /* ============================================================
     DATE STRING
     ============================================================ */

  function _dateStr(
    d,
  ) {

    return (

      d.getFullYear() +

      "-" +

      String(
        d.getMonth() + 1,
      ).padStart(
        2,
        "0",
      ) +

      "-" +

      String(
        d.getDate(),
      ).padStart(
        2,
        "0",
      )

    );
  }

  /* ============================================================
     SAFE TEXT
     ============================================================ */

  function _setText(
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

  /* ============================================================
     PUBLIC API
     ============================================================ */

  return {

    render,

    refresh:
      refreshDashboard,

  };

})();