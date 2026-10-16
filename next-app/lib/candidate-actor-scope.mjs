const actorUrl = (row) => row.source_actor_url ?? row.sourceActorUrl ?? null;
const candidateId = (row) => row.candidateId ?? row.id ?? null;

export function actorQueueKey(row) {
  const url = actorUrl(row);
  if (url) return url;
  const id = candidateId(row);
  if (!id) throw new Error('俳優ページのない候補には配役候補IDが必要です。');
  return `candidate:${id}`;
}

export function filterCandidateActor(query, row) {
  const url = actorUrl(row);
  if (url) return query.eq('source_actor_url', url);
  const id = candidateId(row);
  if (!id) throw new Error('配役候補を再読み込みしてください。');
  return query.eq('id', id);
}

export function sameCandidateActor(left, right) { return actorQueueKey(left) === actorQueueKey(right); }

// A missing actor page does not prove that equal names are the same person.
// Keep those entries scoped to a candidate until an explicit match is made.
export function buildCandidateActorQueue(candidates, factsByUrl = new Map()) {
  const groups = new Map();
  for (const row of candidates) {
    if (row.matched_actor_id || row.accepted_cast_id || !['pending', 'needs_review'].includes(row.status)) continue;
    const key = actorQueueKey(row);
    const facts = row.source_actor_url ? factsByUrl.get(row.source_actor_url) ?? {} : {};
    const queue = groups.get(key) ?? {
      candidateId: row.id, sourceActorName: row.source_actor_name, sourceActorUrl: row.source_actor_url ?? null,
      sourceWorkUrl: row.source_work_url ?? null, sourceActorKana: facts.source_actor_kana,
      aliasFrom: facts.alias_from, aliasTo: facts.alias_to, note: facts.note,
      sourceProfileFactsRaw: facts.source_profile_facts_raw, sourceBirthdayRaw: facts.source_birthday_raw,
      sourceBirthday: facts.source_birthday, sourceHeightCm: facts.source_height_cm,
      sourceBloodType: facts.source_blood_type, sourceAffiliationRaw: facts.source_affiliation_raw,
      candidateCount: 0, matchedPlayCount: 0, latestYear: null,
    };
    queue.candidateCount += 1;
    if (row.matched_play_id) queue.matchedPlayCount += 1;
    if (row.source_year && (!queue.latestYear || row.source_year > queue.latestYear)) queue.latestYear = row.source_year;
    groups.set(key, queue);
  }
  return [...groups.values()];
}
