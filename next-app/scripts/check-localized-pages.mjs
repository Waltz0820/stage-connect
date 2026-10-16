import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as cheerio from 'cheerio';

const flag = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
if (!flag('output-dir')) throw new Error('Use --output-dir=<private evidence directory> [--baseline=<before.json>] [--base-url=http://127.0.0.1:8139]');
const base = new URL(flag('base-url') ?? 'http://127.0.0.1:8139');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname)) throw new Error('This check runs against a local app only.');
const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://stageconnect.jp';
const pairPaths = ['/', '/actors', '/plays', '/series', '/actors/sato-ryuji', '/plays/tennimu-1st-final-rikkai-second', '/plays/touken-ranbu-stage-tandokugyo', '/series/tennimu', '/series/butai-touken-ranbu'];
const localized = pairPaths.flatMap((ja) => [{ path: ja, locale: 'ja', ja, en: ja === '/' ? '/en' : `/en${ja}` }, { path: ja === '/' ? '/en' : `/en${ja}`, locale: 'en', ja, en: ja === '/' ? '/en' : `/en${ja}` }]);
const cases = [...localized, ...['/watch', '/watch/dmm', '/watch/u-next', '/guide', '/tags', '/favorites', '/contact', '/privacy', '/admin'].map((path) => ({ path, locale: 'ja' })),
  { path: '/actors/stage-connect-check-not-a-real-actor', status: 404, clientFallback: true, locale: 'ja' },
  { path: '/en/actors/stage-connect-check-not-a-real-actor', status: 404, clientFallback: true, locale: 'en' },
  ...['/stage-connect-check-no-such-page', '/en/stage-connect-check-no-such-page'].map((path) => ({ path, status: 404, locale: 'ja' }))];
const before = flag('baseline') ? JSON.parse(await readFile(resolve(flag('baseline')), 'utf8')) : null;
const records = [];
const failures = [];
const withoutLocaleLinks = (record) => ({
  actorLinks: record.stats.actorLinks - record.localeLinks.filter((link) => /^\/(?:en\/)?actors\//u.test(link.href)).length,
  playLinks: record.stats.playLinks - record.localeLinks.filter((link) => /^\/(?:en\/)?plays\//u.test(link.href)).length,
});
for (let offset = 0; offset < cases.length; offset += 3) {
  const batch = await Promise.all(cases.slice(offset, offset + 3).map(async (entry) => {
    const response = await fetch(new URL(entry.path, base), { headers: { 'User-Agent': 'StageConnectLocalCheck/1.0' }, signal: AbortSignal.timeout(45000) });
    const html = await response.text();
    const $ = cheerio.load(html);
    const links = $('a[href]').map((_i, node) => $(node).attr('href')).get();
    const contentLinks = $('main a[href]').map((_i, node) => $(node).attr('href')).get();
    const dataLinks = [...new Set(contentLinks.filter((href) => /^\/(?:en\/)?(?:actors|plays|series)(?:\/|$)/u.test(href)))].sort();
    const alternates = Object.fromEntries($('link[rel="alternate"][hreflang]').map((_i, node) => [[ $(node).attr('hreflang'), $(node).attr('href') ]]).get());
    const result = { path: entry.path, status: response.status, lang: $('html').attr('lang'), htmlElements: $('html').length,
      title: $('title').text(), h1: $('h1').map((_i, node) => $(node).text()).get(), description: $('meta[name="description"]').attr('content'),
      canonical: $('link[rel="canonical"]').attr('href'), alternates,
      viewportCount: $('meta[name="viewport"]').length,
      localeLinks: $('.locale-switcher a').map((_i, node) => ({ href: $(node).attr('href'), label: $(node).text() })).get(), dataLinks,
      stats: { actorLinks: links.filter((href) => /^\/(?:en\/)?actors\//u.test(href)).length, playLinks: links.filter((href) => /^\/(?:en\/)?plays\//u.test(href)).length },
    };
    if (before) {
      const previous = before.records.find((row) => row.path === entry.path);
      const require = (condition, message) => { if (!condition) failures.push({ path: entry.path, message }); };
      require(result.status === (entry.status ?? 200), `HTTP ${result.status}`);
      // Next 15 returns an error shell for an async page's notFound(), then
      // recovers its localized document on the client. Verify that separately
      // in a browser; do not mistake its RSC payload for server-rendered HTML.
      if (!entry.clientFallback) require(result.lang === entry.locale, `html lang=${result.lang}`);
      require(result.htmlElements === 1, 'Expected one HTML document');
      require(result.viewportCount === 1, `Viewport tags: ${result.viewportCount}`);
      if (entry.status === 404) {
        require($('meta[name="robots"]').attr('content')?.includes('noindex'), 'Missing noindex');
        if (entry.clientFallback) {
          result.clientFallback = true;
          require(html.includes(entry.locale === 'en' ? 'Back to home' : 'トップへ戻る'), 'Missing localized recovery component');
        } else {
          require($('h1').text() === '404', 'Missing server-rendered 404 body');
          require($('p[lang="en"]').text() === 'This page could not be found.', 'Missing English fallback message');
          require(links.includes('/') && links.includes('/en'), 'Missing language home links');
        }
      }
      if ((entry.status ?? 200) === 200 && !entry.path.startsWith('/admin')) {
        for (const field of ['title', 'h1', 'canonical', 'description', 'dataLinks']) require(JSON.stringify(result[field]) === JSON.stringify(previous?.[field]), `${field} changed`);
        require(Boolean(previous) && JSON.stringify(withoutLocaleLinks(result)) === JSON.stringify(withoutLocaleLinks(previous)), 'Content link counts changed');
      }
      if (entry.en) {
        const expectedCanonical = entry.path === '/' ? site : `${site}${entry.path}`;
        require(result.canonical === expectedCanonical, 'Canonical mismatch');
        require(result.alternates.ja === (entry.ja === '/' ? site : `${site}${entry.ja}`) && result.alternates.en === `${site}${entry.en}`, 'Missing reciprocal language metadata');
        require(result.localeLinks.some((link) => link.href === (entry.locale === 'ja' ? entry.en : entry.ja)), 'Missing language switch');
      }
    }
    return result;
  }));
  records.push(...batch);
}
const technical = {};
for (const path of ['/robots.txt', '/sitemap.xml', '/icon.svg']) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(45000) });
  const text = await response.text();
  technical[path] = { status: response.status, contentType: response.headers.get('content-type'), size: text.length };
  if (before && response.status !== 200) failures.push({ path, message: `HTTP ${response.status}` });
  if (path === '/sitemap.xml') technical[path].locations = cheerio.load(text, { xmlMode: true })('url > loc').map((_i, node) => cheerio.load(node, { xmlMode: true }).text()).get().sort();
  if (before && JSON.stringify(technical[path]) !== JSON.stringify(before.technical[path])) failures.push({ path, message: 'Metadata route changed' });
}
const report = { capturedAt: new Date().toISOString(), baseUrl: base.href, records, technical, failures };
const outputDir = resolve(flag('output-dir')); await mkdir(outputDir, { recursive: true });
const file = join(outputDir, before ? 'after.json' : 'before.json');
await writeFile(file, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ file, pages: records.length, technical: Object.fromEntries(Object.entries(technical).map(([path, row]) => [path, row.status])), failures, languages: [...new Set(records.map((row) => row.lang))] }, null, 2));
if (failures.length) process.exitCode = 1;
