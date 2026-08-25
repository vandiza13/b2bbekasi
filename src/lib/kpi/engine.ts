import { KpiMetric, KpiSummary, WeeklyStat, StoBreakdown, TicketItem } from '@/types/kpi';
import { INDICATORS, getWeekBucket, MASTER_STOS, getSalesAreaForSto } from './constants';

export interface RawTicketInput {
  incidentId: string;
  summary?: string | null;
  serviceAreaCode: string;
  customerName?: string | null;
  serviceId?: string | null;
  serviceType?: string | null;
  category: 'DATIN' | 'HSI' | 'WIFI';
  reportedAt: Date;
  resolvedAt?: Date | null;
  ttrMinutes?: number | null;
  status: string;
  isGaul?: boolean;
  isGuarantee?: boolean;
  technicianName?: string | null;
  telegramId?: string | null;
  rawPayload?: Record<string, unknown> | null;
}

export function evaluateTicketCompliance(ticket: RawTicketInput, indicatorCode: string): boolean {
  const p = ticket.rawPayload || {};

  switch (indicatorCode) {
    case 'TTR_DATIN_K1':
      if (ticket.category !== 'DATIN') return false;
      if (String(p['col_67'] || p['comply'] || '').trim().toUpperCase() === 'COMPLY') return true;
      return ticket.ttrMinutes !== null && ticket.ttrMinutes !== undefined && ticket.ttrMinutes <= 43;

    case 'TTR_DATIN_K2':
      if (ticket.category !== 'DATIN') return false;
      if (String(p['col_67'] || p['comply'] || '').trim().toUpperCase() === 'COMPLY') return true;
      return ticket.ttrMinutes !== null && ticket.ttrMinutes !== undefined && ticket.ttrMinutes <= 216; // 3.6 hours

    case 'TTR_DATIN_K3':
      if (ticket.category !== 'DATIN') return false;
      if (String(p['col_67'] || p['comply'] || '').trim().toUpperCase() === 'COMPLY') return true;
      return ticket.ttrMinutes !== null && ticket.ttrMinutes !== undefined && ticket.ttrMinutes <= 432; // 7.2 hours

    case 'ASR_GUARANTEE_DATIN':
      if (ticket.category !== 'DATIN') return false;
      return !ticket.isGaul;

    case 'TTR_HSI_HVC_4H':
      if (ticket.category !== 'HSI') return false;
      if (String(p['col_89'] || p['comply_4jam'] || '').trim().toUpperCase() === 'COMPLY') return true;
      return ticket.ttrMinutes !== null && ticket.ttrMinutes !== undefined && ticket.ttrMinutes <= 240;

    case 'TTR_HSI_HVC_24H':
      if (ticket.category !== 'HSI') return false;
      if (String(p['col_90'] || p['comply_24jam'] || '').trim().toUpperCase() === 'COMPLY') return true;
      return ticket.ttrMinutes !== null && ticket.ttrMinutes !== undefined && ticket.ttrMinutes <= 1440;

    case 'ASR_GUARANTEE_HSI':
      if (ticket.category !== 'HSI') return false;
      return !ticket.isGaul;

    case 'TTR_WIFI':
      if (ticket.category !== 'WIFI') return false;
      if (String(p['col_41'] || p['comply'] || '').trim().toUpperCase() === 'COMPLY') return true;
      return ticket.ttrMinutes !== null && ticket.ttrMinutes !== undefined && ticket.ttrMinutes <= 360;

    case 'ASR_GUARANTEE_WIFI':
      if (ticket.category !== 'WIFI') return false;
      return !ticket.isGaul;

    default:
      return false;
  }
}

export function filterTicketsForIndicator(tickets: RawTicketInput[], indicatorCode: string): RawTicketInput[] {
  switch (indicatorCode) {
    case 'TTR_DATIN_K1':
      return tickets.filter((t) => {
        if (t.category !== 'DATIN') return false;
        const p = t.rawPayload || {};
        const cat = String(p['kategori'] || p['col_64'] || t.serviceType || '').trim().toUpperCase();
        return cat === 'K1' || (t.summary && t.summary.toUpperCase().includes('K1'));
      });

    case 'TTR_DATIN_K2':
      return tickets.filter((t) => {
        if (t.category !== 'DATIN') return false;
        const p = t.rawPayload || {};
        const cat = String(p['kategori'] || p['col_64'] || t.serviceType || '').trim().toUpperCase();
        return cat === 'K2' || (t.summary && t.summary.toUpperCase().includes('K2'));
      });

    case 'TTR_DATIN_K3':
      return tickets.filter((t) => {
        if (t.category !== 'DATIN') return false;
        const p = t.rawPayload || {};
        const cat = String(p['kategori'] || p['col_64'] || t.serviceType || '').trim().toUpperCase();
        return cat === 'K3' || (t.summary && t.summary.toUpperCase().includes('K3'));
      });

    case 'ASR_GUARANTEE_DATIN':
      return tickets.filter((t) => t.category === 'DATIN');

    case 'TTR_HSI_HVC_4H':
    case 'TTR_HSI_HVC_24H':
    case 'ASR_GUARANTEE_HSI':
      return tickets.filter((t) => t.category === 'HSI');

    case 'TTR_WIFI':
    case 'ASR_GUARANTEE_WIFI':
      return tickets.filter((t) => t.category === 'WIFI');

    default:
      return [];
  }
}

export function computeKpiMetrics(allTickets: RawTicketInput[]): {
  metrics: KpiMetric[];
  summary: KpiSummary;
} {
  const weeksList: ('W1' | 'W2' | 'W3' | 'W4')[] = ['W1', 'W2', 'W3', 'W4'];

  const metrics: KpiMetric[] = INDICATORS.map((def) => {
    const rawRelevantTickets = filterTicketsForIndicator(allTickets, def.code);

    // Dedup / Service resolution for Assurance Guarantee indicators
    let relevantTickets = rawRelevantTickets;
    if (def.code.startsWith('ASR_')) {
      const serviceMap = new Map<string, RawTicketInput>();
      for (const t of rawRelevantTickets) {
        const key = t.serviceId || t.incidentId;
        if (!serviceMap.has(key)) {
          serviceMap.set(key, t);
        } else {
          // In Apps Script rule: TIDAK GAUL takes priority over GAUL
          if (!t.isGaul) {
            serviceMap.set(key, t);
          }
        }
      }
      relevantTickets = Array.from(serviceMap.values());
    }

    const totalTickets = relevantTickets.length;
    const ticketItems: TicketItem[] = relevantTickets.map((t) => {
      const isComply = evaluateTicketCompliance(t, def.code);
      return {
        incidentId: t.incidentId,
        serviceAreaCode: t.serviceAreaCode || 'BEK',
        customerName: t.customerName || 'Pelanggan BGÈS',
        serviceType: t.serviceType || def.category,
        category: def.category,
        status: t.status || 'CLOSED',
        ttrMinutes: t.ttrMinutes,
        isComply,
        reportedAt: t.reportedAt.toISOString(),
        resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
        summary: t.summary || undefined,
        workzone: getSalesAreaForSto(t.serviceAreaCode || 'BEK'),
      };
    });

    const achievedTickets = ticketItems.filter((t) => t.isComply).length;
    const belowTargetTickets = totalTickets - achievedTickets;

    // Special rule for DATIN K1: monthly if 0 tickets = 100%
    let realRate = 0;
    if (def.code === 'TTR_DATIN_K1') {
      realRate = totalTickets > 0 ? Number(((achievedTickets / totalTickets) * 100).toFixed(2)) : 100;
    } else {
      realRate = totalTickets > 0 ? Number(((achievedTickets / totalTickets) * 100).toFixed(2)) : 0;
    }

    const achievementRate = def.targetRate > 0 ? Number(((realRate / def.targetRate) * 100).toFixed(2)) : 0;
    const status: 'ACHIEVED' | 'BELOW_TARGET' = realRate >= def.targetRate ? 'ACHIEVED' : 'BELOW_TARGET';

    // Weekly metrics
    const weekly: WeeklyStat[] = weeksList.map((weekKey) => {
      const weekTickets = ticketItems.filter((t) => {
        const d = new Date(t.reportedAt);
        return getWeekBucket(d) === weekKey;
      });

      const wTotal = weekTickets.length;
      const wComply = weekTickets.filter((t) => t.isComply).length;

      let wReal = 0;
      if (def.code === 'TTR_DATIN_K1') {
        wReal = wTotal > 0 ? Number(((wComply / wTotal) * 100).toFixed(2)) : 0;
      } else {
        wReal = wTotal > 0 ? Number(((wComply / wTotal) * 100).toFixed(2)) : 0;
      }

      // STO breakdown for week
      const weekStoBreakdown: StoBreakdown[] = MASTER_STOS.map((stoCode) => {
        const stoTickets = weekTickets.filter((t) => t.serviceAreaCode.toUpperCase() === stoCode.toUpperCase());
        const sTotal = stoTickets.length;
        const sComply = stoTickets.filter((t) => t.isComply).length;
        const sBelow = sTotal - sComply;
        const sReal = sTotal > 0 ? Number(((sComply / sTotal) * 100).toFixed(2)) : 0;
        return {
          sto: stoCode,
          total: sTotal,
          comply: sComply,
          below: sBelow,
          realRate: sReal,
        };
      });

      return {
        week: weekKey,
        ticketCount: wTotal,
        realRate: wReal,
        tickets: weekTickets,
        stoBreakdown: weekStoBreakdown,
      };
    });

    // Overall STO Breakdown
    const stoBreakdown: StoBreakdown[] = MASTER_STOS.map((stoCode) => {
      const stoTickets = ticketItems.filter((t) => t.serviceAreaCode.toUpperCase() === stoCode.toUpperCase());
      const sTotal = stoTickets.length;
      const sComply = stoTickets.filter((t) => t.isComply).length;
      const sBelow = sTotal - sComply;
      const sReal = sTotal > 0 ? Number(((sComply / sTotal) * 100).toFixed(2)) : (def.code === 'TTR_DATIN_K1' ? 100 : 0);
      return {
        sto: stoCode,
        total: sTotal,
        comply: sComply,
        below: sBelow,
        realRate: sReal,
      };
    });

    return {
      id: def.code,
      name: def.name,
      category: def.category,
      targetRate: def.targetRate,
      realRate,
      totalTickets,
      achievedTickets,
      belowTargetTickets,
      achievementRate,
      status,
      weekly,
      stoBreakdown,
      allTickets: ticketItems,
    };
  });

  const totalIndicators = metrics.length;
  const achievedCount = metrics.filter((m) => m.status === 'ACHIEVED').length;
  const belowTargetCount = totalIndicators - achievedCount;
  const overallAchievement = totalIndicators > 0 ? Number(((achievedCount / totalIndicators) * 100).toFixed(2)) : 0;

  const summary: KpiSummary = {
    totalIndicators,
    achievedCount,
    belowTargetCount,
    overallAchievement,
  };

  return { metrics, summary };
}
