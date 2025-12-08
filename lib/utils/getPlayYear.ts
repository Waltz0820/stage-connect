import { Play } from '../types';

/**
 * 作品データから公開年（西暦4桁）を数値として抽出する
 */
export function getPlayYear(play: Play): number {
  // 将来的な拡張: year プロパティがあれば優先
  if ('year' in play && typeof (play as any).year === 'number') {
    return (play as any).year;
  }
  
  // period 文字列 (例: "2016年5月") から抽出
  if (play.period) {
    const match = play.period.match(/([0-9]{4})/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  return 0; // 年不明の場合は0（ソート順で末尾にする等の扱いに使用）
}