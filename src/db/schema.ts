import { pgTable, varchar, text, timestamp, numeric, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';

// 1. Master Service Area (STO)
export const serviceAreas = pgTable('service_areas', {
  code: varchar('code', { length: 10 }).primaryKey(), // 'BEK', 'KLB', 'KRA', 'PDE', 'PKY', 'DEP', 'CNE', 'SKJ', 'CSL', 'PCM'
  name: varchar('name', { length: 100 }).notNull(),
  branch: varchar('branch', { length: 50 }).notNull().default('BEKASI'),
  isActive: boolean('is_active').default(true),
});

// 2. Billed Customer Master (Acuan Pembagi Q-Saldo)
export const billedCustomers = pgTable('billed_customers', {
  id: varchar('id', { length: 64 }).primaryKey(), // `${sto}_${serviceType}_${year}_${month}`
  serviceAreaCode: varchar('service_area_code', { length: 10 }).references(() => serviceAreas.code).notNull(),
  serviceType: varchar('service_type', { length: 20 }).notNull(), // 'DATIN' | 'HSI' | 'WIFI'
  periodYear: integer('period_year').notNull(),
  periodMonth: integer('period_month').notNull(),
  totalBilled: integer('total_billed').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 3. Raw Incident Tickets Log (TTR & GAUL: HSI, DATIN, WIFI, SIP TRUNK, DWDM)
export const incidentTickets = pgTable('incident_tickets', {
  incidentId: varchar('incident_id', { length: 50 }).primaryKey(),
  summary: text('summary'),
  serviceAreaCode: varchar('service_area_code', { length: 10 }).references(() => serviceAreas.code),
  customerName: varchar('customer_name', { length: 255 }),
  serviceId: varchar('service_id', { length: 100 }),
  serviceType: varchar('service_type', { length: 50 }),
  category: varchar('category', { length: 20 }).notNull(), // 'DATIN' | 'HSI' | 'WIFI'
  uploadCategory: varchar('upload_category', { length: 30 }), // 'HSI' | 'DATIN' | 'WIFI' | 'SIP TRUNK' | 'DWDM'
  reportedAt: timestamp('reported_at', { withTimezone: true }).notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  ttrMinutes: numeric('ttr_minutes', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 30 }).notNull(), // 'CLOSED' | 'OPEN'
  isGaul: boolean('is_gaul').default(false),
  isGuarantee: boolean('is_guarantee').default(false),
  technicianName: varchar('technician_name', { length: 100 }),
  telegramId: varchar('telegram_id', { length: 50 }),
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_tickets_reported_category').on(table.reportedAt, table.category),
  index('idx_tickets_sto').on(table.serviceAreaCode),
]);

// 4. SQM Tickets Log (SQM HSI & SQM DATIN)
export const sqmTickets = pgTable('sqm_tickets', {
  incidentId: varchar('incident_id', { length: 50 }).primaryKey(),
  serviceAreaCode: varchar('service_area_code', { length: 10 }).references(() => serviceAreas.code),
  customerName: varchar('customer_name', { length: 255 }),
  serviceId: varchar('service_id', { length: 100 }),
  serviceType: varchar('service_type', { length: 50 }),
  category: varchar('category', { length: 20 }).notNull(), // 'HSI' | 'DATIN'
  reportedAt: timestamp('reported_at', { withTimezone: true }).notNull(),
  ttrMinutes: numeric('ttr_minutes', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 30 }).notNull(),
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 5. Outstanding Tickets Log (OUTHSI & OUTDATIN)
export const outstandingTickets = pgTable('outstanding_tickets', {
  incidentId: varchar('incident_id', { length: 50 }).primaryKey(),
  serviceAreaCode: varchar('service_area_code', { length: 10 }).references(() => serviceAreas.code),
  customerName: varchar('customer_name', { length: 255 }),
  serviceId: varchar('service_id', { length: 100 }),
  serviceType: varchar('service_type', { length: 50 }),
  category: varchar('category', { length: 20 }).notNull(), // 'HSI' | 'DATIN'
  reportedAt: timestamp('reported_at', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 30 }).notNull(),
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 6. Q Index Tickets Log (Q HSI & Q DATIN)
export const qIndexTickets = pgTable('q_index_tickets', {
  id: varchar('id', { length: 100 }).primaryKey(), // `${sto}_${incidentId}`
  incidentId: varchar('incident_id', { length: 50 }).notNull(),
  serviceAreaCode: varchar('service_area_code', { length: 10 }).references(() => serviceAreas.code),
  customerName: varchar('customer_name', { length: 255 }),
  category: varchar('category', { length: 20 }).notNull(), // 'HSI' | 'DATIN'
  reportedAt: timestamp('reported_at', { withTimezone: true }).notNull(),
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 7. Pre-aggregated KPI Snapshots
export const kpiSnapshots = pgTable('kpi_snapshots', {
  id: varchar('id', { length: 100 }).primaryKey(), // `${period}_${indicatorCode}`
  period: varchar('period', { length: 10 }).notNull(), // '2026-08'
  indicatorCode: varchar('indicator_code', { length: 50 }).notNull(),
  category: varchar('category', { length: 20 }).notNull(), // 'DATIN' | 'HSI' | 'WIFI'
  targetRate: numeric('target_rate', { precision: 5, scale: 2 }).notNull(),
  realRate: numeric('real_rate', { precision: 5, scale: 2 }).notNull(),
  totalTickets: integer('total_tickets').notNull().default(0),
  achievedTickets: integer('achieved_tickets').notNull().default(0),
  achievementRate: numeric('achievement_rate', { precision: 5, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'ACHIEVED' | 'BELOW_TARGET'
  weeklyBreakdown: jsonb('weekly_breakdown').notNull(), // [{ week: 'W1', realRate: 100, ticketCount: 4 }]
  syncedToSheets: boolean('synced_to_sheets').default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type ServiceArea = typeof serviceAreas.$inferSelect;
export type InsertServiceArea = typeof serviceAreas.$inferInsert;
export type IncidentTicket = typeof incidentTickets.$inferSelect;
export type InsertIncidentTicket = typeof incidentTickets.$inferInsert;
export type KpiSnapshot = typeof kpiSnapshots.$inferSelect;
export type InsertKpiSnapshot = typeof kpiSnapshots.$inferInsert;
export type BilledCustomer = typeof billedCustomers.$inferSelect;
export type InsertBilledCustomer = typeof billedCustomers.$inferInsert;
export type SqmTicket = typeof sqmTickets.$inferSelect;
export type InsertSqmTicket = typeof sqmTickets.$inferInsert;
export type OutstandingTicket = typeof outstandingTickets.$inferSelect;
export type InsertOutstandingTicket = typeof outstandingTickets.$inferInsert;
export type QIndexTicket = typeof qIndexTickets.$inferSelect;
export type InsertQIndexTicket = typeof qIndexTickets.$inferInsert;
