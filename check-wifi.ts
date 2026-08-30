import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`
    SELECT TO_CHAR(reported_at, 'YYYY-MM') as month, COUNT(*) as total
    FROM incident_tickets
    WHERE category = 'WIFI'
    GROUP BY TO_CHAR(reported_at, 'YYYY-MM')
  `);
  console.log(res);
  process.exit(0);
}
run();
