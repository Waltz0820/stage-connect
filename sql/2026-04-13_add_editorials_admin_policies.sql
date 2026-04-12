alter table public.editorials enable row level security;

drop policy if exists editorials_admin_select on public.editorials;
drop policy if exists editorials_admin_insert on public.editorials;
drop policy if exists editorials_admin_update on public.editorials;
drop policy if exists editorials_admin_delete on public.editorials;

create policy editorials_admin_select
on public.editorials
for select
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
);

create policy editorials_admin_insert
on public.editorials
for insert
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
);

create policy editorials_admin_update
on public.editorials
for update
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
);

create policy editorials_admin_delete
on public.editorials
for delete
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'butcher1629@gmail.com',
      'sayu.y14@gmail.com'
    ]
  )
);
