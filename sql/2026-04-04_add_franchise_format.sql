alter table public.franchises
add column if not exists format text;

comment on column public.franchises.format is
'シリーズの上演形式。作品一覧などで親シリーズから 舞台 / ミュージカル を判定するための項目。';

alter table public.franchises
drop constraint if exists franchises_format_check;

alter table public.franchises
add constraint franchises_format_check
check (format is null or format in ('stage', 'musical'));
