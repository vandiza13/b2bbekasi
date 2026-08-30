import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`
    SELECT incident_id, TO_CHAR(reported_at, 'YYYY-MM-DD') as date, service_area_code
    FROM incident_tickets
    WHERE category = 'WIFI'
    ORDER BY reported_at DESC
  `);
  console.log(res);
  process.exit(0);
}
run();
