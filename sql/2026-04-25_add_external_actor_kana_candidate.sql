alter table public.external_actors
add column if not exists source_actor_kana text;

comment on column public.external_actors.source_actor_kana is
'外部サイト由来の俳優名読み仮名候補。俳優skeleton作成時のslug生成候補として使う。';
