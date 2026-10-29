import type { ActorDetailData } from "./stage-connect";
import { getPerformanceStart, performanceStartSortKey } from "./performance-period";
import { getEnglishActorName, getEnglishPlayTitle, getEnglishSeriesName, normalizePeriodDisplayEn, translateAnnotatedDisplayTextEn } from "./en-copy";

export const compactActorSeriesName = (name: string) => {
  const alias = name.match(/[（(]([^（）()]+)[）)]$/u)?.[1];
  return alias && !/^(?:stage|musical|live|concert|舞台|ミュージカル)$/iu.test(alias) ? alias : name;
};

export type ExplorerWork = {
  id: string; slug: string; title: string; date: string | null; period: string | null;
  series: { name: string; slug: string | null } | null;
  role: string | null;
  credits: Array<{ id: string; role: string | null; group: string | null; note: string | null; starring: boolean }>;
  coStars: Array<{ slug: string; name: string }>;
  dmm: string | null;
};
export type ExplorerYear = { year: string; works: ExplorerWork[] };

/** Presentation only. Preserve every cast row; count distinct play IDs, never roles. */
export function buildActorExplorer(plays: ActorDetailData["plays"], locale: "ja" | "en"): ExplorerYear[] {
  const en = locale === "en", groups = new Map<string, ExplorerWork[]>(), seen = new Set<string>();
  for (const play of [...plays].sort((a, b) => performanceStartSortKey(b.period) - performanceStartSortKey(a.period))) {
    if (seen.has(play.id)) continue;
    seen.add(play.id);
    const start = getPerformanceStart(play.period), year = start ? String(start.year) : "unknown";
    const date = start ? [start.year, ...(start.month ? [String(start.month).padStart(2, "0")] : []), ...(start.day ? [String(start.day).padStart(2, "0")] : [])].join(".") : null;
    const translate = (value: string | null) => value ? en ? translateAnnotatedDisplayTextEn(value) : value : null;
    const work: ExplorerWork = {
      id: play.id, slug: play.slug, title: en ? getEnglishPlayTitle(play) : play.title, date,
      period: en ? normalizePeriodDisplayEn(play.period).replace(/(\d)年\s*/gu, "$1/").replace(/(\d)月\s*(?=\d)/gu, "$1/").replace(/(\d)[月日]/gu, "$1").replace(/[〜～]/gu, "–") || null : play.period,
      series: play.franchiseName ? { name: en ? getEnglishSeriesName({ name: play.franchiseName, nameEn: play.franchiseNameEn }) : play.franchiseName, slug: play.franchiseSlug } : null,
      role: translate(play.roleName),
      credits: play.credits.map(c => ({ id: c.id, role: translate(c.roleName), group: translate(c.castGroup), note: translate(c.note), starring: c.isStarring })),
      coStars: play.coStars.map(a => ({ slug: a.slug, name: en ? getEnglishActorName(a) : a.name })),
      dmm: play.vod?.dmm || null,
    };
    const bucket = groups.get(year) ?? []; bucket.push(work); groups.set(year, bucket);
  }
  return [...groups].map(([year, works]) => ({ year, works })).sort((a, b) => a.year === "unknown" ? 1 : b.year === "unknown" ? -1 : Number(b.year) - Number(a.year));
}
