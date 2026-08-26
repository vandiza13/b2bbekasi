import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  const res = await db.execute(sql`SELECT raw_payload->>'col_90' as comply24, raw_payload->>'col_89' as comply4, ttr_minutes FROM incident_tickets WHERE category = 'HSI' AND (raw_payload->>'col_90' LIKE '%NOT COMPLY%' OR raw_payload->>'col_89' LIKE '%NOT COMPLY%')`);
  console.log(res);
  process.exit(0);
}
main();
