-- Timesheets: log hours against a customer (logAgainst = 'customer'), for visit-style businesses
-- such as MDC Electrical, plus the "Corrected by" marker.
--   * ts_entries.customer_id (same-business foreign key)
--   * staff can see and add customers while the business logs against customers
--   * an edit or delete by anyone other than the entry's worker is logged in ts_events
--     and stamped on the entry (corrected_by / corrected_at)
--   * ts_save_visit(): saves a visit and its materials in one go

alter table public.ts_entries
  add column customer_id  uuid,
  add column corrected_by uuid,
  add column corrected_at timestamptz,
  add constraint ts_entries_customer_fk foreign key (tenant_id, customer_id) references public.customers (tenant_id, id),
  add constraint ts_entries_corrected_by_fk foreign key (tenant_id, corrected_by) references public.profiles (tenant_id, id);

create index ts_entries_customer_date_idx on public.ts_entries (tenant_id, customer_id, work_date) where customer_id is not null;

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
  v_visits  boolean := s ->> 'logAgainst' = 'customer';
  v_other   boolean;  -- someone other than the entry's worker is making this change
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select * into v_old_wk from public.ts_weeks where tenant_id = old.tenant_id and id = old.week_id;
    perform private.ts_assert_week_writable(v_old_wk);
  end if;

  if tg_op = 'DELETE' then
    if v_old_wk.status = 'submitted'
       or (v_api and auth.uid() is distinct from old.worker_id) then
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

    if s ->> 'logAgainst' <> 'job' then
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

  -- Customer visits: the customer is the thing hours are logged against.
  if v_visits then
    if new.customer_id is null then
      raise exception 'Choose a customer, or add a new one.' using errcode = '23502';
    end if;
    if v_api and (new.notes is null or btrim(new.notes) = '') then
      raise exception 'Add a short note of the work done.' using errcode = '23502';
    end if;
    if v_api and length(new.notes) > 500 then
      raise exception 'Keep the work done note under 500 characters.' using errcode = '22023';
    end if;
  elsif tg_op = 'INSERT' then
    new.customer_id := null;
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
    if v_visits and new.ended_at - new.started_at > interval '16 hours' then
      raise exception 'That''s over 16 hours. Check the times.' using errcode = '22023';
    end if;
  end if;

  if new.work_date > (now() at time zone v_tz)::date then
    raise exception 'Time can''t be logged for a future day' using errcode = '22023';
  end if;

  -- Attach to (or create) the worker's week, and check it's open.
  v_new_wk := private.ts_ensure_week(new.tenant_id, new.worker_id, private.ts_week_start(new.tenant_id, new.work_date));
  perform private.ts_assert_week_writable(v_new_wk);
  new.week_id := v_new_wk.id;

  -- "Corrected by": stamped when anyone but the worker changes the entry. Never set by hand.
  v_other := v_api and auth.uid() is distinct from new.worker_id;
  if tg_op = 'INSERT' then
    new.corrected_by := null;
    new.corrected_at := null;
  elsif v_other then
    new.corrected_by := auth.uid();
    new.corrected_at := now();
  else
    new.corrected_by := old.corrected_by;
    new.corrected_at := old.corrected_at;
  end if;

  if v_new_wk.status = 'submitted' or (tg_op = 'UPDATE' and v_other) then
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

-- Does this business log hours against customers? (Timesheets on and logAgainst = 'customer'.)
create or replace function private.ts_logs_customers()
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select private.feature_enabled('timesheets')
     and private.timesheets_settings(private.current_tenant_id()) ->> 'logAgainst' = 'customer'
$$;

-- Staff pick a customer for each visit and can add a new one (name only is enough).
create policy customers_ts_member_select on public.customers
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id()) and (select private.ts_logs_customers()));

create policy customers_ts_member_insert on public.customers
  for insert to authenticated
  with check (tenant_id = (select private.current_tenant_id()) and (select private.ts_logs_customers()));

-- Save a visit and its materials together. Runs as the caller, so RLS and the triggers apply.
-- p_entry: { id?, worker_id?, started_at, ended_at, customer_id, notes }
-- p_materials: [{ item, quantity, unit }]  (replaces the visit's materials)
create or replace function public.ts_save_visit(p_entry jsonb, p_materials jsonb default '[]'::jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tenant uuid := private.current_tenant_id();
  v_id     uuid := nullif(p_entry ->> 'id', '')::uuid;
  m        jsonb;
  i        int := 0;
begin
  if jsonb_typeof(coalesce(p_materials, '[]'::jsonb)) <> 'array' then
    raise exception 'Materials must be a list' using errcode = '22023';
  end if;

  if v_id is null then
    insert into public.ts_entries (tenant_id, worker_id, work_date, started_at, ended_at, duration_minutes, customer_id, notes)
    values (v_tenant,
            coalesce(nullif(p_entry ->> 'worker_id', '')::uuid, auth.uid()),
            ((p_entry ->> 'started_at')::timestamptz)::date,
            (p_entry ->> 'started_at')::timestamptz,
            (p_entry ->> 'ended_at')::timestamptz,
            1,  -- worked out by the trigger
            nullif(p_entry ->> 'customer_id', '')::uuid,
            p_entry ->> 'notes')
    returning id into v_id;
  else
    update public.ts_entries
       set started_at  = (p_entry ->> 'started_at')::timestamptz,
           ended_at    = (p_entry ->> 'ended_at')::timestamptz,
           customer_id = nullif(p_entry ->> 'customer_id', '')::uuid,
           notes       = p_entry ->> 'notes'
     where tenant_id = v_tenant and id = v_id;
    if not found then
      raise exception 'That visit wasn''t found' using errcode = 'P0002';
    end if;
    delete from public.ts_entry_materials where tenant_id = v_tenant and entry_id = v_id;
  end if;

  for m in select * from jsonb_array_elements(coalesce(p_materials, '[]'::jsonb)) loop
    insert into public.ts_entry_materials (tenant_id, entry_id, item, quantity, unit, position)
    values (v_tenant, v_id, m ->> 'item', (m ->> 'quantity')::numeric, m ->> 'unit', i);
    i := i + 1;
  end loop;

  return v_id;
end
$$;

revoke execute on function public.ts_save_visit(jsonb, jsonb) from public, anon;
grant execute on function public.ts_save_visit(jsonb, jsonb) to authenticated;
