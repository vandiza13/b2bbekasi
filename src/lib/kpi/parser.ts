import * as XLSX from 'xlsx';
import { UploadCategory, CATEGORY_ROUTING_MAP } from '@/types/ingestion';
import { normalizeSTO, parseDateSafe, parseTTRToMinutes, extractPeriodFromDate } from './normalizer';

export interface ParsedRowResult {
  incidentId: string;
  summary: string | null;
  serviceAreaCode: string;
  customerName: string | null;
  serviceId: string | null;
  serviceType: string | null;
  category: 'DATIN' | 'HSI' | 'WIFI';
  uploadCategory: UploadCategory;
  reportedAt: Date;
  resolvedAt: Date | null;
  ttrMinutes: number | null;
  status: string;
  isGaul: boolean;
  isGuarantee: boolean;
  technicianName: string | null;
  telegramId: string | null;
  rawPayload: Record<string, unknown>;
}

export function parseExcelRowsUniversally(
  workbook: XLSX.WorkBook,
  category: UploadCategory,
  explicitPeriod?: string
): {
  parsedRows: ParsedRowResult[];
  detectedPeriod: string;
} {
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    return { parsedRows: [], detectedPeriod: explicitPeriod || extractPeriodFromDate(new Date()) };
  }

  const raw2D: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  if (!raw2D || raw2D.length === 0) {
    return { parsedRows: [], detectedPeriod: explicitPeriod || extractPeriodFromDate(new Date()) };
  }

  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(10, raw2D.length); r++) {
    const row = raw2D[r].map(c => String(c || '').trim().toLowerCase());
    const hasHeaderKeyword = row.some(cell =>
      cell.includes('incident') ||
      cell.includes('tiket') ||
      cell.includes('ticket') ||
      cell.includes('insera') ||
      cell.includes('customer') ||
      cell.includes('pelanggan') ||
      cell.includes('workzone') ||
      cell.includes('layanan') ||
      cell.includes('ttr') ||
      cell.includes('sto') ||
      cell.includes('witel') ||
      cell.includes('sid')
    );

    if (hasHeaderKeyword) {
      headerRowIndex = r;
      break;
    }
  }

  const headers = raw2D[headerRowIndex].map(c => String(c || '').trim().toLowerCase());
  const dataRows = raw2D.slice(headerRowIndex + 1);

  const findColIndex = (...aliases: string[]): number => {
    for (const alias of aliases) {
      const idx = headers.findIndex(h => h === alias.toLowerCase() || h.includes(alias.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idCol = findColIndex('incident_id', 'incident id', 'ticket_id', 'ticket id', 'insera id', 'no tiket', 'no. incident', 'no insiden', 'tiket', 'id', 'incident');
  const custCol = findColIndex('customer_name', 'customer name', 'customer', 'nama pelanggan', 'pelanggan', 'nama_pelanggan');
  const stoCol = findColIndex('service_area_code', 'workzone', 'sto', 'service area', 'area', 'sa', 'wz', 'witel', 'witel_name', 'nama witel', 'witel name');
  const serviceIdCol = findColIndex('service_id', 'service id', 'sid', 'no internet', 'nd', 'service no.', 'service no', 'service_no');
  const summaryCol = findColIndex('summary', 'keterangan', 'deskripsi', 'keluhan', 'problem', 'headline');
  const dateCol = findColIndex('reported_at', 'reported at', 'tgl lapor', 'open date', 'created_at', 'tgl_lapor', 'tanggal', 'tgl', 'date');
  const resolvedDateCol = findColIndex('resolved_at', 'resolved at', 'tgl selesai', 'closed date', 'tgl_selesai', 'closed_at');
  const ttrCol = findColIndex('ttr_minutes', 'ttr minutes', 'ttr', 'durasi menit', 'ttr (menit)', 'duration', 'durasi');
  const gaulCol = findColIndex('is_gaul', 'gaul', 'status gaul', 'status_gaul', 'is_gaul_desc');
  const statusCol = findColIndex('status', 'ticket status', 'status tiket');
  const kategoriCol = findColIndex('kategori', 'category', 'kategori_k1_k2_k3', 'sub_kategori', 'sub category');

  const routing = CATEGORY_ROUTING_MAP[category];
  const parsedRows: ParsedRowResult[] = [];
  let detectedPeriod = explicitPeriod || '';

  // 1. Pass 1: Pre-calculate Service No frequencies (COUNTIF) for Assurance Guarantee
  const sidCounts = new Map<string, number>();
  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    if (!row || row.length === 0) continue;
    let sid: string | undefined = undefined;
    if (category === 'DATIN' || category === 'HSI') {
      sid = String(row[11] || '').trim();
    } else if (category === 'WIFI') {
      sid = String(row[10] || '').trim();
    } else if (category === 'SIP TRUNK' || category === 'DWDM') {
      sid = String(row[12] || row[11] || '').trim();
    }
    if (sid && sid !== '-' && sid.toLowerCase() !== 'null') {
      sidCounts.set(sid, (sidCounts.get(sid) || 0) + 1);
    }
  }

  // 2. Pass 2: Parse rows with strict STO filtering matching GAS
  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    if (!row || row.length === 0) continue;

    // Kolom tetap mengikuti struktur export Insera pada perhitungan_V3.js (GAS)
    let rawId: unknown = undefined;
    let rawSto: unknown = undefined;
    let rawCust: unknown = undefined;
    let rawSid: unknown = undefined;
    let rawDate: unknown = undefined;
    let rawTtr: unknown = undefined;
    let rawGaul: unknown = undefined;
    let rawKategori: unknown = undefined;
    let rawComply: unknown = undefined;
    let rawComply24: unknown = undefined;

    if (category === 'SIP TRUNK' || category === 'DWDM') {
      rawId = row[1] || row[0] || (idCol !== -1 ? row[idCol] : undefined);
      rawCust = row[2] || (custCol !== -1 ? row[custCol] : undefined);
      rawSid = row[12] || row[11] || (serviceIdCol !== -1 ? row[serviceIdCol] : undefined);
      rawSto = row[35] || (stoCol !== -1 ? row[stoCol] : undefined);
      rawTtr = row[54] || row[53] || (ttrCol !== -1 ? row[ttrCol] : undefined);
      rawDate = row[18] || row[59] || (dateCol !== -1 ? row[dateCol] : undefined);
      rawComply = row[52];
    } else if (category === 'DATIN') {
      // GAS: colTiket=0, colCustomer=2, colSid=11, colTtr=25, colWorkzone=36, colKategori=64, colComply=67, colTanggal=73, colGaul=75
      rawId = row[0];
      rawCust = row[2];
      rawSid = row[11];
      rawTtr = row[25];
      rawSto = row[36];
      rawKategori = row[64];
      rawComply = row[67];
      rawDate = row[73];
      rawGaul = row[75];
    } else if (category === 'HSI') {
      // GAS: colTiket=0, colSid=11, colCustomer=2, colWorkzone=41, colTtr=88, colComply_4=89, colComply_24=90, colTanggal=97, colGaul=102
      rawId = row[0];
      rawCust = row[2];
      rawSid = row[11];
      rawSto = row[41];
      rawTtr = row[88];
      rawComply = row[89];
      rawComply24 = row[90];
      rawDate = row[97];
      rawGaul = row[102];
    } else if (category === 'WIFI') {
      // GAS: colIncident=0, colCust=1, colService=10, colTanggal=21, colWorkzone=23, colTtr=33, colGaul=36, colComply=41
      rawId = row[0];
      rawCust = row[1];
      rawSid = row[10];
      rawDate = row[21];
      rawSto = row[23];
      rawTtr = row[33];
      rawGaul = row[36];
      rawComply = row[41];
    } else if (category === 'Q HSI') {
      // GAS: colTiket=0, colCust=1, colTanggal=2, colSto=20
      rawId = row[0];
      rawCust = row[1];
      rawDate = row[2];
      rawSto = row[20];
    } else if (category === 'Q DATIN') {
      // GAS: colTiket=9, colCust=1, colTanggal=12, colSto=27
      rawId = row[9] || row[0];
      rawCust = row[1];
      rawDate = row[12];
      rawSto = row[27];
    } else if (category === 'SQM HSI' || category === 'SQM DATIN') {
      rawId = (idCol !== -1 ? row[idCol] : undefined) || row[0];
      rawCust = (custCol !== -1 ? row[custCol] : undefined) || row[2];
      rawSto = (stoCol !== -1 ? row[stoCol] : undefined) || row[4] || row[5] || row[3];
      rawDate = (dateCol !== -1 ? row[dateCol] : undefined) || row[6] || row[7];
      rawTtr = (ttrCol !== -1 ? row[ttrCol] : undefined) || row[8] || row[9];
    } else {
      rawId = (idCol !== -1 ? row[idCol] : undefined) || row[0];
      rawCust = (custCol !== -1 ? row[custCol] : undefined) || row[1] || row[2];
      rawSto = (stoCol !== -1 ? row[stoCol] : undefined) || row[4] || row[5];
      rawDate = (dateCol !== -1 ? row[dateCol] : undefined) || row[6] || row[7];
    }

    if (!rawId) {
      for (let c = 0; c < Math.min(5, row.length); c++) {
        const valStr = String(row[c] || '').trim();
        if (valStr.length >= 3 && !valStr.toLowerCase().includes('total') && !valStr.toLowerCase().includes('grand')) {
          rawId = valStr;
          break;
        }
      }
    }

    if (!rawId) continue;
    const incidentId = String(rawId).trim();
    if (incidentId.length === 0 || incidentId === '-' || incidentId.toLowerCase() === 'null') {
      continue;
    }

    // Filter STO ketat: Hanya STO yang masuk ke Branch Bekasi (SA_MAPPING) yang diproses, persis GAS
    const serviceAreaCode = normalizeSTO(rawSto);
    if (!serviceAreaCode) {
      continue;
    }

    const customerName = rawCust ? String(rawCust).trim() : 'Pelanggan BGÈS';
    const serviceId = rawSid ? String(rawSid).trim() : null;

    const rawSummary = summaryCol !== -1 ? row[summaryCol] : undefined;
    const summary = rawSummary ? String(rawSummary).trim() : null;

    const reportedAt = parseDateSafe(rawDate);
    if (!reportedAt) {
      continue; // GAS Parity: Ignore rows without a valid KPI date (e.g. non-HVC tickets with empty dates)
    }
    
    if (!detectedPeriod) {
      detectedPeriod = extractPeriodFromDate(reportedAt);
    }

    const rawResolvedDate = resolvedDateCol !== -1 ? row[resolvedDateCol] : undefined;
    const resolvedAt = parseDateSafe(rawResolvedDate);

    let ttrMinutes: number | null = null;
    if (rawTtr !== undefined && rawTtr !== '') {
      ttrMinutes = parseTTRToMinutes(rawTtr);
    } else if (resolvedAt && reportedAt) {
      ttrMinutes = Number(((resolvedAt.getTime() - reportedAt.getTime()) / (1000 * 60)).toFixed(2));
    }

    const rawStatus = statusCol !== -1 ? row[statusCol] : undefined;
    const status = rawStatus ? String(rawStatus).trim().toUpperCase() : 'CLOSED';

    // Penentuan status GAUL secara dinamis matching formula Google Sheets GAS: =IF(COUNTIF(...) = 1, "Tidak Gaul", "Gaul")
    const rawGaulStr = String(rawGaul || '').trim().toUpperCase();
    let isGaul = false;
    if (serviceId && sidCounts.has(serviceId)) {
      const count = sidCounts.get(serviceId) || 1;
      isGaul = count > 1;
    } else if (rawGaulStr !== '') {
      isGaul = rawGaulStr === 'GAUL';
    }

    let subCategory = rawKategori ? String(rawKategori).trim().toUpperCase() : null;
    if (!subCategory && summary) {
      if (summary.toUpperCase().includes('K1')) subCategory = 'K1';
      else if (summary.toUpperCase().includes('K2')) subCategory = 'K2';
      else if (summary.toUpperCase().includes('K3')) subCategory = 'K3';
    }

    const rawPayload: Record<string, unknown> = {
      subCategory,
      kategori: subCategory,
      col_64: row[64] || rawKategori,
      col_67: row[67] || rawComply,
      col_52: rawComply,
      col_89: row[89] || rawComply,
      col_90: row[90] || rawComply24,
      col_41: row[41] || (category === 'WIFI' ? rawComply : rawSto),
      col_75: isGaul ? 'GAUL' : 'TIDAK GAUL',
      col_102: isGaul ? 'GAUL' : 'TIDAK GAUL',
      col_36: isGaul ? 'GAUL' : 'TIDAK GAUL',
      col_23: row[23],
      col_20: row[20],
      col_27: row[27],
      workzone: rawSto,
      gaul: isGaul ? 'GAUL' : 'TIDAK GAUL',
      comply: rawComply,
      comply_4jam: row[89] || rawComply,
      comply_24jam: row[90] || rawComply24,
    };

    for (let c = 0; c < row.length; c++) {
      const colName = headers[c] || `col_${c}`;
      rawPayload[colName] = row[c];
    }

    parsedRows.push({
      incidentId,
      summary,
      serviceAreaCode,
      customerName,
      serviceId,
      serviceType: subCategory || routing.dbCategory,
      category: routing.dbCategory,
      uploadCategory: category,
      reportedAt,
      resolvedAt,
      ttrMinutes,
      status,
      isGaul,
      isGuarantee: false,
      technicianName: null,
      telegramId: null,
      rawPayload,
    });
  }

  if (!detectedPeriod) {
    detectedPeriod = extractPeriodFromDate(new Date());
  }

  return { parsedRows, detectedPeriod };
}
