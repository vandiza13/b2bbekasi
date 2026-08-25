import { db } from '../db';
import { incidentTickets, qIndexTickets, sqmTickets, outstandingTickets } from '../db/schema';
import { count, sql } from 'drizzle-orm';

async function inspect() {
  console.log('=== DATABASE INSPECTION ===');
  
  const [incCount] = await db.select({ val: count() }).from(incidentTickets);
  console.log('Total incident_tickets in DB:', incCount.val);

  const [qCount] = await db.select({ val: count() }).from(qIndexTickets);
  console.log('Total q_index_tickets in DB:', qCount.val);

  const [sqmCount] = await db.select({ val: count() }).from(sqmTickets);
  console.log('Total sqm_tickets in DB:', sqmCount.val);

  const [outCount] = await db.select({ val: count() }).from(outstandingTickets);
  console.log('Total outstanding_tickets in DB:', outCount.val);

  // Sample incident tickets
  const sampleInc = await db.select({
    id: incidentTickets.incidentId,
    cat: incidentTickets.category,
    uploadCat: incidentTickets.uploadCategory,
    date: incidentTickets.reportedAt,
    sto: incidentTickets.serviceAreaCode
  }).from(incidentTickets).limit(10);
  console.log('\nSample Incident Tickets:', JSON.stringify(sampleInc, null, 2));

  // Distinct months in incident_tickets
  const months = await db.execute(sql`
    SELECT TO_CHAR(reported_at, 'YYYY-MM') as month, COUNT(*) as cnt
    FROM incident_tickets
    GROUP BY TO_CHAR(reported_at, 'YYYY-MM');
  `);
  console.log('\nIncident Tickets per Month in DB:', months);

  // Distinct months in q_index_tickets
  const qMonths = await db.execute(sql`
    SELECT TO_CHAR(reported_at, 'YYYY-MM') as month, COUNT(*) as cnt
    FROM q_index_tickets
    GROUP BY TO_CHAR(reported_at, 'YYYY-MM');
  `);
  console.log('\nQ Tickets per Month in DB:', qMonths);

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
