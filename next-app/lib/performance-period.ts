type PerformanceStart = { year: number; month: number | null; day: number | null };

// Require date separators and valid calendar values: venue numbers such as
// シアター1010 must never become a performance year, month or day.
export const getPerformanceStart = (period?: string | null): PerformanceStart | null => {
  const text = String(period ?? "").normalize("NFKC");
  const datedYears = new Set<number>();
  const dates = /(?<!\d)((?:18|19|20|21)\d{2})\s*(?:年\s*|[/.\-]\s*)(\d{1,2})(?!\d)(?:\s*(?:月\s*|[/.\-]\s*)(\d{1,2})(?!\d))?/g;

  for (const match of text.matchAll(dates)) {
    datedYears.add(match.index!);
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = match[3] ? Number(match[3]) : null;
    if (month < 1 || month > 12) continue;
    if (day !== null && (day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate())) continue;
    return { year, month, day };
  }

  for (const match of text.matchAll(/(?<!\d)((?:18|19|20|21)\d{2})(?!\d)/g)) {
    if (!datedYears.has(match.index!)) return { year: Number(match[1]), month: null, day: null };
  }
  return null;
};

export const performanceStartSortKey = (period?: string | null) => {
  const start = getPerformanceStart(period);
  return start ? start.year * 10000 + (start.month ?? 0) * 100 + (start.day ?? 0) : -1;
};

export const compactPerformancePeriod = (period?: string | null, locale: "ja" | "en" = "ja") => {
  const start = getPerformanceStart(period);
  if (!start) return locale === "en" ? "TBA" : "公演時期未定";
  return start.month ? `${start.year}/${String(start.month).padStart(2, "0")}` : String(start.year);
};
