// Stable IDs are shared across languages, UI, APIs and the migration.
export const OSHI_POINTS = Object.freeze([
  { id: 'cast', ja: 'キャスト', en: 'Cast', icon: 'person' },
  { id: 'music', ja: '歌・音楽', en: 'Songs & music', icon: 'music' },
  { id: 'dance', ja: 'ダンス', en: 'Dance', icon: 'dance' },
  { id: 'action', ja: '殺陣・アクション', en: 'Swordplay & action', icon: 'swords' },
  { id: 'story', ja: 'ストーリー', en: 'Story', icon: 'book' },
  { id: 'direction', ja: '演出', en: 'Direction', icon: 'curtain' },
  { id: 'visuals', ja: '衣装・ビジュアル', en: 'Costumes & visuals', icon: 'shirt' },
  { id: 'adaptation', ja: '原作再現度', en: 'Faithfulness to the original', icon: 'star' },
  { id: 'funny', ja: '笑える', en: 'Makes me laugh', icon: 'smile' },
  { id: 'moving', ja: '泣ける', en: 'Moves me to tears', icon: 'drop' },
]);
export const OSHI_MIN_PARTICIPANTS = 5;
export const isOshiPoint = (id) => OSHI_POINTS.some((point) => point.id === id);
export const validOshiSelection = (value) => Array.isArray(value) && value.length >= 1 && value.length <= 3
  && value.every((id) => typeof id === 'string' && isOshiPoint(id)) && new Set(value).size === value.length;
export const isPlayId = (value) => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);

export function summarizeOshiResults(rows = []) {
  const participants = Number(rows[0]?.participants ?? 0);
  const points = OSHI_POINTS.map((point) => {
    const votes = Number(rows.find((row) => row.point_id === point.id)?.votes ?? 0);
    return { id: point.id, votes, support: participants ? Math.round(votes / participants * 100) : 0 };
  });
  return { participants, points, top: points.filter((point) => point.votes > 0)
    .sort((a, b) => b.votes - a.votes || OSHI_POINTS.findIndex((p) => p.id === a.id) - OSHI_POINTS.findIndex((p) => p.id === b.id)).slice(0, 3) };
}
