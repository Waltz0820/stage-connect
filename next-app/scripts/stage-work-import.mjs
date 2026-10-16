import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { readAllRows } from '../lib/source-match.mjs';
import { buildWorkImportPlan } from '../lib/work-import-plan.mjs';
import { stageWorkCandidates, buildWorkCandidateBatch } from '../lib/stage-work-candidates.mjs';

const flag = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const write = process.argv.includes('--write');
if (!flag('source-file') || !flag('review') || !flag('output-dir') || !write && !flag('snapshot-dir')) throw new Error('Use --source-file=<parsed source> --review=<decisions> --output-dir=<private evidence> [--snapshot-dir=<snapshot> | --write]');
const json = async (file) => JSON.parse(await readFile(resolve(file), 'utf8'));
const source = await json(flag('source-file'));
const review = await json(flag('review'));
let supabase;
let snapshot;
if (write) {
  const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const env = { ...process.env };
  for (const line of (await readFile(join(appDir, '.env.local'), 'utf8')).split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/u);
    if (match && env[match[1]] === undefined) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/u, '$2');
  }
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server credentials required; values are never logged.');
  supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  // Rebuild against live identities; never execute actor/play links copied from an old plan.
  snapshot = Object.fromEntries(await Promise.all(['actors', 'plays', 'casts'].map(async (table) => [table, await readAllRows(supabase, table, '*')])));
} else {
  const directory = resolve(flag('snapshot-dir'));
  const manifest = await json(join(directory, 'manifest.json'));
  snapshot = Object.fromEntries(await Promise.all(['actors', 'plays', 'casts'].map(async (table) => {
    const raw = await readFile(join(directory, `${table}.json`), 'utf8');
    const rows = JSON.parse(raw);
    if (manifest.tables?.[table]?.sha256 !== createHash('sha256').update(raw).digest('hex') || manifest.tables[table].count !== rows.length || new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error(`Incomplete or changed snapshot: ${table}`);
    return [table, rows];
  })));
}
const plan = buildWorkImportPlan({ source, snapshot, review });
const batch = buildWorkCandidateBatch(plan);
const directory = resolve(flag('output-dir'));
await mkdir(directory, { recursive: true });
const path = join(directory, `stage-work-${batch.key.slice(0, 16)}-${Date.now()}.json`);
const record = { checkedAt: new Date().toISOString(), state: write ? 'write_pending' : 'dry_run', batch, plan };
await writeFile(path, JSON.stringify(record, null, 2), { flag: 'wx' });
try {
  const result = await stageWorkCandidates(supabase, plan, { write });
  record.state = result.status;
  record.result = result;
  console.log(JSON.stringify({ status: result.status, candidates: batch.items.length, created: result.created ?? 0,
    reviewPreserved: result.review_preserved ?? 0, actorCreates: 0, castCreates: 0, evidencePath: path }, null, 2));
} catch (error) {
  // A network failure may occur after commit. Keep the intent for idempotent recovery.
  record.error = error.message;
  if (error.code === 'WORK_STORAGE_UNAVAILABLE') record.state = 'not_staged';
  console.error(JSON.stringify({ state: record.state, message: error.message, evidencePath: path }));
  process.exitCode = 1;
}
await writeFile(path, JSON.stringify(record, null, 2));
