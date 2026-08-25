import { db } from '../db';
import { incidentTickets } from '../db/schema';
import { sql } from 'drizzle-orm';

async function checkCategories() {
  const cats = await db.execute(sql`
    SELECT category, upload_category, COUNT(*) as cnt
    FROM incident_tickets
    WHERE TO_CHAR(reported_at, 'YYYY-MM') = '2026-08'
    GROUP BY category, upload_category;
  `);
  console.log('Categories in DB for 2026-08:', cats);

  const sampleDatin = await db.execute(sql`
    SELECT incident_id, category, upload_category, raw_payload->>'col_64' as col64, raw_payload->>'KATEGORI' as kategori, raw_payload->>'kategori' as kat_lower, summary
    FROM incident_tickets
    WHERE category = 'DATIN'
    LIMIT 5;
  `);
  console.log('\nSample DATIN rows:', sampleDatin);

  const sampleHsi = await db.execute(sql`
    SELECT incident_id, category, upload_category, raw_payload->>'col_89' as col89, raw_payload->>'col_90' as col90
    FROM incident_tickets
    WHERE category = 'HSI'
    LIMIT 5;
  `);
  console.log('\nSample HSI rows:', sampleHsi);

  const sampleWifi = await db.execute(sql`
    SELECT incident_id, category, upload_category, raw_payload->>'col_41' as col41
    FROM incident_tickets
    WHERE category = 'WIFI'
    LIMIT 5;
  `);
  console.log('\nSample WIFI rows:', sampleWifi);

  process.exit(0);
}

checkCategories().catch(console.error);
