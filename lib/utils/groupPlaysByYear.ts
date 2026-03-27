import { Play } from '../types';

export type TimelineGroup = {
  year: string;
  plays: Play[];
};

const periodSortKey = (period?: string) => {
  if (!period) return -1;

  const fullDates = Array.from(period.matchAll(/(\d{4})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/g)).map((match) => ({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }));

  if (fullDates.length > 0) {
    const first = fullDates[0];
    let endYear = first.year;
    let endMonth = first.month;
    let endDay = first.day;

    const monthDayMatches = Array.from(period.matchAll(/(?:\d{4}\D{0,2})?(\d{1,2})\D{0,2}(\d{1,2})/g)).map(
      (match) => ({
        raw: match[0],
        month: Number(match[1]),
        day: Number(match[2]),
        hasYear: /^\d{4}\D/.test(match[0]),
      })
    );

    for (const item of monthDayMatches) {
      if (item.hasYear) {
        const yearMatch = item.raw.match(/^(\d{4})\D/);
        endYear = yearMatch ? Number(yearMatch[1]) : endYear;
        endMonth = item.month;
        endDay = item.day;
        continue;
      }

      if (item.month < endMonth) endYear += 1;
      endMonth = item.month;
      endDay = item.day;
    }

    return endYear * 10000 + endMonth * 100 + endDay;
  }

  const yearMonth = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const year = Number(yearMonth[1]);
    const month = Number(yearMonth[2]);
    return year * 10000 + month * 100;
  }

  const yearOnly = period.match(/(\d{4})/);
  if (yearOnly) {
    return Number(yearOnly[1]) * 10000;
  }

  return -1;
};

/**
 * 作品リストを年別にグルーピングする
 * period文字列（例: "2016年5月"）から西暦を抽出して分類します
 */
export function groupPlaysByYear(plays: Play[]): TimelineGroup[] {
  const groups: Record<string, Play[]> = {};

  plays.forEach((play) => {
    let year = '年不明';

    // 1. 将来的な拡張のため、もし明示的な year プロパティがあればそれを優先
    if ('year' in play && typeof (play as any).year === 'number') {
       year = String((play as any).year);
    }
    // 2. period 文字列から4桁の数字を抽出 (例: "2016年5月" -> "2016")
    else if (play.period) {
      const match = play.period.match(/([0-9]{4})/);
      if (match) {
        year = match[1];
      }
    }

    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(play);
  });

  // グループをソート（新しい年順、「年不明」は最後）
  return Object.entries(groups)
    .map(([year, groupPlays]) => ({
      year,
      plays: [...groupPlays].sort((a, b) => periodSortKey(b.period) - periodSortKey(a.period)),
    }))
    .sort((a, b) => {
      if (a.year === '年不明') return 1;
      if (b.year === '年不明') return -1;
      return Number(b.year) - Number(a.year);
    });
}
