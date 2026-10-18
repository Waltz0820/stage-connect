import { createHash } from 'node:crypto';
import { analyzeCastCredit, normalizeCreditText } from './cast-credit.mjs';
import { buildSourceLookup, resolveSourceActor, resolveSourcePlay, sourceNameKey, sourceTitleKey } from './source-match.mjs';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rawKey = (credit) => JSON.stringify([credit.sourceActorName, credit.role_name ?? null, credit.cast_group ?? null]);
const creditKey = (credit) => JSON.stringify([normalizeCreditText(credit.role_name), normalizeCreditText(credit.cast_group)]);
const reference = (row) => ({ id: row.id, name: row.name, slug: row.slug });
const textOnly = (text) => typeof text === 'string' && text.trim() && !/<\/?[a-z][^>]*>/iu.test(text);
const validEvidence = (evidence) => Array.isArray(evidence) && evidence.length > 0 && evidence.every((source) => {
  try { return new URL(source.url).protocol === 'https:' && textOnly(source.note) && Number.isFinite(Date.parse(source.checkedAt)); } catch { return false; }
});

// Explicit decisions remain separate from name normalization and display dictionaries.
// A verified alias never becomes a global string replacement for other people.
export function sourceCreditId(credit) { return hash(JSON.parse(rawKey(credit))).slice(0, 20); }

export const isEnsembleOnlyCredit = (credit) => !normalizeCreditText(credit.role_name) && /^(?:アンサンブル|バックダンサー|あんステダンサー)$/u.test(normalizeCreditText(credit.cast_group));

export function buildWorkImportPlan({ source, snapshot, review = {} }) {
  if (!Array.isArray(source?.cast) || !Array.isArray(source?.unparsed)) throw new Error('Expected a parsed work source.');
  if (!['actors', 'plays', 'casts'].every((table) => Array.isArray(snapshot?.[table]))) throw new Error('Expected complete actor/play/cast snapshots.');
  if (new URL(source.sourceUrl).protocol !== 'https:') throw new Error('Expected an HTTPS work source.');
  const blockers = [];
  const warnings = [];
  if (!source.cast.length || source.unparsed.length) blockers.push({ code: 'incomplete_source', lines: source.unparsed });
  const scopeAccepted = review.sourceUrl === source.sourceUrl && review.scope?.decision === 'include' && textOnly(review.scope?.reason) && validEvidence(review.scope?.evidence);
  if (!scopeAccepted) blockers.push({ code: 'scope_not_reviewed', message: '2.5次元作品かを根拠付きで判定してください。' });
  const playLookup = buildSourceLookup(snapshot.plays, ['title', 'title_en'], sourceTitleKey);
  const inferredYear = [...String(source.title).matchAll(/\b(?:19|20)\d{2}\b/gu)].map((m) => Number(m[0]));
  const playMatch = resolveSourcePlay(playLookup, { sourceWorkTitle: source.title, sourceYear: inferredYear.length === 1 ? inferredYear[0] : null });
  let play = playMatch.match;
  if (review.play) {
    const selected = snapshot.plays.find((row) => row.id === review.play.id);
    if (!selected || selected.slug !== review.play.slug || selected.updated_at !== review.play.expectedUpdatedAt || !validEvidence(review.play.evidence)) {
      blockers.push({ code: 'stale_or_unverified_play_decision' }); play = null;
    } else if (playMatch.candidates.length && !playMatch.candidates.some((row) => row.id === selected.id)) {
      blockers.push({ code: 'conflicting_play_identity' }); play = null;
    } else {
      const years = [...String(selected.period).matchAll(/(?:19|20)\d{2}/gu)].map((m) => Number(m[0]));
      if (inferredYear.length === 1 && years.length && !years.includes(inferredYear[0])) {
        blockers.push({ code: 'conflicting_play_year' }); play = null;
      } else play = selected;
    }
  }
  if (!play) blockers.push({ code: 'play_not_resolved', candidates: playMatch.candidates.map(({ id, title, slug }) => ({ id, title, slug })) });

  const actorLookup = buildSourceLookup(snapshot.actors, ['name', 'name_en', 'slug'], sourceNameKey);
  const decisions = review.actors ?? [];
  const sourceNames = new Set(source.cast.map((row) => row.sourceActorName));
  for (const decision of decisions) if (!sourceNames.has(decision.sourceActorName)) blockers.push({ code: 'orphan_actor_decision', name: decision.sourceActorName });
  const decisionByName = new Map();
  for (const decision of decisions) {
    if (decisionByName.has(decision.sourceActorName)) blockers.push({ code: 'duplicate_actor_decision', name: decision.sourceActorName });
    decisionByName.set(decision.sourceActorName, decision);
  }

  const seen = new Set();
  const usedCastIds = new Set();
  const rows = source.cast.map((credit, index) => {
    const issues = [];
    const id = sourceCreditId(credit);
    if (seen.has(id)) issues.push('duplicate_source_credit');
    seen.add(id);
    const analysis = analyzeCastCredit(credit);
    if (!textOnly(credit.sourceActorName) || analysis.qualityFlags.length) issues.push('invalid_or_markup_source');
    if (analysis.needsReview) issues.push('unresolved_credit_annotation');
    if (!normalizeCreditText(credit.role_name) && !normalizeCreditText(credit.cast_group)) issues.push('missing_role_and_group');
    const matched = resolveSourceActor(actorLookup, credit);
    // Ensemble-only credits belong on the work. Do not turn an unmatched
    // ensemble name into a task to create a thin individual profile.
    const creditOnly = isEnsembleOnlyCredit(credit);
    let actor = matched.match;
    let identity = actor ? 'exact_name' : matched.status;
    const decision = decisionByName.get(credit.sourceActorName);
    let newActor = null;
    if (decision) {
      if (!validEvidence(decision.evidence)) issues.push('missing_identity_evidence');
      else if (decision.action === 'link') {
        const selected = snapshot.actors.find((row) => row.id === decision.actorId);
        if (!selected || selected.name !== decision.expectedName || selected.updated_at !== decision.expectedUpdatedAt) issues.push('stale_actor_decision');
        else if (actor && actor.id !== selected.id) issues.push('conflicting_actor_decision');
        else { actor = selected; identity = 'reviewed_link'; }
      } else if (decision.action === 'new') {
        if (actor) issues.push('existing_actor_requires_review');
        else {
          const excluded = new Set(decision.excludeActorIds ?? []);
          if (matched.candidates.some((candidate) => !excluded.has(candidate.id))) issues.push('unresolved_actor_collision');
          if ([...excluded].some((excludedId) => !snapshot.actors.some((row) => row.id === excludedId))) issues.push('unknown_excluded_actor');
          identity = 'reviewed_new';
          newActor = { name: credit.sourceActorName, sourceActorUrl: credit.sourceActorUrl ?? null, evidence: decision.evidence,
            // Slug, reading and profile are deliberately not inferred from a name.
            requiredBeforeCreation: ['verified_identity', 'available_slug', 'english_display_check'] };
        }
      } else issues.push('unknown_identity_action');
    }
    if (!creditOnly && !actor && !newActor && !decision && matched.status === 'unmatched') {
      // An unmatched source name starts a research task, never an actor insert.
      newActor = { name: credit.sourceActorName, sourceActorUrl: credit.sourceActorUrl ?? null,
        evidence: [{ url: source.sourceUrl, note: '出演者名は作品のキャスト欄で確認。人物プロフィールは未確認。', checkedAt: source.checkedAt ?? null }],
        requiredBeforeCreation: ['verified_identity', 'available_slug', 'english_display_check'] };
      identity = 'new_actor_candidate';
    }
    if (creditOnly) newActor = null;
    if (!creditOnly && !actor && !newActor) issues.push('actor_identity_not_resolved');
    const sameActor = play && actor ? snapshot.casts.filter((row) => row.play_id === play.id && row.actor_id === actor.id) : [];
    const exact = sameActor.filter((row) => creditKey(row) === creditKey(credit));
    if (exact.length > 1) issues.push('multiple_existing_credits');
    // Preserve hand-entered conditions and notes; a loosely similar role is not
    // permission to create an unconditional duplicate or overwrite an old row.
    const comparableRoles = new Set(analysis.roleNames.map(normalizeCreditText));
    const conditioned = sameActor.filter((row) => creditKey(row) !== creditKey(credit) && (
      !normalizeCreditText(row.role_name) && !normalizeCreditText(credit.role_name) ||
      analyzeCastCredit(row).roleNames.some((role) => comparableRoles.has(normalizeCreditText(role)))
    ));
    if (!exact.length && conditioned.length) issues.push('existing_credit_has_different_conditions');
    if (exact.length === 1) usedCastIds.add(exact[0].id);
    if (creditOnly && !exact.length) issues.push('ensemble_belongs_in_play_credits');
    if (play?.credits && sourceNameKey(JSON.stringify(play.credits)).includes(sourceNameKey(credit.sourceActorName))) {
      warnings.push({ code: 'also_in_legacy_credits', rowId: id, name: credit.sourceActorName });
      if (!exact.length) issues.push('legacy_credit_requires_review');
    }
    const action = issues.length || !play || !scopeAccepted ? 'hold' : exact.length === 1 ? 'keep' : newActor ? 'prepare_actor' : 'add_cast';
    return { id, sourceOrder: index + 1, source: { ...credit }, analysis, identity, actor: actor ? reference(actor) : null,
      actorCandidates: matched.candidates.map(reference), newActor, action, issues,
      existingCast: exact.length === 1 ? { ...exact[0] } : null,
      storageRecommendation: creditOnly ? 'play_credits' : 'casts',
      // Source order is recorded for review, not asserted to be official billing.
      proposedCast: { play_id: play?.id ?? null, actor_id: actor?.id ?? null, role_name: credit.role_name ?? null, cast_group: credit.cast_group ?? null },
      evidence: [{ url: source.sourceUrl, note: '作品ページのキャスト欄' }, ...(decision?.evidence ?? [])] };
  });
  const sourceOccurrences = new Map();
  for (const row of rows) sourceOccurrences.set(row.id, [...(sourceOccurrences.get(row.id) ?? []), row]);
  for (const duplicates of sourceOccurrences.values()) if (duplicates.length > 1) for (const row of duplicates) {
    if (!row.issues.includes('duplicate_source_credit')) row.issues.push('duplicate_source_credit');
    row.action = 'hold';
  }
  const proposed = new Map();
  for (const row of rows.filter((item) => item.actor && ['keep', 'add_cast'].includes(item.action))) {
    const key = JSON.stringify([row.actor.id, creditKey(row.source)]);
    if (proposed.has(key)) {
      const previous = proposed.get(key);
      for (const duplicate of [previous, row]) {
        if (!duplicate.issues.includes('duplicate_target_credit')) duplicate.issues.push('duplicate_target_credit');
        duplicate.action = 'hold';
      }
    }
    proposed.set(key, row);
  }
  if (blockers.length) for (const row of rows) row.action = 'hold';
  const counts = Object.fromEntries(['keep', 'add_cast', 'prepare_actor', 'hold'].map((action) => [action, rows.filter((row) => row.action === action).length]));
  const existingNotInSource = play ? snapshot.casts.filter((row) => row.play_id === play.id && !usedCastIds.has(row.id)).map((row) => ({ ...row })) : [];
  if (existingNotInSource.length) warnings.push({ code: 'existing_credits_not_represented', count: existingNotInSource.length });
  const plan = { version: 1, mode: 'review_only', executionSupported: false,
    source: { url: source.sourceUrl, title: source.title, checkedAt: source.checkedAt ?? null, scheduleLines: source.scheduleLines ?? [], fingerprint: hash(source) },
    snapshotFingerprint: hash({ actors: snapshot.actors, plays: snapshot.plays, casts: snapshot.casts }),
    reviewFingerprint: hash(review), scope: review.scope ?? null,
    play: play ? { id: play.id, title: play.title, slug: play.slug, expectedUpdatedAt: play.updated_at, period: play.period, credits: play.credits } : null,
    blockers, warnings, rows, counts, existingNotInSource,
    completeForExistingActors: blockers.length === 0 && counts.hold === 0 && counts.prepare_actor === 0,
    writes: 0 };
  return plan;
}

export function renderWorkImportReport(plan) {
  const escape = (value) => String(value ?? '—').replaceAll('|', '\\|').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replace(/[\r\n]/gu, ' ');
  const labels = { keep: '既存を維持', add_cast: '配役追加案', prepare_actor: '新規俳優の準備', hold: '保留' };
  const preparationLabel = (key) => ({ verified_identity: '人物確認', available_slug: 'URL確定', english_display_check: '英語表示確認' })[key] ?? key;
  const notes = plan.rows.flatMap((row) => row.evidence.slice(1).map((item) => `- **${escape(row.source.sourceActorName)}**：${escape(item.note)} [出典](${item.url})`));
  return `# 作品単位の登録準備\n\n${escape(plan.source.title)}\n\n出典：${plan.source.url}\n\n既存維持 ${plan.counts.keep} / 配役追加案 ${plan.counts.add_cast} / 新規俳優準備 ${plan.counts.prepare_actor} / 保留 ${plan.counts.hold}\n\n登録実行なし。本番への書込みは0件。新規俳優には人物確認とURL・英語表示の確認が別途必要。\n\n## 配役\n\n| 元の名前 | 役名 | 区分 | 判断 | 既存俳優 | 確認事項 |\n| --- | --- | --- | --- | --- | --- |\n${plan.rows.map((row) => `| ${[row.source.sourceActorName, row.source.role_name, row.source.cast_group, labels[row.action], row.actor?.name, row.issues.join(', ') || row.newActor?.requiredBeforeCreation.map(preparationLabel).join('・') || '—'].map(escape).join(' | ')} |`).join('\n')}\n\n## 日程原文\n\n${plan.source.scheduleLines.map((line) => `- ${escape(line)}`).join('\n')}\n\n## 個別の照合根拠\n\n${notes.join('\n') || '個別の判断はまだありません。'}\n\n## 作品全体の停止条件\n\n${plan.blockers.length ? plan.blockers.map((item) => `- ${item.code}`).join('\n') : 'なし。個々の行と新規俳優の確認事項は上表に記載。'}\n\n既存データの削除・役名修正・掲載順の上書きは提案しない。出典上の並び順と公式の掲載順位は区別する。\n`;
}
