alter table public.franchises
add column if not exists description_en text;

comment on column public.franchises.description_en is
'英語版シリーズ詳細や英語一覧で使うシリーズ説明文。';

alter table public.plays
add column if not exists summary_en text;

comment on column public.plays.summary_en is
'英語版作品詳細や英語一覧で使う作品あらすじ。';
