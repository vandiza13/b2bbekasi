import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  const res = await db.execute(sql`SELECT raw_payload->>'col_67' as comply, raw_payload->>'kategori' as kat, ttr_minutes FROM incident_tickets WHERE category = 'DATIN' AND raw_payload->>'kategori' = 'K2'`);
  console.log(res);
  process.exit(0);
}
main();
