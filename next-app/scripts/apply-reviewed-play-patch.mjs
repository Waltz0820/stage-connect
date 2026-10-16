// Reviewed, narrow metadata patches only. Dry run by default; no cast/name creation.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const flag = (key) => process.argv.find((arg) => arg.startsWith(`--${key}=`))?.slice(key.length + 3);
if (!flag('plan') || !flag('output-dir')) throw new Error('Use --plan=<reviewed JSON> --output-dir=<private evidence directory> [--apply]');
const planPath = resolve(flag('plan'));
const outputDir = resolve(flag('output-dir'));
const planText = await readFile(planPath, 'utf8');
const plan = JSON.parse(planText);
const allowed = ['title_en', 'summary_en'];
if (!/^[0-9a-f-]{36}$/u.test(plan.playId ?? '') || !plan.slug || !plan.expectedUpdatedAt || !plan.sourceUrls?.length || !plan.rationale) throw new Error('Missing reviewed identity, version or provenance.');
const fields = Object.keys(plan.patch ?? {});
if (!fields.length || fields.some((field) => !allowed.includes(field) || typeof plan.patch[field] !== 'string' || !plan.patch[field].trim())) throw new Error('Only non-empty English title/summary fields may be filled.');
for (const source of plan.sourceUrls) if (new URL(source).protocol !== 'https:') throw new Error('Sources must use HTTPS.');
const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env };
for (const line of (await readFile(join(appDir, '.env.local'), 'utf8')).split(/\r?\n/u)) {
  const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/u);
  if (match && env[match[1]] === undefined) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/u, '$2');
}
const base = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error('Server credentials required; values are never logged.');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
async function request(table, params, method = 'GET', body) {
  const url = new URL(`/rest/v1/${table}`, base);
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, { method, headers: { ...headers, Prefer: 'return=representation' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`DB ${method} failed (${response.status}): ${error.code ?? ''} ${error.message ?? ''}`);
  }
  return response.json();
}
const readPlay = async () => {
  const rows = await request('plays', { select: '*', id: `eq.${plan.playId}`, slug: `eq.${plan.slug}` });
  if (rows.length !== 1) throw new Error('Expected exactly one existing play.');
  return rows[0];
};
const before = await readPlay();
const canonical = (value) => JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))));
if (fields.every((field) => before[field] === plan.patch[field])) {
  console.log(JSON.stringify({ status: 'already_applied', playId: before.id, changed: false }));
  process.exit(0);
}
if (before.updated_at !== plan.expectedUpdatedAt || fields.some((field) => before[field] !== null)) throw new Error('Stale plan or populated field; re-review instead of overwriting.');
await mkdir(outputDir, { recursive: true });
const planHash = createHash('sha256').update(planText).digest('hex');
const evidencePath = join(outputDir, `play-patch-${planHash.slice(0, 16)}-${Date.now()}.json`);
const evidence = { planHash, plan, before, checkedAt: new Date().toISOString(), status: 'dry_run' };
await writeFile(evidencePath, JSON.stringify(evidence, null, 2), { flag: 'wx' });
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ status: 'dry_run', playId: before.id, patch: plan.patch, evidencePath }, null, 2));
  process.exit(0);
}
// Store intent before the request: a network failure can occur after commit.
evidence.status = 'write_pending';
await writeFile(evidencePath, JSON.stringify(evidence, null, 2));
const params = { select: '*', id: `eq.${before.id}`, slug: `eq.${before.slug}`, updated_at: `eq.${before.updated_at}` };
for (const field of fields) params[field] = 'is.null';
const updated = await request('plays', params, 'PATCH', plan.patch);
if (updated.length !== 1) throw new Error('Concurrent change blocked the patch.');
const after = await readPlay();
if (fields.some((field) => after[field] !== plan.patch[field])) throw new Error('Patch read-back failed.');
const omit = (row) => Object.fromEntries(Object.entries(row).filter(([field]) => ![...fields, 'updated_at'].includes(field)));
if (canonical(omit(before)) !== canonical(omit(after))) throw new Error('An unrelated field changed; inspect private evidence.');
evidence.after = after;
evidence.status = 'applied';
await writeFile(evidencePath, JSON.stringify(evidence, null, 2));
// Provenance log is a separate REST request, not an atomic transaction with the patch.
try {
  const log = await request('external_import_logs', {}, 'POST', { source: 'kira-hai', action: 'reviewed_play_translation', target_type: 'play', target_id: before.id, target_label: before.title, source_url: plan.sourceUrls[0], details: { planHash, sourceUrls: plan.sourceUrls, rationale: plan.rationale, before: Object.fromEntries(fields.map((field) => [field, before[field]])), after: plan.patch } });
  evidence.logId = log[0]?.id;
  evidence.status = 'applied_and_logged';
} catch (error) {
  evidence.logError = error.message;
  process.exitCode = 1;
}
await writeFile(evidencePath, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ status: evidence.status, playId: before.id, fields, logId: evidence.logId, evidencePath, logError: evidence.logError }, null, 2));
