import { db } from '../db';
import { incidentTickets } from '../db/schema';
import { sql } from 'drizzle-orm';

async function checkBekasiStos() {
  const stos = ['BEK', 'KLB', 'KRA', 'PKY', 'PDE', 'DEP', 'CNE', 'PCM', 'SKJ', 'CSL'];
  
  const datinRows = await db.execute(sql`
    SELECT raw_payload->>'col_36' as wz, COUNT(*) as cnt
    FROM incident_tickets
    WHERE category = 'DATIN' AND TO_CHAR(reported_at, 'YYYY-MM') = '2026-08'
      AND UPPER(TRIM(raw_payload->>'col_36')) IN ('BEK', 'KLB', 'KRA', 'PKY', 'PDE', 'DEP', 'CNE', 'PCM', 'SKJ', 'CSL')
    GROUP BY raw_payload->>'col_36'
    ORDER BY cnt DESC;
  `);
  console.log('DATIN Branch Bekasi Tickets per STO:', datinRows);

  const hsiRows = await db.execute(sql`
    SELECT raw_payload->>'col_41' as wz, COUNT(*) as cnt
    FROM incident_tickets
    WHERE category = 'HSI' AND TO_CHAR(reported_at, 'YYYY-MM') = '2026-08'
      AND UPPER(TRIM(raw_payload->>'col_41')) IN ('BEK', 'KLB', 'KRA', 'PKY', 'PDE', 'DEP', 'CNE', 'PCM', 'SKJ', 'CSL')
    GROUP BY raw_payload->>'col_41'
    ORDER BY cnt DESC;
  `);
  console.log('\nHSI Branch Bekasi Tickets per STO:', hsiRows);

  const wifiRows = await db.execute(sql`
    SELECT raw_payload->>'workzone' as wz, COUNT(*) as cnt
    FROM incident_tickets
    WHERE category = 'WIFI' AND TO_CHAR(reported_at, 'YYYY-MM') = '2026-08'
      AND UPPER(TRIM(raw_payload->>'workzone')) IN ('BEK', 'KLB', 'KRA', 'PKY', 'PDE', 'DEP', 'CNE', 'PCM', 'SKJ', 'CSL')
    GROUP BY raw_payload->>'workzone'
    ORDER BY cnt DESC;
  `);
  console.log('\nWIFI Branch Bekasi Tickets per STO:', wifiRows);

  process.exit(0);
}

checkBekasiStos().catch(console.error);
