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

  // Excel serial number (e.g. 45123.5)
  if (typeof dateRaw === 'number') {
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
    if (parts.length === 3) {
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
      return isNaN(parsed.getTime()) ? null : parsed;
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
