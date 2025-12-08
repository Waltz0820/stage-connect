import { Play } from '../types';

export type TimelineGroup = {
  year: string;
  plays: Play[];
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
    .map(([year, groupPlays]) => ({ year, plays: groupPlays }))
    .sort((a, b) => {
      if (a.year === '年不明') return 1;
      if (b.year === '年不明') return -1;
      return Number(b.year) - Number(a.year);
    });
}