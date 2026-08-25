import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { incidentTickets, qIndexTickets } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { formatPeriodDisplay, INDICATORS, getWeekBucket, getSalesAreaForSto, MASTER_STOS } from '@/lib/kpi/constants';
import { computeKpiMetrics, RawTicketInput } from '@/lib/kpi/engine';
import { StatsResponse, QualityData, QualityWeekData, QualityTicketItem, KpiSummary } from '@/types/kpi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parsePercent(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().replace(',', '.');
  if (!str) return null;
  const match = str.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get('period');

    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const period = periodParam || defaultPeriod;

    // 1. Fetch raw incident tickets for this period
    let ticketsForPeriod: (typeof incidentTickets.$inferSelect)[] = [];
    try {
      ticketsForPeriod = await db.select().from(incidentTickets).where(
        sql`TO_CHAR(${incidentTickets.reportedAt}, 'YYYY-MM') = ${period}`
      );
    } catch (err) {
      console.warn('[StatsAPI] Error fetching tickets for period:', err);
    }

    // 2. Fetch raw Q tickets for this period (we fetch all and filter dynamically)
    let rawQTickets: (typeof qIndexTickets.$inferSelect)[] = [];
    try {
      rawQTickets = await db.select().from(qIndexTickets);
    } catch (err) {
      console.warn('[StatsAPI] Error fetching Q tickets:', err);
    }

    // Process Q HSI and Q DATIN matching perhitungan_V3.gs
    const buildQualityData = (category: 'HSI' | 'DATIN', targetStr: string, listBilledDefault: number): QualityData | null => {
      let qTickets = rawQTickets.filter(t => t.category === `Q ${category}`);
      if (qTickets.length === 0) return null;

      // Find Max Date in DB to simulate "today" in Apps Script
      const dates = qTickets.map(t => new Date(t.reportedAt).getTime());
      const maxDate = new Date(Math.max(...dates));
      const year = maxDate.getFullYear();
      const month = maxDate.getMonth();
      const day = maxDate.getDate();

      // Rolling 30-day window
      const realStart = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
      const todayEnd = new Date(year, month, day, 23, 59, 59, 999).getTime();

      const w1End = Math.min(todayEnd, new Date(year, month, 7, 23, 59, 59, 999).getTime());
      const w2End = Math.min(todayEnd, new Date(year, month, 14, 23, 59, 59, 999).getTime());
      const w3End = Math.min(todayEnd, new Date(year, month, 21, 23, 59, 59, 999).getTime());
      const w4End = Math.min(todayEnd, new Date(year, month + 1, 0, 23, 59, 59, 999).getTime());

      // Filter exactly within the window
      qTickets = qTickets.filter(t => {
        const d = new Date(t.reportedAt).getTime();
        return d >= realStart && d <= todayEnd;
      });

      const totalTiket = qTickets.length;
      const listBilled = listBilledDefault;
      const real = listBilled > 0 ? Number(((totalTiket / listBilled) * 100).toFixed(2)) : 0;

      const weeks: Record<string, QualityWeekData> = {
        W1: { q: 0, real: 0, totalTiket: 0, listBilled, allTickets: [] },
        W2: { q: 0, real: 0, totalTiket: 0, listBilled, allTickets: [] },
        W3: { q: 0, real: 0, totalTiket: 0, listBilled, allTickets: [] },
        W4: { q: 0, real: 0, totalTiket: 0, listBilled, allTickets: [] },
      };

      const branches: Record<string, { totalTiket: number; listBilled: number; q: number }> = {};
      for (const sto of MASTER_STOS) {
        const sa = getSalesAreaForSto(sto);
        if (!branches[sa]) {
          branches[sa] = { totalTiket: 0, listBilled: Math.round(listBilled / 8), q: 0 };
        }
      }

      for (const t of qTickets) {
        const dTime = new Date(t.reportedAt).getTime();
        const dStr = new Date(t.reportedAt).toISOString().split('T')[0];
        
        let wKey = 'W4';
        if (dTime <= w1End) wKey = 'W1';
        else if (dTime <= w2End) wKey = 'W2';
        else if (dTime <= w3End) wKey = 'W3';

        const sto = t.serviceAreaCode || 'BEK';
        const sa = getSalesAreaForSto(sto);

        const qItem: QualityTicketItem = {
          tiket: t.incidentId,
          sto,
          sa,
          tanggal: dStr,
        };

        if (weeks[wKey]) {
          weeks[wKey].allTickets!.push(qItem);
          weeks[wKey].totalTiket++;
        }

        if (branches[sa]) {
          branches[sa].totalTiket++;
        }
      }

      // In Apps Script, W2 includes tickets from realStart to W2, so it's cumulative!
      // Let's accumulate them
      weeks.W2.totalTiket += weeks.W1.totalTiket;
      weeks.W3.totalTiket += weeks.W2.totalTiket;
      weeks.W4.totalTiket += weeks.W3.totalTiket;

      for (const wKey of Object.keys(weeks)) {
        const w = weeks[wKey];
        w.q = w.listBilled > 0 ? Number(((w.totalTiket / w.listBilled) * 100).toFixed(2)) : 0;
        w.real = w.q;
      }

      for (const sa of Object.keys(branches)) {
        const b = branches[sa];
        b.q = b.listBilled > 0 ? Number(((b.totalTiket / b.listBilled) * 100).toFixed(2)) : 0;
      }

      return {
        indicator: `Q ${category}`,
        source: `Quantity ${category}`,
        real,
        target: targetStr,
        totalTiket,
        listBilled,
        weeks,
        branches,
      };
    };

    const qHsiData = buildQualityData('HSI', '2.40%', 14303);
    const qDatinData = buildQualityData('DATIN', '2.70%', 2222);

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

    // 3. Compute Summary exactly matching JS_Summary.html
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

    const response: StatsResponse = {
      period: formatPeriodDisplay(period),
      rawPeriod: period,
      branch: 'Branch Bekasi',
      summary,
      metrics,
      qHsi: qHsiData,
      qDatin: qDatinData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[StatsAPI] Fatal error:', error);
    return NextResponse.json({
      error: (error as Error).message || 'Failed to fetch KPI stats',
    }, { status: 500 });
  }
}
