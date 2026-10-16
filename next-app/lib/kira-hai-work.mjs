import * as cheerio from 'cheerio';
import { normalizeCreditText } from './cast-credit.mjs';

function section($, label) {
  const heading = $('h2,h3,h4,h5').filter((_i, el) => normalizeCreditText($(el).text()) === label).first();
  if (!heading.length) return $();
  return heading.nextUntil('h2,h3,h4,h5');
}

function lines(nodes) {
  const copy = nodes.clone();
  copy.find('br').replaceWith('\n');
  copy.find('script,style').remove();
  return copy.map((_i, el) => cheerio.load(el).text()).get().join('\n').split(/\r?\n/u).map(normalizeCreditText).filter(Boolean);
}

// Only extracts the work's factual schedule and cast section, not reviews/comments.
export function parseKiraHaiWork(html, sourceUrl) {
  const $ = cheerio.load(html);
  const castSection = section($, 'キャスト');
  const anchors = new Map();
  castSection.find('a[href]').each((_i, el) => {
    const name = normalizeCreditText($(el).text());
    const url = new URL($(el).attr('href'), sourceUrl);
    if (url.origin === new URL(sourceUrl).origin) anchors.set(name, url.href);
  });
  const castLines = lines(castSection);
  const cast = [];
  let group = null;
  const unparsed = [];
  for (const line of castLines) {
    if (/^(?:Facebook|Twitter|B!|はてブ|Pocket|LINEへ送る)(?:\s|$)/u.test(line)) break;
    if (/^[<＜〈【].+[>＞〉】]$/u.test(line)) {
      group = line.replace(/^[<＜〈【]|[>＞〉】]$/gu, '').trim();
      continue;
    }
    const match = line.match(/^(.+?)\s*[:：]\s*(.+)$/u);
    if (match) {
      const name = normalizeCreditText(match[2]);
      cast.push({ sourceActorName: name, sourceActorUrl: anchors.get(name) ?? null,
        role_name: normalizeCreditText(match[1]), cast_group: group });
    } else if (['アンサンブル', 'バックダンサー'].includes(group) && !/[：:]/u.test(line)) {
      cast.push({ sourceActorName: line, sourceActorUrl: anchors.get(line) ?? null, role_name: null, cast_group: group });
    } else {
      unparsed.push(line);
    }
  }
  const pageTitle = $('meta[property="og:title"]').attr('content') || $('h1').last().text();
  return { sourceUrl, title: normalizeCreditText(pageTitle).replace(/\s*\|\s*kirakira.*$/u, ''),
    scheduleLines: lines(section($, '公演日程')), cast, unparsed };
}
