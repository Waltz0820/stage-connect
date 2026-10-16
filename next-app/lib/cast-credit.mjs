// Read-only interpretation of legacy free-text credits. Never a DB rewrite.
// Unknown annotations may be additional roles: retain them and require review.
export const normalizeCreditText = (value) => String(value ?? '').normalize('NFKC').replace(/\s+/gu, ' ').trim();
const unique = (items) => [...new Set(items)];
const containsMarkup = (value) => /<\/?[a-z][^>]*>/iu.test(String(value ?? ''));

const appearanceLabels = new Map([
  ['声', 'voice'], ['声のみ', 'voice'], ['声の出演', 'voice'], ['声の出演のみ', 'voice'], ['音声出演', 'voice'],
  ['映像出演', 'video'], ['映像のみ', 'video'],
  ['ゲスト', 'guest'], ['ゲスト出演', 'guest'],
  ['日替わりゲスト', 'rotating_guest'], ['日替りゲスト', 'rotating_guest'],
  ['日替わり出演', 'rotating_cast'], ['回替わりゲスト', 'rotating_guest'],
  ['会場替わり出演', 'venue_rotation'], ['会場替り出演', 'venue_rotation'],
  ['サポートキャスト', 'support'], ['サポート', 'support'],
  ['特別出演', 'special_appearance'], ['友情出演', 'special_guest'],
  ['特別協力', 'special_cooperation'], ['Wキャスト', 'double_cast'], ['ダブルキャスト', 'double_cast'],
  ['トリプルキャスト', 'triple_cast'], ['千秋楽出演', 'final_performance'],
]);
const locationNames = '北海道 青森 岩手 宮城 秋田 山形 福島 茨城 栃木 群馬 埼玉 千葉 東京 神奈川 新潟 富山 石川 福井 山梨 長野 岐阜 静岡 愛知 三重 滋賀 京都 大阪 兵庫 奈良 和歌山 鳥取 島根 岡山 広島 山口 徳島 香川 愛媛 高知 福岡 佐賀 長崎 熊本 大分 宮崎 鹿児島 沖縄 仙台 名古屋 金沢 盛岡 神戸 北九州 東京凱旋 日本凱旋 上海 バンコク マカオ 香港 台湾 ソウル'.split(' ');
const locationSet = new Set(locationNames);

function classify(text) {
  const compact = normalizeCreditText(text).replace(/\s+/gu, '');
  if (appearanceLabels.has(compact)) return { kind: 'appearance', value: appearanceLabels.get(compact) };
  if (/^[ABＣC]$/u.test(compact)) return { kind: 'team', value: compact.toUpperCase() };
  if (/^(?:初代|[1-9]\d*代目)$/u.test(compact)) return { kind: 'generation', value: compact === '初代' ? 1 : Number.parseInt(compact, 10) };
  const locations = compact.replace(/(?:の)?公演(?:のみ|に)?(?:出演)?$/u, '').split(/[・、,／/]/u);
  if (locations.length && locations.every((part) => locationSet.has(part))) return { kind: 'locations', value: locations };
  // Store date wording, without inferring a year or exact performance.
  if (/^(?:\d{1,2}月\d{1,2}日|\d{1,2}月から)/u.test(compact)) return { kind: 'schedule', value: normalizeCreditText(text) };
  return { kind: 'unresolved', value: normalizeCreditText(text) };
}

function parts(value, field) {
  const normalized = normalizeCreditText(value);
  if (containsMarkup(value)) return { base: '', notes: [] };
  const notes = [];
  // Parentheses are annotations only when the contained meaning is known.
  const marked = normalized.replace(/\(([^()]*)\)/gu, (whole, text) => {
    if (classify(text).kind === 'unresolved') return whole;
    notes.push({ field, text: normalizeCreditText(text), ...classify(text) });
    return '';
  });
  const markerIndex = marked.search(/[※【]/u);
  const base = (markerIndex === -1 ? marked : marked.slice(0, markerIndex)).trim();
  if (markerIndex !== -1) {
    for (const text of marked.slice(markerIndex).split(/[※【】]/u).map(normalizeCreditText).filter(Boolean)) {
      notes.push({ field, text, ...classify(text) });
    }
  }
  return { base, notes };
}

export function analyzeCastCredit(input = {}) {
  const raw = {
    roleName: input.roleName ?? input.role_name ?? null,
    castGroup: input.castGroup ?? input.cast_group ?? null,
    note: input.note ?? null,
  };
  const role = parts(raw.roleName, 'role');
  const group = parts(raw.castGroup, 'group');
  const annotations = [...role.notes, ...group.notes];
  let groupName = group.base || null;
  const baseGroupMeaning = classify(group.base);
  if (groupName && ['locations', 'appearance'].includes(baseGroupMeaning.kind)) {
    annotations.push({ field: 'group', text: group.base, ...baseGroupMeaning });
    groupName = null;
  }
  const unresolved = annotations.filter((item) => item.kind === 'unresolved');
  const qualityFlags = ['roleName', 'castGroup'].filter((field) => containsMarkup(raw[field])).map((field) => ({ field, code: 'embedded_markup' }));
  const roleNames = unique(role.base.split(/[／/]/u).map(normalizeCreditText).filter(Boolean));
  // Japanese middle dots, commas and unknown parentheses may be part of a name.
  // No character-name guessing or automatic splitting on those separators.
  return {
    raw,
    roleNames,
    groupName,
    appearances: unique(annotations.filter((a) => a.kind === 'appearance').map((a) => a.value)),
    teams: unique(annotations.filter((a) => a.kind === 'team').map((a) => a.value)),
    generations: unique(annotations.filter((a) => a.kind === 'generation').map((a) => a.value)),
    locations: unique(annotations.filter((a) => a.kind === 'locations').flatMap((a) => a.value)),
    scheduleNotes: unique(annotations.filter((a) => a.kind === 'schedule').map((a) => a.value)),
    annotations,
    unresolved,
    qualityFlags,
    needsReview: unresolved.length > 0 || qualityFlags.length > 0,
  };
}

// Conservative identity for comparing presentations, never for merging rows.
export function castCreditKey(input) {
  const credit = analyzeCastCredit(input);
  const compact = (text) => normalizeCreditText(text).replace(/\s+/gu, '');
  return JSON.stringify({
    roles: credit.roleNames.map(compact).sort(),
    group: compact(credit.groupName),
    appearances: [...credit.appearances].sort(),
    teams: [...credit.teams].sort(),
    generations: [...credit.generations].sort(),
    locations: [...credit.locations].sort(),
    schedule: credit.scheduleNotes.map(compact).sort(),
    unresolved: credit.unresolved.map(({ field, text }) => [field, compact(text)]).sort(),
    note: compact(credit.raw.note),
    quality: credit.qualityFlags.length ? credit.raw : undefined,
  });
}
