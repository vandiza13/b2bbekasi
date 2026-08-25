import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db';
import { incidentTickets, kpiSnapshots, serviceAreas } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { computeKpiMetrics, RawTicketInput } from '../lib/kpi/engine';

async function runEndToEndVerification() {
  console.log('--- STARTING SYSTEM VERIFICATION FOR KPI BGES BEKASI ---');

  // 1. Check DB Connection & Service Areas
  console.log('\n[1] Verifying Database Connection & Master STOs...');
  const stos = await db.select().from(serviceAreas);
  console.log(`✅ Retrieved ${stos.length} master STOs from Supabase:`, stos.map(s => s.code).join(', '));
  if (stos.length === 0) {
    throw new Error('Master STOs table is empty!');
  }

  // 2. Test Reading & Parsing Sample Excel File
  const sampleFilePath = path.join(process.cwd(), 'sample_data', 'sample_insera_aug2026.xlsx');
  console.log(`\n[2] Reading sample Excel file from: ${sampleFilePath}`);
  if (!fs.existsSync(sampleFilePath)) {
    throw new Error('Sample Excel file does not exist!');
  }

  const fileBuffer = fs.readFileSync(sampleFilePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const rawRows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);
  console.log(`✅ Successfully parsed ${rawRows.length} rows from Excel in memory.`);

  // 3. Test Engine Calculation Logic
  console.log('\n[3] Testing KPI Calculation Engine...');
  const startEngine = Date.now();
  const parsedTickets: RawTicketInput[] = rawRows.map(r => ({
    incidentId: r.incident_id,
    summary: r.summary,
    serviceAreaCode: r.service_area_code,
    customerName: r.customer_name,
    serviceId: r.service_id,
    serviceType: r.service_type,
    category: r.category,
    reportedAt: new Date(r.reported_at),
    resolvedAt: r.resolved_at ? new Date(r.resolved_at) : null,
    ttrMinutes: r.ttr_minutes ? Number(r.ttr_minutes) : null,
    status: r.status,
    isGaul: r.is_gaul,
    isGuarantee: r.is_guarantee,
    technicianName: r.technician_name,
  }));

  const { metrics, summary } = computeKpiMetrics(parsedTickets);
  const engineDuration = Date.now() - startEngine;
  console.log(`✅ Engine computed ${metrics.length} indicators in ${engineDuration}ms:`);
  console.log(`   - Total Indicators: ${summary.totalIndicators}`);
  console.log(`   - Achieved: ${summary.achievedCount}`);
  console.log(`   - Below Target: ${summary.belowTargetCount}`);
  console.log(`   - Overall Achievement: ${summary.overallAchievement}%`);

  for (const m of metrics) {
    console.log(`   • [${m.category}] ${m.id}: Real = ${m.realRate}% (Target: ${m.targetRate}%) -> ${m.status} (W1:${m.weekly[0].realRate}%, W2:${m.weekly[1].realRate}%, W3:${m.weekly[2].realRate}%, W4:${m.weekly[3].realRate}%)`);
  }

  // 4. Test Upserting Snapshots to Supabase
  console.log('\n[4] Testing Snapshot Storage in Supabase...');
  const period = '2026-08';
  for (const m of metrics) {
    await db.insert(kpiSnapshots).values({
      id: `${period}_${m.id}`,
      period,
      indicatorCode: m.id,
      category: m.category,
      targetRate: String(m.targetRate),
      realRate: String(m.realRate),
      totalTickets: m.totalTickets,
      achievedTickets: m.achievedTickets,
      achievementRate: String(m.achievementRate),
      status: m.status,
      weeklyBreakdown: m.weekly,
      syncedToSheets: false,
    }).onConflictDoUpdate({
      target: kpiSnapshots.id,
      set: {
        realRate: String(m.realRate),
        totalTickets: m.totalTickets,
        achievedTickets: m.achievedTickets,
        achievementRate: String(m.achievementRate),
        status: m.status,
        weeklyBreakdown: m.weekly,
      }
    });
  }

  const savedSnapshots = await db.select().from(kpiSnapshots).where(eq(kpiSnapshots.period, period));
  console.log(`✅ Verified ${savedSnapshots.length} snapshot rows stored in Supabase DB for period ${period}.`);

  console.log('\n========================================');
  console.log('🎉 ALL SYSTEM VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
}

runEndToEndVerification().then(() => process.exit(0)).catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
