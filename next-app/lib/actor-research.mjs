import { createHash } from 'node:crypto';
import { sourceCreditId } from './work-import-plan.mjs';
import { sourceNameKey } from './source-match.mjs';

export const ACTOR_FACT_FIELDS = ['kana', 'name_en', 'birthday', 'height_cm', 'blood_type', 'gender'];
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain = (value) => typeof value === 'string' && value.trim() && !/<\/?[a-z][^>]*>/iu.test(value);
const https = (value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const evidenceOK = (items) => Array.isArray(items) && items.length > 0 && items.every((item) =>
  https(item.url) && plain(item.note) && Number.isFinite(Date.parse(item.checkedAt)));
function validFact(field, value) {
  if (field === 'birthday') {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }
  if (field === 'height_cm') return Number.isInteger(value) && value > 0 && value < 300;
  if (field === 'blood_type') return ['A', 'B', 'O', 'AB'].includes(value);
  if (field === 'gender') return ['male', 'female', 'other'].includes(value);
  return plain(value);
}

// Research records describe one source occurrence, not everyone with the same name.
// Field evidence and a reviewed connection to this performer are both required.
// This module has no database client and never creates an actor.
export function buildActorResearch({ plan, actors, research = {} }) {
  if (plan?.version !== 1 || !Array.isArray(plan.rows) || !Array.isArray(actors)) throw new Error('作品準備案と俳優スナップショットが必要です。');
  if (research.version !== 1 || research.sourceUrl !== plan.source.url || research.sourceFingerprint !== plan.source.fingerprint) throw new Error('人物調査と作品原文が一致しません。調査対象を再確認してください。');
  if (!Array.isArray(research.actors)) throw new Error('人物調査の配列が必要です。');
  const targets = plan.rows.filter((row) => row.newActor);
  const records = new Map();
  for (const record of research.actors) {
    const row = targets.find((item) => item.id === record.sourceCreditKey);
    if (!row || row.id !== sourceCreditId(row.source) || row.source.sourceActorName !== record.sourceActorName) throw new Error('人物調査の名前・配役キーが一致しません。');
    if (records.has(row.id)) throw new Error('同じ配役の人物調査が重複しています。');
    records.set(row.id, record);
  }
  const rows = targets.map((row) => {
    const record = records.get(row.id);
    const issues = [];
    const identity = record?.identity ?? { status: 'appearance_only', evidence: [] };
    if (!['appearance_only', 'profile_linked'].includes(identity.status)) issues.push('invalid_identity_status');
    const profileLinked = identity.status === 'profile_linked' && https(identity.profileUrl) && evidenceOK(identity.evidence);
    if (identity.status === 'profile_linked' && !profileLinked) issues.push('unverified_profile_connection');
    const draft = Object.fromEntries(ACTOR_FACT_FIELDS.map((field) => [field, null]));
    draft.name = row.source.sourceActorName;
    // URLs and English spellings are never guessed from a Japanese name.
    draft.slug = null;
    const facts = {};
    for (const [field, claim] of Object.entries(record?.facts ?? {})) {
      if (!ACTOR_FACT_FIELDS.includes(field)) { issues.push(`unsupported_field:${field}`); continue; }
      facts[field] = structuredClone(claim);
      if (!['confirmed', 'unconfirmed', 'conflicting'].includes(claim.status)) { issues.push(`invalid_fact_status:${field}`); continue; }
      if (claim.status !== 'confirmed') continue;
      if (!profileLinked) { issues.push(`unlinked_profile_fact:${field}`); continue; }
      if (!validFact(field, claim.value) || !evidenceOK(claim.evidence)) { issues.push(`unverified_fact:${field}`); continue; }
      draft[field] = claim.value;
    }
    const collisions = actors.filter((actor) => sourceNameKey(actor.name) === sourceNameKey(draft.name) ||
      draft.kana && sourceNameKey(actor.kana) === sourceNameKey(draft.kana)).map((actor) => ({
      id: actor.id, name: actor.name, slug: actor.slug, birthday: actor.birthday ?? null,
      birthdayConflict: Boolean(draft.birthday && actor.birthday && draft.birthday !== actor.birthday),
    }));
    const distinctActors = structuredClone(record?.distinctActors ?? []);
    const reviewedDistinctIds = new Set();
    for (const distinction of distinctActors) {
      const current = actors.find((actor) => actor.id === distinction.actorId);
      if (!current || current.name !== distinction.expectedName || current.birthday !== distinction.expectedBirthday ||
        current.updated_at !== distinction.expectedUpdatedAt || !draft.birthday || !current.birthday || draft.birthday === current.birthday ||
        !evidenceOK(distinction.evidence)) issues.push('stale_or_unverified_distinct_actor');
      else reviewedDistinctIds.add(current.id);
    }
    if (collisions.some((actor) => !reviewedDistinctIds.has(actor.id))) issues.push('existing_identity_candidates');
    return { sourceCreditKey: row.id, sourceActorName: draft.name, sourceWorkUrl: plan.source.url,
      sourceActorUrl: row.source.sourceActorUrl ?? null, role: row.source.role_name ?? null, group: row.source.cast_group ?? null,
      appearanceEvidence: structuredClone(row.newActor.evidence), identity: structuredClone(identity),
      profileStatus: profileLinked ? 'profile_linked' : 'appearance_only', facts, profileDraft: draft,
      unknownFields: ACTOR_FACT_FIELDS.filter((field) => draft[field] === null), collisions, distinctActors, issues,
      // Search failures mean "not found in this attempt", never "does not exist".
      searchHistory: structuredClone(record?.searchHistory ?? []),
      notes: [...record?.notes ?? [], ...distinctActors.flatMap((item) => item.evidence.map((source) => `別人判断（${item.expectedName}）：${source.note} ${source.url}`))],
      creationReady: false };
  });
  return { version: 1, mode: 'research_only', sourceUrl: plan.source.url, sourceFingerprint: plan.source.fingerprint,
    researchFingerprint: fingerprint(research), actorSnapshotFingerprint: fingerprint(actors), rows,
    counts: { total: rows.length, profileLinked: rows.filter((row) => row.profileStatus === 'profile_linked').length,
      appearanceOnly: rows.filter((row) => row.profileStatus === 'appearance_only').length,
      confirmedFacts: rows.reduce((count, row) => count + ACTOR_FACT_FIELDS.filter((field) => row.profileDraft[field] !== null).length, 0),
      needsReview: rows.filter((row) => row.issues.length).length }, writes: 0 };
}

export function renderActorResearch(report) {
  const esc = (value) => String(value ?? '未確認').replaceAll('|', '\\|').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replace(/[\r\n]/gu, ' ');
  return `# 俳優の人物調査\n\n作品出典：${report.sourceUrl}\n\n${report.counts.total}名 / プロフィールとの接点確認 ${report.counts.profileLinked}名 / 出演記録のみ ${report.counts.appearanceOnly}名 / 根拠付き項目 ${report.counts.confirmedFacts}件\n\n登録実行なし。氏名・読み・生年月日・性別を推測で埋めない。未確認のプロフィールは出演記録と分けて残す。URLと英語表記の未確定は人物の不在を意味しない。\n\n${report.rows.map((row) => `## ${esc(row.sourceActorName)}\n\n${row.profileStatus === 'profile_linked' ? '出演者とプロフィールの接点を確認。' : '作品内の出演記録を保持。プロフィールとの接点は未確認。'}\n\n役名：${esc(row.role)} / 区分：${esc(row.group)}\n\n| 項目 | 確認済みの値 |\n| --- | --- |\n${ACTOR_FACT_FIELDS.map((field) => `| ${field} | ${esc(row.profileDraft[field])} |`).join('\n')}\n\n${[...row.identity.evidence ?? [], ...Object.values(row.facts).flatMap((fact) => fact.evidence ?? [])].filter((item, index, all) => all.findIndex((other) => other.url === item.url && other.note === item.note) === index).map((item) => `- ${esc(item.note)} [出典](${item.url})`).join('\n')}\n${row.notes.map((note) => `- ${esc(note)}`).join('\n')}\n${row.issues.length ? `確認事項：${row.issues.map(esc).join(', ')}\n` : ''}\n調査記録：${row.searchHistory.map((item) => esc(item.query)).join(' / ') || '未着手'}\n`).join('\n')}\n本番への書込み0件。出典URLのある人でも同名だけで別公演・別人物へ再利用しない。登録用URLの確定、重複確認、既存候補への紐付けは次工程。\n`;
}
