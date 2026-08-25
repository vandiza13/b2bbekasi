import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  const res = await db.execute(sql`SELECT raw_payload->>'flag_close' as flag, COUNT(*) FROM sqm_tickets GROUP BY flag LIMIT 10`);
  console.log(res);
  process.exit(0);
}
main();
