import { db } from '../db';
import { incidentTickets } from '../db/schema';
import { sql } from 'drizzle-orm';
import { computeKpiMetrics, RawTicketInput } from '../lib/kpi/engine';

async function testCompute() {
  const period = '2026-08';
  console.log('Querying tickets for period:', period);

  const tickets = await db.select().from(incidentTickets).where(
    sql`TO_CHAR(${incidentTickets.reportedAt}, 'YYYY-MM') = ${period}`
  );

  console.log('Found tickets count:', tickets.length);

  const mapped: RawTicketInput[] = tickets.map(t => ({
    incidentId: t.incidentId,
    summary: t.summary,
    serviceAreaCode: t.serviceAreaCode || 'BEK',
    customerName: t.customerName,
    serviceId: t.serviceId,
    serviceType: t.serviceType,
    category: t.category as 'DATIN' | 'HSI' | 'WIFI',
    reportedAt: t.reportedAt,
    resolvedAt: t.resolvedAt,
    ttrMinutes: t.ttrMinutes ? Number(t.ttrMinutes) : null,
    status: t.status || 'CLOSED',
    isGaul: t.isGaul || false,
    isGuarantee: t.isGuarantee || false,
    technicianName: t.technicianName,
    telegramId: t.telegramId,
    rawPayload: t.rawPayload as Record<string, unknown>,
  }));

  const { metrics, summary } = computeKpiMetrics(mapped);
  console.log('\nSummary:', summary);
  console.log('\nMetrics:');
  for (const m of metrics) {
    console.log(`- ${m.id} (${m.name}): Real=${m.realRate}% (Target=${m.targetRate}%), TotalTiket=${m.totalTickets}, Achieved=${m.achievedTickets}, Status=${m.status}`);
  }

  process.exit(0);
}

testCompute().catch(console.error);
