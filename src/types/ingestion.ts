import { z } from 'zod';

export const VALID_CATEGORIES = [
  'HSI',
  'DATIN',
  'WIFI',
  'SIP TRUNK',
  'DWDM',
  'SQM HSI',
  'SQM DATIN',
  'OUTHSI',
  'OUTDATIN',
  'Q HSI',
  'Q DATIN'
] as const;

export type UploadCategory = typeof VALID_CATEGORIES[number];

export const UploadPayloadSchema = z.object({
  category: z.enum(VALID_CATEGORIES, {
    errorMap: () => ({ message: `Kategori tidak valid. Pilihan resmi: ${VALID_CATEGORIES.join(', ')}` })
  }),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Format period harus YYYY-MM (contoh: 2026-08)').optional(),
});

export interface CategoryRoutingInfo {
  targetTable: 'incident_tickets' | 'sqm_tickets' | 'outstanding_tickets' | 'q_index_tickets';
  dbCategory: 'HSI' | 'DATIN' | 'WIFI';
  targetSheet: string;
  maxColumns: number;
  protectedCols: string[];
}

export const CATEGORY_ROUTING_MAP: Record<UploadCategory, CategoryRoutingInfo> = {
  HSI: {
    targetTable: 'incident_tickets',
    dbCategory: 'HSI',
    targetSheet: 'DATA TTR & GAUL HSI',
    maxColumns: 98,
    protectedCols: ['CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DA', 'DB', 'DC'],
  },
  DATIN: {
    targetTable: 'incident_tickets',
    dbCategory: 'DATIN',
    targetSheet: 'DATA TTR & GAUL DATIN',
    maxColumns: 74,
    protectedCols: ['BW', 'BX', 'BY', 'BZ', 'CA'],
  },
  WIFI: {
    targetTable: 'incident_tickets',
    dbCategory: 'WIFI',
    targetSheet: 'DATA TTR & GAUL WIFI',
    maxColumns: 49,
    protectedCols: ['AX', 'AY'],
  },
  'SIP TRUNK': {
    targetTable: 'incident_tickets',
    dbCategory: 'DATIN',
    targetSheet: 'MTTR SIPTRUNK',
    maxColumns: 63,
    protectedCols: ['BL', 'BM'],
  },
  DWDM: {
    targetTable: 'incident_tickets',
    dbCategory: 'DATIN',
    targetSheet: 'MTTR DWDM',
    maxColumns: 63,
    protectedCols: ['BL'],
  },
  'SQM HSI': {
    targetTable: 'sqm_tickets',
    dbCategory: 'HSI',
    targetSheet: 'SQM HSI',
    maxColumns: 28,
    protectedCols: [],
  },
  'SQM DATIN': {
    targetTable: 'sqm_tickets',
    dbCategory: 'DATIN',
    targetSheet: 'SQM DATIN',
    maxColumns: 28,
    protectedCols: [],
  },
  OUTHSI: {
    targetTable: 'outstanding_tickets',
    dbCategory: 'HSI',
    targetSheet: 'Outstanding HSI',
    maxColumns: 32,
    protectedCols: [],
  },
  OUTDATIN: {
    targetTable: 'outstanding_tickets',
    dbCategory: 'DATIN',
    targetSheet: 'Outstanding DATIN',
    maxColumns: 32,
    protectedCols: [],
  },
  'Q HSI': {
    targetTable: 'q_index_tickets',
    dbCategory: 'HSI',
    targetSheet: 'Q HSI',
    maxColumns: 48,
    protectedCols: [],
  },
  'Q DATIN': {
    targetTable: 'q_index_tickets',
    dbCategory: 'DATIN',
    targetSheet: 'Q DATIN',
    maxColumns: 42,
    protectedCols: ['AQ'],
  },
};
