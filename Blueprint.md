1. System Overview & Tech StackFramework: Next.js 15 (App Router, Server Actions / Route Handlers)Language: TypeScript (Strict Mode)Database: PostgreSQL (Supabase / Neon Serverless)ORM: Drizzle ORM (drizzle-kit for migrations)Styling: Tailwind CSS + Lucide Icons + clsx / tailwind-mergeFile Processing: xlsx (In-memory buffer parsing)Deployment: Vercel2. Directory StructurePlaintextkpi-bges-bekasi/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── kpi/
│   │   │       ├── upload/route.ts      # Multipart form parser & batch upsert
│   │   │       └── stats/route.ts       # O(1) Read aggregated KPI
│   │   ├── layout.tsx                   # Inter font, global CSS, meta
│   │   └── page.tsx                     # Main Dashboard view
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Header.tsx               # Top bar, branch title, month badge, upload CTA
│   │   │   ├── SummaryCards.tsx         # 4 Global KPI Cards
│   │   │   ├── MetricCard.tsx           # Individual metric card + W1-W4 progress
│   │   │   ├── FilterBar.tsx            # Service category filter (DATIN/HSI/WIFI)
│   │   │   └── UploadModal.tsx          # Drag & Drop modal
│   │   └── ui/                          # Button, Modal, Progress bar primitives
│   ├── db/
│   │   ├── index.ts                     # Database connection pooler
│   │   ├── schema.ts                    # Drizzle table definitions
│   │   └── seed.ts                      # Initial STO & benchmark seeder
│   ├── lib/
│   │   ├── kpi/
│   │   │   ├── constants.ts             # Thresholds & SLA targets
│   │   │   └── engine.ts                # Calculation & aggregation logic
│   │   └── sheets/
│   │       └── sync.ts                  # Asynchronous Google Sheets backup
│   └── types/
│       └── kpi.ts                       # Shared TypeScript interfaces
├── drizzle.config.ts
├── package.json
└── tailwind.config.ts
3. Database Schema (src/db/schema.ts)TypeScriptimport { pgTable, varchar, text, timestamp, numeric, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';

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

// 3. Raw Incident Tickets Log
export const incidentTickets = pgTable('incident_tickets', {
  incidentId: varchar('incident_id', { length: 50 }).primaryKey(),
  summary: text('summary'),
  serviceAreaCode: varchar('service_area_code', { length: 10 }).references(() => serviceAreas.code),
  customerName: varchar('customer_name', { length: 255 }),
  serviceId: varchar('service_id', { length: 100 }),
  serviceType: varchar('service_type', { length: 50 }),
  category: varchar('category', { length: 20 }).notNull(), // 'DATIN' | 'HSI' | 'WIFI'
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
}, (table) => ({
  periodCategoryIdx: index('idx_tickets_reported_category').on(table.reportedAt, table.category),
  stoIdx: index('idx_tickets_sto').on(table.serviceAreaCode),
}));

// 4. Pre-aggregated KPI Snapshots
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
4. KPI Rules & SLA Engine (src/lib/kpi/constants.ts)Indicator CodeNameSLA ThresholdTarget RateTTR_DATIN_K1Compliance-TTR DATIN-K1 Recovery (43 Menit)$\le 43\text{ Menit}$$90.00\%$TTR_DATIN_K2Compliance-TTR DATIN-K2 (3,6 Jam)$\le 216\text{ Menit}$$95.00\%$TTR_DATIN_K3Compliance-TTR DATIN-K3 (7,2 Jam)$\le 432\text{ Menit}$$92.00\%$ASR_GUARANTEE_DATINAssurance Guarantee DATINNon-Garansi Valid$91.00\%$TTR_HSI_HVC_4HCompliance-TTR HSI-HVC Reguler (4 Jam)$\le 240\text{ Menit}$$65.00\%$TTR_HSI_HVC_24HCompliance-TTR HSI-HVC Reguler (24 Jam)$\le 1440\text{ Menit}$$95.00\%$ASR_GUARANTEE_HSIAssurance Guarantee HSINon-Garansi Valid$91.00\%$TTR_WIFICompliance-TTR WIFI (6 Jam Logik, 24 Jam Fisik)$\le 360 / 1440\text{ Menit}$$93.00\%$Calculation FormulasReal Rate (%): $(\text{Total Tiket Comply} / \text{Total Tiket Selesai}) \times 100$Achievement (%): $(\text{Real Rate} / \text{Target Rate}) \times 100$Weekly Buckets (Reported Date):W1: Tanggal 1 s.d. 7W2: Tanggal 8 s.d. 14W3: Tanggal 15 s.d. 21W4: Tanggal 22 s.d. Akhir Bulan5. API ContractsEndpoint 1: POST /api/kpi/uploadInput: multipart/form-data with key file (Excel/CSV)Processing Flow:Read stream directly to memory buffer (XLSX.read).Batch upsert into incident_tickets table on conflict do update.Recompute KPI snapshot for current period via engine.ts.Upsert aggregated result into kpi_snapshots.Fire asynchronous background sync to Google Sheets API v4.Response:JSON{
  "success": true,
  "processedRows": 372,
  "period": "2026-08",
  "executionTimeMs": 284
}
Endpoint 2: GET /api/kpi/stats?period=2026-08Response:JSON{
  "period": "Aug '26",
  "branch": "Branch Bekasi",
  "summary": {
    "totalIndicators": 8,
    "achievedCount": 7,
    "belowTargetCount": 1,
    "overallAchievement": 87.50
  },
  "metrics": [
    {
      "id": "TTR_DATIN_K2",
      "category": "DATIN",
      "name": "Compliance-TTR DATIN-K2 (3,6 Jam)",
      "realRate": 100.00,
      "targetRate": 95.00,
      "totalTickets": 10,
      "achievementRate": 100.00,
      "status": "ACHIEVED",
      "weekly": [
        { "week": "W1", "realRate": 100.00, "ticketCount": 3 },
        { "week": "W2", "realRate": 100.00, "ticketCount": 4 },
        { "week": "W3", "realRate": 100.00, "ticketCount": 2 },
        { "week": "W4", "realRate": 100.00, "ticketCount": 1 }
      ]
    }
  ]
}
6. Execution Roadmap for Antigravity AgentPlaintext[STEP 1] Setup Project & Config
  ├── Init Next.js 15 App Router + Tailwind CSS
  ├── Install: drizzle-orm postgres @supabase/supabase-js xlsx zod lucide-react googleapis clsx tailwind-merge
  └── Configure drizzle.config.ts & Supabase client in src/db/index.ts

[STEP 2] Schema & Database Initialization
  ├── Create src/db/schema.ts
  ├── Run: npx drizzle-kit push
  └── Seed master STO list: BEK, KLB, KRA, PDE, PKY, DEP, CNE, SKJ, CSL, PCM

[STEP 3] Engine & Backend Services
  ├── Implement src/lib/kpi/constants.ts & src/lib/kpi/engine.ts
  ├── Create POST /api/kpi/upload (RAM buffer parser + Transaction)
  ├── Create GET /api/kpi/stats (Snapshot reader)
  └── Implement src/lib/sheets/sync.ts for Google Sheets API v4

[STEP 4] Frontend Construction
  ├── Header Component (with month filter & Upload CTA)
  ├── SummaryCards Component (Total, Achieved, Below Target, Achievement %)
  ├── MetricCard Component (Real, Target, Total, dynamic Progress Bar, W1-W4 grid)
  └── UploadModal Component (Drag & Drop + Loading state)

[STEP 5] Verification
  ├── Test upload with sample Insera dataset
  ├── Verify response time < 500ms
  └── Check data consistency between Database & Google Sheets backup