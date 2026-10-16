import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { buildActorResearch, renderActorResearch } from '../lib/actor-research.mjs';

const flag = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const allowed = ['plan', 'snapshot-dir', 'research', 'output-dir'];
if (process.argv.slice(2).some((arg) => !allowed.some((name) => arg.startsWith(`--${name}=`))) || allowed.some((name) => !flag(name))) throw new Error('Use --plan=<work plan> --snapshot-dir=<snapshot> --research=<actor research> --output-dir=<private output>. Local preparation only.');
const json = async (file) => JSON.parse(await readFile(resolve(file), 'utf8'));
const manifest = await json(join(flag('snapshot-dir'), 'manifest.json'));
const snapshot = Object.fromEntries(await Promise.all(['actors', 'plays', 'casts'].map(async (table) => {
  const raw = await readFile(resolve(flag('snapshot-dir'), `${table}.json`), 'utf8');
  const rows = JSON.parse(raw);
  if (manifest.tables?.[table]?.sha256 !== createHash('sha256').update(raw).digest('hex') || manifest.tables[table].count !== rows.length || new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error(`Incomplete or changed snapshot: ${table}`);
  return [table, rows];
})));
const { actors } = snapshot;
const plan = await json(flag('plan'));
if (plan.snapshotFingerprint !== createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')) throw new Error('The plan and snapshot differ. Rebuild the work plan.');
const report = buildActorResearch({ plan, actors, research: await json(flag('research')) });
const output = resolve(flag('output-dir'));
await mkdir(output, { recursive: true });
await writeFile(join(output, 'actor-research.json'), JSON.stringify(report, null, 2));
await writeFile(join(output, 'actor-research.md'), renderActorResearch(report));
console.log(JSON.stringify({ ...report.counts, writes: report.writes, output }, null, 2));
if (report.counts.needsReview) process.exitCode = 2;
