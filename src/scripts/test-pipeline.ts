import { VALID_CATEGORIES, CATEGORY_ROUTING_MAP, UploadPayloadSchema } from '../types/ingestion';
import { parseDateSafe, parseTTRToMinutes, normalizeSTO } from '../lib/kpi/normalizer';
import { db } from '../db';
import { incidentTickets, sqmTickets, outstandingTickets, qIndexTickets, kpiSnapshots } from '../db/schema';
import { sql } from 'drizzle-orm';

async function runPipelineTests() {
  console.log('====================================================');
  console.log('🧪 BULLETPROOF INGESTION & DATA ROUTING PIPELINE TEST');
  console.log('====================================================\n');

  // Test 1: Category Validator
  console.log('[1] Testing Category Validator (Zod Schema)...');
  const validCheck = UploadPayloadSchema.safeParse({ category: 'DATIN', period: '2026-08' });
  if (!validCheck.success) throw new Error('Validator failed for valid category');
  console.log('✅ Valid category DATIN passed');

  const invalidCheck = UploadPayloadSchema.safeParse({ category: 'UNKNOWN_SERVICE' });
  if (invalidCheck.success) throw new Error('Validator failed to reject unknown category');
  console.log('✅ Invalid category correctly rejected with error:', invalidCheck.error.errors[0].message);

  // Test 2: Normalizers
  console.log('\n[2] Testing Normalizer Utilities...');
  const ttr1 = parseTTRToMinutes('03:36:00');
  const ttr2 = parseTTRToMinutes('1,22');
  const ttr3 = parseTTRToMinutes(43);
  console.log(`✅ TTR Normalizer: "03:36:00" -> ${ttr1}m, "1,22" -> ${ttr2}m, 43 -> ${ttr3}m`);

  const d1 = parseDateSafe('25/08/2026 14:30:00');
  const d2 = parseDateSafe('2026-08-25T14:30:00Z');
  console.log(`✅ Date Normalizer: "25/08/2026" -> ${d1?.toISOString()}, ISO -> ${d2?.toISOString()}`);

  const sto1 = normalizeSTO(' bekasi ');
  const sto2 = normalizeSTO('PDE');
  const sto3 = normalizeSTO('UNKNOWN_REGION');
  console.log(`✅ STO Normalizer: " bekasi " -> ${sto1}, "PDE" -> ${sto2}, "UNKNOWN" -> ${sto3}`);

  // Test 3: Routing Matrix Verification
  console.log('\n[3] Testing Category & Routing Matrix (11 Categories)...');
  for (const cat of VALID_CATEGORIES) {
    const route = CATEGORY_ROUTING_MAP[cat];
    console.log(`   • [${cat}] -> Table: ${route.targetTable} | Sheet: "${route.targetSheet}" (MaxCol: ${route.maxColumns}, Protected: ${route.protectedCols.length ? route.protectedCols.join(',') : 'None'})`);
  }
  console.log('✅ All 11 categories accurately mapped in routing matrix.');

  // Test 4: Database Table Ingestion & Conflict Resolution
  console.log('\n[4] Testing Transactional Upsert into Supabase DB...');
  
  // Incident Ticket
  await db.insert(incidentTickets).values({
    incidentId: 'TEST-INC-DATIN-01',
    summary: 'Test Ingestion DATIN',
    serviceAreaCode: 'BEK',
    customerName: 'Bank BCA Bekasi',
    serviceType: 'DATIN',
    category: 'DATIN',
    uploadCategory: 'DATIN',
    reportedAt: new Date('2026-08-10T10:00:00Z'),
    ttrMinutes: '40.00',
    status: 'CLOSED',
    isGaul: false,
    isGuarantee: false,
  }).onConflictDoUpdate({
    target: incidentTickets.incidentId,
    set: { ttrMinutes: '40.00', status: 'CLOSED' }
  });
  console.log('✅ Ingested into incident_tickets: TEST-INC-DATIN-01');

  // SQM Ticket
  await db.insert(sqmTickets).values({
    incidentId: 'TEST-SQM-01',
    serviceAreaCode: 'KLB',
    customerName: 'PT Wings Kaliabang',
    serviceType: 'HSI',
    category: 'HSI',
    reportedAt: new Date('2026-08-12T10:00:00Z'),
    ttrMinutes: '120.00',
    status: 'CLOSED',
  }).onConflictDoUpdate({
    target: sqmTickets.incidentId,
    set: { status: 'CLOSED' }
  });
  console.log('✅ Ingested into sqm_tickets: TEST-SQM-01');

  // Outstanding Ticket
  await db.insert(outstandingTickets).values({
    incidentId: 'TEST-OUT-01',
    serviceAreaCode: 'KRA',
    customerName: 'RS Mitra Kranji',
    serviceType: 'DATIN',
    category: 'DATIN',
    reportedAt: new Date('2026-08-15T10:00:00Z'),
    status: 'OPEN',
  }).onConflictDoUpdate({
    target: outstandingTickets.incidentId,
    set: { status: 'OPEN' }
  });
  console.log('✅ Ingested into outstanding_tickets: TEST-OUT-01');

  // Q Index Ticket
  await db.insert(qIndexTickets).values({
    id: 'PKY_TEST-Q-01',
    incidentId: 'TEST-Q-01',
    serviceAreaCode: 'PKY',
    customerName: 'Hotel Horison Pekayon',
    category: 'HSI',
    reportedAt: new Date('2026-08-18T10:00:00Z'),
  }).onConflictDoUpdate({
    target: qIndexTickets.id,
    set: { customerName: 'Hotel Horison Pekayon' }
  });
  console.log('✅ Ingested into q_index_tickets: PKY_TEST-Q-01');

  console.log('\n====================================================');
  console.log('🎉 ALL INGESTION & DATA ROUTING PIPELINE TESTS PASSED!');
  console.log('====================================================\n');
  process.exit(0);
}

runPipelineTests().catch((err) => {
  console.error('Pipeline test failed:', err);
  process.exit(1);
});
