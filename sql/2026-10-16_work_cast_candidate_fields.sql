-- Apply after 2026-10-16_atomic_accept_external_cast_candidate.sql.
-- Candidate-only storage: no actors, plays or casts are rewritten here.
begin;
alter table public.external_cast_candidates
  alter column source_actor_url drop not null,
  add column if not exists source_cast_group text,
  add column if not exists source_order integer,
  add column if not exists source_credit_key text,
  add column if not exists source_evidence jsonb;

alter table public.external_cast_candidates drop constraint if exists external_cast_work_source_check;
alter table public.external_cast_candidates add constraint external_cast_work_source_check check (
  (nullif(btrim(source_actor_url), '') is not null or nullif(btrim(source_work_url), '') is not null)
  and (source_order is null or source_order > 0)
  and (source_credit_key is null or source_credit_key ~ '^[0-9a-f]{20}$' and nullif(btrim(source_work_url), '') is not null)
  and (source_evidence is null or jsonb_typeof(source_evidence) = 'object')
);
drop index if exists public.external_cast_candidates_source_dedupe_key;
create unique index external_cast_candidates_source_dedupe_key
  on public.external_cast_candidates(source, source_actor_url, source_work_title,
    coalesce(source_year, 0), coalesce(source_role_raw, ''), coalesce(source_cast_group, ''));
create unique index if not exists external_cast_candidates_work_credit_key
  on public.external_cast_candidates(source, source_work_url, source_credit_key)
  where source_credit_key is not null;

comment on column public.external_cast_candidates.source_actor_url is '俳優ページがない出演者はnull。作品URLを代入しない。';
comment on column public.external_cast_candidates.source_cast_group is '原文の出演区分。役名なしのアンサンブル等も保持する。';
comment on column public.external_cast_candidates.source_order is '参照先での行順。公式のbilling_orderとは区別する。';
comment on column public.external_cast_candidates.source_credit_key is '作品内の元の人名・役名・区分から生成する照合キー。人物IDではない。';

create or replace function public.stage_external_work_cast_candidates(
  p_work_url text, p_batch_key text, p_items jsonb
) returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_item jsonb;
  v_before public.external_cast_candidates%rowtype;
  v_row public.external_cast_candidates%rowtype;
  v_results jsonb := '[]';
  v_created integer := 0;
  v_preserved integer := 0;
  v_matches integer;
  v_actor_url text;
  v_role text;
  v_group text;
  v_roles text[];
  v_key text;
begin
  if p_work_url is null or p_work_url !~ '^https://kira-hai[.]net/[a-z0-9_-]+/?$'
    or p_batch_key is null or p_batch_key !~ '^[0-9a-f]{64}$'
    or jsonb_typeof(p_items) is distinct from 'array' then raise exception 'invalid_work_batch'; end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 500 then raise exception 'invalid_work_batch_size'; end if;
  if (select count(*) from jsonb_array_elements(p_items)) <> (select count(distinct item->>'source_credit_key') from jsonb_array_elements(p_items) item) then
    raise exception 'duplicate_source_credit';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('work-source:' || p_work_url, 0));
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_key := v_item->>'source_credit_key';
    v_actor_url := nullif(btrim(v_item->>'source_actor_url'), '');
    v_role := nullif(v_item->>'source_role_raw', '');
    v_group := nullif(v_item->>'source_cast_group', '');
    if v_key is null or v_key !~ '^[0-9a-f]{20}$' or nullif(btrim(v_item->>'source_actor_name'), '') is null
      or nullif(btrim(v_item->>'source_work_title'), '') is null
      or (nullif(btrim(v_role), '') is null and nullif(btrim(v_group), '') is null)
      or coalesce(v_item->>'source_order', '') !~ '^[1-9][0-9]*$'
      or jsonb_typeof(v_item->'source_evidence') is distinct from 'object'
      or coalesce(v_item->>'status', '') not in ('pending', 'needs_review') then raise exception 'invalid_work_credit'; end if;
    if concat(v_item->>'source_actor_name', v_role, v_group) ~* '<[/]?[a-z][^>]*>' then raise exception 'source_contains_markup_review_required'; end if;
    if v_actor_url is not null and v_actor_url !~ '^https://' then raise exception 'invalid_source_actor_url'; end if;
    select array_agg(value) into v_roles from jsonb_array_elements_text(coalesce(v_item->'source_role_names', '[]'));
    select c.* into v_before from public.external_cast_candidates c
      where c.source = 'kira-hai' and c.source_work_url = p_work_url and c.source_credit_key = v_key for update;
    if not found and v_actor_url is not null then
      -- Reuse an old actor-page candidate instead of duplicating its review.
      select count(*) into v_matches from public.external_cast_candidates c where c.source = 'kira-hai'
        and c.source_credit_key is null and c.source_actor_url = v_actor_url
        and (c.source_work_url = p_work_url or c.source_work_url is null and c.source_work_title = v_item->>'source_work_title' and c.source_year is not distinct from (v_item->>'source_year')::integer)
        and coalesce(c.source_role_raw, '') = coalesce(v_role, '') and coalesce(c.source_cast_group, '') = coalesce(v_group, '');
      if v_matches > 1 then raise exception 'ambiguous_legacy_work_candidate'; end if;
      select c.* into v_before from public.external_cast_candidates c where c.source = 'kira-hai'
        and c.source_credit_key is null and c.source_actor_url = v_actor_url
        and (c.source_work_url = p_work_url or c.source_work_url is null and c.source_work_title = v_item->>'source_work_title' and c.source_year is not distinct from (v_item->>'source_year')::integer)
        and coalesce(c.source_role_raw, '') = coalesce(v_role, '') and coalesce(c.source_cast_group, '') = coalesce(v_group, '') for update;
    end if;
    if v_before.id is not null then
      if v_before.source_credit_key is not null and (v_before.source_actor_name is distinct from v_item->>'source_actor_name'
        or v_before.source_role_raw is distinct from v_role or v_before.source_cast_group is distinct from v_group) then
        raise exception 'work_credit_identity_changed_review_required';
      end if;
      if v_before.status <> 'pending' or v_before.accepted_cast_id is not null then
        v_row := v_before; v_preserved := v_preserved + 1;
      else
        update public.external_cast_candidates c set source_credit_key = v_key, source_work_url = p_work_url,
          source_actor_name = v_item->>'source_actor_name', source_role_raw = v_role, source_cast_group = v_group,
          source_order = (v_item->>'source_order')::integer, source_evidence = v_item->'source_evidence',
          source_role_names = v_roles, matched_actor_id = coalesce(c.matched_actor_id, (v_item->>'matched_actor_id')::uuid),
          matched_play_id = coalesce(c.matched_play_id, (v_item->>'matched_play_id')::uuid), scraped_at = now(), updated_at = now()
          where c.id = v_before.id returning * into v_row;
      end if;
    else
      insert into public.external_cast_candidates(source, source_actor_name, source_actor_url, source_work_title,
        source_work_url, source_year, source_role_raw, source_role_names, source_cast_group, source_order,
        source_credit_key, source_evidence, matched_actor_id, matched_play_id, status)
      values('kira-hai', v_item->>'source_actor_name', v_actor_url, v_item->>'source_work_title', p_work_url,
        (v_item->>'source_year')::integer, v_role, v_roles, v_group, (v_item->>'source_order')::integer,
        v_key, v_item->'source_evidence', (v_item->>'matched_actor_id')::uuid, (v_item->>'matched_play_id')::uuid, v_item->>'status')
      returning * into v_row;
      v_created := v_created + 1;
    end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object('candidate_id', v_row.id, 'source_credit_key', v_key,
      'status', v_row.status, 'matched_actor_id', v_row.matched_actor_id, 'matched_play_id', v_row.matched_play_id));
  end loop;
  if not exists (select 1 from public.external_import_logs l where l.source = 'kira-hai' and l.action = 'stage_work_candidates' and l.details->>'batch_key' = p_batch_key) then
    insert into public.external_import_logs(source, action, target_type, target_label, source_url, details)
      values('kira-hai', 'stage_work_candidates', 'work', p_items->0->>'source_work_title', p_work_url,
        jsonb_build_object('batch_key', p_batch_key, 'created', v_created, 'review_preserved', v_preserved, 'candidates', v_results));
  end if;
  return jsonb_build_object('created', v_created, 'review_preserved', v_preserved, 'rows', v_results);
end;
$$;

create or replace function public.accept_external_work_cast_candidate(
  p_candidate_id uuid, p_expected_actor_id uuid, p_expected_play_id uuid, p_role_name text,
  p_expected_group text, p_expected_updated_at timestamptz
) returns table (accepted_cast_id uuid, cast_created boolean, already_accepted boolean)
language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_candidate public.external_cast_candidates%rowtype;
  v_cast public.casts%rowtype;
  v_cast_id uuid;
  v_created boolean := false;
  v_role text := nullif(btrim(p_role_name), '');
  v_group text;
begin
  select c.* into v_candidate from public.external_cast_candidates c where c.id = p_candidate_id for update;
  if not found then raise exception 'candidate_not_found_or_not_authorized'; end if;
  if p_expected_actor_id is null or p_expected_play_id is null
    or v_candidate.matched_actor_id is distinct from p_expected_actor_id or v_candidate.matched_play_id is distinct from p_expected_play_id then
    raise exception 'candidate_match_changed_refresh_required'; end if;
  v_group := nullif(btrim(v_candidate.source_cast_group), '');
  if v_group is distinct from nullif(btrim(p_expected_group), '') then raise exception 'candidate_credit_changed_refresh_required'; end if;
  if concat(v_role, v_group) ~* '<[/]?[a-z][^>]*>' then raise exception 'role_contains_markup_review_required'; end if;
  if v_candidate.status = 'accepted' or v_candidate.accepted_cast_id is not null then
    select c.* into v_cast from public.casts c where c.id = v_candidate.accepted_cast_id;
    if not found or v_candidate.status <> 'accepted' or v_cast.actor_id is distinct from p_expected_actor_id
      or v_cast.play_id is distinct from p_expected_play_id or coalesce(v_cast.role_name, '') <> coalesce(v_role, '')
      or coalesce(v_cast.cast_group, '') <> coalesce(v_group, '') then raise exception 'accepted_candidate_requires_explicit_correction'; end if;
    return query select v_cast.id, false, true; return;
  end if;
  if p_expected_updated_at is null or v_candidate.updated_at is distinct from p_expected_updated_at then raise exception 'candidate_credit_changed_refresh_required'; end if;
  if v_candidate.status <> 'pending' then raise exception 'candidate_not_pending_review_required'; end if;
  if v_candidate.source_credit_key is not null and v_role is null and v_group is null then raise exception 'missing_role_and_group'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_expected_actor_id::text || ':' || p_expected_play_id::text, 0));
  select c.id into v_cast_id from public.casts c where c.actor_id = p_expected_actor_id and c.play_id = p_expected_play_id
    and coalesce(c.role_name, '') = coalesce(v_role, '') and coalesce(c.cast_group, '') = coalesce(v_group, '');
  if v_cast_id is null then
    if exists (select 1 from public.casts c where c.actor_id = p_expected_actor_id and c.play_id = p_expected_play_id
      and exists (select 1 from regexp_split_to_table(coalesce(c.role_name, ''), '[/／]') existing_role
        cross join regexp_split_to_table(coalesce(v_role, ''), '[/／]') incoming_role
        where btrim(regexp_replace(existing_role, '[※【(（].*$', '')) = btrim(regexp_replace(incoming_role, '[※【(（].*$', ''))))
    then raise exception 'existing_cast_has_conditions_review_required'; end if;
    insert into public.casts(actor_id, play_id, role_name, cast_group) values(p_expected_actor_id, p_expected_play_id, v_role, v_group)
      on conflict do nothing returning id into v_cast_id;
    v_created := v_cast_id is not null;
    if v_cast_id is null then raise exception 'cast_conflict_review_required'; end if;
  end if;
  update public.external_cast_candidates c set status = 'accepted', accepted_cast_id = v_cast_id, accepted_at = now(), updated_at = now() where c.id = v_candidate.id;
  insert into public.external_import_logs(source, action, target_type, target_id, target_label, source_url, details)
    values(v_candidate.source, case when v_created then 'create_cast' else 'mark_existing_cast_accepted' end, 'cast', v_cast_id,
      concat_ws(' / ', v_candidate.source_work_title, v_candidate.source_actor_name, coalesce(v_role, v_group, '-')),
      coalesce(v_candidate.source_work_url, v_candidate.source_actor_url),
      jsonb_build_object('candidate_id', v_candidate.id, 'source_role_raw', v_candidate.source_role_raw, 'accepted_role_name', v_role,
        'source_cast_group', v_group, 'source_order', v_candidate.source_order, 'source_credit_key', v_candidate.source_credit_key,
        'source_evidence', v_candidate.source_evidence, 'role_edited', v_role is distinct from nullif(btrim(v_candidate.source_role_raw), ''),
        'matched_actor_id', p_expected_actor_id, 'matched_play_id', p_expected_play_id, 'atomic_accept', true));
  return query select v_cast_id, v_created, false;
end;
$$;

-- An old client must not silently adopt a work/group candidate without its group.
create or replace function public.accept_external_cast_candidate(
  p_candidate_id uuid, p_expected_actor_id uuid, p_expected_play_id uuid, p_role_name text
) returns table (accepted_cast_id uuid, cast_created boolean, already_accepted boolean)
language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_row public.external_cast_candidates%rowtype;
begin
  select c.* into v_row from public.external_cast_candidates c where c.id = p_candidate_id for update;
  if not found then raise exception 'candidate_not_found_or_not_authorized'; end if;
  if v_row.source_credit_key is not null or nullif(btrim(v_row.source_cast_group), '') is not null then raise exception 'work_candidate_requires_v2_accept'; end if;
  return query select * from public.accept_external_work_cast_candidate(p_candidate_id, p_expected_actor_id, p_expected_play_id, p_role_name, null, v_row.updated_at);
end;
$$;
revoke all on function public.stage_external_work_cast_candidates(text, text, jsonb) from public, anon;
revoke all on function public.accept_external_work_cast_candidate(uuid, uuid, uuid, text, text, timestamptz) from public, anon;
revoke all on function public.accept_external_cast_candidate(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.stage_external_work_cast_candidates(text, text, jsonb) to authenticated, service_role;
grant execute on function public.accept_external_work_cast_candidate(uuid, uuid, uuid, text, text, timestamptz) to authenticated, service_role;
grant execute on function public.accept_external_cast_candidate(uuid, uuid, uuid, text) to authenticated, service_role;
notify pgrst, 'reload schema';
commit;
