import { db } from '@/db';
import { billedCustomers, incidentTickets, qIndexTickets } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { formatPeriodDisplay, INDICATORS } from '@/lib/kpi/constants';
import { computeKpiMetrics, RawTicketInput } from '@/lib/kpi/engine';
import { computeQIndex, DEFAULT_Q_BILLED, BilledMap, QTicketInput } from '@/lib/kpi/q-index';
import { StatsResponse, QualityData, KpiSummary } from '@/types/kpi';

function parsePercent(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().replace(',', '.');
  if (!str) return null;
  const match = str.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

async function loadBilledMap(category: 'HSI' | 'DATIN'): Promise<BilledMap> {
  try {
    const rows = await db
      .select()
      .from(billedCustomers)
      .where(eq(billedCustomers.serviceType, category))
      .orderBy(desc(billedCustomers.periodYear), desc(billedCustomers.periodMonth));

    if (rows.length === 0) return DEFAULT_Q_BILLED[category];

    const topPeriod = `${rows[0].periodYear}-${String(rows[0].periodMonth).padStart(2, '0')}`;
    const map: BilledMap = {};
    for (const r of rows) {
      const p = `${r.periodYear}-${String(r.periodMonth).padStart(2, '0')}`;
      if (p !== topPeriod) break;
      if (r.serviceAreaCode) map[r.serviceAreaCode.toUpperCase()] = r.totalBilled;
    }
    return Object.keys(map).length > 0 ? map : DEFAULT_Q_BILLED[category];
  } catch (err) {
    console.warn(`[StatsService] Gagal memuat billed_customers ${category}:`, err);
    return DEFAULT_Q_BILLED[category];
  }
}

function buildQualityData(
  qTicketsAll: (typeof qIndexTickets.$inferSelect)[],
  category: 'HSI' | 'DATIN',
  targetStr: string,
  billed: BilledMap
): QualityData | null {
  const tickets: QTicketInput[] = qTicketsAll
    .filter(t => t.category === category)
    .map(t => ({
      incidentId: t.incidentId,
      sto: t.serviceAreaCode || '',
      reportedAt: new Date(t.reportedAt),
    }));

  return computeQIndex({ category, target: targetStr, tickets, billed });
}

export async function getStatsResponse(periodParam?: string): Promise<StatsResponse> {
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const period = periodParam || defaultPeriod;

  let ticketsForPeriod: (typeof incidentTickets.$inferSelect)[] = [];
  try {
    ticketsForPeriod = await db.select().from(incidentTickets).where(
      sql`TO_CHAR(${incidentTickets.reportedAt}, 'YYYY-MM') = ${period}`
    );
  } catch (err) {
    console.warn('[StatsAPI] Error fetching tickets for period:', err);
  }

  let rawQTickets: (typeof qIndexTickets.$inferSelect)[] = [];
  try {
    rawQTickets = await db.select().from(qIndexTickets);
  } catch (err) {
    console.warn('[StatsAPI] Error fetching Q tickets:', err);
  }

  const [billedHsi, billedDatin] = await Promise.all([
    loadBilledMap('HSI'),
    loadBilledMap('DATIN'),
  ]);

  const qHsiData = buildQualityData(rawQTickets, 'HSI', '2.40%', billedHsi);
  const qDatinData = buildQualityData(rawQTickets, 'DATIN', '2.70%', billedDatin);

  let metrics = [];
  if (ticketsForPeriod.length > 0) {
    const mappedInputs: RawTicketInput[] = ticketsForPeriod.map(t => ({
      incidentId: t.incidentId,
      summary: t.summary,
      serviceAreaCode: t.serviceAreaCode || 'BEK',
      customerName: t.customerName,
      serviceId: t.serviceId,
      serviceType: t.serviceType,
      category: t.category as 'DATIN' | 'HSI' | 'WIFI',
      reportedAt: t.reportedAt,
      resolvedAt: t.resolvedAt,
      ttrMinutes: t.ttrMinutes ? Number(t.ttrMinutes) : null,
      status: t.status || 'CLOSED',
      isGaul: t.isGaul || false,
      isGuarantee: t.isGuarantee || false,
      technicianName: t.technicianName,
      telegramId: t.telegramId,
      rawPayload: t.rawPayload as Record<string, unknown>,
    }));
    const computed = computeKpiMetrics(mappedInputs);
    metrics = computed.metrics;
  } else {
    metrics = INDICATORS.map((ind) => ({
      id: ind.code,
      category: ind.category,
      name: ind.name,
      targetRate: ind.targetRate,
      realRate: 100.00,
      totalTickets: 0,
      achievedTickets: 0,
      belowTargetTickets: 0,
      achievementRate: 100.00,
      status: 'ACHIEVED' as const,
      weekly: [
        { week: 'W1' as const, realRate: 100, ticketCount: 0 },
        { week: 'W2' as const, realRate: 100, ticketCount: 0 },
        { week: 'W3' as const, realRate: 100, ticketCount: 0 },
        { week: 'W4' as const, realRate: 100, ticketCount: 0 },
      ],
    }));
  }

  const indicatorsForSummary: Array<{ real: number; target: number | null; type: 'higher' | 'lower' }> = [];

  for (const m of metrics) {
    indicatorsForSummary.push({
      real: m.realRate,
      target: m.targetRate,
      type: 'higher',
    });
  }

  if (qHsiData) {
    indicatorsForSummary.push({
      real: qHsiData.real,
      target: parsePercent(qHsiData.target),
      type: 'lower',
    });
  }

  if (qDatinData) {
    indicatorsForSummary.push({
      real: qDatinData.real,
      target: parsePercent(qDatinData.target),
      type: 'lower',
    });
  }

  let achievedCount = 0;
  let belowTargetCount = 0;

  for (const item of indicatorsForSummary) {
    if (item.target === null) continue;
    const isAchieved = item.type === 'lower' ? item.real <= item.target : item.real >= item.target;
    if (isAchieved) achievedCount++;
    else belowTargetCount++;
  }

  const totalIndicators = achievedCount + belowTargetCount;
  const overallAchievement = totalIndicators > 0 ? Number(((achievedCount / totalIndicators) * 100).toFixed(2)) : 0;

  const summary: KpiSummary = {
    totalIndicators,
    achievedCount,
    belowTargetCount,
    overallAchievement,
  };

  return {
    period: formatPeriodDisplay(period),
    rawPeriod: period,
    branch: 'Branch Bekasi',
    summary,
    metrics,
    qHsi: qHsiData,
    qDatin: qDatinData,
  };
}
