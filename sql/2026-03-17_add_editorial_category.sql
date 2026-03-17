-- Minimal editorial category support for Stage Connect guides.
-- Initial categories:
--   series-guides
--   features

alter table public.editorials
  add column if not exists category text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'editorials_category_check'
  ) then
    alter table public.editorials
      add constraint editorials_category_check
      check (category is null or category in ('series-guides', 'features'));
  end if;
end $$;

create index if not exists editorials_category_idx
  on public.editorials (category);
