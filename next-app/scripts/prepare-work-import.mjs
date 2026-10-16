import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { buildWorkImportPlan, renderWorkImportReport } from '../lib/work-import-plan.mjs';

const flag = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
if (process.argv.includes('--apply') || process.argv.includes('--write')) throw new Error('This command only prepares a local review; it cannot write to a database.');
if (!flag('snapshot-dir') || !flag('source-file') || !flag('output-dir')) throw new Error('Use --snapshot-dir=<complete snapshot> --source-file=<parsed source JSON> --output-dir=<private output> [--review=<decisions JSON>]');
const readJson = async (file) => JSON.parse(await readFile(resolve(file), 'utf8'));
const directory = resolve(flag('snapshot-dir'));
const source = await readJson(flag('source-file'));
const review = flag('review') ? await readJson(flag('review')) : {};
const manifest = await readJson(join(directory, 'manifest.json'));
const snapshot = Object.fromEntries(await Promise.all(['actors', 'plays', 'casts'].map(async (table) => {
  const json = await readFile(join(directory, `${table}.json`), 'utf8');
  const rows = JSON.parse(json);
  if (manifest.tables?.[table]?.sha256 !== createHash('sha256').update(json).digest('hex') || manifest.tables[table].count !== rows.length || new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error(`Incomplete or changed snapshot: ${table}`);
  return [table, rows];
})));
const plan = buildWorkImportPlan({ source, snapshot, review });
const output = resolve(flag('output-dir'));
await mkdir(output, { recursive: true });
await writeFile(join(output, 'work-import-plan.json'), JSON.stringify(plan, null, 2));
await writeFile(join(output, 'work-import-report.md'), renderWorkImportReport(plan));
console.log(JSON.stringify({ output, mode: plan.mode, play: plan.play?.slug ?? null, rows: plan.rows.length, counts: plan.counts, blockers: plan.blockers, warnings: plan.warnings, writes: plan.writes }, null, 2));
if (plan.blockers.length || plan.counts.hold) process.exitCode = 2;
