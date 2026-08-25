import { db } from '../db';
import { sql } from 'drizzle-orm';

async function truncate() {
  console.log('Truncating incident_tickets...');
  await db.execute(sql`TRUNCATE TABLE incident_tickets`);
  console.log('Truncating q_index_tickets...');
  await db.execute(sql`TRUNCATE TABLE q_index_tickets`);
  console.log('Database wiped. Please re-upload all files.');
  process.exit(0);
}

truncate().catch(console.error);
