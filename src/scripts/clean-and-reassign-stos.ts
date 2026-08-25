import { db } from '../db';
import { incidentTickets } from '../db/schema';
import { sql } from 'drizzle-orm';
import { normalizeSTO } from '../lib/kpi/normalizer';

async function cleanAndReassignStos() {
  console.log('=== RE-ASSIGNING STO CODES STRICTLY PER PERHITUNGAN_V3.GS ===');

  const allTickets = await db.select({
    incidentId: incidentTickets.incidentId,
    category: incidentTickets.category,
    uploadCategory: incidentTickets.uploadCategory,
    rawPayload: incidentTickets.rawPayload,
  }).from(incidentTickets);

  console.log(`Analyzing ${allTickets.length} tickets in DB...`);

  let bekasiCount = 0;
  let nonBekasiCount = 0;
  const nonBekasiIds: string[] = [];

  for (const t of allTickets) {
    const p = (t.rawPayload || {}) as Record<string, unknown>;
    
    // Check columns based on category
    let rawSto: unknown = undefined;
    if (t.category === 'DATIN') {
      rawSto = p['col_36'] || p['workzone'] || p['sto'] || p['service_area_code'];
    } else if (t.category === 'HSI') {
      rawSto = p['col_41'] || p['workzone'] || p['sto'] || p['service_area_code'];
    } else if (t.category === 'WIFI') {
      rawSto = p['col_23'] || p['workzone'] || p['sto'] || p['service_area_code'];
    } else {
      rawSto = p['workzone'] || p['sto'] || p['service_area_code'];
    }

    const validSto = normalizeSTO(rawSto);

    if (validSto) {
      bekasiCount++;
      await db.update(incidentTickets).set({
        serviceAreaCode: validSto,
      }).where(sql`${incidentTickets.incidentId} = ${t.incidentId}`);
    } else {
      nonBekasiCount++;
      nonBekasiIds.push(t.incidentId);
    }
  }

  console.log(`Valid Branch Bekasi tickets: ${bekasiCount}`);
  console.log(`Non-Bekasi regional noise tickets: ${nonBekasiCount}`);

  // Delete non-Bekasi tickets from DB
  if (nonBekasiIds.length > 0) {
    console.log('Cleaning non-Bekasi tickets from database...');
    const CHUNK_SIZE = 500;
    for (let i = 0; i < nonBekasiIds.length; i += CHUNK_SIZE) {
      const chunk = nonBekasiIds.slice(i, i + CHUNK_SIZE);
      await db.delete(incidentTickets).where(sql`${incidentTickets.incidentId} IN ${chunk}`);
    }
    console.log(`✅ Removed ${nonBekasiIds.length} non-Bekasi tickets.`);
  }

  // Check STO distribution now
  const dist = await db.execute(sql`
    SELECT service_area_code, category, COUNT(*) as cnt
    FROM incident_tickets
    GROUP BY service_area_code, category
    ORDER BY service_area_code, category;
  `);
  console.log('\nFinal Branch Bekasi STO Distribution:', dist);

  process.exit(0);
}

cleanAndReassignStos().catch(console.error);
