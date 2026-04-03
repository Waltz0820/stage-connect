alter table public.plays
add column if not exists related_franchise_ids uuid[] not null default '{}'::uuid[];

comment on column public.plays.related_franchise_ids is
'同作品の他シリーズ導線用。シリーズ詳細に関連シリーズとして表示する franchise id の配列。';
