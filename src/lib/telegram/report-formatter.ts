import { StatsResponse, TicketItem } from '@/types/kpi';
import { getCurrentTimeWIB } from './bot';
import { MASTER_STOS } from '../kpi/constants';

export interface TelegramReportPayload {
  message: string;
  ticketCounts: {
    datinK2Below: number;
    datinK3Below: number;
    hsiBelow: number;
    gaulDatin: number;
    gaulHsi: number;
  };
}

export function formatTelegramReport(stats: StatsResponse): TelegramReportPayload {
  const timeWIB = getCurrentTimeWIB();

  const getMetric = (id: string) => stats.metrics.find((m) => m.id === id);

  const k2Metric = getMetric('TTR_DATIN_K2');
  const k3Metric = getMetric('TTR_DATIN_K3');
  const hsi4Metric = getMetric('TTR_HSI_HVC_4H');
  const hsi24Metric = getMetric('TTR_HSI_HVC_24H');
  const asrDatinMetric = getMetric('ASR_GUARANTEE_DATIN');
  const asrHsiMetric = getMetric('ASR_GUARANTEE_HSI');

  // 1. DATIN K2 Below Target tickets
  const k2BelowTickets = (k2Metric?.allTickets || []).filter((t) => !t.isComply);
  let k2Text = '*===== DATIN K2 =====*\n';
  if (k2BelowTickets.length === 0) {
    k2Text += 'NIHIL\n';
  } else {
    k2Text += 'No | Tiket | WITEL | STO | Status | TTR\n';
    k2BelowTickets.forEach((t, i) => {
      const dur = t.ttrMinutes !== null && t.ttrMinutes !== undefined ? `${t.ttrMinutes} Jam` : '-';
      k2Text += `${i + 1} | ${t.incidentId} | BEKASI | ${t.serviceAreaCode} | NOT_COMPLY | ${dur}\n`;
    });
  }

  // 2. DATIN K3 Below Target tickets
  const k3BelowTickets = (k3Metric?.allTickets || []).filter((t) => !t.isComply);
  let k3Text = '*===== DATIN K3 =====*\n';
  if (k3BelowTickets.length === 0) {
    k3Text += 'NIHIL\n';
  } else {
    k3Text += 'No | Tiket | WITEL | STO | Status | TTR\n';
    k3BelowTickets.forEach((t, i) => {
      const dur = t.ttrMinutes !== null && t.ttrMinutes !== undefined ? `${t.ttrMinutes} Jam` : '-';
      k3Text += `${i + 1} | ${t.incidentId} | BEKASI | ${t.serviceAreaCode} | NOT_COMPLY | ${dur}\n`;
    });
  }

  // 3. HSI Below Target tickets (combining 4H & 24H)
  const hsiBelowTickets: { ticket: TicketItem; flag: string }[] = [];
  const hsi24Tickets = hsi24Metric?.allTickets || [];
  hsi24Tickets.forEach((t) => {
    if (!t.isComply) {
      hsiBelowTickets.push({ ticket: t, flag: 'NOT_COMPLY 24' });
    }
  });
  const hsi4Tickets = hsi4Metric?.allTickets || [];
  hsi4Tickets.forEach((t) => {
    if (!t.isComply && !hsiBelowTickets.some((item) => item.ticket.incidentId === t.incidentId)) {
      hsiBelowTickets.push({ ticket: t, flag: 'NOT_COMPLY 4' });
    }
  });

  let hsiText = '*===== HSI =====*\n';
  if (hsiBelowTickets.length === 0) {
    hsiText += 'NIHIL\n';
  } else {
    hsiText += 'No | Tiket | WITEL | STO | Status | TTR\n';
    hsiBelowTickets.forEach((item, i) => {
      const t = item.ticket;
      const dur = t.ttrMinutes !== null && t.ttrMinutes !== undefined ? `${t.ttrMinutes} Jam` : '-';
      hsiText += `${i + 1} | ${t.incidentId} | BEKASI | ${t.serviceAreaCode} | ${item.flag} | ${dur}\n`;
    });
  }

  // 4. SIPTRUNK
  const siptrunkText = '*===== SIPTRUNK =====*\nNIHIL\n';

  // 5. GAUL DATIN table per STO & repeat SIDs
  const datinTickets = asrDatinMetric?.allTickets || [];
  let gaulDatinText = '*===== GAUL DATIN =====*\nSTO | Jumlah TIKET | GAUL\n';
  const datinStoCounts: Record<string, { total: number; gaul: number }> = {};
  MASTER_STOS.forEach((sto) => {
    datinStoCounts[sto] = { total: 0, gaul: 0 };
  });

  const datinSidMap: Record<string, { sto: string; sid: string; count: number }> = {};

  datinTickets.forEach((t) => {
    const sto = t.serviceAreaCode?.toUpperCase() || 'BEK';
    if (!datinStoCounts[sto]) datinStoCounts[sto] = { total: 0, gaul: 0 };
    datinStoCounts[sto].total += 1;
    if (!t.isComply) {
      datinStoCounts[sto].gaul += 1;
      const sid = t.incidentId; // or serviceId
      if (!datinSidMap[sid]) {
        datinSidMap[sid] = { sto, sid, count: 1 };
      } else {
        datinSidMap[sid].count += 1;
      }
    }
  });

  // Sort STO by gaul desc
  const sortedDatinStos = Object.entries(datinStoCounts).sort((a, b) => b[1].gaul - a[1].gaul || b[1].total - a[1].total);
  sortedDatinStos.forEach(([sto, cnt]) => {
    gaulDatinText += `${sto} | ${cnt.total} | ${cnt.gaul}\n`;
  });

  const repeatDatinSids = Object.values(datinSidMap);
  if (repeatDatinSids.length > 0) {
    gaulDatinText += '\n*SID Terdampak GAUL Masa ( 30 Hari ):*\n';
    repeatDatinSids.forEach((r) => {
      gaulDatinText += `${r.sto} | ${r.sid} | ${r.count}\n`;
    });
  }

  // 6. GAUL HSI table per STO & repeat Numbers
  const hsiTickets = asrHsiMetric?.allTickets || [];
  let gaulHsiText = '*===== GAUL HSI =====*\nSTO | Jumlah TIKET | GAUL\n';
  const hsiStoCounts: Record<string, { total: number; gaul: number }> = {};
  MASTER_STOS.forEach((sto) => {
    hsiStoCounts[sto] = { total: 0, gaul: 0 };
  });

  const hsiNumberMap: Record<string, { sto: string; num: string; count: number }> = {};

  hsiTickets.forEach((t) => {
    const sto = t.serviceAreaCode?.toUpperCase() || 'BEK';
    if (!hsiStoCounts[sto]) hsiStoCounts[sto] = { total: 0, gaul: 0 };
    hsiStoCounts[sto].total += 1;
    if (!t.isComply) {
      hsiStoCounts[sto].gaul += 1;
      const num = t.incidentId;
      if (!hsiNumberMap[num]) {
        hsiNumberMap[num] = { sto, num, count: 1 };
      } else {
        hsiNumberMap[num].count += 1;
      }
    }
  });

  const sortedHsiStos = Object.entries(hsiStoCounts).sort((a, b) => b[1].gaul - a[1].gaul || b[1].total - a[1].total);
  sortedHsiStos.forEach(([sto, cnt]) => {
    gaulHsiText += `${sto} | ${cnt.total} | ${cnt.gaul}\n`;
  });

  const repeatHsiNumbers = Object.values(hsiNumberMap);
  if (repeatHsiNumbers.length > 0) {
    gaulHsiText += '\n*Nomor Terdampak GAUL Masa ( 30 Hari ):*\n';
    repeatHsiNumbers.forEach((r) => {
      gaulHsiText += `${r.sto} | ${r.num} | ${r.count}\n`;
    });
  }

  // Combined Telegram Full Text
  const fullText = [
    `📊 *Report KPI Assurance BGES Branch Bekasi*`,
    `📅 *${timeWIB}*`,
    '',
    k2Text.trim(),
    '',
    k3Text.trim(),
    '',
    hsiText.trim(),
    '',
    siptrunkText.trim(),
    '',
    gaulDatinText.trim(),
    '',
    gaulHsiText.trim(),
  ].join('\n');

  return {
    message: fullText,
    ticketCounts: {
      datinK2Below: k2BelowTickets.length,
      datinK3Below: k3BelowTickets.length,
      hsiBelow: hsiBelowTickets.length,
      gaulDatin: datinTickets.filter((t) => !t.isComply).length,
      gaulHsi: hsiTickets.filter((t) => !t.isComply).length,
    },
  };
}
