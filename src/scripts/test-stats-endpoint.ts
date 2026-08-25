async function testFetch() {
  const res = await fetch('http://localhost:3000/api/kpi/stats?period=2026-08');
  console.log('HTTP Status:', res.status);
  const json = await res.json();
  console.log('Period:', json.period);
  console.log('Summary:', json.summary);
  console.log('Metrics count:', json.metrics?.length);
  if (json.metrics) {
    for (const m of json.metrics) {
      console.log(`• [${m.category}] ${m.id}: Real=${m.realRate}% (Target=${m.targetRate}%), Total=${m.totalTickets}, Achieved=${m.achievedTickets}, Status=${m.status}`);
    }
  }
}
testFetch().catch(console.error);
