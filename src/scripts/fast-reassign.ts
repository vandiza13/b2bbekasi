import { db } from '../db';
import { sql } from 'drizzle-orm';

async function fastReassign() {
  console.log('=== FAST DIRECT SQL REASSIGN & CLEANUP ===');

  await db.execute(sql`
    UPDATE incident_tickets
    SET service_area_code = CASE
      WHEN UPPER(TRIM(COALESCE(
        raw_payload->>'col_36', 
        raw_payload->>'col_41', 
        raw_payload->>'col_23', 
        raw_payload->>'workzone', 
        raw_payload->>'sto'
      ))) IN ('BEK', 'BEKASI') THEN 'BEK'

      WHEN UPPER(TRIM(COALESCE(
        raw_payload->>'col_36', 
        raw_payload->>'col_41', 
        raw_payload->>'col_23', 
        raw_payload->>'workzone', 
        raw_payload->>'sto'
      ))) IN ('KLB', 'KALIABANG') THEN 'KLB'

      WHEN UPPER(TRIM(COALESCE(
        raw_payload->>'col_36', 
        raw_payload->>'col_41', 
        raw_payload->>'col_23', 
        raw_payload->>'workzone', 
        raw_payload->>'sto'
      ))) IN ('KRA', 'KRANJI') THEN 'KRA'

      WHEN UPPER(TRIM(COALESCE(
        raw_payload->>'col_36', 
        raw_payload->>'col_41', 
        raw_payload->>'col_23', 
        raw_payload->>'workzone', 
        raw_payload->>'sto'
      ))) IN ('PDE', 'PONDOK GEDE', 'PONDOKGEDE') THEN 'PDE'

      WHEN UPPER(TRIM(COALESCE(
        raw_payload->>'col_36', 
        raw_payload->>'col_41', 
        raw_payload->>'col_23', 
        raw_payload->>'workzone', 
        raw_payload->>'sto'
      ))) IN ('PKY', 'PEKAYON') THEN 'PKY'

      WHEN UPPER(TRIM(COALESCE(
        raw_payload->>'col_36', 
        raw_payload->>'col_41', 
        raw_payload->>'col_23', 
        raw_payload->>'workzone', 
        raw_payload->>'sto'
      ))) IN ('DEP', 'DEPOK') THEN 'DEP'

      WHEN UPPER(TRIM(COALESCE(
        raw_payload->>'col_36', 
        raw_payload->>'col_41', 
        raw_payload->>'col_23', 
        raw_payload->>'workzone', 
        raw_payload->>'sto'
      ))) IN ('CNE', 'CINERE') THEN 'CNE'

      WHEN UPPER(TRIM(COALESCE(
        raw_payload->>'col_36', 
        raw_payload->>'col_41', 
        raw_payload->>'col_23', 
        raw_payload->>'workzone', 
        raw_payload->>'sto'
      ))) IN ('SKJ', 'SUKMAJAYA') THEN 'SKJ'

      WHEN UPPER(TRIM(COALESCE(
        raw_payload->>'col_36', 
        raw_payload->>'col_41', 
        raw_payload->>'col_23', 
        raw_payload->>'workzone', 
        raw_payload->>'sto'
      ))) IN ('CSL', 'CIBUBUR') THEN 'CSL'

      WHEN UPPER(TRIM(COALESCE(
        raw_payload->>'col_36', 
        raw_payload->>'col_41', 
        raw_payload->>'col_23', 
        raw_payload->>'workzone', 
        raw_payload->>'sto'
      ))) IN ('PCM', 'PANCORANMAS', 'PANCORAN MAS') THEN 'PCM'

      ELSE NULL
    END;
  `);

  console.log('✅ Updated all ticket service area codes.');

  await db.execute(sql`
    DELETE FROM incident_tickets
    WHERE service_area_code IS NULL;
  `);

  console.log('✅ Cleaned non-Bekasi tickets.');

  const dist = await db.execute(sql`
    SELECT service_area_code, category, COUNT(*) as cnt
    FROM incident_tickets
    GROUP BY service_area_code, category
    ORDER BY service_area_code, category;
  `);
  console.log('\nFinal Branch Bekasi STO Distribution:\n', dist);

  process.exit(0);
}

fastReassign().catch(console.error);
