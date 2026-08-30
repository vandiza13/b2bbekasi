import { parseExcelRowsUniversally } from './src/lib/kpi/parser.ts';
import * as XLSX from 'xlsx';

const wb = XLSX.readFile('C:/Users/Hp/.gemini/antigravity/brain/478a7e49-6b65-4b2f-a761-3faf47ca57ee/scratch/bekasi_sheet.xlsx', {cellDates: true});
// parseExcelRowsUniversally gets the first sheet if uploadCategory matches
// But wait, the sheet name in bekasi_sheet.xlsx is "SQM HSI", so it will look for that!
const result = parseExcelRowsUniversally(wb, 'SQM HSI', '2026-08');
console.log('SQM HSI valid rows for 2026-08:', result.length);
