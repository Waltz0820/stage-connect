// Existing display abbreviations from the home shelf. Formal database names remain visible.
const labels: Record<string, { ja: string; en: string }> = {
  "touken-ranbu-musical": { ja: "刀ミュ", en: "TOUMYU" },
  "butai-touken-ranbu": { ja: "刀ステ", en: "TOUSUTE" },
  tennimu: { ja: "テニミュ 1st", en: "TENIMYU 1st" },
  "tennimu-2nd": { ja: "テニミュ 2nd", en: "TENIMYU 2nd" },
  bleach: { ja: "BLEACH", en: "BLEACH" },
};
export function DirectorySeriesName({ slug, locale }: { slug: string; locale: "ja" | "en" }) {
  return labels[slug] ? <span className="directory-series-short" aria-hidden="true">{labels[slug][locale]}</span> : null;
}
