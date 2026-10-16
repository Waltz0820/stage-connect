import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReviewDataset } from '../lib/cast-credit-preview.mjs';

const flag = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
if (!flag('snapshot-dir') || !flag('output-dir')) throw new Error('Use --snapshot-dir=<saved audit> --output-dir=<private preview directory>');
const snapshotDir = resolve(flag('snapshot-dir'));
const outputDir = resolve(flag('output-dir'));
if (snapshotDir === outputDir) throw new Error('Keep the preview separate from the baseline.');
const [actors, plays, franchises, casts, manifest] = await Promise.all(['actors', 'plays', 'franchises', 'casts', 'manifest'].map(async (name) => JSON.parse(await readFile(join(snapshotDir, `${name}.json`), 'utf8'))));
const dataset = createReviewDataset({ actors, plays, franchises, casts, capturedAt: manifest.capturedAt });
const templateDir = join(dirname(fileURLToPath(import.meta.url)), 'cast-credit-preview');
const [html, css, js] = await Promise.all(['index.html', 'preview.css', 'preview.js'].map((name) => readFile(join(templateDir, name), 'utf8')));
const page = html.replace('/* PREVIEW_CSS */', () => css).replace('/* PREVIEW_DATA */', () => JSON.stringify(dataset).replace(/</gu, '\\u003c')).replace('/* PREVIEW_JS */', () => js);
await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, 'index.html'), page);
console.log(JSON.stringify({ file: join(outputDir, 'index.html'), revision: dataset.revision, stats: dataset.stats, featured: dataset.featuredIds.length }, null, 2));
