import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`
    SELECT COUNT(DISTINCT service_id) as unique_sid, COUNT(*) as total
    FROM incident_tickets
    WHERE category = 'HSI' AND TO_CHAR(reported_at, 'YYYY-MM') = '2026-08'
  `);
  console.log(res);
  process.exit(0);
}
run();
