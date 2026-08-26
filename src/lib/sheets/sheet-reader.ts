import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1afPXrcBvDDVJ207PH1CFA4yKcvmovTIGGqnwUXtDs0s';

export async function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ?.replace(/^"+|"+$/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .trim();

  if (!spreadsheetId || !clientEmail || !privateKey) return null;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return { sheets: google.sheets({ version: 'v4', auth }), spreadsheetId };
}

export interface SheetData {
  headers: string[];
  rows: Record<string, unknown>[];
}

/**
 * Baca seluruh sheet per kategori dengan chunked values.get
 * Mengembalikan header + array baris (object dengan key = header lowercased)
 */
export async function readFullSheet(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string,
  maxCols: number,
  batchSize = 500
): Promise<SheetData> {
  // 1. Ambil header row
  const headerRange = `${sheetName}!A1:${colLetter(maxCols - 1)}1`;
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const rawHeaders = headerRes.data.values?.[0] || [];
  const headers = rawHeaders.map(h => String(h || '').trim().toLowerCase());
  // Pad/truncate to maxCols
  const headersPadded = headers.slice(0, maxCols).concat(Array(Math.max(0, maxCols - headers.length)).fill(''));

  // 2. Baca data chunked
  const rows: Record<string, unknown>[] = [];
  let startRow = 2; // baris 2 = data pertama (baris 1 = header)
  const gridRows = 50000; // batas atas aman; values.get akan mengembalikan apa yang ada

  while (true) {
    const endRow = startRow + batchSize - 1;
    const range = `${sheetName}!A${startRow}:${colLetter(maxCols - 1)}${endRow}`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });

    const values = res.data.values || [];
    if (values.length === 0) break;

    for (const row of values) {
      const rowObj: Record<string, unknown> = {};
      for (let c = 0; c < maxCols; c++) {
        const header = headersPadded[c];
        const val = row[c];
        if (header && val !== undefined && val !== null && val !== '') {
          rowObj[header] = val;
        }
      }
      // Hanya simpan jika ada minimal satu kolom terisi
      if (Object.keys(rowObj).length > 0) {
        rows.push(rowObj);
      }
    }

    if (values.length < batchSize) break;
    startRow += batchSize;
  }

  return { headers: headersPadded, rows };
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

/**
 * Mapping kategori -> nama sheet & maxCols (dari CATEGORY_ROUTING_MAP)
 */
export const SHEET_SPECS: Record<string, { sheet: string; maxCols: number }> = {
  'HSI': { sheet: 'DATA TTR & GAUL HSI', maxCols: 98 },
  'DATIN': { sheet: 'DATA TTR & GAUL DATIN', maxCols: 74 },
  'WIFI': { sheet: 'DATA TTR & GAUL WIFI', maxCols: 49 },
  'SIP TRUNK': { sheet: 'MTTR SIPTRUNK', maxCols: 63 },
  'DWDM': { sheet: 'MTTR DWDM', maxCols: 63 },
  'SQM HSI': { sheet: 'SQM HSI', maxCols: 28 },
  'SQM DATIN': { sheet: 'SQM DATIN', maxCols: 28 },
  'OUTHSI': { sheet: 'Outstanding HSI', maxCols: 32 },
  'OUTDATIN': { sheet: 'Outstanding DATIN', maxCols: 32 },
  'Q HSI': { sheet: 'Q HSI', maxCols: 48 },
  'Q DATIN': { sheet: 'Q DATIN', maxCols: 42 },
};