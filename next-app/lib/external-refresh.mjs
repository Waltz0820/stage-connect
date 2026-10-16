// Refresh source facts without erasing review decisions or a concurrent edit.
const fields = {
  external_actors: ['source_actor_name', 'source_profile_facts_raw', 'source_actor_kana', 'source_birthday_raw', 'source_birthday', 'source_height_cm', 'source_blood_type', 'source_affiliation_raw'],
  external_plays: ['source_work_title_raw', 'source_work_title_normalized', 'source_year', 'event_note', 'source_schedule_raw', 'source_venue_raw', 'source_period_text', 'source_venue_text', 'source_schedule_items'],
  external_cast_candidates: ['external_actor_id', 'external_play_id', 'source_actor_name', 'source_work_url', 'source_role_names'],
};
const guards = {
  external_actors: ['updated_at', 'match_status', 'matched_actor_id', 'match_confidence', 'alias_from', 'alias_to', 'note'],
  external_plays: ['updated_at', 'match_status', 'matched_play_id', 'skeleton_play_id', 'match_confidence'],
  external_cast_candidates: ['updated_at', 'status', 'matched_actor_id', 'matched_play_id', 'accepted_cast_id', 'confidence'],
};
const hasValue = (value) => value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);

export function buildRefreshPatch(table, before, incoming) {
  if (!fields[table]) throw new Error(`Unsupported source table: ${table}`);
  const patch = { scraped_at: incoming.scraped_at, updated_at: incoming.updated_at };
  // Completed or explicitly deferred/rejected candidates are not reinterpreted.
  if (table === 'external_cast_candidates' && (before.status !== 'pending' || before.accepted_cast_id)) return patch;
  for (const field of fields[table]) {
    if (Object.hasOwn(incoming, field) && hasValue(incoming[field])) patch[field] = incoming[field];
  }
  if (table === 'external_actors') {
    for (const field of ['alias_from', 'alias_to', 'note']) {
      if (!hasValue(before[field]) && hasValue(incoming[field])) patch[field] = incoming[field];
    }
    if (before.match_status === 'unmatched' && !before.matched_actor_id && !before.match_confidence && incoming.matched_actor_id) {
      patch.matched_actor_id = incoming.matched_actor_id;
      patch.match_status = 'matched';
      patch.match_confidence = incoming.match_confidence;
    }
  } else if (table === 'external_plays') {
    if (before.match_status === 'unmatched' && !before.matched_play_id && !before.skeleton_play_id && !before.match_confidence && incoming.matched_play_id) {
      patch.matched_play_id = incoming.matched_play_id;
      patch.match_status = 'matched';
      patch.match_confidence = incoming.match_confidence;
    }
  } else {
    for (const field of ['matched_actor_id', 'matched_play_id']) {
      if (!before[field] && incoming[field]) patch[field] = incoming[field];
    }
    // Confidence from a conflicting proposal cannot describe retained manual IDs.
    if (!before.matched_actor_id && !before.matched_play_id) patch.confidence = incoming.confidence;
  }
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

function filterIdentity(query, identity) {
  for (const [field, value] of Object.entries(identity)) query = value == null ? query.is(field, null) : query.eq(field, value);
  return query;
}

export async function refreshExternalRow(supabase, table, incoming, identity, { attempts = 3 } = {}) {
  if (!fields[table]) throw new Error(`Unsupported source table: ${table}`);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const found = await filterIdentity(supabase.from(table).select('*'), identity).maybeSingle();
    if (found.error) throw found.error;
    const before = found.data;
    // Work-source credits carry their own immutable source identity/group.
    // The older actor-page importer must not reinterpret those source facts.
    if (table === 'external_cast_candidates' && (before?.source_credit_key || before?.source_cast_group)) return before;
    if (!before) {
      const created = await supabase.from(table).insert(incoming).select('*').single();
      if (created.error?.code === '23505') continue; // Another importer won; re-read its row.
      if (created.error) throw created.error;
      return created.data;
    }
    const patch = buildRefreshPatch(table, before, incoming);
    let update = supabase.from(table).update(patch).eq('id', before.id);
    update = filterIdentity(update, Object.fromEntries(guards[table].map((field) => [field, before[field] ?? null])));
    const refreshed = await update.select('*').maybeSingle();
    if (refreshed.error) throw refreshed.error;
    if (refreshed.data) return refreshed.data;
    // A review changed after the read. Rebuild the patch against the latest decision.
  }
  throw new Error(`Concurrent review prevented ${table} refresh; no stale decision was written.`);
}
