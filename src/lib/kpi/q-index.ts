import { QualityData, QualityTicketItem, QualityWeekData } from '@/types/kpi';
import { SA_MAPPING } from './constants';

export interface QTicketInput {
  incidentId: string;
  sto: string;
  reportedAt: Date;
}

export type BilledMap = Record<string, number>;

// Nilai List Berbilled resmi per-STO dari blok "Dashboard Branch Bekasi" BI6:BQ15.
// Dipakai sebagai fallback ketika tabel billed_customers belum terisi.
export const DEFAULT_Q_BILLED: Record<'HSI' | 'DATIN', BilledMap> = {
  DATIN: {
    BEK: 250, KRA: 508, KLB: 227, PKY: 387, PDE: 286,
    DEP: 257, CSL: 74, PCM: 64, SKJ: 76, CNE: 91,
  },
  HSI: {
    BEK: 1978, KRA: 2667, KLB: 1785, PKY: 2743, PDE: 1402,
    DEP: 1446, CSL: 352, PCM: 355, SKJ: 1024, CNE: 568,
  },
};

const STO_TO_SA: Record<string, string> = {};
for (const [sa, stos] of Object.entries(SA_MAPPING)) {
  for (const sto of stos) STO_TO_SA[sto.toUpperCase()] = sa;
}

function startOfDay(y: number, m: number, d: number): number {
  return new Date(y, m, d, 0, 0, 0, 0).getTime();
}

function endOfDay(y: number, m: number, d: number): number {
  return new Date(y, m, d, 23, 59, 59, 999).getTime();
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().split('T')[0];
}

function findFirstAvailable(times: number[], start: number, end: number): number | null {
  let min: number | null = null;
  for (const t of times) {
    if (t >= start && t <= end && (min === null || t < min)) min = t;
  }
  return min;
}

interface WindowRange {
  key: 'W1' | 'W2' | 'W3' | 'W4';
  nominalStart: number;
  nominalEnd: number;
  start: number;
  end: number;
}

function buildWindows(now: Date, times: number[]): WindowRange[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const todayEnd = endOfDay(y, m, d);

  const defs: Array<{ key: WindowRange['key']; startDay: number }> = [
    { key: 'W1', startDay: 7 },
    { key: 'W2', startDay: 14 },
    { key: 'W3', startDay: 21 },
  ];

  const windows: WindowRange[] = defs.map(({ key, startDay }) => {
    const nominalStart = startOfDay(y, m - 1, startDay);
    const nominalEnd = endOfDay(y, m, startDay);
    const actualEnd = Math.min(nominalEnd, todayEnd);
    const first = findFirstAvailable(times, nominalStart, actualEnd);
    const start = first !== null ? Math.max(nominalStart, first) : nominalStart;
    return { key, nominalStart, nominalEnd, start, end: actualEnd };
  });

  const w4NominalStart = startOfDay(y, m, 1);
  const w4NominalEnd = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
  const w4ActualEnd = Math.min(w4NominalEnd, todayEnd);
  const w4First = findFirstAvailable(times, w4NominalStart, w4ActualEnd);
  windows.push({
    key: 'W4',
    nominalStart: w4NominalStart,
    nominalEnd: w4NominalEnd,
    start: w4First !== null ? Math.max(w4NominalStart, w4First) : w4NominalStart,
    end: w4ActualEnd,
  });

  return windows;
}

export function computeQIndex(params: {
  category: 'HSI' | 'DATIN';
  target: string;
  tickets: QTicketInput[];
  billed: BilledMap;
  today?: Date;
}): QualityData | null {
  const { category, target, billed } = params;
  const ticketsIn = params.tickets
    .map((t) => ({ ...t, time: new Date(t.reportedAt).getTime() }))
    .filter((t) => Number.isFinite(t.time));

  if (ticketsIn.length === 0) return null;

  const times = ticketsIn.map((t) => t.time);
  const maxTime = Math.max(...times);
  const now = params.today ?? (Number.isFinite(maxTime) ? new Date(maxTime) : new Date());

  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const todayEnd = endOfDay(y, m, d);

  const windows = buildWindows(now, times);
  const scanStart = windows[0].nominalStart;

  const scanned = ticketsIn.filter((t) => t.time >= scanStart && t.time <= todayEnd);

  const billedOf = (sto: string): number => billed[sto.toUpperCase()] ?? 0;

  const saBilled: Record<string, number> = {};
  for (const [sto] of Object.entries(billed)) {
    const sa = STO_TO_SA[sto.toUpperCase()];
    if (!sa) continue;
    saBilled[sa] = (saBilled[sa] ?? 0) + billedOf(sto);
  }
  let totalBilledAll = 0;
  for (const v of Object.values(saBilled)) totalBilledAll += v;

  interface Bucket { uniq: Set<string>; count: number; tickets: QualityTicketItem[] }
  const mkBucket = (): Bucket => ({ uniq: new Set(), count: 0, tickets: [] });

  const saReal: Record<string, Bucket> = {};
  for (const sa of Object.keys(saBilled)) saReal[sa] = mkBucket();

  const weekBranch: Record<string, Bucket> = { W1: mkBucket(), W2: mkBucket(), W3: mkBucket(), W4: mkBucket() };

  for (const t of scanned) {
    const sto = String(t.sto || '').trim().toUpperCase();
    const sa = STO_TO_SA[sto];
    if (!sa) continue;
    const ticketKey = `${sto}|${String(t.incidentId).trim().toUpperCase()}`;
    const item: QualityTicketItem = {
      tiket: String(t.incidentId),
      sto,
      sa,
      tanggal: new Date(t.time).toISOString().split('T')[0],
    };

    const rb = saReal[sa];
    if (!rb.uniq.has(ticketKey)) {
      rb.uniq.add(ticketKey);
      rb.count++;
      rb.tickets.push(item);
    }

    for (const w of windows) {
      if (t.time >= w.start && t.time <= w.end) {
        const wb = weekBranch[w.key];
        if (!wb.uniq.has(ticketKey)) {
          wb.uniq.add(ticketKey);
          wb.count++;
          wb.tickets.push(item);
        }
      }
    }
  }

  const qOf = (count: number, billedTotal: number): number =>
    billedTotal > 0 ? round2((count / billedTotal) * 100) : 0;

  let scanCount = 0;
  const branches: Record<string, { totalTiket: number; listBilled: number; q: number }> = {};
  for (const [sa, b] of Object.entries(saReal)) {
    scanCount += b.count;
    branches[sa] = {
      totalTiket: b.count,
      listBilled: saBilled[sa] ?? 0,
      q: qOf(b.count, saBilled[sa] ?? 0),
    };
  }

  const weeks: Record<string, QualityWeekData> = {};
  for (const w of windows) {
    const wb = weekBranch[w.key];
    weeks[w.key] = {
      q: qOf(wb.count, totalBilledAll),
      real: qOf(wb.count, totalBilledAll),
      totalTiket: wb.count,
      listBilled: totalBilledAll,
      startDate: isoDate(w.start),
      endDate: isoDate(w.end),
      nominalStartDate: isoDate(w.nominalStart),
      nominalEndDate: isoDate(Math.min(w.nominalEnd, todayEnd)),
      allTickets: wb.tickets,
    };
  }

  return {
    indicator: `Q ${category}`,
    source: `Quantity ${category}`,
    real: qOf(scanCount, totalBilledAll),
    target,
    totalTiket: scanCount,
    listBilled: totalBilledAll,
    weeks,
    branches,
  };
}
