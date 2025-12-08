import { actors } from '../data/actors';
import { plays } from '../data/plays';
import { Actor } from '../types';

export type CoStar = {
  actor: Actor;
  count: number;
  playSlugs: string[];
};

/**
 * 指定された俳優と共演回数の多い俳優を取得する
 * @param targetSlug 対象の俳優スラッグ
 * @param limit 取得する最大人数（デフォルト6人）
 */
export function getCoStars(targetSlug: string, limit: number = 6): CoStar[] {
  // 1. 対象の俳優が出演している作品を取得
  const targetPlays = plays.filter((play) => play.actorSlugs.includes(targetSlug));

  // 2. 共演者をカウント
  const coStarMap: Record<string, { count: number; playSlugs: string[] }> = {};

  targetPlays.forEach((play) => {
    play.actorSlugs.forEach((slug) => {
      // 自分自身は除外
      if (slug === targetSlug) return;

      if (!coStarMap[slug]) {
        coStarMap[slug] = { count: 0, playSlugs: [] };
      }
      coStarMap[slug].count += 1;
      coStarMap[slug].playSlugs.push(play.slug);
    });
  });

  // 3. 配列に変換し、Actorデータを結合
  const results: CoStar[] = Object.entries(coStarMap)
    .map(([slug, data]) => {
      const actor = actors.find((a) => a.slug === slug);
      // 登録されている俳優データがある場合のみ有効
      return actor ? { actor, ...data } : null;
    })
    .filter((item): item is CoStar => item !== null);

  // 4. 共演回数順（降順）にソートして、limit件返す
  return results
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}