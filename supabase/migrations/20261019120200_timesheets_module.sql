-- Module: Timesheets (behind tenants.features.timesheets).
-- Follows "Timesheets Module — Design & Implementation Plan" (2026-10-18), reconciled with
-- the tenant-settings brief. Depends on core only; core never references this module.
--
-- Tables
--   ts_assignments    which supervisor approves for which worker (one approver per worker)
--   ts_cost_codes     optional work categories (setting costCodes)
--   ts_weeks          one row per worker per week: status + approval trail
--   ts_entries        one block of work; ALWAYS has duration_minutes
--   ts_clock_sessions a running clock (max one per worker); becomes an entry on clock-out
--   ts_events         audit trail: submit, approve, reject, reopen, edits after submit
-- Views (security_invoker, so RLS applies)
--   v_ts_daily, v_ts_weekly, v_ts_job_hours
--
-- Deferred to later stages (settings will be added then, not now):
--   reminders + submit day (T4, pg_cron), clock location stamp (T4, GDPR sign-off),
--   prefill from bookings (T4), export Edge Function (T3; status 'exported' exists already).

create extension if not exists btree_gist with schema extensions;

-------------------------------------------------------------------------------
-- Settings: defaults + validator (registered with core by naming convention)
-------------------------------------------------------------------------------

-- Must match src/modules/timesheets/settings.defaults.json (checked by tests).
create or replace function private.settings_defaults__timesheets()
returns jsonb
language sql immutable
set search_path = ''
as $$
  select '{
    "entryMode": "start_end",
    "breaks": "off",
    "fixedBreakMinutes": 30,
    "approval": "manager",
    "logAgainst": "job",
    "requireJob": false,
    "costCodes": false,
    "weekStartsOn": "monday",
    "roundingMinutes": 15,
    "overtimeDailyAfterMinutes": null,
    "overtimeWeeklyAfterMinutes": 2340
  }'::jsonb
$$;

create or replace function private.ts_is_whole_number(p jsonb, lo int, hi int)
returns boolean
language sql immutable
set search_path = ''
as $$
  select jsonb_typeof(p) = 'number'
     and (p #>> '{}')::numeric = trunc((p #>> '{}')::numeric)
     and (p #>> '{}')::numeric between lo and hi
$$;

create or replace function private.settings_validate__timesheets(p jsonb)
returns jsonb
language plpgsql stable
security definer
set search_path = ''
as $$
declare
  k text;
  v_tenant uuid := private.current_tenant_id();
  v_current jsonb;
begin
  for k in select jsonb_object_keys(p) loop
    if k not in ('entryMode', 'breaks', 'fixedBreakMinutes', 'approval', 'logAgainst', 'requireJob',
                 'costCodes', 'weekStartsOn', 'roundingMinutes',
                 'overtimeDailyAfterMinutes', 'overtimeWeeklyAfterMinutes') then
      raise exception 'Timesheets: unknown setting "%"', k using errcode = '22023';
    end if;
  end loop;

  if p ? 'entryMode' and not (p ->> 'entryMode' in ('start_end', 'duration', 'clock') and jsonb_typeof(p -> 'entryMode') = 'string') then
    raise exception 'Timesheets: entryMode must be start_end, duration or clock' using errcode = '22023';
  end if;
  if p ? 'breaks' and not (p ->> 'breaks' in ('off', 'fixed', 'manual') and jsonb_typeof(p -> 'breaks') = 'string') then
    raise exception 'Timesheets: breaks must be off, fixed or manual' using errcode = '22023';
  end if;
  if p ? 'fixedBreakMinutes' and not private.ts_is_whole_number(p -> 'fixedBreakMinutes', 0, 120) then
    raise exception 'Timesheets: fixedBreakMinutes must be a whole number from 0 to 120' using errcode = '22023';
  end if;
  if p ? 'approval' and not (p ->> 'approval' in ('none', 'manager', 'supervisor') and jsonb_typeof(p -> 'approval') = 'string') then
    raise exception 'Timesheets: approval must be none, manager or supervisor' using errcode = '22023';
  end if;
  if p ? 'logAgainst' and not (p ->> 'logAgainst' in ('job', 'none') and jsonb_typeof(p -> 'logAgainst') = 'string') then
    raise exception 'Timesheets: logAgainst must be job or none' using errcode = '22023';
  end if;
  if p ? 'requireJob' and jsonb_typeof(p -> 'requireJob') <> 'boolean' then
    raise exception 'Timesheets: requireJob must be true or false' using errcode = '22023';
  end if;
  if p ? 'costCodes' and jsonb_typeof(p -> 'costCodes') <> 'boolean' then
    raise exception 'Timesheets: costCodes must be true or false' using errcode = '22023';
  end if;
  if p ? 'weekStartsOn' and not (jsonb_typeof(p -> 'weekStartsOn') = 'string' and p ->> 'weekStartsOn' in
       ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')) then
    raise exception 'Timesheets: weekStartsOn must be a day of the week' using errcode = '22023';
  end if;
  if p ? 'roundingMinutes' and not (private.ts_is_whole_number(p -> 'roundingMinutes', 0, 60)
       and (p ->> 'roundingMinutes')::int in (0, 5, 6, 10, 15, 30, 60)) then
    raise exception 'Timesheets: roundingMinutes must be 0, 5, 6, 10, 15, 30 or 60' using errcode = '22023';
  end if;
  if p ? 'overtimeDailyAfterMinutes' and not (jsonb_typeof(p -> 'overtimeDailyAfterMinutes') = 'null'
       or private.ts_is_whole_number(p -> 'overtimeDailyAfterMinutes', 1, 1440)) then
    raise exception 'Timesheets: overtimeDailyAfterMinutes must be empty or 1–1440' using errcode = '22023';
  end if;
  if p ? 'overtimeWeeklyAfterMinutes' and not (jsonb_typeof(p -> 'overtimeWeeklyAfterMinutes') = 'null'
       or private.ts_is_whole_number(p -> 'overtimeWeeklyAfterMinutes', 1, 10080)) then
    raise exception 'Timesheets: overtimeWeeklyAfterMinutes must be empty or 1–10080' using errcode = '22023';
  end if;

  -- Changing the week start once weeks exist would split existing weeks.
  if v_tenant is not null and p ? 'weekStartsOn' then
    v_current := private.timesheets_settings(v_tenant);
    if p ->> 'weekStartsOn' <> v_current ->> 'weekStartsOn'
       and exists (select 1 from public.ts_weeks w where w.tenant_id = v_tenant) then
      raise exception 'The week start day can''t be changed once timesheets have been recorded' using errcode = '22023';
    end if;
  end if;

  return p;
end
$$;

create or replace function private.timesheets_settings(p_tenant uuid)
returns jsonb
language sql stable
security definer
set search_path = ''
as $$
  select private.settings_defaults__timesheets()
         || coalesce((select t.settings -> 'timesheets' from public.tenants t where t.id = p_tenant), '{}'::jsonb)
$$;

create or replace function private.tenant_timezone(p_tenant uuid)
returns text
language sql stable
security definer
set search_path = ''
as $$
  select coalesce((select t.timezone from public.tenants t where t.id = p_tenant), 'UTC')
$$;

-- First day of the tenant's week containing p_date.
create or replace function private.ts_week_start(p_tenant uuid, p_date date)
returns date
language sql stable
security definer
set search_path = ''
as $$
  select p_date - ((extract(isodow from p_date)::int
                    - array_position(array['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
                                     private.timesheets_settings(p_tenant) ->> 'weekStartsOn')
                    + 7) % 7)
$$;

-------------------------------------------------------------------------------
-- ts_assignments
-------------------------------------------------------------------------------

create table public.ts_assignments (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  supervisor_id uuid not null,
  worker_id     uuid not null,
  created_at    timestamptz not null default now(),
  constraint ts_assignments_supervisor_fk foreign key (tenant_id, supervisor_id) references public.profiles (tenant_id, id) on delete cascade,
  constraint ts_assignments_worker_fk     foreign key (tenant_id, worker_id)     references public.profiles (tenant_id, id) on delete cascade,
  constraint ts_assignments_not_self check (supervisor_id <> worker_id),
  constraint ts_assignments_one_approver unique (tenant_id, worker_id)
);
create index ts_assignments_supervisor_idx on public.ts_assignments (tenant_id, supervisor_id);

-- Can the current user act on this worker's timesheets?
create or replace function private.ts_can_access_worker(p_worker uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select p_worker = auth.uid()
      or private.is_manager()
      or (private.is_supervisor() and exists (
            select 1 from public.ts_assignments a
             where a.tenant_id = private.current_tenant_id()
               and a.supervisor_id = auth.uid()
               and a.worker_id = p_worker))
$$;

alter table public.ts_assignments enable row level security;

create policy ts_assignments_select on public.ts_assignments
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('timesheets'))
         and ((select private.is_manager()) or supervisor_id = (select auth.uid())));

create policy ts_assignments_write on public.ts_assignments
  for all to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('timesheets'))
         and (select private.is_manager()))
  with check (tenant_id = (select private.current_tenant_id())
              and (select private.is_manager()));

-------------------------------------------------------------------------------
-- ts_cost_codes
-------------------------------------------------------------------------------

create table public.ts_cost_codes (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  code       text not null check (length(btrim(code)) between 1 and 40),
  label      text not null check (length(btrim(label)) between 1 and 200),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  constraint ts_cost_codes_tenant_id_id_key unique (tenant_id, id),
  constraint ts_cost_codes_code_key unique (tenant_id, code)
);
create index ts_cost_codes_active_idx on public.ts_cost_codes (tenant_id) where active;

alter table public.ts_cost_codes enable row level security;

create policy ts_cost_codes_select on public.ts_cost_codes
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('timesheets'))
         and (active or (select private.is_manager())));

create policy ts_cost_codes_write on public.ts_cost_codes
  for all to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('timesheets'))
         and (select private.is_manager()))
  with check (tenant_id = (select private.current_tenant_id())
              and (select private.is_manager()));

-------------------------------------------------------------------------------
-- ts_weeks
-------------------------------------------------------------------------------

create table public.ts_weeks (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  worker_id     uuid not null,
  week_start    date not null,
  status        text not null default 'draft'
                check (status in ('draft', 'submitted', 'approved', 'rejected', 'exported')),
  submitted_at  timestamptz,
  decided_by    uuid,
  decided_at    timestamptz,
  reject_reason text check (reject_reason is null or length(reject_reason) <= 1000),
  exported_at   timestamptz,
  created_at    timestamptz not null default now(),
  constraint ts_weeks_worker_fk  foreign key (tenant_id, worker_id)  references public.profiles (tenant_id, id),
  constraint ts_weeks_decider_fk foreign key (tenant_id, decided_by) references public.profiles (tenant_id, id),
  constraint ts_weeks_tenant_id_id_key unique (tenant_id, id),
  constraint ts_weeks_unique unique (tenant_id, worker_id, week_start),
  constraint ts_weeks_reject_needs_reason check (status <> 'rejected' or length(btrim(coalesce(reject_reason, ''))) > 0)
);
create index ts_weeks_tenant_week_status_idx on public.ts_weeks (tenant_id, week_start, status);

alter table public.ts_weeks enable row level security;

create policy ts_weeks_select on public.ts_weeks
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('timesheets'))
         and private.ts_can_access_worker(worker_id));

-- Status changes only via RPCs; rows are created by the entry trigger.
revoke insert, update, delete on public.ts_weeks from anon, authenticated;

-- Finds or creates the worker's week row (draft). Used by the entry trigger.
create or replace function private.ts_ensure_week(p_tenant uuid, p_worker uuid, p_week_start date)
returns public.ts_weeks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week public.ts_weeks;
begin
  insert into public.ts_weeks (tenant_id, worker_id, week_start)
  values (p_tenant, p_worker, p_week_start)
  on conflict (tenant_id, worker_id, week_start) do nothing;

  select * into v_week from public.ts_weeks
   where tenant_id = p_tenant and worker_id = p_worker and week_start = p_week_start;
  return v_week;
end
$$;

-------------------------------------------------------------------------------
-- ts_events (audit trail)
-------------------------------------------------------------------------------

create table public.ts_events (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  week_id    uuid not null,
  actor_id   uuid,
  action     text not null check (action in ('submitted', 'approved', 'rejected', 'reopened',
                                             'entry_added', 'entry_changed', 'entry_deleted', 'exported')),
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ts_events_week_fk foreign key (tenant_id, week_id) references public.ts_weeks (tenant_id, id) on delete cascade
);
create index ts_events_week_idx on public.ts_events (tenant_id, week_id, created_at);

alter table public.ts_events enable row level security;

create policy ts_events_select on public.ts_events
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('timesheets'))
         and exists (select 1 from public.ts_weeks w
                      where w.tenant_id = ts_events.tenant_id and w.id = ts_events.week_id));  -- inherits ts_weeks RLS

revoke insert, update, delete on public.ts_events from anon, authenticated;

create or replace function private.ts_log(p_tenant uuid, p_week uuid, p_action text, p_detail jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.ts_events (tenant_id, week_id, actor_id, action, detail)
  values (p_tenant, p_week, auth.uid(), p_action, coalesce(p_detail, '{}'::jsonb))
$$;

-------------------------------------------------------------------------------
-- ts_entries
-------------------------------------------------------------------------------

create table public.ts_entries (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants (id) on delete cascade,
  week_id          uuid not null,                -- set by trigger
  worker_id        uuid not null,
  work_date        date not null,                -- local date; derived from started_at when times exist
  job_id           uuid,
  cost_code_id     uuid,
  started_at       timestamptz,                  -- null for duration-only entries
  ended_at         timestamptz,                  -- null for duration-only entries
  break_minutes    integer not null default 0,
  duration_minutes integer not null,             -- always stored: exact net minutes (rounding is applied in views)
  source           text not null default 'manual' check (source in ('manual', 'clock', 'booking')),
  notes            text check (notes is null or length(notes) <= 2000),
  created_by       uuid not null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint ts_entries_week_fk      foreign key (tenant_id, week_id)      references public.ts_weeks (tenant_id, id),
  constraint ts_entries_worker_fk    foreign key (tenant_id, worker_id)    references public.profiles (tenant_id, id),
  constraint ts_entries_job_fk       foreign key (tenant_id, job_id)       references public.jobs (tenant_id, id),
  constraint ts_entries_cost_code_fk foreign key (tenant_id, cost_code_id) references public.ts_cost_codes (tenant_id, id),

  constraint ts_entries_break_range    check (break_minutes between 0 and 600),
  constraint ts_entries_duration_range check (duration_minutes between 1 and 1440),
  constraint ts_entries_clock_has_times check (source <> 'clock' or started_at is not null),
  -- One shape check keeps rows from every entry mode consistent:
  --   duration-only: no times, no break (the typed hours are net)
  --   timed: both times, end after start, ≤ 24 h, duration = span − break
  constraint ts_entries_shape check (
    case
      when started_at is null and ended_at is null then break_minutes = 0
      when started_at is not null and ended_at is not null then
            ended_at > started_at
        and ended_at - started_at <= interval '24 hours'
        and duration_minutes = floor(extract(epoch from (ended_at - started_at)) / 60)::int - break_minutes
      else false
    end
  ),
  -- No overlapping timed entries for one worker.
  constraint ts_entries_no_overlap exclude using gist (
    tenant_id with =,
    worker_id with =,
    tstzrange(started_at, ended_at, '[)') with &&
  ) where (started_at is not null)
);

create index ts_entries_worker_date_idx on public.ts_entries (tenant_id, worker_id, work_date);
create index ts_entries_job_date_idx    on public.ts_entries (tenant_id, job_id, work_date) where job_id is not null;
create index ts_entries_week_idx        on public.ts_entries (tenant_id, week_id);

-- Week lock. Workers and supervisors write only in draft/rejected weeks.
-- Managers may also change submitted weeks (logged). Approved/exported weeks must be reopened first.
create or replace function private.ts_assert_week_writable(p_week public.ts_weeks)
returns void
language plpgsql stable
set search_path = ''
as $$
begin
  if p_week.status in ('approved', 'exported') then
    raise exception 'This week has been approved, so it can''t be changed. A manager can reopen it.' using errcode = '42501';
  end if;
  if p_week.status = 'submitted' and not private.is_manager() then
    raise exception 'This week has been sent for approval, so it can''t be changed.' using errcode = '42501';
  end if;
end
$$;

-- SECURITY INVOKER on purpose: current_user tells API calls ('authenticated') apart from trusted RPCs.
create or replace function private.ts_entries_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_tenant  uuid := case when tg_op = 'DELETE' then old.tenant_id else new.tenant_id end;
  s         jsonb := private.timesheets_settings(v_tenant);
  v_tz      text := private.tenant_timezone(v_tenant);
  v_api     boolean := current_user in ('authenticated', 'anon');
  v_manager boolean := private.is_manager();
  v_old_wk  public.ts_weeks;
  v_new_wk  public.ts_weeks;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select * into v_old_wk from public.ts_weeks where tenant_id = old.tenant_id and id = old.week_id;
    perform private.ts_assert_week_writable(v_old_wk);
  end if;

  if tg_op = 'DELETE' then
    if v_old_wk.status = 'submitted' then
      perform private.ts_log(old.tenant_id, old.week_id, 'entry_deleted', jsonb_build_object('entry_id', old.id, 'old', to_jsonb(old)));
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and (new.tenant_id is distinct from old.tenant_id
       or new.worker_id is distinct from old.worker_id
       or new.created_by is distinct from old.created_by
       or new.source is distinct from old.source) then
    raise exception 'The person, author and source of an entry can''t be changed' using errcode = '42501';
  end if;

  if v_api and not v_manager and new.source <> 'manual' then
    raise exception 'Clocked time is recorded by clocking in and out. Ask a manager to correct it.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if v_api then
      new.created_by := auth.uid();
    end if;

    -- Workers and supervisors must use the tenant's entry method; managers can correct with either.
    if v_api and not v_manager then
      if s ->> 'entryMode' = 'clock' then
        raise exception 'Time is recorded by clocking in and out' using errcode = '22023';
      elsif s ->> 'entryMode' = 'start_end' and (new.started_at is null or new.ended_at is null) then
        raise exception 'Please enter a start and finish time' using errcode = '23502';
      elsif s ->> 'entryMode' = 'duration' and (new.started_at is not null or new.ended_at is not null) then
        raise exception 'Please enter the total hours only' using errcode = '22023';
      end if;
    end if;

    -- Breaks: fixed at creation so later setting changes don't rewrite history.
    if new.started_at is null or s ->> 'breaks' = 'off' then
      new.break_minutes := 0;
    elsif s ->> 'breaks' = 'fixed' then
      new.break_minutes := (s ->> 'fixedBreakMinutes')::int;
    end if;  -- 'manual': keep what was entered

    if s ->> 'logAgainst' = 'none' then
      new.job_id := null;
    elsif (s ->> 'requireJob')::boolean and new.job_id is null then
      raise exception 'Please pick a job for this time' using errcode = '23502';
    end if;

    if not (s ->> 'costCodes')::boolean then
      new.cost_code_id := null;
    end if;
  else
    -- UPDATE: breaks are editable only in 'manual' mode on timed entries.
    if new.started_at is null then
      new.break_minutes := 0;
    elsif s ->> 'breaks' <> 'manual' then
      new.break_minutes := old.break_minutes;
    end if;
  end if;

  -- Times → local work date and exact duration.
  if new.started_at is not null or new.ended_at is not null then
    if new.started_at is null or new.ended_at is null then
      raise exception 'Start and finish times are both needed' using errcode = '23502';
    end if;
    if new.ended_at <= new.started_at then
      raise exception 'Finish time must be after start time' using errcode = '22023';
    end if;
    new.work_date := (new.started_at at time zone v_tz)::date;
    new.duration_minutes := floor(extract(epoch from (new.ended_at - new.started_at)) / 60)::int - new.break_minutes;
    if new.duration_minutes < 1 then
      raise exception 'The break is as long as the time worked' using errcode = '22023';
    end if;
  end if;

  if new.work_date > (now() at time zone v_tz)::date then
    raise exception 'Time can''t be logged for a future day' using errcode = '22023';
  end if;

  -- Attach to (or create) the worker's week, and check it's open.
  v_new_wk := private.ts_ensure_week(new.tenant_id, new.worker_id, private.ts_week_start(new.tenant_id, new.work_date));
  perform private.ts_assert_week_writable(v_new_wk);
  new.week_id := v_new_wk.id;

  if v_new_wk.status = 'submitted' then  -- only managers get here
    perform private.ts_log(new.tenant_id, new.week_id,
      case when tg_op = 'INSERT' then 'entry_added' else 'entry_changed' end,
      jsonb_build_object('entry_id', new.id,
                         'old', case when tg_op = 'UPDATE' then to_jsonb(old) end,
                         'new', to_jsonb(new)));
  end if;

  new.updated_at := now();
  return new;
end
$$;

create trigger ts_entries_before_write
  before insert or update or delete on public.ts_entries
  for each row execute function private.ts_entries_before_write();

alter table public.ts_entries enable row level security;

create policy ts_entries_select on public.ts_entries
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('timesheets'))
         and private.ts_can_access_worker(worker_id));

create policy ts_entries_insert on public.ts_entries
  for insert to authenticated
  with check (tenant_id = (select private.current_tenant_id())
              and (select private.feature_enabled('timesheets'))
              and private.ts_can_access_worker(worker_id));

create policy ts_entries_update on public.ts_entries
  for update to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('timesheets'))
         and private.ts_can_access_worker(worker_id))
  with check (tenant_id = (select private.current_tenant_id())
              and private.ts_can_access_worker(worker_id));

create policy ts_entries_delete on public.ts_entries
  for delete to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('timesheets'))
         and private.ts_can_access_worker(worker_id));

-------------------------------------------------------------------------------
-- ts_clock_sessions (entryMode = 'clock')
-------------------------------------------------------------------------------

create table public.ts_clock_sessions (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants (id) on delete cascade,
  worker_id    uuid not null,
  started_at   timestamptz not null default now(),   -- server time, not the phone's clock
  job_id       uuid,
  cost_code_id uuid,
  notes        text check (notes is null or length(notes) <= 2000),
  constraint ts_clock_sessions_worker_fk    foreign key (tenant_id, worker_id)    references public.profiles (tenant_id, id),
  constraint ts_clock_sessions_job_fk       foreign key (tenant_id, job_id)       references public.jobs (tenant_id, id),
  constraint ts_clock_sessions_cost_code_fk foreign key (tenant_id, cost_code_id) references public.ts_cost_codes (tenant_id, id),
  constraint ts_clock_sessions_one_open unique (tenant_id, worker_id)
);

alter table public.ts_clock_sessions enable row level security;

create policy ts_clock_sessions_select on public.ts_clock_sessions
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('timesheets'))
         and private.ts_can_access_worker(worker_id));

revoke insert, update, delete on public.ts_clock_sessions from anon, authenticated;

-------------------------------------------------------------------------------
-- Views (security_invoker: the caller's RLS applies)
-------------------------------------------------------------------------------

create or replace function private.ts_round(p_minutes int, p_step int)
returns int
language sql immutable
set search_path = ''
as $$
  select case when coalesce(p_step, 0) <= 0 then p_minutes
              else (round(p_minutes::numeric / p_step) * p_step)::int end
$$;

-- Rounding is per entry, to the nearest step (open question: per entry or per day?).
create view public.v_ts_daily
with (security_invoker = true)
as
select
  e.tenant_id,
  e.worker_id,
  e.week_id,
  e.work_date,
  count(*)::int                  as entry_count,
  sum(e.duration_minutes)::int   as total_minutes,
  sum(private.ts_round(e.duration_minutes, (private.timesheets_settings(e.tenant_id) ->> 'roundingMinutes')::int))::int
                                 as rounded_minutes
from public.ts_entries e
group by e.tenant_id, e.worker_id, e.week_id, e.work_date;

-- Overtime = time over the daily limit, plus remaining time over the weekly limit (one rule set per tenant).
create view public.v_ts_weekly
with (security_invoker = true)
as
with days as (
  select d.*,
         (private.timesheets_settings(d.tenant_id) ->> 'overtimeDailyAfterMinutes')::int  as daily_after,
         (private.timesheets_settings(d.tenant_id) ->> 'overtimeWeeklyAfterMinutes')::int as weekly_after
    from public.v_ts_daily d
),
totals as (
  select tenant_id, week_id,
         sum(rounded_minutes)::int as rounded_minutes,
         sum(total_minutes)::int   as total_minutes,
         coalesce(sum(greatest(rounded_minutes - daily_after, 0)), 0)::int as daily_overtime,
         max(weekly_after) as weekly_after
    from days
   group by tenant_id, week_id
)
select
  w.tenant_id,
  w.id          as week_id,
  w.worker_id,
  w.week_start,
  w.status,
  w.submitted_at,
  w.decided_at,
  w.reject_reason,
  coalesce(t.total_minutes, 0)   as total_minutes,
  coalesce(t.rounded_minutes, 0) as rounded_minutes,
  coalesce(t.daily_overtime, 0)
    + greatest(coalesce(t.rounded_minutes, 0) - coalesce(t.daily_overtime, 0) - coalesce(t.weekly_after, 2147483647), 0)
                                 as overtime_minutes,
  coalesce(t.rounded_minutes, 0) - (coalesce(t.daily_overtime, 0)
    + greatest(coalesce(t.rounded_minutes, 0) - coalesce(t.daily_overtime, 0) - coalesce(t.weekly_after, 2147483647), 0))
                                 as normal_minutes
from public.ts_weeks w
left join totals t on t.tenant_id = w.tenant_id and t.week_id = w.id;

create view public.v_ts_job_hours
with (security_invoker = true)
as
select
  e.tenant_id,
  e.job_id,
  w.week_start,
  e.worker_id,
  sum(e.duration_minutes)::int as total_minutes,
  sum(private.ts_round(e.duration_minutes, (private.timesheets_settings(e.tenant_id) ->> 'roundingMinutes')::int))::int
                               as rounded_minutes
from public.ts_entries e
join public.ts_weeks w on w.tenant_id = e.tenant_id and w.id = e.week_id
where e.job_id is not null
group by e.tenant_id, e.job_id, w.week_start, e.worker_id;

-------------------------------------------------------------------------------
-- RPCs
-------------------------------------------------------------------------------

create or replace function private.ts_require_enabled()
returns jsonb
language plpgsql stable
security definer
set search_path = ''
as $$
begin
  if private.current_tenant_id() is null or not private.feature_enabled('timesheets') then
    raise exception 'Timesheets are not switched on for this business' using errcode = '42501';
  end if;
  return private.timesheets_settings(private.current_tenant_id());
end
$$;

create or replace function private.ts_get_week(p_week_id uuid)
returns public.ts_weeks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.ts_weeks;
begin
  select * into v from public.ts_weeks
   where id = p_week_id and tenant_id = private.current_tenant_id()
   for update;
  if not found or not private.ts_can_access_worker(v.worker_id) then
    raise exception 'Week not found' using errcode = 'P0002';
  end if;
  return v;
end
$$;

-- Worker submits their own week. With approval = 'none', submitting approves it.
create or replace function public.ts_submit_week(p_week_id uuid)
returns public.ts_weeks
language plpgsql
security definer
set search_path = ''
as $$
declare
  s jsonb := private.ts_require_enabled();
  v public.ts_weeks := private.ts_get_week(p_week_id);
begin
  if v.worker_id <> auth.uid() then
    raise exception 'You can only submit your own week' using errcode = '42501';
  end if;
  if v.status not in ('draft', 'rejected') then
    raise exception 'This week has already been submitted' using errcode = '22023';
  end if;
  if exists (select 1 from public.ts_clock_sessions c where c.tenant_id = v.tenant_id and c.worker_id = v.worker_id) then
    raise exception 'Please clock out before submitting your week' using errcode = '22023';
  end if;

  if s ->> 'approval' = 'none' then
    update public.ts_weeks
       set status = 'approved', submitted_at = now(), decided_by = null, decided_at = now(), reject_reason = null
     where id = v.id returning * into v;
    perform private.ts_log(v.tenant_id, v.id, 'submitted');
    perform private.ts_log(v.tenant_id, v.id, 'approved', '{"auto": true}');
  else
    update public.ts_weeks
       set status = 'submitted', submitted_at = now(), reject_reason = null
     where id = v.id returning * into v;
    perform private.ts_log(v.tenant_id, v.id, 'submitted');
  end if;
  -- Push to approver: added in T2 (database webhook → ts-notify Edge Function).
  return v;
end
$$;

create or replace function public.ts_decide_week(p_week_id uuid, p_decision text, p_reason text default null)
returns public.ts_weeks
language plpgsql
security definer
set search_path = ''
as $$
declare
  s jsonb := private.ts_require_enabled();
  v public.ts_weeks := private.ts_get_week(p_week_id);
begin
  if p_decision not in ('approve', 'reject') then
    raise exception 'Decision must be approve or reject' using errcode = '22023';
  end if;
  if v.status <> 'submitted' then
    raise exception 'Only submitted weeks can be approved or sent back' using errcode = '22023';
  end if;
  if v.worker_id = auth.uid() and not private.is_owner() then
    raise exception 'You can''t approve your own week' using errcode = '42501';
  end if;
  if not (private.is_manager()
          or (s ->> 'approval' = 'supervisor' and private.is_supervisor()
              and private.ts_can_access_worker(v.worker_id))) then
    raise exception 'You''re not the approver for this person' using errcode = '42501';
  end if;
  if p_decision = 'reject' and length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Please give a reason for sending the week back' using errcode = '23502';
  end if;

  update public.ts_weeks
     set status = case when p_decision = 'approve' then 'approved' else 'rejected' end,
         decided_by = auth.uid(),
         decided_at = now(),
         reject_reason = case when p_decision = 'reject' then btrim(p_reason) end
   where id = v.id returning * into v;

  perform private.ts_log(v.tenant_id, v.id,
    case when p_decision = 'approve' then 'approved' else 'rejected' end,
    case when p_decision = 'reject' then jsonb_build_object('reason', btrim(p_reason)) else '{}'::jsonb end);
  return v;
end
$$;

create or replace function public.ts_reopen_week(p_week_id uuid, p_reason text)
returns public.ts_weeks
language plpgsql
security definer
set search_path = ''
as $$
declare
  s jsonb := private.ts_require_enabled();
  v public.ts_weeks := private.ts_get_week(p_week_id);
begin
  if not private.is_manager() then
    raise exception 'Only a manager can reopen a week' using errcode = '42501';
  end if;
  if v.status <> 'approved' then
    raise exception 'Only approved weeks can be reopened' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Please give a reason for reopening' using errcode = '23502';
  end if;

  update public.ts_weeks
     set status = 'draft', submitted_at = null, decided_by = null, decided_at = null, reject_reason = null
   where id = v.id returning * into v;
  perform private.ts_log(v.tenant_id, v.id, 'reopened', jsonb_build_object('reason', btrim(p_reason)));
  return v;
end
$$;

create or replace function public.ts_clock_in(
  p_job_id       uuid default null,
  p_cost_code_id uuid default null,
  p_notes        text default null
)
returns public.ts_clock_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s     jsonb := private.ts_require_enabled();
  v_row public.ts_clock_sessions;
begin
  if s ->> 'entryMode' <> 'clock' then
    raise exception 'Clocking in isn''t switched on' using errcode = '22023';
  end if;
  if s ->> 'logAgainst' = 'job' and (s ->> 'requireJob')::boolean and p_job_id is null then
    raise exception 'Please pick a job' using errcode = '23502';
  end if;

  insert into public.ts_clock_sessions (tenant_id, worker_id, job_id, cost_code_id, notes)
  values (private.current_tenant_id(), auth.uid(),
          case when s ->> 'logAgainst' = 'job' then p_job_id end,
          case when (s ->> 'costCodes')::boolean then p_cost_code_id end,
          p_notes)
  returning * into v_row;
  return v_row;
exception
  when unique_violation then
    raise exception 'You''re already clocked in' using errcode = '23505';
end
$$;

-- Workers clock themselves out at server time. Managers, or the worker's supervisor,
-- can clock someone out and set the finish time (e.g. a forgotten clock-out).
create or replace function public.ts_clock_out(
  p_worker_id     uuid default null,
  p_end_at        timestamptz default null,
  p_break_minutes integer default null
)
returns public.ts_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  s       jsonb := private.ts_require_enabled();
  v_user  uuid  := coalesce(p_worker_id, auth.uid());
  v_sess  public.ts_clock_sessions;
  v_end   timestamptz;
  v_entry public.ts_entries;
begin
  if not private.ts_can_access_worker(v_user) then
    raise exception 'You can''t clock this person out' using errcode = '42501';
  end if;
  if p_end_at is not null and v_user = auth.uid() and not private.is_manager() then
    raise exception 'Only a manager or supervisor can set a finish time' using errcode = '42501';
  end if;

  select * into v_sess from public.ts_clock_sessions
   where tenant_id = private.current_tenant_id() and worker_id = v_user
   for update;
  if not found then
    raise exception 'Not clocked in' using errcode = 'P0002';
  end if;

  v_end := coalesce(p_end_at, now());
  if v_end - v_sess.started_at > interval '24 hours' then
    raise exception 'This shift is over 24 hours. Ask a manager to set the finish time.' using errcode = '22023';
  end if;

  -- The trigger works out work_date, week, break and duration.
  insert into public.ts_entries
    (tenant_id, worker_id, source, started_at, ended_at, break_minutes, duration_minutes,
     work_date, job_id, cost_code_id, notes, created_by, week_id)
  values
    (v_sess.tenant_id, v_user, 'clock', v_sess.started_at, v_end, coalesce(p_break_minutes, 0), 1,
     current_date, v_sess.job_id, v_sess.cost_code_id, v_sess.notes, auth.uid(),
     '00000000-0000-0000-0000-000000000000')
  returning * into v_entry;

  delete from public.ts_clock_sessions where id = v_sess.id;
  return v_entry;
end
$$;

create or replace function public.ts_clock_cancel(p_worker_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s      jsonb := private.ts_require_enabled();
  v_user uuid  := coalesce(p_worker_id, auth.uid());
begin
  if not private.ts_can_access_worker(v_user) then
    raise exception 'You can only cancel your own clock-in' using errcode = '42501';
  end if;
  delete from public.ts_clock_sessions
   where tenant_id = private.current_tenant_id() and worker_id = v_user;
end
$$;

revoke all on function public.ts_submit_week(uuid)                          from public, anon;
revoke all on function public.ts_decide_week(uuid, text, text)              from public, anon;
revoke all on function public.ts_reopen_week(uuid, text)                    from public, anon;
revoke all on function public.ts_clock_in(uuid, uuid, text)                 from public, anon;
revoke all on function public.ts_clock_out(uuid, timestamptz, integer)      from public, anon;
revoke all on function public.ts_clock_cancel(uuid)                         from public, anon;
grant execute on function public.ts_submit_week(uuid)                       to authenticated;
grant execute on function public.ts_decide_week(uuid, text, text)           to authenticated;
grant execute on function public.ts_reopen_week(uuid, text)                 to authenticated;
grant execute on function public.ts_clock_in(uuid, uuid, text)              to authenticated;
grant execute on function public.ts_clock_out(uuid, timestamptz, integer)   to authenticated;
grant execute on function public.ts_clock_cancel(uuid)                      to authenticated;

-- Internal helpers: not callable from the API.
revoke all on function private.ts_ensure_week(uuid, uuid, date)        from public, anon, authenticated;
revoke all on function private.ts_log(uuid, uuid, text, jsonb)         from public, anon, authenticated;
revoke all on function private.ts_get_week(uuid)                       from public, anon, authenticated;
grant execute on function private.ts_ensure_week(uuid, uuid, date)     to authenticated;  -- needed by the invoker trigger
grant execute on function private.ts_log(uuid, uuid, text, jsonb)      to authenticated;  -- needed by the invoker trigger
