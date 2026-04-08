alter table public.actors
add column if not exists birthday_label text;

comment on column public.actors.birthday_label is
'年を出さない俳優向けの表示用生年月日ラベル。例: 2月5日 / 非公表。';
