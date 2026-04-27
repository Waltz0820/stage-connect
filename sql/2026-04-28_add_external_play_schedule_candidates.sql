alter table public.external_plays
add column if not exists source_schedule_raw text;

comment on column public.external_plays.source_schedule_raw is
'外部サイト由来の公演日程候補のraw表記。plays.periodへは自動確定反映しない。';

alter table public.external_plays
add column if not exists source_venue_raw text;

comment on column public.external_plays.source_venue_raw is
'外部サイト由来の会場候補のraw表記。plays.venueへは自動確定反映しない。';

alter table public.external_plays
add column if not exists source_period_text text;

comment on column public.external_plays.source_period_text is
'Stage Connectのperiod形式に寄せた外部候補。例: 東京: 2020/07/09-07/19 / 新潟: 2020/07/24-07/26。';

alter table public.external_plays
add column if not exists source_venue_text text;

comment on column public.external_plays.source_venue_text is
'Stage Connectのvenue形式に寄せた外部候補。例: 日本青年館 大ホール / 大阪メルパルクホール。';

alter table public.external_plays
add column if not exists source_schedule_items jsonb not null default '[]'::jsonb;

comment on column public.external_plays.source_schedule_items is
'外部サイト由来の公演日程候補を構造化したJSON配列。area/start_date/end_date/venue/source_lineを保持する。';
