import { createHash } from 'node:crypto';
import { analyzeCastCredit } from './cast-credit.mjs';

export const appearanceLabels = {
  guest: 'ゲスト', rotating_guest: '日替わりゲスト', rotating_cast: '日替わり出演',
  venue_rotation: '会場替わり出演', support: 'サポート', special_appearance: '特別出演',
  special_guest: '友情出演', special_cooperation: '特別協力', double_cast: 'Wキャスト',
  triple_cast: 'トリプルキャスト', final_performance: '千秋楽出演',
};
const media = ['voice', 'video'];
export function suggestCreditDraft(parsed) {
  // A modifier on a slash-separated list does not establish its scope for each role.
  const singleRole = parsed.roleNames.length === 1;
  return {
    roles: parsed.roleNames.map((name) => ({ name, media: singleRole ? parsed.appearances.filter((value) => media.includes(value)) : [], context: 'unknown' })),
    group: parsed.groupName ?? '', generations: parsed.generations.join('、'), teams: parsed.teams.join('、'),
    locations: parsed.locations.join('、'), schedule: parsed.scheduleNotes.join(' / '),
    participation: parsed.appearances.filter((value) => !media.includes(value)),
    scopeNote: !singleRole && parsed.appearances.some((value) => media.includes(value)) ? '出演形態の対象となる役を確認してください。' : '',
    conditionScope: 'unknown', sourceUrls: '', reviewNote: '', decision: 'pending',
  };
}

export function createReviewDataset({ actors, plays, franchises, casts, capturedAt }) {
  const actorsById = new Map(actors.map((row) => [row.id, row]));
  const playsById = new Map(plays.map((row) => [row.id, row]));
  const seriesById = new Map(franchises.map((row) => [row.id, row]));
  const records = casts.map((row) => {
    const actor = actorsById.get(row.actor_id);
    const play = playsById.get(row.play_id);
    const series = seriesById.get(play?.franchise_id);
    const parsed = analyzeCastCredit(row);
    return {
      id: row.id, kind: 'real', actor: { id: row.actor_id, name: actor?.name ?? '俳優未取得', slug: actor?.slug ?? '' },
      play: { id: row.play_id, title: play?.title ?? '作品未取得', slug: play?.slug ?? '' },
      series: { slug: series?.slug ?? '', name: series?.name ?? 'シリーズ未指定' },
      starring: row.is_starring, billingOrder: row.billing_order, parsed, draft: suggestCreditDraft(parsed),
    };
  });
  const picks = [
    (r) => r.parsed.raw.roleName === '鶴丸国永※声',
    (r) => r.parsed.appearances.includes('video'),
    (r) => r.actor.name.replace(/\s/gu, '') === '三浦宏規' && r.parsed.locations.length > 1,
    (r) => r.parsed.scheduleNotes.length && r.parsed.appearances.includes('rotating_cast'),
    (r) => r.parsed.generations.includes(5),
    (r) => r.parsed.teams.length && r.parsed.appearances.includes('guest'),
    (r) => r.parsed.raw.castGroup?.includes('10月から'),
    (r) => r.parsed.roleNames.length > 1 && !r.parsed.needsReview,
    (r) => r.parsed.raw.roleName === '豊前江※犬山道節・浜路',
    (r) => r.parsed.raw.roleName?.startsWith('水心子正秀※'),
    (r) => r.parsed.raw.roleName?.includes('※GOD座'),
    (r) => r.parsed.qualityFlags.length > 0,
    (r) => !r.parsed.annotations.length && !r.parsed.needsReview && r.series.slug === 'tennimu',
  ];
  const featuredIds = [...new Set(picks.map((predicate) => records.find(predicate)?.id).filter(Boolean))];
  const synthetic = {
    id: 'demo-mixed-media', kind: 'synthetic', actor: { name: '架空の俳優', slug: '' },
    play: { title: '構造確認用の架空例', slug: '' }, series: { slug: '', name: '実DBに存在しません' },
    parsed: { raw: { roleName: '役A／役B（声）', castGroup: '架空の所属', note: 'Aは舞台上、Bは声のみ、という仕様確認用。実在公演の出演事実ではありません。' }, roleNames: ['役A', '役B'], annotations: [], unresolved: [], qualityFlags: [], needsReview: false },
    draft: { ...suggestCreditDraft(analyzeCastCredit()), roles: [{ name: '役A', media: ['stage'], context: 'primary' }, { name: '役B', media: ['voice'], context: 'additional' }], group: '架空の所属' },
  };
  const stats = {
    total: records.length, annotated: records.filter((r) => r.parsed.annotations.length).length,
    unresolved: records.filter((r) => r.parsed.unresolved.length).length,
    quality: records.filter((r) => r.parsed.qualityFlags.length).length,
    needsReview: records.filter((r) => r.parsed.needsReview).length,
  };
  const revision = createHash('sha256').update(JSON.stringify(records)).digest('hex').slice(0, 16);
  return { version: 1, revision, capturedAt, generatedAt: new Date().toISOString(), stats, featuredIds, appearanceLabels, records, synthetic };
}
