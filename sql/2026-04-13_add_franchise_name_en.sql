alter table public.franchises
add column if not exists name_en text;

comment on column public.franchises.name_en is
'英語版シリーズ名。未入力時は /en 側でも日本語タイトルを表示する。';
