import { KpiMetric, KpiSummary, WeeklyStat, StoBreakdown, TicketItem } from '@/types/kpi';
import { INDICATORS, getWeekBucket, MASTER_STOS, getSalesAreaForSto } from './constants';

export interface RawTicketInput {
  incidentId: string;
  summary?: string | null;
  serviceAreaCode: string;
  customerName?: string | null;
  serviceId?: string | null;
  serviceType: string | null;
  category: 'DATIN' | 'HSI' | 'WIFI';
  uploadCategory?: string | null;
  reportedAt: Date | null;
  resolvedAt?: Date | null;
  ttrMinutes?: number | null;
  status: string;
  isGaul?: boolean;
  isGuarantee?: boolean;
  technicianName?: string | null;
  telegramId?: string | null;
  rawPayload?: Record<string, unknown> | null;
}

function payloadFlag(p: Record<string, unknown> | null | undefined, keys: string[]): string {
  if (!p) return '';
  for (const key of keys) {
    const v = p[key];
    if (v === null || v === undefined) continue;
    const s = String(v).trim().toUpperCase();
    if (s !== '') return s;
  }
  return '';
}

// Flag teks absolut ala Apps Script: COMPLY/NOT COMPLY menang atas nilai menit.
// Fallback ke threshold menit hanya ketika sel flag benar-benar kosong.
function complyByFlagOrMinutes(
  p: Record<string, unknown> | null | undefined,
  flagKeys: string[],
  ttrMinutes: number | null | undefined,
  thresholdMinutes: number
): boolean {
  const flag = payloadFlag(p, flagKeys);
  if (flag !== '') return flag === 'COMPLY';
  return ttrMinutes !== null && ttrMinutes !== undefined && ttrMinutes <= thresholdMinutes;
}

function wifiThresholdMinutes(p: Record<string, unknown> | null | undefined): number {
  const jenis = payloadFlag(p, ['jenis_ggn', 'col_34']);
  return jenis.includes('FISIK') ? 1440 : 360;
}

function gaulStatus(t: RawTicketInput): string {
  if (t.isGaul) return 'GAUL';
  const flag = payloadFlag(t.rawPayload, ['gaul', 'col_75', 'col_102', 'col_36', 'col_36_wifi']);
  if (flag === 'GAUL') return 'GAUL';
  return 'TIDAK GAUL';
}

export function evaluateTicketCompliance(ticket: RawTicketInput, indicatorCode: string): boolean {
  const p = ticket.rawPayload || {};

  switch (indicatorCode) {
    case 'TTR_DATIN_K1':
      if (ticket.category !== 'DATIN') return false;
      return complyByFlagOrMinutes(p, ['col_67', 'col_52', 'comply'], ticket.ttrMinutes, 43);

    case 'TTR_DATIN_K2':
      if (ticket.category !== 'DATIN') return false;
      return complyByFlagOrMinutes(p, ['col_67', 'col_52', 'comply'], ticket.ttrMinutes, 216);

    case 'TTR_DATIN_K3':
      if (ticket.category !== 'DATIN') return false;
      return complyByFlagOrMinutes(p, ['col_67', 'col_52', 'comply'], ticket.ttrMinutes, 432);

    case 'ASR_GUARANTEE_DATIN':
      if (ticket.category !== 'DATIN') return false;
      return gaulStatus(ticket) === 'TIDAK GAUL';

    case 'TTR_HSI_HVC_4H':
      if (ticket.category !== 'HSI') return false;
      return complyByFlagOrMinutes(p, ['col_89', 'comply_4jam', 'comply'], ticket.ttrMinutes, 240);

    case 'TTR_HSI_HVC_24H':
      if (ticket.category !== 'HSI') return false;
      return complyByFlagOrMinutes(p, ['col_90', 'comply_24jam', 'comply'], ticket.ttrMinutes, 1440);

    case 'ASR_GUARANTEE_HSI':
      if (ticket.category !== 'HSI') return false;
      return gaulStatus(ticket) === 'TIDAK GAUL';

    case 'TTR_WIFI':
      if (ticket.category !== 'WIFI') return false;
      return complyByFlagOrMinutes(p, ['col_41', 'comply'], ticket.ttrMinutes, wifiThresholdMinutes(p));

    case 'ASR_GUARANTEE_WIFI':
      if (ticket.category !== 'WIFI') return false;
      return gaulStatus(ticket) === 'TIDAK GAUL';

    case 'MTTR_SIPTRUNK':
      return complyByFlagOrMinutes(p, ['col_52', 'comply'], ticket.ttrMinutes, 240); // 4 hours

    case 'MTTR_DWDM':
      return complyByFlagOrMinutes(p, ['col_52', 'comply'], ticket.ttrMinutes, 204); // 3.4 hours

    case 'SQM_HSI':
    case 'SQM_DATIN': {
      const flag = String(p?.['flag_close'] || p?.['col_26'] || '').trim().toUpperCase();
      return ['SOLVER BY TSC', 'SOLVER NOT BY TSC'].includes(flag);
    }

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

    case 'MTTR_SIPTRUNK':
      return tickets.filter((t) => t.uploadCategory === 'SIP TRUNK' || t.serviceType === 'SIP TRUNK');
    
    case 'MTTR_DWDM':
      return tickets.filter((t) => t.uploadCategory === 'DWDM' || t.serviceType === 'DWDM');

    case 'SQM_HSI':
      return tickets.filter((t) => {
        if (t.uploadCategory !== 'SQM HSI') return false;
        const flag = String(t.rawPayload?.['flag_close'] || t.rawPayload?.['col_26'] || '').trim().toUpperCase();
        return !['PROACTIVE IBOOSTER', 'RELASI GAMAS', 'PELANGGAN SUDAH ONLINE'].includes(flag);
      });

    case 'SQM_DATIN':
      return tickets.filter((t) => {
        if (t.uploadCategory !== 'SQM DATIN') return false;
        const flag = String(t.rawPayload?.['flag_close'] || t.rawPayload?.['col_26'] || '').trim().toUpperCase();
        return !['PROACTIVE IBOOSTER', 'RELASI GAMAS', 'PELANGGAN SUDAH ONLINE'].includes(flag);
      });

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

    // Dedup per SERVICE_NO untuk Assurance Guarantee, port setia calculateAssuranceGuarantee:
    // - metadata (customer/sto/tanggal/minggu) dikunci pada kemunculan PERTAMA
    // - status bersifat sticky: TIDAK GAUL sekali tercapai tidak dapat ditimpa GAUL
    let relevantTickets = rawRelevantTickets;
    if (def.code.startsWith('ASR_')) {
      const serviceMap = new Map<string, RawTicketInput>();
      for (const t of rawRelevantTickets) {
        const sid = (t.serviceId || '').trim();
        const key = sid !== '' ? sid : t.incidentId;
        const existing = serviceMap.get(key);
        if (!existing) {
          serviceMap.set(key, t);
          continue;
        }
        if (gaulStatus(existing) !== 'TIDAK GAUL' && gaulStatus(t) === 'TIDAK GAUL') {
          const mergedPayload = { ...(existing.rawPayload || {}), gaul: 'TIDAK GAUL' };
          serviceMap.set(key, { ...existing, isGaul: false, rawPayload: mergedPayload });
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
        reportedAt: t.reportedAt ? t.reportedAt.toISOString() : new Date().toISOString(),
        resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
        summary: t.summary || undefined,
        workzone: getSalesAreaForSto(t.serviceAreaCode || 'BEK'),
      };
    });

    const achievedTickets = ticketItems.filter((t) => t.isComply).length;
    const belowTargetTickets = totalTickets - achievedTickets;

    // K1: tanpa tiket dianggap 100%
    let realRate = 0;
    if (def.code === 'TTR_DATIN_K1') {
      realRate = totalTickets > 0 ? Number(((achievedTickets / totalTickets) * 100).toFixed(2)) : 100;
    } else {
      realRate = totalTickets > 0 ? Number(((achievedTickets / totalTickets) * 100).toFixed(2)) : 0;
    }

    const achievementRate = def.targetRate > 0 ? Number(((realRate / def.targetRate) * 100).toFixed(2)) : 0;
    const status: 'ACHIEVED' | 'BELOW_TARGET' = realRate >= def.targetRate ? 'ACHIEVED' : 'BELOW_TARGET';

    const weekly: WeeklyStat[] = weeksList.map((weekKey) => {
      const weekTickets = ticketItems.filter((t) => {
        const d = new Date(t.reportedAt);
        return getWeekBucket(d) === weekKey;
      });

      const wTotal = weekTickets.length;
      const wComply = weekTickets.filter((t) => t.isComply).length;

      const wReal = wTotal > 0 ? Number(((wComply / wTotal) * 100).toFixed(2)) : 0;

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
