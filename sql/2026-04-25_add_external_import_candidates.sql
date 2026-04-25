create table if not exists public.external_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_url text not null,
  description text,
  created_at timestamptz not null default now()
);

comment on table public.external_sources is
'外部サイト由来の候補データの取得元。本文ではなく、出演フレーム候補の出典管理に使う。';

insert into public.external_sources (name, base_url, description)
values (
  'kira-hai',
  'https://kira-hai.net',
  '俳優・作品・出演履歴の外部候補フレーム。本文や感想は取り込まない。'
)
on conflict (name) do update
set
  base_url = excluded.base_url,
  description = excluded.description;

create table if not exists public.external_actors (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'kira-hai',
  source_actor_name text not null,
  source_actor_url text not null,
  alias_from text,
  alias_to text,
  note text,
  matched_actor_id uuid references public.actors(id) on delete set null,
  match_status text not null default 'unmatched',
  match_confidence integer not null default 0,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_actor_url)
);

comment on table public.external_actors is
'外部サイトから取得した俳優候補。既存actorsへの照合結果を保持し、本番俳優DBには直接投入しない。';
comment on column public.external_actors.match_status is
'unmatched / matched / ambiguous / ignored など。';

create index if not exists external_actors_source_name_idx
  on public.external_actors (source, source_actor_name);

create index if not exists external_actors_matched_actor_id_idx
  on public.external_actors (matched_actor_id);

create table if not exists public.external_plays (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'kira-hai',
  source_work_title_raw text not null,
  source_work_title_normalized text,
  source_work_url text,
  source_year integer,
  event_note text,
  matched_play_id uuid references public.plays(id) on delete set null,
  skeleton_play_id uuid references public.plays(id) on delete set null,
  match_status text not null default 'unmatched',
  match_confidence integer not null default 0,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.external_plays is
'外部サイトから取得した作品候補。作品名のraw/normalizedを残し、既存playsまたは後続のskeleton作成に使う。';
comment on column public.external_plays.event_note is
'初演・再演・振替・公演中止など、タイトル正規化時に落とさず逃がす補足。';

create unique index if not exists external_plays_source_url_key
  on public.external_plays (source, source_work_url)
  where source_work_url is not null;

create index if not exists external_plays_source_title_idx
  on public.external_plays (source, source_work_title_normalized);

create index if not exists external_plays_matched_play_id_idx
  on public.external_plays (matched_play_id);

create table if not exists public.external_cast_candidates (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'kira-hai',
  external_actor_id uuid references public.external_actors(id) on delete set null,
  external_play_id uuid references public.external_plays(id) on delete set null,
  source_actor_name text not null,
  source_actor_url text not null,
  source_work_title text not null,
  source_work_url text,
  source_year integer,
  source_role_raw text,
  source_role_names text[],
  matched_actor_id uuid references public.actors(id) on delete set null,
  matched_play_id uuid references public.plays(id) on delete set null,
  accepted_cast_id uuid references public.casts(id) on delete set null,
  confidence integer not null default 0,
  status text not null default 'pending',
  note text,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  rejected_at timestamptz
);

comment on table public.external_cast_candidates is
'外部サイトから取得した出演候補。actors/plays/castsへ直接反映せず、管理画面で採用・保留・無視する。';
comment on column public.external_cast_candidates.source_role_raw is
'外部サイト上の役名表記をそのまま保持する。分解や翻訳前の原本。';
comment on column public.external_cast_candidates.status is
'pending / accepted / rejected / needs_review など。';

create unique index if not exists external_cast_candidates_source_dedupe_key
  on public.external_cast_candidates (
    source,
    source_actor_url,
    source_work_title,
    coalesce(source_year, 0),
    coalesce(source_role_raw, '')
  );

create index if not exists external_cast_candidates_status_idx
  on public.external_cast_candidates (source, status);

create index if not exists external_cast_candidates_matched_actor_idx
  on public.external_cast_candidates (matched_actor_id);

create index if not exists external_cast_candidates_matched_play_idx
  on public.external_cast_candidates (matched_play_id);

alter table public.external_sources enable row level security;
alter table public.external_actors enable row level security;
alter table public.external_plays enable row level security;
alter table public.external_cast_candidates enable row level security;

drop policy if exists external_sources_admin_all on public.external_sources;
drop policy if exists external_actors_admin_all on public.external_actors;
drop policy if exists external_plays_admin_all on public.external_plays;
drop policy if exists external_cast_candidates_admin_all on public.external_cast_candidates;

create policy external_sources_admin_all
on public.external_sources
for all
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
);

create policy external_actors_admin_all
on public.external_actors
for all
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
);

create policy external_plays_admin_all
on public.external_plays
for all
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
);

create policy external_cast_candidates_admin_all
on public.external_cast_candidates
for all
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
);
