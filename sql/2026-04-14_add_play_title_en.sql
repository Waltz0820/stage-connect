alter table public.plays
add column if not exists title_en text;

comment on column public.plays.title_en is
'英語版作品タイトル。未入力時は /en 側でも日本語タイトルを表示する。';
