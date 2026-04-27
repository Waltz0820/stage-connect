create table if not exists public.external_import_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'kira-hai',
  action text not null,
  target_type text,
  target_id uuid,
  target_label text,
  source_url text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.external_import_logs is
'外部候補取り込みの作業ログ。候補から作成・採用・手動紐づけした履歴を軽く追うために使う。';

create index if not exists external_import_logs_source_created_idx
  on public.external_import_logs (source, created_at desc);

create index if not exists external_import_logs_action_idx
  on public.external_import_logs (action);

alter table public.external_import_logs enable row level security;

drop policy if exists external_import_logs_admin_all on public.external_import_logs;

create policy external_import_logs_admin_all
on public.external_import_logs
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
