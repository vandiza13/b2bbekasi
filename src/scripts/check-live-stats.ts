async function testFetch() {
  const res = await fetch('http://localhost:3000/api/kpi/stats?period=2026-08');
  console.log('HTTP Status:', res.status);
  const json = await res.json();
  console.log('Period:', json.period);
  console.log('Summary:', json.summary);
  console.log('\n--- METRICS ---');
  if (json.metrics) {
    for (const m of json.metrics) {
      console.log(`• [${m.category}] ${m.id} (${m.name}): Real=${m.realRate}% (Target=${m.targetRate}%), Total=${m.totalTickets}, Achieved=${m.achievedTickets}, Status=${m.status}`);
      if (m.weekly) {
        console.log('   Weekly:', m.weekly.map((w: any) => `${w.week}: ${w.realRate}% (${w.ticketCount} tkt)`).join(' | '));
      }
    }
  }
  console.log('\n--- QUALITY HSI ---');
  console.log('Q HSI:', json.qHsi ? {
    real: json.qHsi.real,
    target: json.qHsi.target,
    totalTiket: json.qHsi.totalTiket,
    listBilled: json.qHsi.listBilled,
    weeks: Object.entries(json.qHsi.weeks || {}).map(([k, v]: any) => `${k}: ${v.q}% (${v.totalTiket} tkt)`).join(' | ')
  } : 'null');

  console.log('\n--- QUALITY DATIN ---');
  console.log('Q DATIN:', json.qDatin ? {
    real: json.qDatin.real,
    target: json.qDatin.target,
    totalTiket: json.qDatin.totalTiket,
    listBilled: json.qDatin.listBilled,
    weeks: Object.entries(json.qDatin.weeks || {}).map(([k, v]: any) => `${k}: ${v.q}% (${v.totalTiket} tkt)`).join(' | ')
  } : 'null');
}

testFetch().catch(console.error);
