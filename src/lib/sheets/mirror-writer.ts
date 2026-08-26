import { and, asc, eq, sql } from 'drizzle-orm';
import { google } from 'googleapis';
import { db } from '@/db';
import {
  incidentTickets,
  outstandingTickets,
  qIndexTickets,
  sheetSyncJobs,
  sqmTickets,
  SheetSyncJob,
} from '@/db/schema';
import { CATEGORY_ROUTING_MAP, UploadCategory } from '@/types/ingestion';
import { getSheetsClient } from './sync';

// Template kolom kanonik per kategori — urutan & nama persis mengikuti
// header asli spreadsheet produksi (hasil inspeksi workbook).
const COLUMN_TEMPLATES: Record<UploadCategory, string[]> = {
  DATIN: [
    'incident', 'customer_name', 'customer', 'sumary', 'last_work_log_date',
    'last_updated_work_log', 'source', 'segment', 'channel', 'customer_segment',
    'service_id', 'service_no', 'service_type', 'top_priority', 'slg',
    'technology', 'induk_gamas', 'reported_date', 'ttr_nasional', 'ttr_regional',
    'ttr_witel', 'ttr_mitra', 'ttr_agent', 'ttr_customer', 'ttr_pending',
    'ttr_e2e', 'durasi', 'ttr_pending_customer', 'ttr_pending_telkom', 'status',
    'last_update_ticket', 'status_date', 'closed_reopen_by', 'resolved_by', 'owner',
    'owner_group', 'workzone', 'witel', 'regional', 'new_regional',
    'new_witel', 'territory', 'district_tif', 'c_classification_path', 'symptom',
    'actual_solution', 'incident_domain', 'reported_priority', 'assigned_owner_group', 'customer_id',
    'review_by_dso', 'approve_by_cfu', 'reason', 'user_dso', 'user_cfu',
    'leveling', 'sumber', 'periode', 'reason_reduksi', 'reason_exclude',
    'reduksi_ttr_e2e', 'tgl_update', 'reported_by', 'reported_name', 'kategori',
    'pro_react', 'compliance', 'compliance_e2e', 'rep_rec', 'is_rekon',
    'c_flag_fcr', 'nipnas', 'reported_datex', 'status_datex',
  ],
  HSI: [
    'incident', 'customer_name', 'customer', 'sumary', 'last_work_log_date',
    'last_updated_work_log', 'source', 'segment', 'channel', 'customer_segment',
    'service_id', 'service_no', 'service_type', 'top_priority', 'slg',
    'datek', 'rk', 'technology', 'induk_gamas', 'reported_date',
    'ttr_nasional', 'ttr_regional', 'ttr_witel', 'ttr_mitra', 'ttr_agent',
    'ttr_customer', 'ttr_pending', 'ttr_customer_awal', 'ttr_pending_telkom_awal', 'reduksi_ttr_customer',
    'reduksi_ttr_pending_telkom', 'ttr_pending_customer', 'ttr_pending_telkom', 'status', 'osm_resolved_code',
    'last_update_ticket', 'status_date', 'closed_reopen_by', 'resolved_by', 'owner',
    'owner_group', 'workzone', 'witel', 'regional', 'symptom',
    'solution_segment', 'actual_solution', 'reported_priority', 'assigned_owner_group', 'customer_id',
    'request_by_witel', 'review_by_roc', 'review_by_dso', 'approve_by_cfu', 'reason',
    'change_actual_solution', 'date_request_witel', 'date_review_roc', 'date_review_dso', 'date_approve_cfu',
    'user_witel', 'user_roc', 'user_dso', 'user_cfu', 'jenis_layanan',
    'comply', 'not_comply', 'leveling', 'sumber', 'periode',
    'reason_reduksi', 'reason_exclude', 'mapping_actual_solution', 'reported_by', 'reported_name',
    'incident_domain', 'tgl_update', 'compliance', 'comply_6', 'comply_12',
    'comply_36', 'comply_6_e2e', 'comply_12_e2e', 'comply_36_e2e', 'c_flag_fcr',
    'nipnas', 'realm', 'ttr_e2e', 'durasi', 'comply_4_e2e',
    'comply_24_e2e', 'qiyu', 'new_regional', 'new_witel', 'territory',
    'territory_tif', 'reported_datex', 'status_datex',
  ],
  WIFI: [
    'incident', 'customer_name', 'summary', 'owner_group', 'assigned_to',
    'source', 'segment', 'channel', 'customer_segment', 'service_id',
    'service_no', 'service_type', 'induk_gamas', 'reported_date', 'ttr_customer',
    'ttr_nasional', 'ttr_regional', 'ttr_witel', 'ttr_mitra', 'ttr_agent',
    'status', 'status_date', 'resolved_by', 'workzone', 'witel',
    'regional', 'classification_id', 'symptom', 'solution_segment', 'actual_solution',
    'ttr_pending', 'incident_domain', 'ttr_end_to_end_insera', 'ttr_end_to_end', 'jenis_ggn',
    'jml_service_no', 'ket_gaul', 'incident_b4', 'incident_b4_all', 'jenis_ggn_b4',
    'jenis_ggn_b4_now', 'compliance', 'witel_telkom', 'regional_telkom', 'district_tif',
    'territory_tif', 'district_tif_2026', 'regional_tif_2026', 'area_tif_2026',
  ],
  'SIP TRUNK': mttrTemplate(),
  DWDM: mttrTemplate(),
  'SQM HSI': [
    'bulan', 'tanggal_close', 'service_type', 'subsegmentasi_id', 'subsegmentasi',
    'no_tiket', 'nomor_internet', 'channel', 'nama_channel', 'trouble_closed_group_id',
    'trouble_closed_group', 'unit', 'pd_name', 'ont_sn', 'actual_solution_code',
    'actual_solution', 'reg', 'witel', 'datel', 'reg_baru',
    'witel_baru', 'datel_baru', 'tif_reg', 'tif_district', 'sto',
    'closed_by', 'flag_close', 'jenis_sqm',
  ],
  'SQM DATIN': [
    'bulan', 'tanggal_close', 'service_type', 'subsegmentasi_id', 'subsegmentasi',
    'no_tiket', 'nomor_internet', 'channel', 'nama_channel', 'trouble_closed_group_id',
    'trouble_closed_group', 'unit', 'pd_name', 'ont_sn', 'actual_solution_code',
    'actual_solution', 'reg', 'witel', 'datel', 'reg_baru',
    'witel_baru', 'datel_baru', 'tif_reg', 'tif_district', 'sto',
    'closed_by', 'flag_close', 'jenis_sqm',
  ],
  OUTHSI: outstandingTemplate(),
  OUTDATIN: outstandingTemplate(),
  'Q HSI': [
    'trouble_no', 'trouble_number', 'trouble_opentime', 'trouble_closetime', 'trouble_resolvetime',
    'status', 'tkassettype', 'nd_inet', 'nd_pots', 'nd_group',
    'plblcl', 'kat_plg', 'flag_hvc', 'alpro', 'status_indihome',
    'reg', 'cwitel', 'witel', 'cdatel', 'datel',
    'sto', 'subsegmentasi_id', 'subsegmentasi', 'kategori', 'jenis_tiket1',
    'jenis_tiket2', 'is_gamas', 'is_kpi_q', 'flag_fcr', 'is_exclude',
    'alasan_exclude', 'tgl_exclude', 'letak_perbaikan', 'actual_solution', 'no_tiket_induk_gamas',
    'unit', 'realm', 'flag_exclude_q_ggn', 'incident_domain', 'reg_baru',
    'cwitel_baru', 'witel_baru', 'cdatel_baru', 'datel_baru', 'tif_reg',
    'tif_cdistrict', 'tif_district', 'odp',
  ],
  'Q DATIN': [
    'plblcl', 'product', 'sub_product', 'reg', 'cwitel',
    'jenis_tiket1', 'jenis_tiket2', 'flag_k', 'sid', 'trouble_no',
    'is_dummy', 'segmen_ggn', 'trouble_opentime', 'trouble_closetime', 'trouble_resolvetime',
    'status', 'subsegmentasi_id', 'subsegmentasi', 'is_gamas', 'letak_perbaikan',
    'actual_solution', 'no_tiket_induk_gamas', 'channel', 'channel_name', 'bud',
    'incident_domain', 'witel', 'tk_workzone', 'group_pareto', 'solution_id',
    'solution0', 'parent_solution_id', 'child_solution_id', 'symptom_lv0', 'klasifikasi_incident_domain_2',
    'klasifikasi_incident_domain_1', 'ebis_segmen_ggn', 'customer_name_lis', 'last_update_export', 'flag_exclude_q_ggn',
    'kategori_top_cc', 'odp',
  ],
};

function mttrTemplate(): string[] {
  return [
    'rn', 'incident', 'customer_name', 'customer', 'sumary',
    'last_work_log_date', 'last_updated_work_log', 'source', 'segment', 'channel',
    'customer_segment', 'service_id', 'service_no', 'service_type', 'top_priority',
    'slg', 'technology', 'induk_gamas', 'reported_date', 'ttr_nasional',
    'ttr_regional', 'ttr_witel', 'ttr_mitra', 'ttr_agent', 'ttr_customer',
    'ttr_pending', 'ttr_pending_customer', 'ttr_pending_telkom', 'status', 'last_update_ticket',
    'status_date', 'closed_reopen_by', 'resolved_by', 'owner', 'owner_group',
    'workzone', 'witel', 'regional', 'symptom', 'actual_solution',
    'reported_priority', 'assigned_owner_group', 'customer_id', 'leveling', 'sumber',
    'periode', 'reason_reduksi', 'reason_exclude', 'reported_by', 'reported_name',
    'incident_domain', 'tgl_update', 'compliance', 'durasi', 'ttr_e2e',
    'c_flag_fcr', 'nipnas', 'realm', 'reported_datex', 'status_datex',
    'new_regional', 'new_witel', 'territory',
  ];
}

function outstandingTemplate(): string[] {
  return [
    'tgl_capture', 'jam_capture', 'no_tiket', 'reg', 'cwitel',
    'witel', 'sto', 'bud', 'product', 'sub_product',
    'jenis_tiket1', 'jenis_tiket2', 'channel', 'channel_name', 'trouble_status_id',
    'subsegmentasi_id', 'subsegmentasi', 'trouble_opentime', 'waktu_capture', 'usia_tiket_jam',
    'nipnas_lis', 'nipnas_ncx', 'nipnas_standar_lis', 'customer_name_lis', 'customer_standar_name_lis',
    'nama_std_ncx', 'reg_baru', 'cwitel_baru', 'witel_baru', 'tif_reg',
    'tif_cdistrict', 'tif_district',
  ];
}

type Cell = string | number | null;

// Fallback semantik: memetakan nama kolom template ke kolom tabel saat rawPayload kosong
const SEMANTIC_ALIASES: Record<string, string[]> = {
  incident: ['incident_id', 'incidentId'],
  no_tiket: ['incident_id', 'incidentId'],
  tiket: ['incident_id', 'incidentId'],
  trouble_no: ['incident_id', 'incidentId'],
  service_no: ['service_id', 'serviceId'],
  service_id: ['service_id', 'serviceId'],
  sid: ['service_id', 'serviceId'],
  nd_inet: ['service_id', 'serviceId'],
  sto: ['service_area_code', 'serviceAreaCode'],
  tk_workzone: ['service_area_code', 'serviceAreaCode'],
  workzone: ['service_area_code', 'serviceAreaCode'],
  cwitel: ['service_area_code', 'serviceAreaCode'],
  witel: ['branch'],
  customer_name_lis: ['customer_name', 'customerName'],
  customer_standar_name_lis: ['customer_name', 'customerName'],
  customer_name: ['customer_name', 'customerName'],
  customer: ['customer_name', 'customerName'],
  trouble_opentime: ['reported_at', 'reportedAt'],
  reported_date: ['reported_at', 'reportedAt'],
  reported_datex: ['reported_at', 'reportedAt'],
  tgl_capture: ['reported_at', 'reportedAt'],
  bulan: ['reported_at', 'reportedAt'],
};

function pickRowField(row: Record<string, unknown>, names: string[]): unknown {
  for (const n of names) {
    const v = row[n];
    if (v !== undefined && v !== null && String(v) !== '') return v;
  }
  return undefined;
}

function colLetter(index0: number): string {
  let n = index0;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function toCell(v: unknown): Cell {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'number') return v;
  return String(v);
}

function protectedIndices(category: UploadCategory): Set<number> {
  const letters = CATEGORY_ROUTING_MAP[category].protectedCols || [];
  const set = new Set<number>();
  for (const letter of letters) {
    let n = 0;
    for (const ch of letter.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
    set.add(n - 1);
  }
  return set;
}

async function loadRows(category: UploadCategory): Promise<Record<string, unknown>[]> {
  const routing = CATEGORY_ROUTING_MAP[category];
  if (routing.targetTable === 'incident_tickets') {
    const rows = await db.select().from(incidentTickets)
      .where(eq(incidentTickets.uploadCategory, category))
      .orderBy(asc(incidentTickets.reportedAt));
    return rows as unknown as Record<string, unknown>[];
  }
  if (routing.targetTable === 'sqm_tickets') {
    const rows = await db.select().from(sqmTickets)
      .where(eq(sqmTickets.category, category === 'SQM HSI' ? 'HSI' : 'DATIN'))
      .orderBy(asc(sqmTickets.reportedAt));
    return rows as unknown as Record<string, unknown>[];
  }
  if (routing.targetTable === 'outstanding_tickets') {
    const rows = await db.select().from(outstandingTickets)
      .where(eq(outstandingTickets.category, category === 'OUTHSI' ? 'HSI' : 'DATIN'))
      .orderBy(asc(outstandingTickets.reportedAt));
    return rows as unknown as Record<string, unknown>[];
  }
  const rows = await db.select().from(qIndexTickets)
    .where(eq(qIndexTickets.category, category === 'Q HSI' ? 'HSI' : 'DATIN'))
    .orderBy(asc(qIndexTickets.reportedAt));
  return rows as unknown as Record<string, unknown>[];
}

async function clearUnprotected(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  title: string,
  width: number,
  prot: Set<number>
): Promise<void> {
  let gridRows = 200000;
  try {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(sheetId,title,gridProperties(rowCount)))',
    });
    const target = meta.data.sheets?.find(s => s.properties?.title === title);
    gridRows = target?.properties?.gridProperties?.rowCount ?? gridRows;
  } catch {
    // pakai default bila metadata gagal
  }

  const ranges: string[] = [];
  let start = -1;
  for (let c = 0; c <= width; c++) {
    const isProt = c < width ? prot.has(c) : true;
    if (!isProt && start === -1) start = c;
    if (isProt && start !== -1) {
      ranges.push(`${title}!${colLetter(start)}1:${colLetter(c - 1)}${gridRows}`);
      start = -1;
    }
  }

  if (ranges.length > 0) {
    await sheets.spreadsheets.values.batchClear({
      spreadsheetId,
      requestBody: { ranges },
    });
  }
}

export async function runMirrorJob(job: SheetSyncJob): Promise<number> {
  const client = getSheetsClient();
  if (!client) throw new Error('Google Sheets belum dikonfigurasi di environment');

  const { sheets, spreadsheetId } = client;
  const category = job.category as UploadCategory;
  const template = COLUMN_TEMPLATES[category];
  if (!template) throw new Error(`Template kolom tidak ditemukan untuk ${category}`);

  const width = Math.min(template.length, CATEGORY_ROUTING_MAP[category].maxColumns);
  const prot = protectedIndices(category);

  const rows = await loadRows(category);
  await db.update(sheetSyncJobs).set({ rowsTotal: rows.length, updatedAt: new Date() })
    .where(eq(sheetSyncJobs.id, job.id));

  await clearUnprotected(sheets, spreadsheetId, job.targetSheet, width, prot);

  const matrix: Cell[][] = [template.slice(0, width)];
  for (const r of rows) {
    const payload = (r.rawPayload && typeof r.rawPayload === 'object')
      ? (r.rawPayload as Record<string, unknown>)
      : {};
    const rowCells: Cell[] = new Array(width).fill('');
    for (let c = 0; c < width; c++) {
      if (prot.has(c)) {
        rowCells[c] = null;
        continue;
      }
      let v: unknown = payload[template[c]];
      if (v === undefined || v === null || String(v) === '') {
        v = r[template[c]];
        if (v === undefined || v === null || String(v) === '') {
          const aliases = SEMANTIC_ALIASES[template[c]];
          if (aliases) v = pickRowField(r, aliases);
        }
      }
      rowCells[c] = toCell(v);
    }
    matrix.push(rowCells);
  }

  const CHUNK = 1000;
  let done = 0;
  for (let offset = 0; offset < matrix.length; offset += CHUNK) {
    const slice = matrix.slice(offset, offset + CHUNK);
    const range = `${job.targetSheet}!A${offset + 1}:${colLetter(width - 1)}${offset + slice.length}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: slice },
    });
    done = Math.min(offset + slice.length - 1, rows.length);
    await db.update(sheetSyncJobs).set({ rowsDone: done, updatedAt: new Date() })
      .where(eq(sheetSyncJobs.id, job.id));
  }
  return done;
}

export async function pumpPendingJobs(max = 2): Promise<SheetSyncJob[]> {
  const claimed = await db.execute(sql`
    UPDATE sheet_sync_jobs SET status='running', attempts=attempts+1, updated_at=now(), error=NULL
    WHERE id IN (
      SELECT id FROM sheet_sync_jobs
      WHERE status='pending'
         OR (status='running' AND attempts < 3 AND updated_at < now() - interval '3 minutes')
      ORDER BY CASE status WHEN 'running' THEN 0 ELSE 1 END, created_at
      LIMIT ${max}
    )
    RETURNING id, category, target_sheet AS "targetSheet", period, status, attempts
  `) as unknown as { rows?: SheetSyncJob[] } | SheetSyncJob[];

  const jobs = (Array.isArray(claimed) ? claimed : claimed?.rows ?? []) as SheetSyncJob[];
  for (const job of jobs) {
    try {
      const total = await runMirrorJob(job);
      await db.update(sheetSyncJobs)
        .set({ status: 'done', rowsDone: total, updatedAt: new Date() })
        .where(eq(sheetSyncJobs.id, job.id));
    } catch (err) {
      await db.update(sheetSyncJobs)
        .set({ status: 'failed', error: (err as Error).message?.slice(0, 500), updatedAt: new Date() })
        .where(eq(sheetSyncJobs.id, job.id));
    }
  }
  return jobs;
}

export async function createOrCoalesceJob(category: UploadCategory, period: string): Promise<SheetSyncJob | null> {
  const targetSheet = CATEGORY_ROUTING_MAP[category]?.targetSheet;
  if (!targetSheet) return null;

  // Gerbang aman: batasi kategori yang boleh di-mirror otomatis.
  // Format env: "OUTHSI,OUTDATIN" — kosong/tidak diset berarti semua kategori diizinkan.
  const allowRaw = process.env.SHEET_MIRROR_CATEGORIES?.trim() ?? '';
  if (allowRaw !== '' && !allowRaw.split(',').map(s => s.trim().toUpperCase()).includes(category.toUpperCase())) {
    return null;
  }

  const pending = await db.select().from(sheetSyncJobs)
    .where(and(eq(sheetSyncJobs.category, category), eq(sheetSyncJobs.status, 'pending')))
    .limit(1);

  if (pending.length > 0) {
    const existing = pending[0];
    await db.update(sheetSyncJobs)
      .set({ period, updatedAt: new Date() })
      .where(eq(sheetSyncJobs.id, existing.id));
    return existing;
  }

  const id = `${category}_${period}_${Date.now()}`.replace(/\s+/g, '');
  const inserted = await db.insert(sheetSyncJobs)
    .values({ id, category, targetSheet, period, status: 'pending' })
    .returning();
  return inserted[0] ?? null;
}
