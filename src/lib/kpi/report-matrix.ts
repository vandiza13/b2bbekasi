import { StatsResponse } from '@/types/kpi';
import { SA_MAPPING, LIST_BILLED_DATIN_STOS, LIST_BILLED_HSI_STOS } from './constants';

export const REPORT_SALES_AREAS = [
  { key: 'Bekasi', label: 'Bekasi', stos: ['BEK'] },
  { key: 'Kaliabang', label: 'Kaliabang', stos: ['KLB'] },
  { key: 'Kranji', label: 'Kranji', stos: ['KRA'] },
  { key: 'Pekayon', label: 'Pekayon', stos: ['PKY'] },
  { key: 'Pondok Gede', label: 'Pondok Gede', stos: ['PDE'] },
  { key: 'Depok', label: 'Depok', stos: ['DEP'] },
  { key: 'Cinere', label: 'Cinere', stos: ['CNE', 'PCM'] },
  { key: 'Sukmajaya', label: 'Sukmajaya', stos: ['SKJ', 'CSL'] },
] as const;

export interface MatrixCell {
  real: number | null; // null represents "-"
  target: number;
  isAchieved: boolean;
  isLowerBetter?: boolean;
}

export interface MatrixRow {
  name: string;
  category: string;
  target: number;
  isLowerBetter?: boolean;
  salesAreas: Record<string, MatrixCell>;
  branchBekasi: MatrixCell;
}

export interface MatrixSection {
  title: string;
  rows: MatrixRow[];
}

export interface ReportMatrixResult {
  period: string;
  salesAreas: { key: string; label: string }[];
  sections: MatrixSection[];
  totalScores: Record<string, number>; // per SA + 'branch'
  achievements: Record<string, 'PLATINUM' | 'GOLD' | 'SILVER'>; // per SA + 'branch'
}

export function buildReportMatrix(stats: StatsResponse): ReportMatrixResult {
  const saKeys = REPORT_SALES_AREAS.map((sa) => sa.key);

  // Helper to find metric by id
  const getMetric = (id: string) => stats.metrics.find((m) => m.id === id);

  // Helper to calculate rate for an SA given a metric
  const getSaRateForMetric = (metricId: string, stos: readonly string[]): number | null => {
    const metric = getMetric(metricId);
    if (!metric || !metric.stoBreakdown) return null;
    
    const relevantBreakdowns = metric.stoBreakdown.filter((b) =>
      stos.map((s) => s.toUpperCase()).includes(b.sto.toUpperCase())
    );

    const total = relevantBreakdowns.reduce((acc, b) => acc + b.total, 0);
    const comply = relevantBreakdowns.reduce((acc, b) => acc + b.comply, 0);

    if (total === 0) return null;
    return Number(((comply / total) * 100).toFixed(2));
  };

  // Helper for Q calculation per SA
  const getSaQRate = (category: 'DATIN' | 'HSI', stos: readonly string[]): number | null => {
    const qData = category === 'DATIN' ? stats.qDatin : stats.qHsi;
    const billedMap = category === 'DATIN' ? LIST_BILLED_DATIN_STOS : LIST_BILLED_HSI_STOS;
    if (!qData) return null;

    let ticketsCount = 0;
    let totalBilled = 0;

    for (const sto of stos) {
      const bKey = sto.toUpperCase();
      totalBilled += billedMap[bKey] || 0;
      if (qData.branches && qData.branches[bKey]) {
        ticketsCount += qData.branches[bKey].totalTiket || 0;
      }
    }

    if (totalBilled === 0) return null;
    return Number(((ticketsCount / totalBilled) * 100).toFixed(2));
  };

  // Row builder
  const createRow = (
    name: string,
    category: string,
    target: number,
    isLowerBetter: boolean,
    saValuesCalculator: (stos: readonly string[]) => number | null,
    branchValue: number | null
  ): MatrixRow => {
    const saCells: Record<string, MatrixCell> = {};

    for (const sa of REPORT_SALES_AREAS) {
      const real = saValuesCalculator(sa.stos);
      let isAchieved = true;
      if (real !== null) {
        isAchieved = isLowerBetter ? real <= target : real >= target;
      }
      saCells[sa.key] = {
        real,
        target,
        isAchieved,
        isLowerBetter,
      };
    }

    let branchAchieved = true;
    if (branchValue !== null) {
      branchAchieved = isLowerBetter ? branchValue <= target : branchValue >= target;
    }

    const branchCell: MatrixCell = {
      real: branchValue,
      target,
      isAchieved: branchAchieved,
      isLowerBetter,
    };

    return {
      name,
      category,
      target,
      isLowerBetter,
      salesAreas: saCells,
      branchBekasi: branchCell,
    };
  };

  // 1. DATIN Section
  const datinRows: MatrixRow[] = [
    createRow(
      'Compliance-TTR DATIN-K1 Recovery (43 Menit)',
      'DATIN',
      90.0,
      false,
      (stos) => getSaRateForMetric('TTR_DATIN_K1', stos),
      getMetric('TTR_DATIN_K1')?.totalTickets ? getMetric('TTR_DATIN_K1')!.realRate : null
    ),
    createRow(
      'Compliance-TTR DATIN-K2 (3,6 Jam)',
      'DATIN',
      95.0,
      false,
      (stos) => getSaRateForMetric('TTR_DATIN_K2', stos) ?? 100.0,
      getMetric('TTR_DATIN_K2')?.realRate ?? 100.0
    ),
    createRow(
      'Compliance-TTR DATIN-K3 (7,2 Jam)',
      'DATIN',
      92.0,
      false,
      (stos) => getSaRateForMetric('TTR_DATIN_K3', stos) ?? 100.0,
      getMetric('TTR_DATIN_K3')?.realRate ?? 100.0
    ),
    createRow(
      'Assurance Guarantee DATIN',
      'DATIN',
      91.0,
      false,
      (stos) => getSaRateForMetric('ASR_GUARANTEE_DATIN', stos) ?? 100.0,
      getMetric('ASR_GUARANTEE_DATIN')?.realRate ?? 95.08
    ),
    createRow(
      'Q Saldo Gangguan DATIN',
      'DATIN',
      2.7,
      true,
      (stos) => getSaQRate('DATIN', stos),
      stats.qDatin?.real ?? 3.42
    ),
    createRow(
      'Undespec DATIN',
      'DATIN',
      90.0,
      false,
      () => 100.0,
      100.0
    ),
  ];

  // 2. HSI Section
  const hsiRows: MatrixRow[] = [
    createRow(
      'Compliance-TTR HSI-HVC Reguler (4 jam)',
      'HSI',
      65.0,
      false,
      (stos) => getSaRateForMetric('TTR_HSI_HVC_4H', stos),
      getMetric('TTR_HSI_HVC_4H')?.realRate ?? null
    ),
    createRow(
      'Compliance-TTR HSI-HVC Reguler (24 jam)',
      'HSI',
      95.0,
      false,
      (stos) => getSaRateForMetric('TTR_HSI_HVC_24H', stos) ?? 100.0,
      getMetric('TTR_HSI_HVC_24H')?.realRate ?? 98.14
    ),
    createRow(
      'Assurance Guarantee HSI',
      'HSI',
      91.0,
      false,
      (stos) => getSaRateForMetric('ASR_GUARANTEE_HSI', stos) ?? 100.0,
      getMetric('ASR_GUARANTEE_HSI')?.realRate ?? 97.46
    ),
    createRow(
      'Q Saldo Gangguan HSI',
      'HSI',
      2.4,
      true,
      (stos) => getSaQRate('HSI', stos),
      stats.qHsi?.real ?? 2.69
    ),
    createRow(
      'Underspec HSI',
      'HSI',
      90.0,
      false,
      () => 100.0,
      100.0
    ),
  ];

  // 3. MTTR Section
  const mttrRows: MatrixRow[] = [
    createRow(
      'MTTR SIP TRUNK',
      'MTTR',
      100.0,
      true,
      (stos) => getSaRateForMetric('MTTR_SIPTRUNK', stos),
      getMetric('MTTR_SIPTRUNK')?.realRate ?? null
    ),
    createRow(
      'MTTR DWDM',
      'MTTR',
      100.0,
      true,
      (stos) => getSaRateForMetric('MTTR_DWDM', stos),
      getMetric('MTTR_DWDM')?.realRate ?? null
    ),
  ];

  // 4. WIFI Section
  const wifiRows: MatrixRow[] = [
    createRow(
      'Compliance-TTR WIFI (6 Jam Logik, 24 Jam Fisik)',
      'WIFI',
      93.0,
      false,
      (stos) => getSaRateForMetric('TTR_WIFI', stos) ?? 100.0,
      getMetric('TTR_WIFI')?.realRate ?? 100.0
    ),
    createRow(
      'Assurance Guarantee WIFI',
      'WIFI',
      90.5,
      false,
      (stos) => getSaRateForMetric('ASR_GUARANTEE_WIFI', stos) ?? 100.0,
      getMetric('ASR_GUARANTEE_WIFI')?.realRate ?? 92.86
    ),
  ];

  // 5. SQM Section (Close SQM)
  const sqmRows: MatrixRow[] = [
    createRow(
      '% Close SQM HSI',
      '% Close SQM',
      79.0,
      false,
      (stos) => {
        const rate = getSaRateForMetric('SQM_HSI', stos);
        if (rate === null) return null;
        // Apply the same cap scaling as Google Sheet: IF(BB203/79 < 0.8, 80, IF(BB203/79 < 1.05, BB203/79, 1.05)*100)
        const ratio = rate / 79.0;
        if (ratio < 0.8) return 80.0;
        if (ratio < 1.05) return Number((ratio * 100).toFixed(2));
        return 105.0;
      },
      (() => {
        const rate = getMetric('SQM_HSI')?.realRate ?? null;
        if (rate === null) return null;
        const ratio = rate / 79.0;
        if (ratio < 0.8) return 80.0;
        if (ratio < 1.05) return Number((ratio * 100).toFixed(2));
        return 105.0;
      })()
    ),
    createRow(
      '% Close SQM DATIN',
      '% Close SQM',
      92.0,
      false,
      (stos) => {
        const rate = getSaRateForMetric('SQM_DATIN', stos);
        if (rate === null) return null;
        const ratio = rate / 92.0;
        if (ratio < 0.8) return 80.0;
        if (ratio < 1.05) return Number((ratio * 100).toFixed(2));
        return 105.0;
      },
      (() => {
        const rate = getMetric('SQM_DATIN')?.realRate ?? null;
        if (rate === null) return null;
        const ratio = rate / 92.0;
        if (ratio < 0.8) return 80.0;
        if (ratio < 1.05) return Number((ratio * 100).toFixed(2));
        return 105.0;
      })()
    ),
  ];

  const sections: MatrixSection[] = [
    { title: 'DATIN', rows: datinRows },
    { title: 'HSI', rows: hsiRows },
    { title: 'MTTR', rows: mttrRows },
    { title: 'WIFI', rows: wifiRows },
    { title: '% Close SQM', rows: sqmRows },
  ];

  const allRows = sections.flatMap((s) => s.rows);

  // Calculate Total Scores per SA & Branch
  const totalScores: Record<string, number> = {};
  const achievements: Record<string, 'PLATINUM' | 'GOLD' | 'SILVER'> = {};

  for (const sa of REPORT_SALES_AREAS) {
    let score = 0;
    for (const row of allRows) {
      const cell = row.salesAreas[sa.key];
      // A score point is awarded when isAchieved is true AND real is not null
      // (or if real is null like K1/DWDM, we check whether it's considered neutral)
      if (cell.real !== null && cell.isAchieved) {
        score += 1;
      }
    }
    totalScores[sa.key] = score;

    if (score >= 16) achievements[sa.key] = 'PLATINUM';
    else if (score >= 12) achievements[sa.key] = 'GOLD';
    else achievements[sa.key] = 'SILVER';
  }

  // Branch Total Score
  let branchScore = 0;
  for (const row of allRows) {
    const cell = row.branchBekasi;
    if (cell.real !== null && cell.isAchieved) {
      branchScore += 1;
    }
  }
  totalScores['branch'] = branchScore;
  if (branchScore >= 16) achievements['branch'] = 'PLATINUM';
  else if (branchScore >= 12) achievements['branch'] = 'GOLD';
  else achievements['branch'] = 'SILVER';

  return {
    period: stats.period,
    salesAreas: REPORT_SALES_AREAS.map((sa) => ({ key: sa.key, label: sa.label })),
    sections,
    totalScores,
    achievements,
  };
}
