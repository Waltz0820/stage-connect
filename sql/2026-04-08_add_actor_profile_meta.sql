alter table public.actors
add column if not exists height_cm integer;

comment on column public.actors.height_cm is
'俳優詳細のメタデータで使う身長（cm）。';

alter table public.actors
add column if not exists blood_type text;

comment on column public.actors.blood_type is
'俳優詳細のメタデータで使う血液型。';
