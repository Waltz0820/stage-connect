import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseKiraHaiWork } from '../lib/kira-hai-work.mjs';
import { buildSourceLookup, resolveSourceActor, sourceNameKey } from '../lib/source-match.mjs';

const getFlag = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const sourceUrl = getFlag('url');
const dir = resolve(getFlag('snapshot-dir') ?? '');
if (!sourceUrl || !getFlag('snapshot-dir')) throw new Error('Use --url=<kira-hai work URL> --snapshot-dir=<baseline>');
const url = new URL(sourceUrl);
if (url.origin !== 'https://kira-hai.net' || !/^\/[a-z0-9_-]+\/?$/u.test(url.pathname)) throw new Error('Expected a public kira-hai work URL.');
const headers = { 'User-Agent': 'StageConnectResearch/0.1 (+https://stageconnect.jp)' };
const robots = await fetch(new URL('/robots.txt', url), { headers, signal: AbortSignal.timeout(20000) });
if (!robots.ok) throw new Error('Cannot verify source robots policy.');
const robotsText = await robots.text();
if (robotsText.split(/\r?\n/u).some((line) => /^Disallow:\s*\/$/iu.test(line.trim()))) throw new Error('Source blocks crawling.');
const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Source returned ${response.status}`);
const html = await response.text();
const parsed = parseKiraHaiWork(html, url.href);
if (!parsed.cast.length || parsed.unparsed.length) throw new Error(`Incomplete source extraction: ${parsed.cast.length} cast, ${parsed.unparsed.length} unparsed lines.`);
const actors = JSON.parse(await readFile(join(dir, 'actors.json'), 'utf8'));
const lookup = buildSourceLookup(actors, ['name', 'name_en', 'slug'], sourceNameKey);
const cast = parsed.cast.map((credit) => {
  const result = resolveSourceActor(lookup, credit);
  return { ...credit, matchStatus: result.status, matchedActorId: result.match?.id ?? null, matchedActorName: result.match?.name ?? null,
    candidates: result.status === 'matched' ? [] : result.candidates.map(({ id, name, slug }) => ({ id, name, slug })) };
});
const report = { ...parsed, checkedAt: new Date().toISOString(), cast };
await writeFile(join(dir, `${url.pathname.slice(1)}-source.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
