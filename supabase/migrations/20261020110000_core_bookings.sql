-- Core: bookings (scheduling). A booking puts a job in the diary for a time range and assigns people.
-- Switched on per business with tenants.features.scheduling. Generic: no trade-specific columns.
--
-- Double-booking is impossible in the database: booking_assignees carries a copy of the booking's
-- time range and an exclusion constraint forbids overlapping ranges for the same person.
-- The app warns first (booking_clashes) so people see a friendly message, not an error.
-- save_booking reports a clash with SQLSTATE BK001 and a plain-English message naming the person.
--
-- Access:
--   owner / manager : everything in their business
--   everyone else   : only bookings they are assigned to, and the job sheet for those (no prices:
--                     prices never live in these tables)

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

---------------------------------------------------------------- tables
create table public.bookings (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id),
  job_id      uuid not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  notes       text check (length(notes) <= 2000),
  created_by  uuid not null default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint bookings_tenant_id_id_key unique (tenant_id, id),
  constraint bookings_job_fk foreign key (tenant_id, job_id) references public.jobs (tenant_id, id),
  constraint bookings_time_order check (ends_at > starts_at),
  constraint bookings_max_length check (ends_at - starts_at <= interval '31 days')
);
create index bookings_tenant_starts_idx on public.bookings (tenant_id, starts_at);
create index bookings_tenant_job_idx on public.bookings (tenant_id, job_id);

create table public.booking_assignees (
  tenant_id   uuid not null references public.tenants (id),
  booking_id  uuid not null,
  user_id     uuid not null,
  -- Copied from the booking by trigger (never trusted from the client).
  time_range  tstzrange not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (booking_id, user_id),
  constraint booking_assignees_booking_fk foreign key (tenant_id, booking_id)
    references public.bookings (tenant_id, id) on delete cascade,
  constraint booking_assignees_user_fk foreign key (tenant_id, user_id)
    references public.profiles (tenant_id, id),
  constraint booking_assignees_no_overlap exclude using gist (
    tenant_id with =, user_id with =, time_range with &&
  ) where (active)
);
create index booking_assignees_user_idx on public.booking_assignees (tenant_id, user_id);

---------------------------------------------------------------- keep assignee ranges in step
create or replace function private.booking_assignees_fill()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.bookings;
begin
  select * into b from public.bookings where id = new.booking_id and tenant_id = new.tenant_id;
  if not found then
    raise exception 'Booking not found' using errcode = '23503';
  end if;
  new.time_range := tstzrange(b.starts_at, b.ends_at, '[)');
  new.active := b.status = 'scheduled';
  return new;
end
$$;

create trigger booking_assignees_fill
before insert or update on public.booking_assignees
for each row execute function private.booking_assignees_fill();

create or replace function private.bookings_sync_assignees()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.job_id <> old.job_id or new.tenant_id <> old.tenant_id then
    raise exception 'A booking can''t be moved to another job' using errcode = '22023';
  end if;
  return new;
end
$$;

create trigger bookings_before_update
before update on public.bookings
for each row execute function private.bookings_sync_assignees();

create or replace function private.bookings_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.starts_at, new.ends_at, new.status) is distinct from (old.starts_at, old.ends_at, old.status) then
    -- Re-runs the fill trigger, so the exclusion constraint checks the new time.
    update public.booking_assignees set active = active where booking_id = new.id;
  end if;
  return null;
end
$$;

create trigger bookings_after_update
after update on public.bookings
for each row execute function private.bookings_after_update();

---------------------------------------------------------------- access
create or replace function private.is_booking_assignee(p_booking uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.booking_assignees a
     where a.booking_id = p_booking and a.user_id = auth.uid()
       and a.tenant_id = private.current_tenant_id()
  )
$$;

alter table public.bookings enable row level security;
alter table public.booking_assignees enable row level security;

create policy bookings_manager_all on public.bookings for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.is_manager())
         and (select private.feature_enabled('scheduling')))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.is_manager())
              and (select private.feature_enabled('scheduling')));

create policy bookings_assignee_select on public.bookings for select
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('scheduling'))
         and private.is_booking_assignee(id));

create policy booking_assignees_manager_all on public.booking_assignees for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.is_manager())
         and (select private.feature_enabled('scheduling')))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.is_manager())
              and (select private.feature_enabled('scheduling')));

-- Staff see who else is on their bookings (names come from profiles, already visible in the business).
create policy booking_assignees_coworker_select on public.booking_assignees for select
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('scheduling'))
         and private.is_booking_assignee(booking_id));

grant select, insert, update, delete on public.bookings, public.booking_assignees to authenticated;

---------------------------------------------------------------- clash check (friendly warning)
-- Scheduled bookings that overlap the given time for any of the given people.
create or replace function public.booking_clashes(
  p_user_ids uuid[], p_starts timestamptz, p_ends timestamptz, p_ignore_booking uuid default null)
returns table (user_id uuid, full_name text, booking_id uuid, starts_at timestamptz, ends_at timestamptz, job_summary text)
language sql stable
security invoker
set search_path = ''
as $$
  select a.user_id, p.full_name, b.id, b.starts_at, b.ends_at, j.summary
    from public.booking_assignees a
    join public.bookings b on b.id = a.booking_id
    join public.profiles p on p.id = a.user_id
    join public.jobs j on j.id = b.job_id
   where a.user_id = any (p_user_ids)
     and a.active
     and a.time_range && tstzrange(p_starts, p_ends, '[)')
     and (p_ignore_booking is null or b.id <> p_ignore_booking)
   order by b.starts_at, p.full_name
$$;

---------------------------------------------------------------- save (one call, all or nothing)
create or replace function public.save_booking(
  p_id uuid, p_job_id uuid, p_starts timestamptz, p_ends timestamptz, p_user_ids uuid[], p_notes text default null)
returns public.bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tenant uuid := private.current_tenant_id();
  v public.bookings;
  c record;
begin
  if not private.is_manager() or not private.feature_enabled('scheduling') then
    raise exception 'Only the owner or a manager can change the schedule' using errcode = '42501';
  end if;
  if p_ends <= p_starts then
    raise exception 'The finish time must be after the start time' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(coalesce(p_user_ids, '{}')) u
              where not exists (select 1 from public.profiles p where p.id = u and p.tenant_id = v_tenant and p.active)) then
    raise exception 'Pick people who are active in this business' using errcode = '22023';
  end if;

  select * into c from public.booking_clashes(coalesce(p_user_ids, '{}'), p_starts, p_ends, p_id) limit 1;
  if found then
    raise exception '% is already booked from % to % (%)', coalesce(c.full_name, 'Someone'),
      to_char(c.starts_at at time zone (select coalesce(t.timezone, 'UTC') from public.tenants t where t.id = v_tenant), 'Dy DD Mon HH24:MI'),
      to_char(c.ends_at at time zone (select coalesce(t.timezone, 'UTC') from public.tenants t where t.id = v_tenant), 'HH24:MI'),
      coalesce(c.job_summary, 'another job')
      using errcode = 'BK001';
  end if;

  if p_id is null then
    insert into public.bookings (tenant_id, job_id, starts_at, ends_at, notes)
    values (v_tenant, p_job_id, p_starts, p_ends, nullif(btrim(p_notes), ''))
    returning * into v;
  else
    update public.bookings
       set starts_at = p_starts, ends_at = p_ends, notes = nullif(btrim(p_notes), ''), status = 'scheduled'
     where id = p_id and tenant_id = v_tenant
    returning * into v;
    if not found then
      raise exception 'Booking not found' using errcode = 'P0002';
    end if;
    if v.job_id <> p_job_id then
      raise exception 'A booking can''t be moved to another job' using errcode = '22023';
    end if;
  end if;

  delete from public.booking_assignees where booking_id = v.id and user_id <> all (coalesce(p_user_ids, '{}'));
  insert into public.booking_assignees (tenant_id, booking_id, user_id, time_range)
  select v_tenant, v.id, u, tstzrange(v.starts_at, v.ends_at, '[)')
    from (select distinct unnest(coalesce(p_user_ids, '{}')) u) s
  on conflict (booking_id, user_id) do nothing;

  return v;
exception
  when exclusion_violation then
    raise exception 'Someone on this booking is already booked at that time. Refresh and try again.' using errcode = 'BK001';
end
$$;

create or replace function public.cancel_booking(p_id uuid)
returns public.bookings
language sql
security invoker
set search_path = ''
as $$
  update public.bookings set status = 'cancelled' where id = p_id returning *
$$;

---------------------------------------------------------------- job sheet (what the person on site needs)
-- Job, address and customer contact for one booking. Managers, or people assigned to it.
-- Customers stay manager-only in RLS; this returns only name, phone and address. No prices.
create or replace function public.booking_job_sheet(p_booking uuid)
returns table (
  booking_id uuid, starts_at timestamptz, ends_at timestamptz, status text, notes text,
  job_id uuid, job_summary text, job_status text, site_address text,
  customer_name text, customer_phone text, customer_address text,
  people jsonb)
language plpgsql stable
security definer
set search_path = ''
as $$
begin
  if not private.feature_enabled('scheduling')
     or not (private.is_manager() or private.is_booking_assignee(p_booking)) then
    raise exception 'You can only open job sheets for your own bookings' using errcode = '42501';
  end if;
  return query
  select b.id, b.starts_at, b.ends_at, b.status, b.notes,
         j.id, j.summary, j.status, j.site_address,
         c.name, c.phone, c.address,
         coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name) order by p.full_name)
                     from public.booking_assignees a join public.profiles p on p.id = a.user_id
                    where a.booking_id = b.id), '[]'::jsonb)
    from public.bookings b
    join public.jobs j on j.id = b.job_id and j.tenant_id = b.tenant_id
    left join public.customers c on c.id = j.customer_id and c.tenant_id = j.tenant_id
   where b.id = p_booking and b.tenant_id = private.current_tenant_id();
end
$$;

revoke all on function public.booking_job_sheet(uuid) from public, anon;
grant execute on function public.booking_job_sheet(uuid) to authenticated;
revoke all on function public.save_booking(uuid, uuid, timestamptz, timestamptz, uuid[], text) from public, anon;
grant execute on function public.save_booking(uuid, uuid, timestamptz, timestamptz, uuid[], text) to authenticated;
revoke all on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;
revoke all on function public.booking_clashes(uuid[], timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.booking_clashes(uuid[], timestamptz, timestamptz, uuid) to authenticated;

---------------------------------------------------------------- live updates
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'bookings') then
      alter publication supabase_realtime add table public.bookings;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'booking_assignees') then
      alter publication supabase_realtime add table public.booking_assignees;
    end if;
  end if;
end
$$;
