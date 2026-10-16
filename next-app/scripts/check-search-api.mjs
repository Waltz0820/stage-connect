import assert from 'node:assert/strict';
const base = process.env.STAGE_VERIFY_BASE_URL || 'http://127.0.0.1:8139';
const report = [];
for (const q of ['', '佐藤流司', 'サトウリュウジ', 'sato ryuji', 'Final Match Rikkai', 'A3!', 'abc),name.neq.foo', 'Quote:"', 'Backslash:\\', '%', '_']) {
  const response = await fetch(`${base}/api/search?q=${encodeURIComponent(q)}`);
  assert.equal(response.status, 200, q);
  const { results } = await response.json();
  for (const rows of Object.values(results)) {
    assert.ok(rows.length <= 5, q+' suggestion limit');
    assert.ok(rows.every(row => row.id && row.slug), q+' valid link targets');
  }
  if (['佐藤流司','サトウリュウジ','sato ryuji'].includes(q)) assert.ok(results.actors.some(item => item.slug === 'sato-ryuji'), q);
  if (q === 'Final Match Rikkai') assert.ok(results.plays.some(item => item.slug === 'tennimu-1st-final-rikkai-second' && item.titleEn?.includes('Final Match Rikkai')), q);
  if (!q || q.includes('name.neq') || q === '%') assert.ok(Object.values(results).every(rows => rows.length === 0), q+' empty or literal search');
  if (q === '_') assert.ok(Object.values(results).flat().every(row => Object.values(row).some(value => typeof value === 'string' && value.includes('_'))), 'underscore is literal');
  report.push({ q, counts: Object.fromEntries(Object.entries(results).map(([key,rows]) => [key,rows.length])) });
}
console.log(JSON.stringify({ passed: true, queries: report.length, report }, null, 2));
