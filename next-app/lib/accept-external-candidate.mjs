// A missing RPC is the only compatibility fallback. Real RPC failures must stop.
export async function tryAtomicCandidateAccept(supabase, row, roleName) {
  const isWorkCredit = Boolean(row.source_credit_key || String(row.source_cast_group ?? '').trim());
  const rpc = isWorkCredit ? 'accept_external_work_cast_candidate' : 'accept_external_cast_candidate';
  const params = {
    p_candidate_id: row.id, p_expected_actor_id: row.matched_actor_id,
    p_expected_play_id: row.matched_play_id, p_role_name: roleName,
  };
  if (isWorkCredit) {
    params.p_expected_group = String(row.source_cast_group ?? '').trim() || null;
    params.p_expected_updated_at = row.updated_at;
    if (!row.updated_at) throw new Error('候補の更新日時を確認できません。再読み込みしてください。');
  }
  const { data, error } = await supabase.rpc(rpc, params);
  if (error) {
    if (error.code === 'PGRST202' && String(error.message).includes(rpc)) {
      if (isWorkCredit) throw new Error('作品単位の採用SQLが未適用です。出演区分を保持するため、採用を停止しました。');
      return null;
    }
    const messages = {
      candidate_match_changed_refresh_required: '照合先が更新されています。候補を再読み込みして確認してください。',
      candidate_credit_changed_refresh_required: '配役の区分や取得内容が更新されています。候補を再読み込みしてください。',
      work_candidate_requires_v2_accept: '出演区分に対応した画面から採用してください。画面を再読み込みしてください。',
      missing_role_and_group: '役名または出演区分を確認してから採用してください。',
      candidate_not_pending_review_required: '保留・無視の候補は、確認後に「未処理」へ戻してから採用してください。',
      accepted_candidate_requires_explicit_correction: '採用済みの配役と内容が異なります。既存の配役を確認してください。',
      existing_cast_has_conditions_review_required: '同じ役に公演地・チームなどの情報が登録されています。既存配役を確認してください。',
      role_contains_markup_review_required: '役名にHTMLが混入しています。原文を確認して役名を修正してください。',
      candidate_not_found_or_not_authorized: '候補が見つからないか、操作する権限がありません。',
      cast_conflict_review_required: '既存配役との競合があるため、内容を確認してください。',
    };
    const key = Object.keys(messages).find((value) => String(error.message).includes(value));
    if (key) throw new Error(messages[key], { cause: error });
    throw error;
  }
  const result = data?.[0];
  if (!result?.accepted_cast_id) throw new Error('採用結果を確認できません。候補を再読み込みしてください。');
  return result;
}

export async function acceptCandidateWithHistory(supabase, expected, roleName) {
  const role = String(roleName ?? '').trim() || null;
  if (/<\/?[a-z][^>]*>/iu.test(role ?? '')) throw new Error('役名にHTMLが混入しています。原文を確認して役名を修正してください。');
  const atomic = await tryAtomicCandidateAccept(supabase, expected, role);
  if (atomic) return { ...atomic, atomic: true, history_saved: true };

  // Compatibility path for a DB that has not received the RPC migration yet.
  // These requests are NOT transactional; failures must never be reported as a full success.
  const { data: row, error: readError } = await supabase.from('external_cast_candidates').select('*').eq('id', expected.id).maybeSingle();
  if (readError) throw readError;
  if (!row || !row.matched_actor_id || !row.matched_play_id || row.matched_actor_id !== expected.matched_actor_id || row.matched_play_id !== expected.matched_play_id) {
    throw new Error('照合先が更新されています。候補を再読み込みして確認してください。');
  }
  if (row.source_credit_key || String(row.source_cast_group ?? '').trim()) throw new Error('作品単位の採用SQLが未適用です。出演区分を保持するため、採用を停止しました。');
  if (row.status === 'accepted' || row.accepted_cast_id) {
    const { data: cast, error } = await supabase.from('casts').select('*').eq('id', row.accepted_cast_id).maybeSingle();
    if (error) throw error;
    if (row.status !== 'accepted' || !cast || cast.actor_id !== row.matched_actor_id || cast.play_id !== row.matched_play_id || (cast.role_name ?? '') !== (role ?? '')) {
      throw new Error('採用済みの配役と内容が異なります。既存の配役を確認してください。');
    }
    return { accepted_cast_id: cast.id, cast_created: false, already_accepted: true, atomic: false, history_saved: null };
  }
  if (row.status !== 'pending') throw new Error('保留・無視の候補は、確認後に「未処理」へ戻してから採用してください。');
  const findExisting = async () => {
    let query = supabase.from('casts').select('id,cast_group').eq('actor_id', row.matched_actor_id).eq('play_id', row.matched_play_id);
    query = role ? query.eq('role_name', role) : query.is('role_name', null);
    const { data: rows, error } = await query;
    if (error) throw error;
    const match = rows?.find((cast) => !(cast.cast_group ?? '').trim());
    if (!match && rows?.length) throw new Error('同じ役に公演地・チームなどの情報が登録されています。既存配役を確認してください。');
    return match;
  };
  let cast = await findExisting();
  let created = false;
  if (!cast) {
    const result = await supabase.from('casts').insert({ actor_id: row.matched_actor_id, play_id: row.matched_play_id, role_name: role, cast_group: null }).select('id').single();
    if (result.error?.code === '23505') cast = await findExisting();
    else if (result.error) throw result.error;
    else { cast = result.data; created = true; }
    if (!cast) throw new Error('既存配役との競合があるため、内容を確認してください。');
  }
  const now = new Date().toISOString();
  const { data: changed, error: updateError } = await supabase.from('external_cast_candidates')
    .update({ status: 'accepted', accepted_cast_id: cast.id, accepted_at: now, updated_at: now })
    .eq('id', row.id).eq('status', 'pending').eq('matched_actor_id', row.matched_actor_id)
    .eq('matched_play_id', row.matched_play_id).is('accepted_cast_id', null).select('id').maybeSingle();
  if (updateError) throw new Error('配役の保存後に採用状態の更新に失敗しました。再読み込みして確認してください。', { cause: updateError });
  if (!changed) throw new Error('候補が更新されています。配役と採用状態を再読み込みして確認してください。');
  const { error: logError } = await supabase.from('external_import_logs').insert({
    source: row.source, action: created ? 'create_cast' : 'mark_existing_cast_accepted', target_type: 'cast', target_id: cast.id,
    target_label: `${row.source_work_title} / ${row.source_actor_name} / ${role || '-'}`, source_url: row.source_work_url || row.source_actor_url,
    details: { candidate_id: row.id, source_role_raw: row.source_role_raw, accepted_role_name: role,
      role_edited: role !== (String(row.source_role_raw ?? '').trim() || null), matched_actor_id: row.matched_actor_id, matched_play_id: row.matched_play_id, atomic_accept: false },
  });
  return { accepted_cast_id: cast.id, cast_created: created, already_accepted: false, atomic: false, history_saved: !logError };
}
