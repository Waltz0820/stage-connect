-- Allow the same actor to appear multiple times within a play
-- as long as the role/group combination is different.
--
-- Before:
--   unique (play_id, actor_id)
--
-- After:
--   unique (
--     play_id,
--     actor_id,
--     coalesce(role_name, ''),
--     coalesce(cast_group, '')
--   )
--
-- This keeps exact duplicates out while allowing multi-role casts.

alter table public.casts
  drop constraint if exists casts_play_actor_key;

alter table public.casts
  drop constraint if exists casts_unique_play_actor;

alter table public.casts
  drop constraint if exists casts_play_actor_unique;

drop index if exists public.casts_play_actor_key;
drop index if exists public.casts_unique_play_actor;
drop index if exists public.casts_play_actor_unique;

create unique index if not exists casts_play_actor_role_group_key
  on public.casts (
    play_id,
    actor_id,
    coalesce(role_name, ''),
    coalesce(cast_group, '')
  );
