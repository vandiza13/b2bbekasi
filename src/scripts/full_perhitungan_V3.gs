perhitungan_V3.gs:
/* ============================================================
 * 01. CONFIG
 * ============================================================ */

const CONFIG = {

  sheets: {
    datin: "DATA TTR & GAUL DATIN",
    hsi: "DATA TTR & GAUL HSI",
    wifi: "DATA TTR & GAUL WIFI",

    dashboard: "Dashboard Branch Bekasi",

    qDatin: "Q DATIN",
    qHsi: "Q HSI"
  },

  assurance: {
    dashboard: "Dashboard Branch Bekasi"
  },

  q: {
    datinBilledRange: "BI5:BL16",
    hsiBilledRange: "BN5:BQ16"
  },

  saMapping: {
    Bekasi: ["BEK"],
    Kaliabang: ["KLB"],
    Kranji: ["KRA"],
    Pekayon: ["PKY"],
    "Pondok Gede": ["PDE"],
    Depok: ["DEP"],
    Cinere: ["CNE", "PCM"],
    Sukmajaya: ["SKJ", "CSL"]
  }

};


/* ============================================================
 * 02. BACKWARD COMPATIBILITY CONSTANTS
 * ============================================================ */

const DATIN_SHEET_NAME =
  CONFIG.sheets.datin;

const HSI_SHEET_NAME =
  CONFIG.sheets.hsi;

const WIFI_SHEET_NAME =
  CONFIG.sheets.wifi;

const DASHBOARD_SHEET_NAME =
  CONFIG.sheets.dashboard;


const ASSURANCE_DASHBOARD_SHEET =
  CONFIG.assurance.dashboard;

const ASSURANCE_DATIN_SHEET =
  CONFIG.sheets.datin;

const ASSURANCE_HSI_SHEET =
  CONFIG.sheets.hsi;

const ASSURANCE_WIFI_SHEET =
  CONFIG.sheets.wifi;


const ASSURANCE_SA_MAPPING =
  CONFIG.saMapping;


const Q_DASHBOARD_SHEET =
  CONFIG.sheets.dashboard;

const Q_DATIN_SHEET =
  CONFIG.sheets.qDatin;

const Q_HSI_SHEET =
  CONFIG.sheets.qHsi;


const Q_DATIN_BILLED_RANGE =
  CONFIG.q.datinBilledRange;

const Q_HSI_BILLED_RANGE =
  CONFIG.q.hsiBilledRange;


const SA_MAPPING =
  CONFIG.saMapping;


/* ============================================================
 * WIFI INDICATORS
 * ============================================================ */

const WIFI_TTR_INDICATOR =
  "Compliance-TTR WIFI (6 Jam Logik, 24 Jam Fisik)";

const WIFI_ASSURANCE_INDICATOR =
  "Assurance Guarantee WIFI";


/* ============================================================
 * 03. WEEK CONFIG
 * ============================================================ */

const ASSURANCE_WEEKS = {

  W1: {
    key: "W1",
    label: "Week 1",
    startDay: 1,
    endDay: 7
  },

  W2: {
    key: "W2",
    label: "Week 2",
    startDay: 8,
    endDay: 14
  },

  W3: {
    key: "W3",
    label: "Week 3",
    startDay: 15,
    endDay: 21
  },

  W4: {
    key: "W4",
    label: "Week 4",
    startDay: 22,
    endDay: 31
  }

};


/* ============================================================
 * 04. GENERIC UTILITIES
 * ============================================================ */

function getWeekList() {

  return [
    "W1",
    "W2",
    "W3",
    "W4"
  ];

}


function getWeekPeriod(date) {

  if (!(date instanceof Date)) {
    return null;
  }

  const day =
    date.getDate();


  if (
    day >= 1 &&
    day <= 7
  ) {
    return "W1";
  }


  if (
    day >= 8 &&
    day <= 14
  ) {
    return "W2";
  }


  if (
    day >= 15 &&
    day <= 21
  ) {
    return "W3";
  }


  if (day >= 22) {
    return "W4";
  }


  return null;

}


function normalizeValue(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  if (
    value instanceof Date
  ) {

    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "dd/MM/yyyy HH:mm:ss"
    );

  }


  return String(value);

}


function normalizeText(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  return String(value)
    .trim()
    .toUpperCase();

}


function calculateReal(
  total,
  comply,
  emptyValue
) {

  if (
    !total ||
    total <= 0
  ) {

    return emptyValue !== undefined
      ? emptyValue
      : 0;

  }


  return Math.round(
    (
      (comply / total) *
      100
    ) * 100
  ) / 100;

}


function getSheetOrThrow(sheetName) {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    ss.getSheetByName(
      sheetName
    );


  if (!sheet) {

    throw new Error(
      'Sheet "' +
      sheetName +
      '" tidak ditemukan.'
    );

  }


  return sheet;

}


function getDashboardKpiData() {

  const sheet =
    getSheetOrThrow(
      DASHBOARD_SHEET_NAME
    );


  return sheet
    .getRange("B2:C26")
    .getDisplayValues();

}


function findKpiTarget(
  kpiData,
  indicator
) {

  if (
    !Array.isArray(kpiData)
  ) {
    return "-";
  }


  const target =
    kpiData.find(
      function(row) {

        return (
          String(
            row[0] || ""
          ).trim() ===
          String(
            indicator || ""
          ).trim()
        );

      }
    );


  if (!target) {
    return "-";
  }


  return target[1] || "-";

}


function getKpiTarget(
  indicator
) {

  return findKpiTarget(
    getDashboardKpiData(),
    indicator
  );

}


/* ============================================================
 * 05. SALES AREA
 * ============================================================ */

function getSalesArea(
  workzone
) {

  const wz =
    normalizeText(
      workzone
    );


  if (!wz) {
    return null;
  }


  const salesAreas =
    Object.keys(
      SA_MAPPING
    );


  for (
    let i = 0;
    i < salesAreas.length;
    i++
  ) {

    const sa =
      salesAreas[i];


    if (
      SA_MAPPING[sa]
        .map(normalizeText)
        .includes(wz)
    ) {

      return sa;

    }

  }


  return null;

}


/* ============================================================
 * 06. TTR DATA STRUCTURE
 * ============================================================ */

function createWeekData() {

  return {

    total: 0,
    comply: 0,
    real: 0,

    belowTarget: [],
    allTickets: []

  };

}


function createTicketCategory() {

  return {

    total: 0,
    comply: 0,
    real: 0,

    belowTarget: [],
    allTickets: [],

    weeks: {

      W1:
        createWeekData(),

      W2:
        createWeekData(),

      W3:
        createWeekData(),

      W4:
        createWeekData()

    }

  };

}


function calculateCategoryReal(
  category,
  emptyValue
) {

  category.real =
    calculateReal(
      category.total,
      category.comply,
      emptyValue
    );


  getWeekList()
    .forEach(
      function(week) {

        const weekData =
          category.weeks[week];


        weekData.real =
          calculateReal(
            weekData.total,
            weekData.comply,
            emptyValue
          );

      }
    );


  return category;

}


/* ============================================================
 * 07. DATIN K1 SPECIAL RULE
 *
 * MONTHLY kosong = 100%
 * WEEKLY kosong  = 0%
 * ============================================================ */

function calculateK1DatinReal(
  category
) {

  if (
    category.total <= 0
  ) {

    category.total = 0;
    category.comply = 0;
    category.real = 100;

    category.allTickets = [];
    category.belowTarget = [];

  } else {

    category.real =
      calculateReal(
        category.total,
        category.comply
      );

  }


  getWeekList()
    .forEach(
      function(week) {

        const data =
          category.weeks[week];


        if (
          data.total <= 0
        ) {

          data.total = 0;
          data.comply = 0;
          data.real = 0;

          data.allTickets = [];
          data.belowTarget = [];

        } else {

          data.real =
            calculateReal(
              data.total,
              data.comply
            );

        }

      }
    );


  return category;

}


/* ============================================================
 * 08. TTR GENERIC AGGREGATION
 * ============================================================ */

function createSAResult(
  categories
) {

  const result = {};


  Object.keys(
    SA_MAPPING
  ).forEach(
    function(sa) {

      result[sa] = {};


      categories.forEach(
        function(category) {

          result[sa][category] =
            createTicketCategory();

        }
      );

    }
  );


  return result;

}


function addTicketToCategory(
  category,
  ticketData,
  comply,
  week
) {

  category.total++;


  category.allTickets.push(
    ticketData
  );


  if (
    comply === "COMPLY"
  ) {

    category.comply++;

  } else {

    category.belowTarget.push(
      ticketData
    );

  }


  const weekData =
    category.weeks[week];


  weekData.total++;
  weekData.allTickets.push(
    ticketData
  );


  if (
    comply === "COMPLY"
  ) {

    weekData.comply++;

  } else {

    weekData.belowTarget.push(
      ticketData
    );

  }

}


function mergeTicketCategory(
  target,
  source
) {

  target.total +=
    source.total;


  target.comply +=
    source.comply;


  target.belowTarget.push.apply(
    target.belowTarget,
    source.belowTarget
  );


  target.allTickets.push.apply(
    target.allTickets,
    source.allTickets
  );


  getWeekList()
    .forEach(
      function(week) {

        const targetWeek =
          target.weeks[week];

        const sourceWeek =
          source.weeks[week];


        targetWeek.total +=
          sourceWeek.total;


        targetWeek.comply +=
          sourceWeek.comply;


        targetWeek.belowTarget.push.apply(
          targetWeek.belowTarget,
          sourceWeek.belowTarget
        );


        targetWeek.allTickets.push.apply(
          targetWeek.allTickets,
          sourceWeek.allTickets
        );

      }
    );

}


function createBranchTtrTotal(
  categories
) {

  const result = {};


  categories.forEach(
    function(category) {

      result[category] =
        createTicketCategory();

    }
  );


  return result;

}


/* ============================================================
 * 09. DATIN TTR
 * ============================================================ */

function calculateDatinTTR(
  targetMonth,
  targetYear
) {

  const sheet =
    getSheetOrThrow(
      DATIN_SHEET_NAME
    );


  const data =
    sheet.getDataRange()
      .getValues();


  const COL_TIKET = 0;
  const COL_CUSTOMER = 2;
  const COL_TTR = 25;
  const COL_WORKZONE = 36;
  const COL_KATEGORI = 64;
  const COL_COMPLY = 67;
  const COL_BULAN = 73;


  const result =
    createSAResult([
      "K1",
      "K2",
      "K3"
    ]);


  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    const row =
      data[i];


    const workzone =
      normalizeText(
        row[COL_WORKZONE]
      );


    if (!workzone) {
      continue;
    }


    const kategori =
      normalizeText(
        row[COL_KATEGORI]
      );


    if (
      ![
        "K1",
        "K2",
        "K3"
      ].includes(kategori)
    ) {
      continue;
    }


    const comply =
      normalizeText(
        row[COL_COMPLY]
      );


    const timestamp =
      row[COL_BULAN];


    if (
      !(timestamp instanceof Date)
    ) {
      continue;
    }


    if (
      timestamp.getMonth() + 1 !==
        targetMonth ||
      timestamp.getFullYear() !==
        targetYear
    ) {
      continue;
    }


    const week =
      getWeekPeriod(
        timestamp
      );


    if (!week) {
      continue;
    }


    const sa =
      getSalesArea(
        workzone
      );


    if (!sa) {
      continue;
    }


    const ticketData = {

      tiket:
        normalizeValue(
          row[COL_TIKET]
        ),

      customer:
        normalizeValue(
          row[COL_CUSTOMER]
        ),

      ttr:
        normalizeValue(
          row[COL_TTR]
        ),

      sa:
        sa,

      kategori:
        kategori,

      comply:
        comply,

      workzone:
        workzone,

      week:
        week

    };


    addTicketToCategory(
      result[sa][kategori],
      ticketData,
      comply,
      week
    );

  }


  Object.keys(result)
    .forEach(
      function(sa) {

        calculateK1DatinReal(
          result[sa].K1
        );


        calculateCategoryReal(
          result[sa].K2
        );


        calculateCategoryReal(
          result[sa].K3
        );

      }
    );


  return result;

}


/* ============================================================
 * 10. DATIN DASHBOARD
 * ============================================================ */

function getLatestDateFromColumn(
  data,
  columnIndex
) {

  let latestDate = null;


  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    const value =
      data[i][columnIndex];


    if (
      !(value instanceof Date)
    ) {
      continue;
    }


    if (
      !latestDate ||
      value > latestDate
    ) {

      latestDate =
        value;

    }

  }


  return latestDate;

}


function getDatinDashboardData() {

  const dashboardSheet =
    getSheetOrThrow(
      DASHBOARD_SHEET_NAME
    );


  const kpiData =
    dashboardSheet
      .getRange("B2:C26")
      .getDisplayValues();


  const sheet =
    getSheetOrThrow(
      DATIN_SHEET_NAME
    );


  const data =
    sheet.getDataRange()
      .getValues();


  const COL_BULAN = 73;


  const latestDate =
    getLatestDateFromColumn(
      data,
      COL_BULAN
    );


  if (!latestDate) {

    throw new Error(
      "Tidak ditemukan tanggal valid pada kolom BV."
    );

  }


  const targetMonth =
    latestDate.getMonth() + 1;


  const targetYear =
    latestDate.getFullYear();


  const datinResult =
    calculateDatinTTR(
      targetMonth,
      targetYear
    );


  const branchTotal =
    createBranchTtrTotal([
      "K1",
      "K2",
      "K3"
    ]);


  Object.keys(datinResult)
    .forEach(
      function(sa) {

        [
          "K1",
          "K2",
          "K3"
        ].forEach(
          function(kategori) {

            mergeTicketCategory(
              branchTotal[kategori],
              datinResult[sa][kategori]
            );

          }
        );

      }
    );


  calculateK1DatinReal(
    branchTotal.K1
  );


  calculateCategoryReal(
    branchTotal.K2
  );


  calculateCategoryReal(
    branchTotal.K3
  );


  const branches = {};


  Object.keys(SA_MAPPING)
    .forEach(
      function(sa) {

        branches[sa] =
          datinResult[sa];

      }
    );


  const datin = [

    {

      indicator:
        "Compliance-TTR DATIN-K1 Recovery (43 Menit)",

      target:
        findKpiTarget(
          kpiData,
          "Compliance-TTR DATIN-K1 Recovery (43 Menit)"
        ),

      real:
        branchTotal.K1.real,

      branches:
        branches,

      allTickets:
        branchTotal.K1.allTickets,

      belowTarget:
        branchTotal.K1.belowTarget,

      weeks:
        branchTotal.K1.weeks

    },


    {

      indicator:
        "Compliance-TTR DATIN-K2 (3,6 Jam)",

      target:
        findKpiTarget(
          kpiData,
          "Compliance-TTR DATIN-K2 (3,6 Jam)"
        ),

      real:
        branchTotal.K2.real,

      branches:
        branches,

      allTickets:
        branchTotal.K2.allTickets,

      belowTarget:
        branchTotal.K2.belowTarget,

      weeks:
        branchTotal.K2.weeks

    },


    {

      indicator:
        "Compliance-TTR DATIN-K3 (7,2 Jam)",

      target:
        findKpiTarget(
          kpiData,
          "Compliance-TTR DATIN-K3 (7,2 Jam)"
        ),

      real:
        branchTotal.K3.real,

      branches:
        branches,

      allTickets:
        branchTotal.K3.allTickets,

      belowTarget:
        branchTotal.K3.belowTarget,

      weeks:
        branchTotal.K3.weeks

    }

  ];


  return {

    kpiData:
      kpiData,

    datin:
      datin,

    updateMonth:
      Utilities.formatDate(
        latestDate,
        Session.getScriptTimeZone(),
        "MMM ''yy"
      )

  };

}


/* ============================================================
 * 11. HSI TTR
 * ============================================================ */

function calculateHsiTTR(
  targetMonth,
  targetYear
) {

  const sheet =
    getSheetOrThrow(
      HSI_SHEET_NAME
    );


  const data =
    sheet.getDataRange()
      .getValues();


  const COL_TIKET = 0;
  const COL_CUSTOMER = 2;
  const COL_TTR = 88;
  const COL_WORKZONE = 41;
  const COL_COMPLY_4JAM = 89;
  const COL_COMPLY_24JAM = 90;
  const COL_BULAN = 97;


  const result =
    createSAResult([
      "HSI_4JAM",
      "HSI_24JAM"
    ]);


  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    const row =
      data[i];


    const workzone =
      normalizeText(
        row[COL_WORKZONE]
      );


    if (!workzone) {
      continue;
    }


    const timestamp =
      row[COL_BULAN];


    if (
      !(timestamp instanceof Date)
    ) {
      continue;
    }


    if (
      timestamp.getMonth() + 1 !==
        targetMonth ||
      timestamp.getFullYear() !==
        targetYear
    ) {
      continue;
    }


    const week =
      getWeekPeriod(
        timestamp
      );


    if (!week) {
      continue;
    }


    const sa =
      getSalesArea(
        workzone
      );


    if (!sa) {
      continue;
    }


    const comply4 =
      normalizeText(
        row[COL_COMPLY_4JAM]
      );


    const comply24 =
      normalizeText(
        row[COL_COMPLY_24JAM]
      );


    const base = {

      tiket:
        normalizeValue(
          row[COL_TIKET]
        ),

      customer:
        normalizeValue(
          row[COL_CUSTOMER]
        ),

      ttr:
        normalizeValue(
          row[COL_TTR]
        ),

      sa:
        sa,

      workzone:
        workzone,

      week:
        week

    };


    const ticket4 = {

      tiket:
        base.tiket,

      customer:
        base.customer,

      ttr:
        base.ttr,

      sa:
        base.sa,

      workzone:
        base.workzone,

      kategori:
        "HSI-HVC Reguler 4 Jam",

      comply:
        comply4,

      week:
        week

    };


    addTicketToCategory(
      result[sa].HSI_4JAM,
      ticket4,
      comply4,
      week
    );


    const ticket24 = {

      tiket:
        base.tiket,

      customer:
        base.customer,

      ttr:
        base.ttr,

      sa:
        base.sa,

      workzone:
        base.workzone,

      kategori:
        "HSI-HVC Reguler 24 Jam",

      comply:
        comply24,

      week:
        week

    };


    addTicketToCategory(
      result[sa].HSI_24JAM,
      ticket24,
      comply24,
      week
    );

  }


  Object.keys(result)
    .forEach(
      function(sa) {

        calculateCategoryReal(
          result[sa].HSI_4JAM
        );


        calculateCategoryReal(
          result[sa].HSI_24JAM
        );

      }
    );


  return result;

}


/* ============================================================
 * 12. HSI DASHBOARD
 * ============================================================ */

function getHsiDashboardData() {

  const kpiData =
    getDashboardKpiData();


  const sheet =
    getSheetOrThrow(
      HSI_SHEET_NAME
    );


  const data =
    sheet.getDataRange()
      .getValues();


  const COL_BULAN = 97;


  const latestDate =
    getLatestDateFromColumn(
      data,
      COL_BULAN
    );


  if (!latestDate) {

    throw new Error(
      "Tidak ditemukan tanggal valid pada kolom CT sheet HSI."
    );

  }


  const targetMonth =
    latestDate.getMonth() + 1;


  const targetYear =
    latestDate.getFullYear();


  const hsiResult =
    calculateHsiTTR(
      targetMonth,
      targetYear
    );


  const branchTotal =
    createBranchTtrTotal([
      "HSI_4JAM",
      "HSI_24JAM"
    ]);


  Object.keys(hsiResult)
    .forEach(
      function(sa) {

        [
          "HSI_4JAM",
          "HSI_24JAM"
        ].forEach(
          function(indicator) {

            mergeTicketCategory(
              branchTotal[indicator],
              hsiResult[sa][indicator]
            );

          }
        );

      }
    );


  calculateCategoryReal(
    branchTotal.HSI_4JAM
  );


  calculateCategoryReal(
    branchTotal.HSI_24JAM
  );


  const hsi = [

    {

      indicator:
        "Compliance-TTR HSI-HVC Reguler (4 jam)",

      target:
        findKpiTarget(
          kpiData,
          "Compliance-TTR HSI-HVC Reguler (4 jam)"
        ),

      real:
        branchTotal.HSI_4JAM.real,

      branches:
        hsiResult,

      allTickets:
        branchTotal.HSI_4JAM.allTickets,

      belowTarget:
        branchTotal.HSI_4JAM.belowTarget,

      weeks:
        branchTotal.HSI_4JAM.weeks

    },


    {

      indicator:
        "Compliance-TTR HSI-HVC Reguler (24 jam)",

      target:
        findKpiTarget(
          kpiData,
          "Compliance-TTR HSI-HVC Reguler (24 jam)"
        ),

      real:
        branchTotal.HSI_24JAM.real,

      branches:
        hsiResult,

      allTickets:
        branchTotal.HSI_24JAM.allTickets,

      belowTarget:
        branchTotal.HSI_24JAM.belowTarget,

      weeks:
        branchTotal.HSI_24JAM.weeks

    }

  ];


  return {

    hsi:
      hsi,

    updateMonth:
      Utilities.formatDate(
        latestDate,
        Session.getScriptTimeZone(),
        "MMM ''yy"
      )

  };

}


/* ============================================================
 * 13. WIFI TTR
 *
 * Sheet:
 * DATA TTR & GAUL WIFI
 *
 * A  = No. Incident
 * B  = Customer Name
 * K  = Service No.
 * V  = Tanggal
 * X  = Workzone
 * AP = Comply / Not Comply
 *
 * AP sudah merupakan hasil gabungan:
 * 6 Jam Logik + 24 Jam Fisik
 * ============================================================ */

function calculateWifiTTR(
  targetMonth,
  targetYear
) {

  const sheet =
    getSheetOrThrow(
      WIFI_SHEET_NAME
    );


  const data =
    sheet.getDataRange()
      .getValues();


  const COL_INCIDENT = 0; // A
  const COL_CUSTOMER = 1; // B
  const COL_SERVICE = 10; // K
  const COL_TANGGAL = 21; // V
  const COL_TTR = 33; // AH
  const COL_JENIS_GANGGUAN = 34; // AI
  const COL_WORKZONE = 23; // X
  const COL_COMPLY = 41; // AP


  const result =
    createSAResult([
      "WIFI"
    ]);


  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    const row =
      data[i];


    const workzone =
      normalizeText(
        row[COL_WORKZONE]
      );


    if (!workzone) {
      continue;
    }


    const tanggal =
      row[COL_TANGGAL];


    if (
      !(tanggal instanceof Date)
    ) {
      continue;
    }


    if (
      tanggal.getMonth() + 1 !==
        targetMonth ||
      tanggal.getFullYear() !==
        targetYear
    ) {
      continue;
    }


    const week =
      getWeekPeriod(
        tanggal
      );


    if (!week) {
      continue;
    }


    const sa =
      getSalesArea(
        workzone
      );


    if (!sa) {
      continue;
    }


    const comply =
      normalizeText(
        row[COL_COMPLY]
      );


    const ticketData = {

      tiket:
        normalizeValue(
          row[COL_INCIDENT]
        ),

      incident:
        normalizeValue(
          row[COL_INCIDENT]
        ),

      customer:
        normalizeValue(
          row[COL_CUSTOMER]
        ),

      serviceNo:
        normalizeValue(
          row[COL_SERVICE]
        ),

      tanggal:
        normalizeValue(
          tanggal
        ),

      ttr:
        normalizeValue(
          row[COL_TTR]
        ),

      jenisGangguan:
        normalizeValue(
          row[COL_JENIS_GANGGUAN]
        ),

      sa:
        sa,

      kategori:
        WIFI_TTR_INDICATOR,

      comply:
        comply,

      workzone:
        workzone,

      week:
        week

    };


    addTicketToCategory(
      result[sa].WIFI,
      ticketData,
      comply,
      week
    );

  }


  Object.keys(result)
    .forEach(
      function(sa) {

        calculateCategoryReal(
          result[sa].WIFI
        );

      }
    );


  return result;

}


/* ============================================================
 * 14. WIFI TTR DASHBOARD
 * ============================================================ */

function getWifiDashboardData() {

  const kpiData =
    getDashboardKpiData();


  const sheet =
    getSheetOrThrow(
      WIFI_SHEET_NAME
    );


  const data =
    sheet.getDataRange()
      .getValues();


  const COL_TANGGAL = 21; // V


  const latestDate =
    getLatestDateFromColumn(
      data,
      COL_TANGGAL
    );


  if (!latestDate) {

    throw new Error(
      'Tidak ditemukan tanggal valid pada kolom V sheet "' +
      WIFI_SHEET_NAME +
      '".'
    );

  }


  const targetMonth =
    latestDate.getMonth() + 1;


  const targetYear =
    latestDate.getFullYear();


  const wifiResult =
    calculateWifiTTR(
      targetMonth,
      targetYear
    );


  const branchTotal =
    createBranchTtrTotal([
      "WIFI"
    ]);


  Object.keys(wifiResult)
    .forEach(
      function(sa) {

        mergeTicketCategory(
          branchTotal.WIFI,
          wifiResult[sa].WIFI
        );

      }
    );


  calculateCategoryReal(
    branchTotal.WIFI
  );


  return {

    kpiData:
      kpiData,

    wifi: [

      {

        indicator:
          WIFI_TTR_INDICATOR,

        target:
          findKpiTarget(
            kpiData,
            WIFI_TTR_INDICATOR
          ),

        real:
          branchTotal.WIFI.real,

        branches:
          wifiResult,

        allTickets:
          branchTotal.WIFI.allTickets,

        belowTarget:
          branchTotal.WIFI.belowTarget,

        weeks:
          branchTotal.WIFI.weeks

      }

    ],

    updateMonth:
      Utilities.formatDate(
        latestDate,
        Session.getScriptTimeZone(),
        "MMM ''yy"
      )

  };

}


/* ============================================================
 * 15. ASSURANCE STRUCTURE
 * ============================================================ */

function createAssuranceCategory() {

  return {

    total: 0,

    tidakGaul: 0,

    gaul: 0,

    real: 0,

    allTickets: [],

    belowTarget: []

  };

}


function createAssuranceWeeklyCategory() {

  return {

    W1:
      createAssuranceCategory(),

    W2:
      createAssuranceCategory(),

    W3:
      createAssuranceCategory(),

    W4:
      createAssuranceCategory()

  };

}


function createAssuranceBranchTotal() {

  const result =
    createAssuranceCategory();


  result.weekly =
    createAssuranceWeeklyCategory();


  return result;

}


function calculateAssuranceReal(
  category
) {

  if (
    category.total > 0
  ) {

    category.real =
      (
        category.tidakGaul /
        category.total
      ) * 100;

  } else {

    category.real = 0;

  }


  category.real =
    Math.round(
      category.real * 100
    ) / 100;


  return category;

}


function mergeAssuranceCategory(
  target,
  source
) {

  target.total +=
    source.total;


  target.tidakGaul +=
    source.tidakGaul;


  target.gaul +=
    source.gaul;


  target.allTickets.push.apply(
    target.allTickets,
    source.allTickets
  );


  target.belowTarget.push.apply(
    target.belowTarget,
    source.belowTarget
  );


  getWeekList()
    .forEach(
      function(week) {

        target.weekly[week].total +=
          source.weekly[week].total;


        target.weekly[week].tidakGaul +=
          source.weekly[week].tidakGaul;


        target.weekly[week].gaul +=
          source.weekly[week].gaul;


        target.weekly[week].allTickets.push.apply(
          target.weekly[week].allTickets,
          source.weekly[week].allTickets
        );


        target.weekly[week].belowTarget.push.apply(
          target.weekly[week].belowTarget,
          source.weekly[week].belowTarget
        );

      }
    );

}


/* ============================================================
 * 16. ASSURANCE GENERIC
 * ============================================================ */

function calculateAssuranceGuarantee(
  sheetName,
  colTiket,
  colCustomer,
  colWorkzone,
  colTanggal,
  colGaul
) {

  const sheet =
    getSheetOrThrow(
      sheetName
    );


  const data =
    sheet.getDataRange()
      .getValues();


  if (
    data.length <= 1
  ) {

    throw new Error(
      'Sheet "' +
      sheetName +
      '" tidak memiliki data.'
    );

  }


  const latestDate =
    getLatestDateFromColumn(
      data,
      colTanggal
    );


  if (!latestDate) {

    throw new Error(
      'Tidak ditemukan tanggal valid pada kolom tanggal sheet "' +
      sheetName +
      '".'
    );

  }


  const targetMonth =
    latestDate.getMonth() + 1;


  const targetYear =
    latestDate.getFullYear();


  const result = {};


  Object.keys(
    ASSURANCE_SA_MAPPING
  ).forEach(
    function(sa) {

      result[sa] =
        createAssuranceCategory();


      result[sa].weekly =
        createAssuranceWeeklyCategory();

    }
  );


  /*
   * Map Service No.
   *
   * Jika satu service muncul berkali-kali:
   *
   * GAUL
   * GAUL
   * -> GAUL
   *
   * GAUL
   * TIDAK GAUL
   * -> TIDAK GAUL
   */

  const serviceMap =
    new Map();


  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    const row =
      data[i];


    const serviceNo =
      String(
        row[colTiket] || ""
      ).trim();


    if (!serviceNo) {
      continue;
    }


    const workzone =
      normalizeText(
        row[colWorkzone]
      );


    if (!workzone) {
      continue;
    }


    const sa =
      getSalesArea(
        workzone
      );


    if (!sa) {
      continue;
    }


    const tanggal =
      row[colTanggal];


    if (
      !(tanggal instanceof Date)
    ) {
      continue;
    }


    const week =
      getWeekPeriod(
        tanggal
      );


    if (!week) {
      continue;
    }


    const gaul =
      normalizeText(
        row[colGaul]
      );


    const isTidakGaul =
      gaul === "TIDAK GAUL";


    const isGaul =
      gaul === "GAUL";


    if (
      !serviceMap.has(
        serviceNo
      )
    ) {

      serviceMap.set(
        serviceNo,
        {

          serviceNo:
            serviceNo,

          customer:
            normalizeValue(
              row[colCustomer]
            ),

          sa:
            sa,

          workzone:
            workzone,

          tanggal:
            tanggal,

          gaul:
            gaul,

          isTidakGaul:
            isTidakGaul,

          isGaul:
            isGaul,

          week:
            week,

          weekLabel:
            ASSURANCE_WEEKS[
              week
            ].label

        }
      );

    } else {

      const existing =
        serviceMap.get(
          serviceNo
        );


      /*
       * TIDAK GAUL memiliki prioritas.
       */

      if (isTidakGaul) {

        existing.isTidakGaul =
          true;

        existing.isGaul =
          false;

        existing.gaul =
          "TIDAK GAUL";

      }


      if (
        existing.isTidakGaul
      ) {

        existing.gaul =
          "TIDAK GAUL";

      } else if (isGaul) {

        existing.isGaul =
          true;

        existing.gaul =
          "GAUL";

      }

    }

  }


  /*
   * Masukkan Service No unik
   * ke perhitungan.
   */

  serviceMap.forEach(
    function(service) {

      const isTidakGaul =
        service.isTidakGaul;


      const isGaul =
        !isTidakGaul;


      const ticketData = {

        tiket:
          service.serviceNo,

        serviceNo:
          service.serviceNo,

        customer:
          service.customer,

        sa:
          service.sa,

        workzone:
          service.workzone,

        tanggal:
          normalizeValue(
            service.tanggal
          ),

        gaul:
          isTidakGaul
            ? "TIDAK GAUL"
            : "GAUL",

        comply:
          isTidakGaul
            ? "TIDAK GAUL"
            : "GAUL",

        week:
          service.week,

        weekLabel:
          service.weekLabel

      };


      const category =
        result[
          service.sa
        ];


      category.total++;


      category.allTickets.push(
        ticketData
      );


      if (isTidakGaul) {

        category.tidakGaul++;

      } else {

        category.gaul++;


        category.belowTarget.push(
          ticketData
        );

      }


      const weekCategory =
        category.weekly[
          service.week
        ];


      weekCategory.total++;


      weekCategory.allTickets.push(
        ticketData
      );


      if (isTidakGaul) {

        weekCategory.tidakGaul++;

      } else {

        weekCategory.gaul++;


        weekCategory.belowTarget.push(
          ticketData
        );

      }

    }
  );


  Object.keys(result)
    .forEach(
      function(sa) {

        const item =
          result[sa];


        calculateAssuranceReal(
          item
        );


        getWeekList()
          .forEach(
            function(week) {

              calculateAssuranceReal(
                item.weekly[week]
              );

            }
          );

      }
    );


  return {

    result:
      result,

    latestDate:
      latestDate,

    targetMonth:
      targetMonth,

    targetYear:
      targetYear,

    totalUniqueServiceNo:
      serviceMap.size

  };

}


/* ============================================================
 * 17. ASSURANCE DATIN / HSI / WIFI
 * ============================================================ */

function calculateAssuranceGuaranteeDatin() {

  return calculateAssuranceGuarantee(

    ASSURANCE_DATIN_SHEET,

    11, // L = Service No
    2,  // C = Customer
    36, // AK = Workzone
    73, // BV = Tanggal
    75  // BX = GAUL

  );

}


function calculateAssuranceGuaranteeHsi() {

  return calculateAssuranceGuarantee(

    ASSURANCE_HSI_SHEET,

    11,  // L = Service No
    2,   // C = Customer
    41,  // AP = Workzone
    97,  // CT = Tanggal
    102  // CY = GAUL

  );

}


function calculateAssuranceGuaranteeWifi() {

  return calculateAssuranceGuarantee(

    ASSURANCE_WIFI_SHEET,

    10, // K = Service No
    1,  // B = Customer
    23, // X = Workzone
    21, // V = Tanggal
    36  // AK = GAUL

  );

}


function calculateAssuranceDatin() {

  return calculateAssuranceGuaranteeDatin();

}


function calculateAssuranceHsi() {

  return calculateAssuranceGuaranteeHsi();

}


function calculateAssuranceWifi() {

  return calculateAssuranceGuaranteeWifi();

}


/* ============================================================
 * 18. ASSURANCE KPI
 * ============================================================ */

function getAssuranceKpiTarget(
  indicatorName
) {

  const sheet =
    getSheetOrThrow(
      ASSURANCE_DASHBOARD_SHEET
    );


  const kpiData =
    sheet
      .getRange("B2:C26")
      .getDisplayValues();


  return findKpiTarget(
    kpiData,
    indicatorName
  );

}


/* ============================================================
 * 19. ASSURANCE DASHBOARD GENERIC
 * ============================================================ */

function buildAssuranceDashboardData(
  calculationResult,
  indicatorName
) {

  const data =
    calculationResult.result;


  const branchTotal =
    createAssuranceBranchTotal();


  Object.keys(data)
    .forEach(
      function(sa) {

        mergeAssuranceCategory(
          branchTotal,
          data[sa]
        );

      }
    );


  calculateAssuranceReal(
    branchTotal
  );


  getWeekList()
    .forEach(
      function(week) {

        calculateAssuranceReal(
          branchTotal.weekly[week]
        );

      }
    );


  return {

    indicator:
      indicatorName,

    target:
      getAssuranceKpiTarget(
        indicatorName
      ),

    real:
      branchTotal.real,

    branches:
      data,

    weekly:
      branchTotal.weekly,

    allTickets:
      branchTotal.allTickets,

    belowTarget:
      branchTotal.belowTarget,

    total:
      branchTotal.total,

    tidakGaul:
      branchTotal.tidakGaul,

    gaul:
      branchTotal.gaul,

    updateMonth:
      Utilities.formatDate(
        calculationResult.latestDate,
        Session.getScriptTimeZone(),
        "MMM ''yy"
      )

  };

}


/* ============================================================
 * 20. ASSURANCE DASHBOARD PUBLIC
 * ============================================================ */

function getAssuranceDatinDashboardData() {

  return buildAssuranceDashboardData(

    calculateAssuranceGuaranteeDatin(),

    "Assurance Guarantee DATIN"

  );

}


function getAssuranceHsiDashboardData() {

  return buildAssuranceDashboardData(

    calculateAssuranceGuaranteeHsi(),

    "Assurance Guarantee HSI"

  );

}


function getAssuranceWifiDashboardData() {

  return buildAssuranceDashboardData(

    calculateAssuranceGuaranteeWifi(),

    WIFI_ASSURANCE_INDICATOR

  );

}


function getAssuranceGuaranteeDashboardData() {

  const datin =
    getAssuranceDatinDashboardData();


  const hsi =
    getAssuranceHsiDashboardData();


  const wifi =
    getAssuranceWifiDashboardData();


  return {

    datin:
      datin,

    hsi:
      hsi,

    wifi:
      wifi,

    updateMonth:
      datin.updateMonth

  };

}


/* ============================================================
 * 21. Q DATA STRUCTURE
 * ============================================================ */

function createQWeekData() {

  return {

    totalTiket: 0,
    listBilled: 0,
    q: 0,

    uniqueTickets: [],
    allTickets: [],

    startDate: null,
    endDate: null,

    nominalStartDate: null,
    nominalEndDate: null

  };

}


function createQStoData() {

  return {

    totalTiket: 0,
    listBilled: 0,
    q: 0,

    uniqueTickets: [],
    allTickets: []

  };

}


function createQCategory() {

  return {

    totalTiket: 0,
    listBilled: 0,
    q: 0,

    uniqueTickets: [],
    allTickets: [],

    sto: {},

    weeks: {

      W1:
        createQWeekData(),

      W2:
        createQWeekData(),

      W3:
        createQWeekData(),

      W4:
        createQWeekData()

    },

    weekSto: {

      W1: {},
      W2: {},
      W3: {},
      W4: {}

    }

  };

}


/* ============================================================
 * 22. Q UTILITIES
 * ============================================================ */

function normalizeQSto(
  value
) {

  return normalizeText(
    value
  );

}


function normalizeQTicket(
  value
) {

  return normalizeText(
    value
  );

}


function parseQDate(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return null;

  }


  if (
    value instanceof Date
  ) {

    if (
      isNaN(
        value.getTime()
      )
    ) {
      return null;
    }


    return new Date(
      value.getTime()
    );

  }


  const text =
    String(value)
      .trim();


  if (!text) {
    return null;
  }


  /*
   * YYYY-MM-DD HH:mm:ss
   */

  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?)?$/
    );


  if (match) {

    const date =
      new Date(

        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),

        Number(match[4] || 0),
        Number(match[5] || 0),
        Number(match[6] || 0)

      );


    if (
      !isNaN(
        date.getTime()
      )
    ) {

      return date;

    }

  }


  const fallback =
    new Date(text);


  if (
    !isNaN(
      fallback.getTime()
    )
  ) {

    return fallback;

  }


  return null;

}


function startOfQDay(
  date
) {

  const d =
    parseQDate(
      date
    );


  if (!d) {
    return null;
  }


  return new Date(

    d.getFullYear(),
    d.getMonth(),
    d.getDate(),

    0,
    0,
    0,
    0

  );

}


function endOfQDay(
  date
) {

  const d =
    parseQDate(
      date
    );


  if (!d) {
    return null;
  }


  return new Date(

    d.getFullYear(),
    d.getMonth(),
    d.getDate(),

    23,
    59,
    59,
    999

  );

}


function isQDateInPeriod(
  date,
  period
) {

  const tanggal =
    parseQDate(
      date
    );


  if (
    !tanggal ||
    !period ||
    !period.start ||
    !period.end
  ) {

    return false;

  }


  return (

    tanggal >=
      startOfQDay(
        period.start
      )

    &&

    tanggal <=
      endOfQDay(
        period.end
      )

  );

}


/* ============================================================
 * 23. Q FIRST AVAILABLE DATE
 * ============================================================ */

function findQFirstAvailableDate(
  data,
  colTanggal,
  nominalStart,
  nominalEnd
) {

  const start =
    startOfQDay(
      nominalStart
    );


  const end =
    endOfQDay(
      nominalEnd
    );


  let firstDate = null;


  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    const tanggal =
      parseQDate(
        data[i][colTanggal]
      );


    if (!tanggal) {
      continue;
    }


    if (
      tanggal < start ||
      tanggal > end
    ) {
      continue;
    }


    if (
      !firstDate ||
      tanggal < firstDate
    ) {

      firstDate =
        tanggal;

    }

  }


  return firstDate;

}


/* ============================================================
 * 24. Q PERIOD
 * ============================================================ */

function getQPeriods(
  baseDate,
  data,
  colTanggal
) {

  const today =
    parseQDate(
      baseDate
    );


  if (!today) {

    throw new Error(
      "Tanggal sekarang tidak valid."
    );

  }


  const year =
    today.getFullYear();


  const month =
    today.getMonth();


  const todayEnd =
    endOfQDay(
      today
    );


  /*
   * REAL
   *
   * 1 bulan lalu -> hari ini
   */

  const realStart =
    new Date(

      year,
      month - 1,
      today.getDate(),

      0,
      0,
      0,
      0

    );


  /*
   * W1
   */

  const w1NominalStart =
    new Date(
      year,
      month - 1,
      7
    );


  const w1NominalEnd =
    new Date(

      year,
      month,
      7,

      23,
      59,
      59,
      999

    );


  /*
   * W2
   */

  const w2NominalStart =
    new Date(
      year,
      month - 1,
      14
    );


  const w2NominalEnd =
    new Date(

      year,
      month,
      14,

      23,
      59,
      59,
      999

    );


  /*
   * W3
   */

  const w3NominalStart =
    new Date(
      year,
      month - 1,
      21
    );


  const w3NominalEnd =
    new Date(

      year,
      month,
      21,

      23,
      59,
      59,
      999

    );


  /*
   * W4
   */

  const w4NominalStart =
    new Date(
      year,
      month,
      1
    );


  const w4NominalEnd =
    new Date(

      year,
      month + 1,
      0,

      23,
      59,
      59,
      999

    );


  function getActualEnd(
    nominalEnd
  ) {

    const end =
      endOfQDay(
        nominalEnd
      );


    return end > todayEnd
      ? todayEnd
      : end;

  }


  function getDynamicStart(
    nominalStart,
    actualEnd
  ) {

    const firstAvailable =
      findQFirstAvailableDate(
        data,
        colTanggal,
        nominalStart,
        actualEnd
      );


    if (!firstAvailable) {

      return startOfQDay(
        nominalStart
      );

    }


    const nominal =
      startOfQDay(
        nominalStart
      );


    const actual =
      startOfQDay(
        firstAvailable
      );


    return actual > nominal
      ? actual
      : nominal;

  }


  const w1End =
    getActualEnd(
      w1NominalEnd
    );


  const w2End =
    getActualEnd(
      w2NominalEnd
    );


  const w3End =
    getActualEnd(
      w3NominalEnd
    );


  const w4End =
    getActualEnd(
      w4NominalEnd
    );


  return {

    REAL: {

      start:
        realStart,

      end:
        todayEnd

    },


    W1: {

      start:
        getDynamicStart(
          w1NominalStart,
          w1End
        ),

      end:
        w1End,

      nominalStart:
        w1NominalStart,

      nominalEnd:
        w1NominalEnd

    },


    W2: {

      start:
        getDynamicStart(
          w2NominalStart,
          w2End
        ),

      end:
        w2End,

      nominalStart:
        w2NominalStart,

      nominalEnd:
        w2NominalEnd

    },


    W3: {

      start:
        getDynamicStart(
          w3NominalStart,
          w3End
        ),

      end:
        w3End,

      nominalStart:
        w3NominalStart,

      nominalEnd:
        w3NominalEnd

    },


    W4: {

      start:
        getDynamicStart(
          w4NominalStart,
          w4End
        ),

      end:
        w4End,

      nominalStart:
        w4NominalStart,

      nominalEnd:
        w4NominalEnd

    }

  };

}


/* ============================================================
 * 25. Q SALES AREA
 * ============================================================ */

function getQSalesArea(
  sto
) {

  const normalized =
    normalizeQSto(
      sto
    );


  if (!normalized) {
    return null;
  }


  const salesAreas =
    Object.keys(
      SA_MAPPING
    );


  for (
    let i = 0;
    i < salesAreas.length;
    i++
  ) {

    const sa =
      salesAreas[i];


    const stoList =
      SA_MAPPING[sa] || [];


    for (
      let j = 0;
      j < stoList.length;
      j++
    ) {

      if (
        normalizeQSto(
          stoList[j]
        ) === normalized
      ) {

        return sa;

      }

    }

  }


  return null;

}


/* ============================================================
 * 26. Q KPI TABLE
 * ============================================================ */

function findQHeaderColumn(
  headers,
  headerName
) {

  const target =
    normalizeText(
      headerName
    );


  for (
    let i = 0;
    i < headers.length;
    i++
  ) {

    if (
      normalizeText(
        headers[i]
      ) === target
    ) {

      return i;

    }

  }


  return -1;

}


function parseQNumber(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return 0;

  }


  if (
    typeof value === "number"
  ) {

    return value;

  }


  let text =
    String(value)
      .trim();


  if (!text) {
    return 0;
  }


  text =
    text.replace(
      /[^0-9,.\-]/g,
      ""
    );


  if (!text) {
    return 0;
  }


  if (
    text.includes(".") &&
    text.includes(",")
  ) {

    text =
      text.replace(
        /\./g,
        ""
      );


    text =
      text.replace(
        ",",
        "."
      );

  } else if (
    text.includes(",")
  ) {

    text =
      text.replace(
        ",",
        "."
      );

  } else if (
    text.includes(".")
  ) {

    const parts =
      text.split(".");


    if (
      parts.length === 2 &&
      parts[1].length === 3
    ) {

      text =
        parts[0] +
        parts[1];

    }

  }


  const number =
    Number(text);


  return isNaN(number)
    ? 0
    : number;

}


/* ============================================================
 * 27. Q LIST BILLED
 * ============================================================ */

function getQListBilled(
  rangeA1
) {

  const sheet =
    getSheetOrThrow(
      Q_DASHBOARD_SHEET
    );


  const values =
    sheet
      .getRange(rangeA1)
      .getDisplayValues();


  if (
    values.length <= 1
  ) {

    return {};

  }


  const headers =
    values[0];


  const stoColumn =
    findQHeaderColumn(
      headers,
      "STO"
    );


  const billedColumn =
    findQHeaderColumn(
      headers,
      "List Berbilled"
    );


  if (
    stoColumn === -1
  ) {

    throw new Error(
      'Header "STO" tidak ditemukan pada range ' +
      rangeA1
    );

  }


  if (
    billedColumn === -1
  ) {

    throw new Error(
      'Header "List Berbilled" tidak ditemukan pada range ' +
      rangeA1
    );

  }


  const result = {};


  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row =
      values[i];


    const sto =
      normalizeQSto(
        row[stoColumn]
      );


    if (!sto) {
      continue;
    }


    const billed =
      parseQNumber(
        row[billedColumn]
      );


    if (
      !result[sto]
    ) {

      result[sto] = 0;

    }


    result[sto] +=
      billed;

  }


  return result;

}


/* ============================================================
 * 28. Q CALCULATION
 * ============================================================ */

function calculateQReal(
  category
) {

  if (
    category.listBilled > 0
  ) {

    category.q =
      (
        category.totalTiket /
        category.listBilled
      ) * 100;

  } else {

    category.q = 0;

  }


  category.q =
    Math.round(
      category.q * 100
    ) / 100;


  return category;

}


/* ============================================================
 * 29. Q GENERIC
 * ============================================================ */

function calculateQ(
  sheetName,
  dashboardRange,
  colSto,
  colTiket,
  colTanggal
) {

  const sheet =
    getSheetOrThrow(
      sheetName
    );


  const data =
    sheet
      .getDataRange()
      .getValues();


  if (
    data.length <= 1
  ) {

    throw new Error(
      'Sheet "' +
      sheetName +
      '" tidak memiliki data.'
    );

  }


  /*
   * TODAY
   */

  const today =
    new Date();


  /*
   * PERIOD
   */

  const qPeriods =
    getQPeriods(
      today,
      data,
      colTanggal
    );


  /*
   * LIST BILLED
   */

  const listBilledMap =
    getQListBilled(
      dashboardRange
    );


  /*
   * INITIAL RESULT
   */

  const result = {};


  Object.keys(
    SA_MAPPING
  ).forEach(
    function(sa) {

      result[sa] =
        createQCategory();

    }
  );


  /*
   * Data minimum:
   *
   * W1 nominal start -> hari ini
   */

  const qDataStart =
    startOfQDay(
      qPeriods.W1.nominalStart
    );


  const qDataEnd =
    endOfQDay(
      today
    );


  /*
   * LOOP DATA
   */

  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    const row =
      data[i];


    const tiket =
      normalizeQTicket(
        row[colTiket]
      );


    if (!tiket) {
      continue;
    }


    const tanggal =
      parseQDate(
        row[colTanggal]
      );


    if (!tanggal) {
      continue;
    }


    if (
      tanggal < qDataStart ||
      tanggal > qDataEnd
    ) {
      continue;
    }


    const sto =
      normalizeQSto(
        row[colSto]
      );


    if (!sto) {
      continue;
    }


    const sa =
      getQSalesArea(
        sto
      );


    if (!sa) {
      continue;
    }


    const category =
      result[sa];


    if (!category) {
      continue;
    }


    /*
     * STO
     */

    if (
      !category.sto[sto]
    ) {

      category.sto[sto] =
        createQStoData();

    }


    const stoCategory =
      category.sto[sto];


    const ticketKey =
      sto + "|" + tiket;


    /*
     * Duplicate di STO
     */

    if (
      stoCategory.uniqueTickets
        .includes(ticketKey)
    ) {

      continue;

    }


    const ticketData = {

      tiket:
        tiket,

      sto:
        sto,

      sa:
        sa,

      ticketKey:
        ticketKey,

      tanggal:
        normalizeValue(
          tanggal
        )

    };


    /*
     * STO TOTAL
     */

    stoCategory.uniqueTickets.push(
      ticketKey
    );


    stoCategory.totalTiket++;


    stoCategory.allTickets.push(
      ticketData
    );


    /*
     * REAL
     */

    if (
      isQDateInPeriod(
        tanggal,
        qPeriods.REAL
      )
    ) {

      if (
        !category.uniqueTickets
          .includes(ticketKey)
      ) {

        category.uniqueTickets.push(
          ticketKey
        );


        category.totalTiket++;


        category.allTickets.push(
          ticketData
        );

      }

    }


    /*
     * WEEK
     */

    getWeekList()
      .forEach(
        function(week) {

          const period =
            qPeriods[week];


          if (
            !isQDateInPeriod(
              tanggal,
              period
            )
          ) {

            return;

          }


          const weekData =
            category.weeks[week];


          if (
            !category.weekSto[week][sto]
          ) {

            category.weekSto[week][sto] =
              createQStoData();

          }


          const weekSto =
            category.weekSto[week][sto];


          /*
           * Duplicate dalam week
           */

          if (
            weekData.uniqueTickets
              .includes(ticketKey)
          ) {

            return;

          }


          if (
            weekSto.uniqueTickets
              .includes(ticketKey)
          ) {

            return;

          }


          weekData.uniqueTickets.push(
            ticketKey
          );


          weekData.totalTiket++;


          weekSto.uniqueTickets.push(
            ticketKey
          );


          weekSto.totalTiket++;


          weekSto.allTickets.push(
            ticketData
          );


          weekData.allTickets.push(
            ticketData
          );

        }
      );

  }


  /*
   * APPLY LIST BILLED
   */

  Object.keys(result)
    .forEach(
      function(sa) {

        const category =
          result[sa];


        /*
         * STO
         */

        Object.keys(category.sto)
          .forEach(
            function(sto) {

              const stoCategory =
                category.sto[sto];


              stoCategory.listBilled =
                listBilledMap[sto] || 0;


              calculateQReal(
                stoCategory
              );

            }
          );


        /*
         * TOTAL LIST BILLED SA
         */

        category.listBilled = 0;


        Object.keys(category.sto)
          .forEach(
            function(sto) {

              category.listBilled +=
                category.sto[sto]
                  .listBilled;

            }
          );


        calculateQReal(
          category
        );


        /*
         * WEEK
         */

        getWeekList()
          .forEach(
            function(week) {

              const weekData =
                category.weeks[week];


              const period =
                qPeriods[week];


              /*
               * Denominator week =
               * total List Berbilled SA
               */

              weekData.listBilled =
                category.listBilled;


              weekData.startDate =
                normalizeValue(
                  period.start
                );


              weekData.endDate =
                normalizeValue(
                  period.end
                );


              weekData.nominalStartDate =
                normalizeValue(
                  period.nominalStart
                );


              weekData.nominalEndDate =
                normalizeValue(
                  period.nominalEnd
                );


              calculateQReal(
                weekData
              );

            }
          );

      }
    );


  /*
   * BRANCH TOTAL
   */

  const branchTotal =
    createQCategory();


  Object.keys(result)
    .forEach(
      function(sa) {

        const item =
          result[sa];


        /*
         * REAL
         */

        branchTotal.totalTiket +=
          item.totalTiket;


        branchTotal.listBilled +=
          item.listBilled;


        branchTotal.uniqueTickets.push.apply(
          branchTotal.uniqueTickets,
          item.uniqueTickets
        );


        branchTotal.allTickets.push.apply(
          branchTotal.allTickets,
          item.allTickets
        );


        /*
         * WEEK
         */

        getWeekList()
          .forEach(
            function(week) {

              const branchWeek =
                branchTotal.weeks[week];


              const saWeek =
                item.weeks[week];


              branchWeek.totalTiket +=
                saWeek.totalTiket;


              branchWeek.uniqueTickets.push.apply(
                branchWeek.uniqueTickets,
                saWeek.uniqueTickets
              );


              branchWeek.allTickets.push.apply(
                branchWeek.allTickets,
                saWeek.allTickets
              );

            }
          );

      }
    );


  /*
   * BRANCH REAL
   */

  calculateQReal(
    branchTotal
  );


  /*
   * BRANCH WEEK
   */

  getWeekList()
    .forEach(
      function(week) {

        const weekData =
          branchTotal.weeks[week];


        const period =
          qPeriods[week];


        weekData.listBilled =
          branchTotal.listBilled;


        weekData.startDate =
          normalizeValue(
            period.start
          );


        weekData.endDate =
          normalizeValue(
            period.end
          );


        weekData.nominalStartDate =
          normalizeValue(
            period.nominalStart
          );


        weekData.nominalEndDate =
          normalizeValue(
            period.nominalEnd
          );


        calculateQReal(
          weekData
        );

      }
    );


  return {

    result:
      result,

    branchTotal:
      branchTotal,

    listBilled:
      listBilledMap,

    periods:
      qPeriods,

    today:
      normalizeValue(
        today
      )

  };

}


/* ============================================================
 * 30. Q DATIN
 *
 * STO     = AB = index 27
 * Tiket   = J  = index 9
 * Tanggal = M  = index 12
 * ============================================================ */

function calculateQDatin() {

  return calculateQ(

    Q_DATIN_SHEET,

    Q_DATIN_BILLED_RANGE,

    27,
    9,
    12

  );

}


/* ============================================================
 * 31. Q HSI
 *
 * STO     = U = index 20
 * Tiket   = A = index 0
 * Tanggal = C = index 2
 * ============================================================ */

function calculateQHsi() {

  return calculateQ(

    Q_HSI_SHEET,

    Q_HSI_BILLED_RANGE,

    20,
    0,
    2

  );

}


/* ============================================================
 * 32. Q DASHBOARD
 * ============================================================ */

function buildQDashboardData(
  calculationResult,
  indicator
) {

  const branch =
    calculationResult.branchTotal;


  const target =
    getAssuranceKpiTarget(
      indicator
    );


  return {

    indicator:
      indicator,

    target:
      target || 0,

    real:
      branch.q || 0,

    totalTiket:
      branch.totalTiket || 0,

    listBilled:
      branch.listBilled || 0,

    q:
      branch.q || 0,

    weeks:
      branch.weeks || {},

    periods:
      calculationResult.periods || {},

    today:
      calculationResult.today || null,

    allTickets:
      branch.allTickets || [],

    branches:
      calculationResult.result || {},

    sto:
      calculationResult.listBilled || {}

  };

}


function getQDatinDashboardData() {

  return buildQDashboardData(

    calculateQDatin(),

    "Q Saldo Gangguan DATIN"

  );

}


function getQHsiDashboardData() {

  return buildQDashboardData(

    calculateQHsi(),

    "Q Saldo Gangguan HSI"

  );

}


/* ============================================================
 * 33. DASHBOARD JSON SAFE
 * ============================================================ */

function makeJsonSafe(
  value
) {

  return JSON.parse(
    JSON.stringify(value)
  );

}


/* ============================================================
 * 34. MAIN DASHBOARD API
 *
 * Fungsi ini dipanggil oleh HTML.
 * ============================================================ */

function getDashboardData() {

  try {

    const dashboardSheet =
      getSheetOrThrow(
        DASHBOARD_SHEET_NAME
      );


    /*
     * KPI
     */

    const tableData =
      dashboardSheet
        .getRange("B2:C26")
        .getDisplayValues();


    /*
     * TTR
     */

    const datinDashboard =
      getDatinDashboardData();


    const hsiDashboard =
      getHsiDashboardData();


    const wifiDashboard =
      getWifiDashboardData();


    /*
     * ASSURANCE
     */

    const assuranceDatin =
      getAssuranceDatinDashboardData();


    const assuranceHsi =
      getAssuranceHsiDashboardData();


    const assuranceWifi =
      getAssuranceWifiDashboardData();


    /*
     * Q
     */

    const qDatin =
      getQDatinDashboardData();


    const qHsi =
      getQHsiDashboardData();


    /*
     * RESPONSE
     */

    const response = {

      tableData:
        tableData,


      datin:
        datinDashboard &&
        datinDashboard.datin
          ? datinDashboard.datin
          : [],


      hsi:
        hsiDashboard &&
        hsiDashboard.hsi
          ? hsiDashboard.hsi
          : [],


      /*
       * WIFI TTR
       */

      wifi:
        wifiDashboard &&
        wifiDashboard.wifi
          ? wifiDashboard.wifi
          : [

              {

                indicator:
                  WIFI_TTR_INDICATOR,

                target:
                  "-",

                real:
                  0,

                branches:
                  {},

                allTickets:
                  [],

                belowTarget:
                  [],

                weeks:
                  {}

              }

            ],


      /*
       * ASSURANCE
       *
       * DATIN
       * HSI
       * WIFI
       */

      assurance: [

        assuranceDatin,

        assuranceHsi,

        assuranceWifi

      ],


      /*
       * Q DATIN
       */

      qDatin:
        qDatin || {

          indicator:
            "Q Saldo Gangguan DATIN",

          target:
            0,

          real:
            0,

          totalTiket:
            0,

          listBilled:
            0,

          q:
            0,

          weeks:
            {},

          periods:
            {},

          today:
            null,

          allTickets:
            [],

          branches:
            {},

          sto:
            {}

        },


      /*
       * Q HSI
       */

      qHsi:
        qHsi || {

          indicator:
            "Q Saldo Gangguan HSI",

          target:
            0,

          real:
            0,

          totalTiket:
            0,

          listBilled:
            0,

          q:
            0,

          weeks:
            {},

          periods:
            {},

          today:
            null,

          allTickets:
            [],

          branches:
            {},

          sto:
            {}

        },


      updateMonth:
        datinDashboard
          ? datinDashboard.updateMonth
          : "",


      weeks:
        getWeekList()

    };


    /*
     * JSON SAFE
     */

    const safeResponse =
      makeJsonSafe(
        response
      );


    console.log(
      "=============================================="
    );


    console.log(
      "getDashboardData BERHASIL"
    );


    console.log(
      "Q DATIN:",
      safeResponse.qDatin
        ? safeResponse.qDatin.q
        : "NULL"
    );


    console.log(
      "Q HSI:",
      safeResponse.qHsi
        ? safeResponse.qHsi.q
        : "NULL"
    );


    console.log(
      "TTR WIFI:",
      safeResponse.wifi &&
      safeResponse.wifi[0]
        ? safeResponse.wifi[0].real
        : "NULL"
    );


    console.log(
      "ASSURANCE WIFI:",
      safeResponse.assurance &&
      safeResponse.assurance[2]
        ? safeResponse.assurance[2].real
        : "NULL"
    );


    console.log(
      "=============================================="
    );


    return safeResponse;

  } catch (error) {

    console.error(
      "ERROR getDashboardData:",
      error
    );


    throw new Error(
      "getDashboardData gagal: " +
      error.message
    );

  }

}


/* ============================================================
 * 35. OPTIONAL TEST FUNCTIONS
 * ============================================================ */

function testDashboardData() {

  const result =
    getDashboardData();


  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


function testQDatin() {

  const result =
    getQDatinDashboardData();


  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


function testQHsi() {

  const result =
    getQHsiDashboardData();


  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


function testAssurance() {

  const result =
    getAssuranceGuaranteeDashboardData();


  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * WIFI TEST FUNCTIONS
 * ============================================================ */

function testWifiTTR() {

  const result =
    getWifiDashboardData();


  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


function testAssuranceWifi() {

  const result =
    getAssuranceWifiDashboardData();


  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * END OF FILE
 * ============================================================ */
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-08-26T01:05:41+07:00.
</ADDITIONAL_METADATA>