-- Apply after 2026-10-16_work_cast_candidate_fields.sql.
begin;
create table if not exists public.actor_identity_sources (
  profile_url text primary key check (profile_url ~ '^https://'),
  actor_id uuid not null references public.actors(id) on delete cascade,
  evidence jsonb not null check (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz not null default now()
);
comment on table public.actor_identity_sources is
  '確認済み人物プロフィールと俳優IDの対応。氏名だけの別人統合や全候補への一括紐付けには使わない。';
alter table public.actor_identity_sources enable row level security;
drop policy if exists actor_identity_sources_admin_all on public.actor_identity_sources;
create policy actor_identity_sources_admin_all on public.actor_identity_sources for all
using (lower(coalesce(auth.jwt()->>'email', '')) = any(array['butcher1629@gmail.com','sayu.y14@gmail.com']))
with check (lower(coalesce(auth.jwt()->>'email', '')) = any(array['butcher1629@gmail.com','sayu.y14@gmail.com']));
revoke all on public.actor_identity_sources from public,anon,authenticated;
grant select,insert on public.actor_identity_sources to authenticated,service_role;

create or replace function public.stage_actor_evidence_valid(p_evidence jsonb)
returns boolean language plpgsql immutable security invoker set search_path = public,pg_temp as $$
declare v_item jsonb;
begin
  if jsonb_typeof(p_evidence) is distinct from 'array' then return false; end if;
  if jsonb_array_length(p_evidence) = 0 then return false; end if;
  for v_item in select value from jsonb_array_elements(p_evidence) loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or coalesce(v_item->>'url','') !~ '^https://[^[:space:]]+$'
      or nullif(btrim(v_item->>'note'),'') is null
      or (v_item->>'note') ~* '<[/]?[a-z][^>]*>'
      or coalesce(v_item->>'checkedAt','') !~ '^\d{4}-\d{2}-\d{2}T' then return false; end if;
    perform (v_item->>'checkedAt')::timestamptz;
  end loop;
  return true;
exception when invalid_datetime_format or datetime_field_overflow then return false;
end;
$$;

create or replace function public.register_reviewed_work_actor(
  p_candidate_id uuid, p_expected_updated_at timestamptz, p_request_key text,
  p_actor jsonb, p_research jsonb
) returns jsonb language plpgsql security invoker set search_path = public,pg_temp as $$
declare
  v_row public.external_cast_candidates%rowtype;
  v_actor public.actors%rowtype;
  v_prior public.external_import_logs%rowtype;
  v_profile_url text;
  v_identity public.actor_identity_sources%rowtype;
  v_name_key text;
  v_field text;
  v_claim jsonb;
  v_distinct jsonb;
  v_date date;
  v_created boolean := false;
begin
  if jsonb_typeof(p_actor) is distinct from 'object' or jsonb_typeof(p_research) is distinct from 'object'
    or p_request_key is null or p_request_key !~ '^[0-9a-f]{64}$' then raise exception 'invalid_actor_registration'; end if;
  if exists (select 1 from jsonb_object_keys(p_actor) k where k not in ('name','slug','kana','name_en','birthday','height_cm','blood_type','gender'))
    or jsonb_typeof(p_actor->'name') is distinct from 'string' or jsonb_typeof(p_actor->'slug') is distinct from 'string'
    or nullif(btrim(p_actor->>'name'),'') is null or (p_actor->>'name') ~* '<[/]?[a-z][^>]*>'
    or coalesce(p_actor->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'invalid_actor_payload'; end if;
  v_profile_url := p_research->'identity'->>'profileUrl';
  if p_research->>'version' is distinct from '1'
    or p_research->'identity'->>'status' is distinct from 'profile_linked'
    or coalesce(v_profile_url,'') !~ '^https://[^[:space:]]+$'
    or not public.stage_actor_evidence_valid(p_research->'identity'->'evidence')
    or not public.stage_actor_evidence_valid(p_research->'appearance_evidence')
    or jsonb_typeof(p_research->'facts') is distinct from 'object'
    or jsonb_typeof(coalesce(p_research->'distinct_actors','[]'::jsonb)) is distinct from 'array'
    or coalesce(p_research->>'research_fingerprint','') !~ '^[0-9a-f]{64}$'
    or coalesce(p_research->>'source_fingerprint','') !~ '^[0-9a-f]{64}$' then raise exception 'unverified_actor_research'; end if;
  for v_field in select unnest(array['kana','name_en','birthday','height_cm','blood_type','gender']) loop
    if p_actor->>v_field is null then continue; end if;
    v_claim := p_research->'facts'->v_field;
    if v_claim->>'status' is distinct from 'confirmed'
      or v_claim->'value' is distinct from p_actor->v_field
      or not public.stage_actor_evidence_valid(v_claim->'evidence') then raise exception 'unverified_actor_field:%',v_field; end if;
    if v_field in ('kana','name_en') and (jsonb_typeof(p_actor->v_field) <> 'string' or nullif(btrim(p_actor->>v_field),'') is null or (p_actor->>v_field) ~* '<[/]?[a-z][^>]*>') then raise exception 'invalid_actor_field:%',v_field; end if;
    if v_field = 'birthday' then
      if p_actor->>v_field !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'invalid_actor_birthday'; end if;
      v_date := (p_actor->>v_field)::date;
      if to_char(v_date,'YYYY-MM-DD') <> p_actor->>v_field then raise exception 'invalid_actor_birthday'; end if;
    end if;
    if v_field = 'height_cm' and (jsonb_typeof(p_actor->v_field) <> 'number' or p_actor->>v_field !~ '^[1-9][0-9]{0,2}$' or (p_actor->>v_field)::int >= 300) then raise exception 'invalid_actor_height'; end if;
    if v_field = 'blood_type' and p_actor->>v_field not in ('A','B','O','AB') then raise exception 'invalid_actor_blood_type'; end if;
    if v_field = 'gender' and p_actor->>v_field not in ('male','female','other') then raise exception 'invalid_actor_gender'; end if;
  end loop;
  select c.* into v_row from public.external_cast_candidates c where c.id = p_candidate_id for update;
  if not found then raise exception 'candidate_not_found_or_not_authorized'; end if;
  if v_row.source <> 'kira-hai' or v_row.source_credit_key is null
    or v_row.source_work_url is distinct from p_research->>'source_work_url'
    or v_row.source_credit_key is distinct from p_research->>'source_credit_key'
    or v_row.source_actor_name is distinct from p_research->>'source_actor_name'
    or v_row.source_actor_name is distinct from p_actor->>'name'
    or v_row.source_actor_url is distinct from p_research->>'source_actor_url'
    or v_row.source_evidence->>'source_fingerprint' is distinct from p_research->>'source_fingerprint'
    then raise exception 'actor_source_changed_refresh_required'; end if;
  select l.* into v_prior from public.external_import_logs l
    where l.action = 'register_reviewed_work_actor' and l.details->>'request_key' = p_request_key;
  if found then
    if v_prior.details->>'candidate_id' is distinct from p_candidate_id::text
      or v_prior.details->'actor_payload' is distinct from p_actor
      or v_prior.details->'research' is distinct from p_research
      or v_row.matched_actor_id is distinct from v_prior.target_id
      or not exists(select 1 from public.actor_identity_sources s where s.profile_url=v_profile_url and s.actor_id=v_prior.target_id)
      then raise exception 'actor_registration_retry_conflict'; end if;
    select a.* into v_actor from public.actors a where a.id = v_prior.target_id;
    if not found then raise exception 'registered_actor_missing'; end if;
    return jsonb_build_object('actor',to_jsonb(v_actor),'candidate_id',v_row.id,'updated_at',v_row.updated_at,'already_registered',true,'actor_created',false);
  end if;
  if v_row.updated_at is distinct from p_expected_updated_at or p_expected_updated_at is null then raise exception 'candidate_changed_refresh_required'; end if;
  if v_row.matched_actor_id is not null or v_row.accepted_cast_id is not null or v_row.status not in ('pending','needs_review') then raise exception 'candidate_actor_already_decided'; end if;
  perform pg_advisory_xact_lock(hashtextextended('verified-actor-profile:'||v_profile_url,0));
  select s.* into v_identity from public.actor_identity_sources s where s.profile_url=v_profile_url;
  v_name_key := regexp_replace(normalize(btrim(p_actor->>'name'),NFKC),'[[:space:]　]+','','g');
  if found then
    select a.* into v_actor from public.actors a where a.id=v_identity.actor_id for share;
    if not found or regexp_replace(normalize(btrim(v_actor.name),NFKC),'[[:space:]　]+','','g') <> v_name_key then raise exception 'verified_profile_actor_changed'; end if;
    for v_field in select unnest(array['kana','name_en','birthday','height_cm','blood_type','gender']) loop
      if p_actor->>v_field is not null and to_jsonb(v_actor)->>v_field is not null
        and to_jsonb(v_actor)->>v_field <> p_actor->>v_field then raise exception 'verified_profile_fact_conflict:%',v_field; end if;
    end loop;
    -- Reuse the actor without filling or overwriting any existing profile fields.
  else
    -- The table lock also serializes ordinary actor inserts while checking names.
    -- Names are not a unique key: any collision is left for explicit review.
    lock table public.actors in share row exclusive mode;
    for v_distinct in select value from jsonb_array_elements(coalesce(p_research->'distinct_actors','[]'::jsonb)) loop
      if not public.stage_actor_evidence_valid(v_distinct->'evidence')
        or p_actor->>'birthday' is null or v_distinct->>'expectedBirthday' is null
        or p_actor->>'birthday' = v_distinct->>'expectedBirthday'
        or v_distinct->>'expectedUpdatedAt' is null
        or not exists(select 1 from public.actors a where a.id=(v_distinct->>'actorId')::uuid
          and a.name=v_distinct->>'expectedName' and a.birthday=(v_distinct->>'expectedBirthday')::date
          and a.updated_at=(v_distinct->>'expectedUpdatedAt')::timestamptz)
        then raise exception 'stale_or_unverified_distinct_actor'; end if;
    end loop;
    if exists(select 1 from public.actors a where
      (regexp_replace(normalize(btrim(a.name),NFKC),'[[:space:]　]+','','g') = v_name_key
        or nullif(p_actor->>'kana','') is not null and regexp_replace(normalize(coalesce(a.kana,''),NFKC),'[[:space:]　]+','','g') = regexp_replace(normalize(p_actor->>'kana',NFKC),'[[:space:]　]+','','g'))
      and not exists(select 1 from jsonb_array_elements(coalesce(p_research->'distinct_actors','[]'::jsonb)) d where d->>'actorId'=a.id::text)) then raise exception 'existing_actor_identity_review_required'; end if;
    if exists(select 1 from public.actors a where a.slug=p_actor->>'slug') then raise exception 'actor_slug_conflict_review_required'; end if;
    insert into public.actors(name,slug,kana,name_en,birthday,height_cm,blood_type,gender,profile,profile_en)
      values(p_actor->>'name',p_actor->>'slug',p_actor->>'kana',p_actor->>'name_en',(p_actor->>'birthday')::date,
        (p_actor->>'height_cm')::int,p_actor->>'blood_type',p_actor->>'gender',null,null) returning * into v_actor;
    insert into public.actor_identity_sources(profile_url,actor_id,evidence) values(v_profile_url,v_actor.id,p_research);
    v_created := true;
  end if;
  update public.external_cast_candidates c set matched_actor_id=v_actor.id,status='pending',updated_at=now(),
    source_evidence=coalesce(c.source_evidence,'{}')||jsonb_build_object('actor_research',p_research)
    where c.id=v_row.id returning * into v_row;
  insert into public.external_import_logs(source,action,target_type,target_id,target_label,source_url,details)
    values(v_row.source,'register_reviewed_work_actor','actor',v_actor.id,v_actor.name,v_row.source_work_url,
      jsonb_build_object('request_key',p_request_key,'candidate_id',v_row.id,'actor_created',v_created,'actor_payload',p_actor,'research',p_research));
  return jsonb_build_object('actor',to_jsonb(v_actor),'candidate_id',v_row.id,'updated_at',v_row.updated_at,'already_registered',false,'actor_created',v_created);
end;
$$;
create unique index if not exists external_import_logs_actor_registration_key
on public.external_import_logs((details->>'request_key')) where action='register_reviewed_work_actor';
revoke all on function public.stage_actor_evidence_valid(jsonb) from public, anon;
revoke all on function public.register_reviewed_work_actor(uuid,timestamptz,text,jsonb,jsonb) from public, anon;
grant execute on function public.stage_actor_evidence_valid(jsonb) to authenticated,service_role;
grant execute on function public.register_reviewed_work_actor(uuid,timestamptz,text,jsonb,jsonb) to authenticated,service_role;
notify pgrst,'reload schema';
commit;
