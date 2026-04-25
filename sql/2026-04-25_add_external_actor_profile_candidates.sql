alter table public.external_actors
add column if not exists source_profile_facts_raw text;

comment on column public.external_actors.source_profile_facts_raw is
'外部サイト上のプロフィール基本情報行。例: 1987年10月1日生まれ / 180cm / O型。';

alter table public.external_actors
add column if not exists source_birthday_raw text;

comment on column public.external_actors.source_birthday_raw is
'外部サイト由来の生年月日候補のraw表記。';

alter table public.external_actors
add column if not exists source_birthday date;

comment on column public.external_actors.source_birthday is
'外部サイト由来の生年月日候補。actors.birthdayへは自動反映しない。';

alter table public.external_actors
add column if not exists source_height_cm integer;

comment on column public.external_actors.source_height_cm is
'外部サイト由来の身長候補（cm）。actors.height_cmへは自動反映しない。';

alter table public.external_actors
add column if not exists source_blood_type text;

comment on column public.external_actors.source_blood_type is
'外部サイト由来の血液型候補。actors.blood_typeへは自動反映しない。';

alter table public.external_actors
add column if not exists source_affiliation_raw text;

comment on column public.external_actors.source_affiliation_raw is
'外部サイト由来の所属候補のraw表記。ファクト確認や逆引き用で、actorsへは自動反映しない。';
