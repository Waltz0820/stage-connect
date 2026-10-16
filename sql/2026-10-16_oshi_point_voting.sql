-- Independent of the cast-import migrations. Does not alter legacy tags or works.
begin;

create table public.oshi_points (
  id text primary key,
  name_ja text not null,
  name_en text not null,
  sort_order smallint not null unique
);
insert into public.oshi_points (id, name_ja, name_en, sort_order) values
 ('cast','キャスト','Cast',1), ('music','歌・音楽','Songs & music',2),
 ('dance','ダンス','Dance',3), ('action','殺陣・アクション','Swordplay & action',4),
 ('story','ストーリー','Story',5), ('direction','演出','Direction',6),
 ('visuals','衣装・ビジュアル','Costumes & visuals',7),
 ('adaptation','原作再現度','Faithfulness to the original',8),
 ('funny','笑える','Makes me laugh',9), ('moving','泣ける','Moves me to tears',10);

create function public.valid_oshi_points(points text[]) returns boolean
language sql immutable set search_path = '' as $$
 select coalesce(cardinality(points) between 1 and 3
   and array_position(points, null) is null
   and points <@ array['cast','music','dance','action','story','direction','visuals','adaptation','funny','moving']::text[]
   and cardinality(points) = (select count(distinct p) from unnest(points) p), false)
$$;
revoke all on function public.valid_oshi_points(text[]) from public, anon, authenticated;
grant execute on function public.valid_oshi_points(text[]) to service_role;

create table public.oshi_ballots (
  play_id uuid not null references public.plays(id) on delete cascade,
  voter_hash text not null check (voter_hash ~ '^[a-f0-9]{64}$'),
  point_ids text[] not null check (public.valid_oshi_points(point_ids)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (play_id, voter_hash)
);
create index oshi_voter_index on public.oshi_ballots (voter_hash);

-- Hourly counters are shared across server instances. No raw IP or cookie is stored.
create table public.oshi_vote_limits (
  bucket_key text not null,
  window_start timestamptz not null,
  hits integer not null check (hits > 0),
  primary key (bucket_key, window_start)
);
create index oshi_limit_index on public.oshi_vote_limits(window_start);

alter table public.oshi_points enable row level security;
alter table public.oshi_ballots enable row level security;
alter table public.oshi_vote_limits enable row level security;
revoke all on public.oshi_points, public.oshi_ballots, public.oshi_vote_limits from public, anon, authenticated;
grant select on public.oshi_points to anon, authenticated;
create policy oshi_master_read on public.oshi_points for select to anon, authenticated using (true);
grant select on public.oshi_points to service_role;
grant all on public.oshi_ballots, public.oshi_vote_limits to service_role;

-- Only aggregated counts leave the database. Identities and individual ballots stay private.
create function public.get_oshi_results(p_play_id uuid)
returns table (point_id text, votes bigint, participants bigint)
language sql stable security definer set search_path = '' as $$
 with ballots as materialized (
   select b.point_ids from public.oshi_ballots b where b.play_id = p_play_id
 ), totals as (select count(*) n from ballots),
 counts as (select p, count(*) n from ballots, unnest(point_ids) p group by p)
 select m.id, coalesce(c.n,0), t.n
 from public.oshi_points m cross join totals t left join counts c on c.p = m.id
 order by m.sort_order
$$;
revoke all on function public.get_oshi_results(uuid) from public;
grant execute on function public.get_oshi_results(uuid) to anon, authenticated, service_role;

-- Minimum five participants; deterministic pagination, with no single-vote leaders.
create function public.discover_oshi_plays(p_point_id text, p_offset integer default 0)
returns table (play_slug text, votes bigint, participants bigint)
language sql stable security definer set search_path = '' as $$
 with counts as (
   select b.play_id, count(*) as participants,
     count(*) filter (where p_point_id = any(b.point_ids)) as votes
   from public.oshi_ballots b group by b.play_id having count(*) >= 5
 )
 select p.slug, c.votes, c.participants from counts c
 join public.plays p on p.id = c.play_id
 where c.votes > 0 and p_point_id in (select id from public.oshi_points)
 order by c.votes::numeric / c.participants desc, c.participants desc, p.slug
 limit 500 offset greatest(0, least(coalesce(p_offset,0),100000))
$$;
revoke all on function public.discover_oshi_plays(text,integer) from public;
grant execute on function public.discover_oshi_plays(text,integer) to anon, authenticated, service_role;

-- Called only by the server, with hashes derived from a signed identity and a trusted IP.
create function public.submit_oshi_ballot(p_play_id uuid, p_voter_hash text, p_network_hash text, p_points text[])
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_key text;
  v_max integer;
  v_hits integer;
  v_hour timestamptz := date_trunc('hour', now());
begin
  if not public.valid_oshi_points(p_points)
    or p_voter_hash is null or p_voter_hash !~ '^[a-f0-9]{64}$'
    or p_network_hash is null or p_network_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_ballot' using errcode = '22023';
  end if;
  if not exists (select 1 from public.plays where id = p_play_id) then
    raise exception 'play_not_found' using errcode = 'P0002';
  end if;
  -- Serialize the same identity before checking or replacing a ballot.
  perform pg_advisory_xact_lock(hashtextextended('oshi:' || p_voter_hash,0));
  if exists (select 1 from public.oshi_ballots where play_id = p_play_id and voter_hash = p_voter_hash
    and updated_at > now() - interval '3 seconds') then
    raise exception 'vote_rate_limited' using errcode = 'P0001';
  end if;
  -- Stable ordering avoids counter lock inversions across concurrent requests.
  for v_key, v_max in select * from (values
    ('network:' || p_network_hash,120),
    ('play:' || p_play_id::text || ':' || p_network_hash,10),
    ('voter:' || p_voter_hash,30)
  ) as limits(k,n) order by k loop
    insert into public.oshi_vote_limits(bucket_key,window_start,hits) values(v_key,v_hour,1)
    on conflict (bucket_key,window_start) do update set hits = public.oshi_vote_limits.hits + 1
    returning hits into v_hits;
    if v_hits > v_max then
      raise exception 'vote_rate_limited' using errcode = 'P0001';
    end if;
  end loop;
  insert into public.oshi_ballots(play_id,voter_hash,point_ids)
  values(p_play_id,p_voter_hash,array(select unnest(p_points) order by 1))
  on conflict (play_id,voter_hash) do update set point_ids = excluded.point_ids, updated_at = now();
  delete from public.oshi_vote_limits where window_start < now() - interval '2 days';
end
$$;
revoke all on function public.submit_oshi_ballot(uuid,text,text,text[]) from public, anon, authenticated;
grant execute on function public.submit_oshi_ballot(uuid,text,text,text[]) to service_role;

commit;
