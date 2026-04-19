alter table public.actors
add column if not exists profile_en text;

comment on column public.actors.profile_en is
'英語版俳優プロフィール。未入力時は /en 側でも日本語プロフィールを表示する。';
