export const VALID_STOS = ['BEK', 'KLB', 'KRA', 'PDE', 'PKY', 'DEP', 'CNE', 'SKJ', 'CSL', 'PCM'] as const;
export type ValidSto = typeof VALID_STOS[number];

export const STO_ALIAS_MAP: Record<string, ValidSto> = {
  BEKASI: 'BEK',
  KALIABANG: 'KLB',
  KRANJI: 'KRA',
  'PONDOK GEDE': 'PDE',
  PONDOKGEDE: 'PDE',
  PEKAYON: 'PKY',
  DEPOK: 'DEP',
  CINERE: 'CNE',
  SUKMAJAYA: 'SKJ',
  CIBUBUR: 'CSL',
  PANCORANMAS: 'PCM',
  'PANCORAN MAS': 'PCM',
};

export function normalizeSTO(stoRaw: unknown): ValidSto | null {
  if (!stoRaw) return null;
  const clean = String(stoRaw).trim().toUpperCase();
  
  if (VALID_STOS.includes(clean as ValidSto)) {
    return clean as ValidSto;
  }

  if (STO_ALIAS_MAP[clean]) {
    return STO_ALIAS_MAP[clean];
  }

  for (const [alias, validSto] of Object.entries(STO_ALIAS_MAP)) {
    if (clean.includes(alias)) {
      return validSto;
    }
  }

  for (const sto of VALID_STOS) {
    const regex = new RegExp(`(^|[^A-Z0-9])${sto}([^A-Z0-9]|$)`, 'i');
    if (regex.test(clean)) return sto;
  }

  return null;
}

export function parseTTRToMinutes(ttrRaw: unknown): number {
  if (ttrRaw === null || ttrRaw === undefined || ttrRaw === '') return 0;
  
  if (typeof ttrRaw === 'number') {
    return Number(ttrRaw.toFixed(2));
  }

  const str = String(ttrRaw).trim();
  
  // Format HH:MM:SS
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return Number((parts[0] * 60 + parts[1] + parts[2] / 60).toFixed(2));
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  
  // Format desimal Excel (contoh: 1,22 jam atau 1.22)
  const val = parseFloat(str.replace(',', '.'));
  return isNaN(val) ? 0 : Number(val.toFixed(2));
}

export function parseDateSafe(dateRaw: unknown): Date | null {
  if (!dateRaw) return null;
  if (dateRaw instanceof Date) {
    return isNaN(dateRaw.getTime()) ? null : dateRaw;
  }

  // Number parsing (Excel serial number or numeric YYYYMMDD / YYYYMM)
  if (typeof dateRaw === 'number') {
    // Numeric YYYYMMDD (e.g. 20260819 in SQM exports)
    if (dateRaw >= 19000101 && dateRaw <= 20991231) {
      const y = Math.floor(dateRaw / 10000);
      const m = Math.floor((dateRaw % 10000) / 100);
      const d = dateRaw % 100;
      const parsed = new Date(Date.UTC(y, m - 1, d));
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    // Numeric YYYYMM (e.g. 202608 in SQM exports)
    if (dateRaw >= 190001 && dateRaw <= 209912) {
      const y = Math.floor(dateRaw / 100);
      const m = dateRaw % 100;
      const parsed = new Date(Date.UTC(y, m - 1, 1));
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    // Standard Excel serial number (e.g. 46233.5)
    const date = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? null : date;
  }
  
  const str = String(dateRaw).trim();
  if (!str) return null;

  // Format YYYYMMDD (e.g. '20260819' from SQM exports)
  if (/^\d{8}$/.test(str)) {
    const y = parseInt(str.substring(0, 4), 10);
    const m = parseInt(str.substring(4, 6), 10);
    const d = parseInt(str.substring(6, 8), 10);
    const parsed = new Date(Date.UTC(y, m - 1, d));
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Format YYYYMM (e.g. '202608' — bulan saja, set ke tanggal 1)
  if (/^\d{6}$/.test(str)) {
    const y = parseInt(str.substring(0, 4), 10);
    const m = parseInt(str.substring(4, 6), 10);
    const parsed = new Date(Date.UTC(y, m - 1, 1));
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Format DD/MM/YYYY HH:mm:ss atau YYYY-MM-DD HH:mm:ss
  if (str.includes('/') || str.includes('-')) {
    const [datePart, timePart] = str.split(' ');
    const sep = datePart.includes('/') ? '/' : '-';
    const parts = datePart.split(sep).map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      let [p1, p2, p3] = parts;
      const [hr, min, sec] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];

      let y: number, m: number, d: number;
      if (p1 > 1000) {
        // YYYY-MM-DD or YYYY/MM/DD
        y = p1; m = p2; d = p3;
      } else {
        // p3 is year
        y = p3 < 100 ? 2000 + p3 : p3;
        if (p2 > 12) {
          // MM/DD/YYYY (p2 is day because > 12)
          m = p1; d = p2;
        } else {
          // Standard Indonesian format: DD/MM/YYYY
          d = p1; m = p2;
        }
      }

      const parsed = new Date(Date.UTC(y, m - 1, d, hr || 0, min || 0, sec || 0));
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  // Format text month seperti '02-Aug-26', '02-Agu-2026', '2 Agustus 2026 10:00:00'
  const indoMatch = str.match(/^(\d{1,2})[\s\-\/]([a-zA-Z]+)[\s\-\/](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/i);
  if (indoMatch) {
    const INDO_MONTHS: Record<string, number> = {
      jan: 1, januari: 1,
      feb: 2, peb: 2, februari: 2, pebruari: 2,
      mar: 3, maret: 3,
      apr: 4, april: 4,
      mei: 5, may: 5,
      jun: 6, juni: 6,
      jul: 7, juli: 7,
      agu: 8, agt: 8, aug: 8, agustus: 8, august: 8,
      sep: 9, sept: 9, september: 9,
      okt: 10, oct: 10, oktober: 10, october: 10,
      nov: 11, nop: 11, november: 11, nopember: 11,
      des: 12, dec: 12, desember: 12, december: 12
    };
    const d = parseInt(indoMatch[1], 10);
    const mStr = indoMatch[2].toLowerCase();
    let y = parseInt(indoMatch[3], 10);
    if (y < 100) y += 2000;
    const m = INDO_MONTHS[mStr];
    if (m) {
      const hr = parseInt(indoMatch[4] || '0', 10);
      const min = parseInt(indoMatch[5] || '0', 10);
      const sec = parseInt(indoMatch[6] || '0', 10);
      const parsed = new Date(Date.UTC(y, m - 1, d, hr, min, sec));
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  // Coba parse standar ISO/EN fallback
  const fallbackParsed = new Date(str);
  if (!isNaN(fallbackParsed.getTime())) {
    return fallbackParsed;
  }

  return null;
}

export function extractPeriodFromDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
