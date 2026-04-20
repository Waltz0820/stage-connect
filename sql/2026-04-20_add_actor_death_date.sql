alter table public.actors
add column if not exists death_date date;

comment on column public.actors.death_date is
'逝去日。入力されている場合は公開側で現在年齢の表示を止める。';
