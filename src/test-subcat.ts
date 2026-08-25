import { db } from './db';
import { sql } from 'drizzle-orm';

async function main() {
  const res = await db.execute(sql`SELECT raw_payload->>'subCategory' as subcat, COUNT(*) FROM incident_tickets WHERE category = 'DATIN' GROUP BY subcat`);
  console.log(res);
  process.exit(0);
}
main();
