import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  const res = await db.execute(sql`SELECT reported_at FROM incident_tickets WHERE category = 'DATIN' AND raw_payload->>'subCategory' = 'K2'`);
  console.log(res);
  process.exit(0);
}
main();
