// A slash inside a date is not a list separator. Keep the source text intact;
// only the list boundaries are interpreted for display and counts.
export const splitPerformanceList = (value?: string | null): string[] =>
  String(value ?? "")
    .split(/\s+\/\s+|(?<![0-9０-９])／|／(?![0-9０-９])|[\r\n]+/u)
    .map((item) => item.trim())
    .filter(Boolean);

export const extractPerformanceCities = (period?: string | null): string[] => {
  const cities = splitPerformanceList(period).map((entry) => {
    const text = entry.normalize("NFKC");
    const labelled = text.match(/^([^\d:][^:]*):/u);
    const direct = text.match(/^([^\d]+?)\s+\d{4}\s*(?:\/|年)/u);
    const city = labelled?.[1] ?? direct?.[1] ?? "";
    // Venue/district qualifiers do not make two Tokyo runs different cities.
    // This only normalizes the count label; the full schedule stays intact.
    return city.split("・")[0].replace(/\([^()]*\)/gu, "").trim().replace(/\s+/gu, " ").replace(/(?:公演|会場)$/u, "").trim();
  });
  return Array.from(new Set(cities.filter(Boolean)));
};
