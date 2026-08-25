import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('--- RUNNING SAFE SQL MIGRATION FOR BGES BEKASI ---');

  await db.execute(sql`
    ALTER TABLE incident_tickets 
    ADD COLUMN IF NOT EXISTS upload_category varchar(30);
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sqm_tickets (
      incident_id varchar(50) PRIMARY KEY,
      service_area_code varchar(10) REFERENCES service_areas(code),
      customer_name varchar(255),
      service_id varchar(100),
      service_type varchar(50),
      category varchar(20) NOT NULL,
      reported_at timestamp with time zone NOT NULL,
      ttr_minutes numeric(10, 2),
      status varchar(30) NOT NULL,
      raw_payload jsonb,
      created_at timestamp with time zone DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS outstanding_tickets (
      incident_id varchar(50) PRIMARY KEY,
      service_area_code varchar(10) REFERENCES service_areas(code),
      customer_name varchar(255),
      service_id varchar(100),
      service_type varchar(50),
      category varchar(20) NOT NULL,
      reported_at timestamp with time zone NOT NULL,
      status varchar(30) NOT NULL,
      raw_payload jsonb,
      created_at timestamp with time zone DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS q_index_tickets (
      id varchar(100) PRIMARY KEY,
      incident_id varchar(50) NOT NULL,
      service_area_code varchar(10) REFERENCES service_areas(code),
      customer_name varchar(255),
      category varchar(20) NOT NULL,
      reported_at timestamp with time zone NOT NULL,
      raw_payload jsonb,
      created_at timestamp with time zone DEFAULT now()
    );
  `);

  console.log('✅ All tables successfully created and synchronized in Supabase DB!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
