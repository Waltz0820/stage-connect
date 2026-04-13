alter table public.actors
add column if not exists name_en text;

comment on column public.actors.name_en is
'英語版俳優名。未入力時は slug から自動生成して表示する。';
