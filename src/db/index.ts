import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || '';

const client = postgres(connectionString, {
  prepare: false, // Transaction mode pooler requires prepare: false
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export default db;
