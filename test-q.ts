import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  const res = await db.execute(sql`SELECT category, COUNT(*) FROM q_index_tickets GROUP BY category`);
  console.log(res);
  process.exit(0);
}
main();
