-- Flooring module: viewings (a visit to measure up) and the rooms measured.
-- Switched on with tenants.features.flooring. Nothing here has prices.
-- Owner / manager: full access. People booked on the job: read only (for the job sheet).

create table public.fl_viewings (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants (id),
  job_id              uuid not null,
  viewed_at           timestamptz,
  notes               text check (length(notes) <= 4000),
  est_duration_hours  numeric(5,1) check (est_duration_hours > 0 and est_duration_hours <= 500),
  created_by          uuid not null default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint fl_viewings_tenant_id_id_key unique (tenant_id, id),
  constraint fl_viewings_one_per_job unique (tenant_id, job_id),
  constraint fl_viewings_job_fk foreign key (tenant_id, job_id) references public.jobs (tenant_id, id) on delete cascade
);

create table public.fl_viewing_rooms (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id),
  viewing_id  uuid not null,
  name        text not null check (length(btrim(name)) between 1 and 80),
  length_m    numeric(6,2) check (length_m > 0 and length_m <= 200),
  width_m     numeric(6,2) check (width_m > 0 and width_m <= 200),
  -- length x width when both are given; otherwise the area entered (odd-shaped rooms).
  area_m2     numeric(8,2) check (area_m2 > 0 and area_m2 <= 10000),
  floor_type  text check (length(floor_type) <= 80),
  notes       text check (length(notes) <= 2000),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  constraint fl_viewing_rooms_viewing_fk foreign key (tenant_id, viewing_id)
    references public.fl_viewings (tenant_id, id) on delete cascade
);
create index fl_viewing_rooms_viewing_idx on public.fl_viewing_rooms (tenant_id, viewing_id, sort_order);

-- Area = length x width when both are given; otherwise keep the area typed in.
create or replace function private.fl_rooms_fill_area()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.length_m is not null and new.width_m is not null then
    new.area_m2 := round(new.length_m * new.width_m, 2);
  end if;
  return new;
end
$$;
create trigger fl_viewing_rooms_fill_area before insert or update on public.fl_viewing_rooms
for each row execute function private.fl_rooms_fill_area();

create or replace function private.fl_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;
create trigger fl_viewings_touch before update on public.fl_viewings
for each row execute function private.fl_touch();

create or replace function private.fl_viewing_job(p_viewing uuid)
returns uuid
language sql stable
security definer
set search_path = ''
as $$
  select v.job_id from public.fl_viewings v where v.id = p_viewing and v.tenant_id = private.current_tenant_id()
$$;

alter table public.fl_viewings enable row level security;
alter table public.fl_viewing_rooms enable row level security;

create policy fl_viewings_manager_all on public.fl_viewings for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.is_manager())
         and (select private.feature_enabled('flooring')))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.is_manager())
              and (select private.feature_enabled('flooring')));
create policy fl_viewings_job_read on public.fl_viewings for select
  using (tenant_id = (select private.current_tenant_id()) and (select private.feature_enabled('flooring'))
         and private.can_access_job(job_id));

create policy fl_rooms_manager_all on public.fl_viewing_rooms for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.is_manager())
         and (select private.feature_enabled('flooring')))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.is_manager())
              and (select private.feature_enabled('flooring')));
create policy fl_rooms_job_read on public.fl_viewing_rooms for select
  using (tenant_id = (select private.current_tenant_id()) and (select private.feature_enabled('flooring'))
         and private.can_access_job(private.fl_viewing_job(viewing_id)));

grant select, insert, update, delete on public.fl_viewings, public.fl_viewing_rooms to authenticated;
