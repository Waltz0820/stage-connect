import { createHash } from 'node:crypto';
import { ACTOR_FACT_FIELDS } from './actor-research.mjs';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Callers rebuild research from the source, decisions and current actor snapshot.
// No actor insert is constructed from unchecked clipboard/profile text.
export function buildReviewedActorRegistration({ report, row, candidate, slugDecision }) {
  if (!row || report?.mode !== 'research_only' || !Array.isArray(report.rows) || report.rows.find((item) => item.sourceCreditKey === row.sourceCreditKey) !== row ||
    row.profileStatus !== 'profile_linked' || row.issues.some((issue) => issue !== 'existing_identity_candidates')) throw new Error('人物とプロフィールの接点を確認してから登録してください。');
  if (slugDecision?.sourceCreditKey !== row.sourceCreditKey || slugDecision.sourceActorName !== row.sourceActorName ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slugDecision.slug ?? '') || !String(slugDecision.reason ?? '').trim()) throw new Error('根拠を確認した登録用URLの判断が必要です。');
  if (!candidate?.id || !candidate.updated_at || candidate.source !== 'kira-hai' ||
    candidate.source_work_url !== row.sourceWorkUrl || candidate.source_credit_key !== row.sourceCreditKey ||
    candidate.source_actor_name !== row.sourceActorName || (candidate.source_actor_url ?? null) !== row.sourceActorUrl ||
    candidate.source_evidence?.source_fingerprint !== report.sourceFingerprint) throw new Error('候補と人物調査の出典が一致しません。再読み込みしてください。');
  const actor = { name: row.sourceActorName, slug: slugDecision.slug,
    ...Object.fromEntries(ACTOR_FACT_FIELDS.map((field) => [field, row.profileDraft[field] ?? null])) };
  const research = { version: 1, source_work_url: row.sourceWorkUrl, source_credit_key: row.sourceCreditKey,
    source_actor_name: row.sourceActorName, source_actor_url: row.sourceActorUrl,
    source_fingerprint: report.sourceFingerprint,
    // Another performer's research must not change this person's retry key.
    research_fingerprint: hash({ sourceCreditKey: row.sourceCreditKey, identity: row.identity,
      facts: row.facts, appearanceEvidence: row.appearanceEvidence, distinctActors: row.distinctActors ?? [] }),
    identity: row.identity, facts: row.facts, appearance_evidence: row.appearanceEvidence, distinct_actors: row.distinctActors ?? [],
    slug_decision: slugDecision };
  const requestKey = hash({ candidateId: candidate.id, actor, research });
  return { p_candidate_id: candidate.id, p_expected_updated_at: candidate.updated_at,
    p_request_key: requestKey, p_actor: actor, p_research: research };
}

export async function registerReviewedActor(supabase, input, { write = false } = {}) {
  const params = buildReviewedActorRegistration(input);
  if (!write) return { status: 'dry_run', params, writes: 0 };
  const { data, error } = await supabase.rpc('register_reviewed_work_actor', params);
  if (error) {
    if (error.code === 'PGRST202') throw Object.assign(new Error('人物確認付きの登録SQLが未適用です。別々の書込みには切り替えません。'), { code: 'ACTOR_REGISTRATION_UNAVAILABLE' });
    throw error;
  }
  if (!data?.actor?.id || data.candidate_id !== params.p_candidate_id || !data.updated_at || typeof data.actor_created !== 'boolean' || typeof data.already_registered !== 'boolean') throw new Error('人物登録の結果を確認できません。同じ内容で再確認してください。');
  return { status: 'registered', ...data, requestKey: params.p_request_key };
}
