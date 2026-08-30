import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
async function run() {
  await db.execute(sql`TRUNCATE incident_tickets, sqm_tickets, outstanding_tickets, q_index_tickets, kpi_snapshots CASCADE;`);
  console.log('DB Cleared');
  process.exit(0);
}
run();
