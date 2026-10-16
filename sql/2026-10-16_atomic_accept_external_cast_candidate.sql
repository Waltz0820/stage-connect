-- Apply after the external-candidate, multi-role-cast and import-log migrations.
-- Runs with the caller's grants/RLS; does not grant access to the underlying tables.
begin;

create or replace function public.accept_external_cast_candidate(
  p_candidate_id uuid,
  p_expected_actor_id uuid,
  p_expected_play_id uuid,
  p_role_name text
)
returns table (accepted_cast_id uuid, cast_created boolean, already_accepted boolean)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_candidate public.external_cast_candidates%rowtype;
  v_cast public.casts%rowtype;
  v_cast_id uuid;
  v_created boolean := false;
  v_role text := nullif(btrim(p_role_name), '');
begin
  select c.* into v_candidate
  from public.external_cast_candidates c where c.id = p_candidate_id for update;
  if not found then raise exception 'candidate_not_found_or_not_authorized'; end if;
  if p_expected_actor_id is null or p_expected_play_id is null
    or v_candidate.matched_actor_id is distinct from p_expected_actor_id
    or v_candidate.matched_play_id is distinct from p_expected_play_id then
    raise exception 'candidate_match_changed_refresh_required';
  end if;
  if v_role ~* '<[/]?[a-z][^>]*>' then raise exception 'role_contains_markup_review_required'; end if;

  if v_candidate.status = 'accepted' or v_candidate.accepted_cast_id is not null then
    select c.* into v_cast from public.casts c where c.id = v_candidate.accepted_cast_id;
    if not found or v_candidate.status <> 'accepted'
      or v_cast.actor_id is distinct from p_expected_actor_id
      or v_cast.play_id is distinct from p_expected_play_id
      or coalesce(v_cast.role_name, '') <> coalesce(v_role, '') then
      raise exception 'accepted_candidate_requires_explicit_correction';
    end if;
    return query select v_cast.id, false, true;
    return;
  end if;
  if v_candidate.status <> 'pending' then raise exception 'candidate_not_pending_review_required'; end if;

  -- Serialize adoption of different source candidates for this actor/play pair.
  perform pg_advisory_xact_lock(hashtextextended(p_expected_actor_id::text || ':' || p_expected_play_id::text, 0));
  select c.id into v_cast_id from public.casts c
    where c.actor_id = p_expected_actor_id and c.play_id = p_expected_play_id
      and coalesce(c.role_name, '') = coalesce(v_role, '') and coalesce(c.cast_group, '') = '';
  if v_cast_id is null then
    -- An existing guest/team credit must not gain a second, unconditional credit.
    if exists (select 1 from public.casts c
      where c.actor_id = p_expected_actor_id and c.play_id = p_expected_play_id
        and coalesce(c.role_name, '') = coalesce(v_role, '') and coalesce(c.cast_group, '') <> '') then
      raise exception 'existing_cast_has_conditions_review_required';
    end if;
    insert into public.casts(actor_id, play_id, role_name, cast_group)
      values(p_expected_actor_id, p_expected_play_id, v_role, null)
      on conflict do nothing returning id into v_cast_id;
    v_created := v_cast_id is not null;
    if v_cast_id is null then
      select c.id into v_cast_id from public.casts c
        where c.actor_id = p_expected_actor_id and c.play_id = p_expected_play_id
          and coalesce(c.role_name, '') = coalesce(v_role, '') and coalesce(c.cast_group, '') = '';
    end if;
    if v_cast_id is null then raise exception 'cast_conflict_review_required'; end if;
  end if;

  update public.external_cast_candidates c set status = 'accepted', accepted_cast_id = v_cast_id,
    accepted_at = now(), updated_at = now() where c.id = v_candidate.id;
  insert into public.external_import_logs(source, action, target_type, target_id, target_label, source_url, details)
    values(v_candidate.source, case when v_created then 'create_cast' else 'mark_existing_cast_accepted' end,
      'cast', v_cast_id,
      concat_ws(' / ', v_candidate.source_work_title, v_candidate.source_actor_name, coalesce(v_role, '-')),
      coalesce(v_candidate.source_work_url, v_candidate.source_actor_url),
      jsonb_build_object('candidate_id', v_candidate.id, 'source_role_raw', v_candidate.source_role_raw,
        'accepted_role_name', v_role, 'role_edited', v_role is distinct from nullif(btrim(v_candidate.source_role_raw), ''),
        'matched_actor_id', p_expected_actor_id, 'matched_play_id', p_expected_play_id, 'atomic_accept', true));
  return query select v_cast_id, v_created, false;
end;
$$;

revoke all on function public.accept_external_cast_candidate(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.accept_external_cast_candidate(uuid, uuid, uuid, text) to authenticated, service_role;
comment on function public.accept_external_cast_candidate(uuid, uuid, uuid, text) is
'外部候補の配役作成・候補採用・履歴を一括反映。再実行時は既存採用を返し、手動修正・条件付き配役の自動統合はしない。';
notify pgrst, 'reload schema';
commit;
