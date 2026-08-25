import { db } from '../db';
import { incidentTickets } from '../db/schema';
import { sql } from 'drizzle-orm';

async function checkRawWorkzones() {
  console.log('=== INSPECTING WORKZONE VALUES IN RAW_PAYLOAD ===');

  const datinWZ = await db.execute(sql`
    SELECT DISTINCT raw_payload->>'col_36' as col36, raw_payload->>'workzone' as wz_named, service_area_code, COUNT(*) as cnt
    FROM incident_tickets
    WHERE category = 'DATIN'
    GROUP BY raw_payload->>'col_36', raw_payload->>'workzone', service_area_code
    ORDER BY cnt DESC
    LIMIT 20;
  `);
  console.log('\nDATIN Workzones in DB (col_36):', datinWZ);

  const hsiWZ = await db.execute(sql`
    SELECT DISTINCT raw_payload->>'col_41' as col41, raw_payload->>'workzone' as wz_named, service_area_code, COUNT(*) as cnt
    FROM incident_tickets
    WHERE category = 'HSI'
    GROUP BY raw_payload->>'col_41', raw_payload->>'workzone', service_area_code
    ORDER BY cnt DESC
    LIMIT 20;
  `);
  console.log('\nHSI Workzones in DB (col_41):', hsiWZ);

  const wifiWZ = await db.execute(sql`
    SELECT DISTINCT raw_payload->>'col_23' as col23, raw_payload->>'workzone' as wz_named, service_area_code, COUNT(*) as cnt
    FROM incident_tickets
    WHERE category = 'WIFI'
    GROUP BY raw_payload->>'col_23', raw_payload->>'workzone', service_area_code
    ORDER BY cnt DESC
    LIMIT 20;
  `);
  console.log('\nWIFI Workzones in DB (col_23):', wifiWZ);

  process.exit(0);
}

checkRawWorkzones().catch(console.error);
