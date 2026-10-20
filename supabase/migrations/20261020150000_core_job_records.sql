-- Core: job records. A job becomes a record people work on together: instructions, who's on it,
-- a dated updates feed, photos tagged Before / Progress / Completion, a simple status, and search.
-- Generic (no trade words), so any business can use it. The feed and the job list are switched
-- on per business with tenants.features.job_records; the job fields and assignees are plain core.
--
-- Access:
--   owner / manager : every job in their business; create and edit jobs, assign people, set status
--   everyone else   : jobs they are assigned to (or booked on); post updates and photos on them,
--                     but not once the job is completed. They cannot edit the job itself.
--   Businesses with Timesheets on keep letting staff read every job's row (title and address), so
--   staff can still pick a job for their hours. Updates and files still follow assignment.
--
-- Job status for records: todo -> in_progress -> completed (or cancelled). 'enquiry' stays for the
-- flooring sales path, which keeps its own stages.

---------------------------------------------------------------- jobs: record fields
alter table public.jobs
  add column if not exists instructions text,
  add column if not exists start_on     date,
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid,
  add column if not exists created_by   uuid default auth.uid(),
  add column if not exists updated_at   timestamptz not null default now(),
  add column if not exists search_doc   tsvector;

alter table public.jobs
  add constraint jobs_status_values check (status in ('enquiry', 'todo', 'in_progress', 'completed', 'cancelled')),
  add constraint jobs_summary_length check (summary is null or length(summary) <= 200),
  add constraint jobs_instructions_length check (instructions is null or length(instructions) <= 5000),
  add constraint jobs_completed_shape check ((status = 'completed') = (completed_at is not null)),
  add constraint jobs_completed_by_fk foreign key (tenant_id, completed_by) references public.profiles (tenant_id, id);

create index if not exists jobs_tenant_status_idx on public.jobs (tenant_id, status, created_at desc);
create index if not exists jobs_search_idx on public.jobs using gin (search_doc);

---------------------------------------------------------------- assignees (no time range needed)
create table public.job_assignees (
  tenant_id   uuid not null references public.tenants (id),
  job_id      uuid not null,
  user_id     uuid not null,
  added_by    uuid not null default auth.uid(),
  created_at  timestamptz not null default now(),
  primary key (job_id, user_id),
  constraint job_assignees_job_fk  foreign key (tenant_id, job_id)  references public.jobs (tenant_id, id) on delete cascade,
  constraint job_assignees_user_fk foreign key (tenant_id, user_id) references public.profiles (tenant_id, id) on delete cascade
);
create index job_assignees_user_idx on public.job_assignees (tenant_id, user_id);

-- Assigned people (or people booked on it) may open a job. Replaces the bookings-only version.
create or replace function private.can_access_job(p_job uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select private.is_manager()
      or exists (select 1 from public.job_assignees a
                  where a.job_id = p_job and a.tenant_id = private.current_tenant_id() and a.user_id = auth.uid())
      or (private.feature_enabled('scheduling') and exists (
            select 1 from public.bookings b
              join public.booking_assignees a on a.booking_id = b.id
             where b.job_id = p_job and b.tenant_id = private.current_tenant_id()
               and a.user_id = auth.uid()))
$$;

-- Fix: the original "manager all" policies on jobs and customers only checked the business on
-- insert, so any staff member could add a job or a customer. Now only owners and managers can.
drop policy if exists jobs_manager_all on public.jobs;
create policy jobs_manager_all on public.jobs for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.is_manager()))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.is_manager()));
drop policy if exists customers_manager_all on public.customers;
create policy customers_manager_all on public.customers for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.is_manager()))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.is_manager()));

-- Staff no longer read every job in the business, except where Timesheets needs it.
drop policy if exists jobs_member_select on public.jobs;
create policy jobs_member_select on public.jobs for select
  using (tenant_id = (select private.current_tenant_id())
         and ((select private.is_manager())
              or private.can_access_job(id)
              or (select private.feature_enabled('timesheets'))));

alter table public.job_assignees enable row level security;
create policy job_assignees_select on public.job_assignees for select
  using (tenant_id = (select private.current_tenant_id()) and private.can_access_job(job_id));
create policy job_assignees_manager_insert on public.job_assignees for insert
  with check (tenant_id = (select private.current_tenant_id()) and (select private.is_manager()) and added_by = auth.uid());
create policy job_assignees_manager_delete on public.job_assignees for delete
  using (tenant_id = (select private.current_tenant_id()) and (select private.is_manager()));

revoke all on public.job_assignees from anon, authenticated;
grant select, insert, delete on public.job_assignees to authenticated;

---------------------------------------------------------------- updates feed
create table public.job_updates (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id),
  job_id      uuid not null,
  author_id   uuid not null default auth.uid(),
  body        text check (body is null or length(btrim(body)) between 1 and 4000),
  created_at  timestamptz not null default now(),
  edited_at   timestamptz,
  constraint job_updates_tenant_id_id_key unique (tenant_id, id),
  constraint job_updates_job_fk    foreign key (tenant_id, job_id)    references public.jobs (tenant_id, id) on delete cascade,
  constraint job_updates_author_fk foreign key (tenant_id, author_id) references public.profiles (tenant_id, id)
);
create index job_updates_job_idx on public.job_updates (tenant_id, job_id, created_at desc);

create or replace function private.job_is_open(p_job uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.jobs j
                  where j.id = p_job and j.tenant_id = private.current_tenant_id()
                    and j.status in ('todo', 'in_progress'))
$$;

alter table public.job_updates enable row level security;
create policy job_updates_select on public.job_updates for select
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('job_records'))
         and private.can_access_job(job_id));
create policy job_updates_insert on public.job_updates for insert
  with check (tenant_id = (select private.current_tenant_id())
              and (select private.feature_enabled('job_records'))
              and author_id = auth.uid()
              and private.can_access_job(job_id)
              and ((select private.is_manager()) or private.job_is_open(job_id)));
-- Authors can fix their own update for a day; managers can always tidy up.
create policy job_updates_update on public.job_updates for update
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('job_records'))
         and ((select private.is_manager())
              or (author_id = auth.uid() and created_at > now() - interval '24 hours' and private.job_is_open(job_id))))
  with check (tenant_id = (select private.current_tenant_id()));
create policy job_updates_delete on public.job_updates for delete
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('job_records'))
         and ((select private.is_manager())
              or (author_id = auth.uid() and created_at > now() - interval '24 hours' and private.job_is_open(job_id))));

revoke all on public.job_updates from anon, authenticated;
grant select, insert, delete on public.job_updates to authenticated;
grant update (body) on public.job_updates to authenticated;

create or replace function private.job_updates_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.body := nullif(btrim(new.body), '');
  if tg_op = 'UPDATE' and new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end
$$;
create trigger job_updates_touch before insert or update on public.job_updates
for each row execute function private.job_updates_touch();

-- The first update on a job that hasn't started moves it to In progress.
create or replace function private.job_updates_start_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.jobs set status = 'in_progress'
   where id = new.job_id and tenant_id = new.tenant_id and status = 'todo';
  return null;
end
$$;
create trigger job_updates_start_job after insert on public.job_updates
for each row execute function private.job_updates_start_job();

---------------------------------------------------------------- photos: stage and link to an update
alter table public.job_files
  add column if not exists stage     text check (stage in ('before', 'progress', 'completion')),
  add column if not exists update_id uuid,
  add constraint job_files_update_fk foreign key (tenant_id, update_id)
    references public.job_updates (tenant_id, id) on delete set null (update_id);
create index if not exists job_files_stage_idx on public.job_files (tenant_id, job_id, stage, created_at);
create index if not exists job_files_update_idx on public.job_files (tenant_id, update_id) where update_id is not null;

create or replace function private.job_files_update_same_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.update_id is not null and not exists (
       select 1 from public.job_updates u
        where u.id = new.update_id and u.tenant_id = new.tenant_id and u.job_id = new.job_id) then
    raise exception 'That update belongs to a different job' using errcode = '23514';
  end if;
  return new;
end
$$;
create trigger job_files_update_same_job before insert or update of update_id, job_id on public.job_files
for each row execute function private.job_files_update_same_job();

grant update (caption, stage) on public.job_files to authenticated;

---------------------------------------------------------------- jobs: status, who did what, search text
create or replace function private.job_search_doc(p_job uuid, p_summary text, p_address text, p_instructions text, p_customer uuid, p_tenant uuid)
returns tsvector
language sql stable
security definer
set search_path = ''
as $$
  select to_tsvector('simple',
           concat_ws(' ', p_summary, p_address, p_instructions,
             (select c.name from public.customers c where c.id = p_customer and c.tenant_id = p_tenant),
             (select string_agg(u.body, ' ') from public.job_updates u where u.job_id = p_job and u.tenant_id = p_tenant)))
$$;

create or replace function private.jobs_records_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if current_user in ('authenticated', 'anon') then
      new.created_by := auth.uid();
    end if;
  else
    new.created_by := old.created_by;
    new.updated_at := now();
  end if;
  -- Completed: stamp when and who; reopening clears it.
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    new.completed_at := now();
    new.completed_by := coalesce(auth.uid(), new.completed_by);
  elsif new.status <> 'completed' then
    new.completed_at := null;
    new.completed_by := null;
  end if;
  new.summary := nullif(btrim(new.summary), '');
  new.instructions := nullif(btrim(new.instructions), '');
  new.site_address := nullif(btrim(new.site_address), '');
  new.search_doc := private.job_search_doc(new.id, new.summary, new.site_address, new.instructions, new.customer_id, new.tenant_id);
  return new;
end
$$;
drop trigger if exists jobs_records_touch on public.jobs;
create trigger jobs_records_touch before insert or update on public.jobs
for each row execute function private.jobs_records_touch();

-- Keep the search text in step when updates or the customer's name change.
create or replace function private.job_updates_refresh_search()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare r record;
begin
  r := coalesce(new, old);
  update public.jobs j
     set search_doc = private.job_search_doc(j.id, j.summary, j.site_address, j.instructions, j.customer_id, j.tenant_id)
   where j.id = r.job_id and j.tenant_id = r.tenant_id;
  return null;
end
$$;
create trigger job_updates_refresh_search after insert or update of body or delete on public.job_updates
for each row execute function private.job_updates_refresh_search();

create or replace function private.customers_refresh_job_search()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.jobs j
     set search_doc = private.job_search_doc(j.id, j.summary, j.site_address, j.instructions, j.customer_id, j.tenant_id)
   where j.customer_id = new.id and j.tenant_id = new.tenant_id;
  return null;
end
$$;
create trigger customers_refresh_job_search after update of name on public.customers
for each row execute function private.customers_refresh_job_search();

-- Existing rows get their search text now.
update public.jobs set updated_at = updated_at;

---------------------------------------------------------------- reading jobs
-- Search words become prefix matches, so "bath" finds "bathroom".
create or replace function private.prefix_tsquery(p_text text)
returns tsquery
language sql immutable
set search_path = ''
as $$
  select case when string_agg(w, '') is null then null
              else to_tsquery('simple', string_agg(quote_literal(w) || ':*', ' & ')) end
    from regexp_split_to_table(lower(coalesce(p_text, '')), '[^[:alnum:]]+') as w
   where w <> ''
$$;

-- The jobs list: the jobs this person can open, newest activity first. Workers see only their jobs.
create or replace function public.job_list(p_filter text default 'active', p_query text default null, p_limit integer default 100)
returns table (
  id uuid, summary text, status text, site_address text, customer_name text,
  start_on date, completed_at timestamptz, people_count integer,
  last_update_at timestamptz, last_update_by text, matched boolean)
language plpgsql stable
security definer
set search_path = ''
as $$
declare
  q tsquery := private.prefix_tsquery(p_query);
begin
  if not private.feature_enabled('job_records') then
    return;
  end if;
  if p_filter not in ('active', 'completed', 'all') then
    raise exception 'Filter must be active, completed or all' using errcode = '22023';
  end if;
  return query
  select j.id, j.summary, j.status, j.site_address, c.name,
         j.start_on, j.completed_at,
         (select count(*)::integer from public.job_assignees a where a.job_id = j.id),
         lu.created_at, lp.full_name,
         q is not null
    from public.jobs j
    left join public.customers c on c.id = j.customer_id and c.tenant_id = j.tenant_id
    left join lateral (select u.created_at, u.author_id from public.job_updates u
                        where u.job_id = j.id and u.tenant_id = j.tenant_id
                        order by u.created_at desc limit 1) lu on true
    left join public.profiles lp on lp.id = lu.author_id
   where j.tenant_id = private.current_tenant_id()
     and private.can_access_job(j.id)
     and j.status in ('todo', 'in_progress', 'completed')
     and (p_filter = 'all' or (p_filter = 'active' and j.status in ('todo', 'in_progress'))
                           or (p_filter = 'completed' and j.status = 'completed'))
     and (q is null or j.search_doc @@ q)
   order by case when q is not null then ts_rank(j.search_doc, q) end desc nulls last,
            case when p_filter = 'completed' then j.completed_at end desc nulls last,
            case j.status when 'in_progress' then 0 when 'todo' then 1 else 2 end,
            coalesce(lu.created_at, j.created_at) desc
   limit least(greatest(coalesce(p_limit, 100), 1), 500);
end
$$;

-- One job's page: the job, its customer (name, phone, address only) and the people on it.
create or replace function public.job_record(p_job uuid)
returns table (
  id uuid, summary text, status text, site_address text, instructions text, start_on date,
  created_at timestamptz, created_by_name text, completed_at timestamptz, completed_by_name text,
  customer_id uuid, customer_name text, customer_phone text, customer_address text, people jsonb)
language plpgsql stable
security definer
set search_path = ''
as $$
begin
  if not private.feature_enabled('job_records') or not private.can_access_job(p_job) then
    raise exception 'You can only open jobs you are on' using errcode = '42501';
  end if;
  return query
  select j.id, j.summary, j.status, j.site_address, j.instructions, j.start_on,
         j.created_at, cb.full_name, j.completed_at, cp.full_name,
         c.id, c.name, c.phone, c.address,
         coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name, 'role', p.role) order by p.full_name)
                     from public.job_assignees a join public.profiles p on p.id = a.user_id
                    where a.job_id = j.id), '[]'::jsonb)
    from public.jobs j
    left join public.customers c on c.id = j.customer_id and c.tenant_id = j.tenant_id
    left join public.profiles cb on cb.id = j.created_by
    left join public.profiles cp on cp.id = j.completed_by
   where j.id = p_job and j.tenant_id = private.current_tenant_id();
end
$$;

---------------------------------------------------------------- writing jobs (owner / manager)
-- Create or edit a job in one step: the customer (an existing one, or a new one from p_customer),
-- the job fields, and exactly who is on it. Runs as the caller, so RLS still applies.
create or replace function public.save_job(
  p_job uuid, p_summary text, p_site_address text, p_instructions text, p_start_on date,
  p_customer_id uuid, p_customer jsonb, p_people uuid[])
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tenant   uuid := private.current_tenant_id();
  v_customer uuid := p_customer_id;
  v_job      uuid := p_job;
begin
  if not private.is_manager() then
    raise exception 'Only the owner or a manager can add or change jobs' using errcode = '42501';
  end if;
  if not private.feature_enabled('job_records') then
    raise exception 'Job records are not switched on for this business' using errcode = '42501';
  end if;
  if nullif(btrim(p_summary), '') is null then
    raise exception 'Say what the job is' using errcode = '23514';
  end if;

  if v_customer is null and p_customer is not null then
    if nullif(btrim(p_customer ->> 'name'), '') is null then
      raise exception 'Add the customer''s name' using errcode = '23514';
    end if;
    insert into public.customers (tenant_id, name, phone, email, address)
    values (v_tenant, p_customer ->> 'name', p_customer ->> 'phone', p_customer ->> 'email', p_customer ->> 'address')
    returning id into v_customer;
  end if;

  if v_job is null then
    insert into public.jobs (tenant_id, customer_id, summary, site_address, instructions, start_on, status)
    values (v_tenant, v_customer, p_summary,
            coalesce(nullif(btrim(p_site_address), ''),
                     (select c.address from public.customers c where c.id = v_customer and c.tenant_id = v_tenant)),
            p_instructions, p_start_on, 'todo')
    returning id into v_job;
  else
    update public.jobs
       set customer_id = v_customer, summary = p_summary, site_address = p_site_address,
           instructions = p_instructions, start_on = p_start_on
     where id = v_job and tenant_id = v_tenant and status in ('todo', 'in_progress', 'completed');
    if not found then
      raise exception 'Job not found' using errcode = 'P0002';
    end if;
  end if;

  if p_people is not null then
    delete from public.job_assignees a
     where a.job_id = v_job and a.tenant_id = v_tenant and not (a.user_id = any (p_people));
    insert into public.job_assignees (tenant_id, job_id, user_id)
    select v_tenant, v_job, u from unnest(p_people) as u
    on conflict (job_id, user_id) do nothing;
  end if;

  return v_job;
end
$$;

revoke all on function public.job_list(text, text, integer) from public, anon;
grant execute on function public.job_list(text, text, integer) to authenticated;
revoke all on function public.job_record(uuid) from public, anon;
grant execute on function public.job_record(uuid) to authenticated;
revoke all on function public.save_job(uuid, text, text, text, date, uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.save_job(uuid, text, text, text, date, uuid, jsonb, uuid[]) to authenticated;

---------------------------------------------------------------- live updates
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'job_updates') then
      alter publication supabase_realtime add table public.job_updates;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'job_assignees') then
      alter publication supabase_realtime add table public.job_assignees;
    end if;
    -- Photos arrive a little after their update (they upload in the background), so watch them too.
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'job_files') then
      alter publication supabase_realtime add table public.job_files;
    end if;
  end if;
end $$;
