-- Module: Timesheets — reports and export (design stage T3).
--   ts_hours_report()   totals by worker, job or week for a date range (caller's RLS applies)
--   ts_export_rows()    signed-off entries for whole weeks in a period (owner/manager only)
--   ts_record_export()  after the file is stored: marks weeks exported, logs it, and records the
--                       file in core file_exports (core bucket 'exports', path {tenant_id}/timesheets/exports/...)
-- Files are built and uploaded by the ts-export Edge Function.

-------------------------------------------------------------------------------
-- Hours report (SECURITY INVOKER: workers see their own hours, supervisors their
-- assigned people, managers everyone — exactly as the tables' RLS allows)
-------------------------------------------------------------------------------

create or replace function public.ts_hours_report(
  p_from             date,
  p_to               date,
  p_group            text,
  p_only_signed_off  boolean default false
)
returns table (
  group_key       text,
  label           text,
  sort_key        text,
  entry_count     integer,
  total_minutes   integer,
  rounded_minutes integer
)
language plpgsql stable
set search_path = ''
as $$
declare
  v_step int := (private.ts_require_enabled() ->> 'roundingMinutes')::int;
begin
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'Pick a start and end date' using errcode = '22023';
  end if;
  if p_to - p_from > 400 then
    raise exception 'Pick a period of about a year or less' using errcode = '22023';
  end if;
  if p_group is null or p_group not in ('worker', 'job', 'week') then
    raise exception 'Group by worker, job or week' using errcode = '22023';
  end if;

  return query
  with rows as (
    select
      case p_group
        when 'worker' then e.worker_id::text
        when 'job'    then coalesce(e.job_id::text, 'none')
        else w.week_start::text
      end as k,
      case p_group
        when 'worker' then coalesce(p.full_name, 'Unnamed')
        when 'job'    then case when e.job_id is null then 'No job' else coalesce(j.summary, 'Untitled job') end
        else to_char(w.week_start, 'YYYY-MM-DD')
      end as l,
      e.duration_minutes as d
    from public.ts_entries e
    join public.ts_weeks w on w.tenant_id = e.tenant_id and w.id = e.week_id
    left join public.profiles p on p.tenant_id = e.tenant_id and p.id = e.worker_id
    left join public.jobs j on j.tenant_id = e.tenant_id and j.id = e.job_id
    where e.work_date between p_from and p_to
      and (not p_only_signed_off or w.status in ('approved', 'exported'))
  )
  select r.k, max(r.l), case when p_group = 'week' then r.k else lower(max(r.l)) end,
         count(*)::int, sum(r.d)::int, sum(private.ts_round(r.d, v_step))::int
    from rows r
   group by r.k
   order by 3;
end
$$;

revoke all on function public.ts_hours_report(date, date, text, boolean) from public, anon;
grant execute on function public.ts_hours_report(date, date, text, boolean) to authenticated;

-------------------------------------------------------------------------------
-- Export rows: whole weeks that START in [p_from, p_to], signed off only.
-------------------------------------------------------------------------------

create or replace function public.ts_export_rows(
  p_from              date,
  p_to                date,
  p_include_exported  boolean default false
)
returns table (
  tenant_id             uuid,
  week_id               uuid,
  week_start            date,
  week_status           text,
  worker_id             uuid,
  worker_name           text,
  work_date             date,
  start_local           text,
  finish_local          text,
  break_minutes         integer,
  duration_minutes      integer,
  rounded_minutes       integer,
  job_label             text,
  cost_code_label       text,
  notes                 text,
  source                text,
  week_total_minutes    integer,
  week_rounded_minutes  integer,
  week_normal_minutes   integer,
  week_overtime_minutes integer
)
language plpgsql stable
set search_path = ''
as $$
declare
  s      jsonb := private.ts_require_enabled();
  v_step int   := (s ->> 'roundingMinutes')::int;
  v_tz   text  := private.tenant_timezone(private.current_tenant_id());
begin
  if not private.is_manager() then
    raise exception 'Only the owner or a manager can export timesheets' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 400 then
    raise exception 'Pick a period of about a year or less' using errcode = '22023';
  end if;

  return query
  select
    e.tenant_id, w.id, w.week_start, w.status, e.worker_id,
    coalesce(p.full_name, 'Unnamed'),
    e.work_date,
    to_char(e.started_at at time zone v_tz, 'HH24:MI'),
    to_char(e.ended_at at time zone v_tz, 'HH24:MI'),
    e.break_minutes, e.duration_minutes, private.ts_round(e.duration_minutes, v_step),
    case when e.job_id is null then null else coalesce(j.summary, 'Untitled job') end,
    case when c.id is null then null else c.code || ' ' || c.label end,
    e.notes, e.source,
    t.total_minutes, t.rounded_minutes, t.normal_minutes, t.overtime_minutes
  from public.ts_weeks w
  join public.ts_entries e on e.tenant_id = w.tenant_id and e.week_id = w.id
  join public.v_ts_weekly t on t.tenant_id = w.tenant_id and t.week_id = w.id
  left join public.profiles p on p.tenant_id = e.tenant_id and p.id = e.worker_id
  left join public.jobs j on j.tenant_id = e.tenant_id and j.id = e.job_id
  left join public.ts_cost_codes c on c.tenant_id = e.tenant_id and c.id = e.cost_code_id
  where w.week_start between p_from and p_to
    and (w.status = 'approved' or (p_include_exported and w.status = 'exported'))
  order by lower(coalesce(p.full_name, '')), e.worker_id, e.work_date, e.started_at nulls first;
end
$$;

revoke all on function public.ts_export_rows(date, date, boolean) from public, anon;
grant execute on function public.ts_export_rows(date, date, boolean) to authenticated;

-------------------------------------------------------------------------------
-- Record an export once the file is stored. Marks approved weeks as exported
-- (they stay locked), logs an event per week, and records the file in core file_exports.
-------------------------------------------------------------------------------

create or replace function public.ts_record_export(
  p_week_ids     uuid[],
  p_from         date,
  p_to           date,
  p_format       text,
  p_storage_path text
)
returns public.file_exports
language plpgsql
security definer
set search_path = ''
as $$
declare
  s        jsonb := private.ts_require_enabled();
  v_tenant uuid  := private.current_tenant_id();
  v_ids    uuid[];
  v_week   uuid;
  v_row    public.file_exports;
  v_entries int;
  v_minutes int;
begin
  if not private.is_manager() then
    raise exception 'Only the owner or a manager can export timesheets' using errcode = '42501';
  end if;
  if p_format not in ('csv', 'pdf') then
    raise exception 'Format must be csv or pdf' using errcode = '22023';
  end if;
  if p_storage_path is null
     or p_storage_path not like v_tenant::text || '/timesheets/exports/%'
     or p_storage_path like '%..%' then
    raise exception 'Invalid export file path' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_week_ids), 0) = 0 then
    raise exception 'Nothing to export' using errcode = '22023';
  end if;

  -- Lock the weeks so nobody reopens one mid-export.
  perform 1 from public.ts_weeks w
   where w.tenant_id = v_tenant and w.id = any (p_week_ids)
   for update;

  select array_agg(w.id) into v_ids
    from public.ts_weeks w
   where w.tenant_id = v_tenant
     and w.id = any (p_week_ids)
     and w.status in ('approved', 'exported');

  if coalesce(cardinality(v_ids), 0) <> (select count(distinct x) from unnest(p_week_ids) x) then
    raise exception 'Some weeks changed while exporting (e.g. one was reopened). Please export again.' using errcode = '40001';
  end if;

  for v_week in
    update public.ts_weeks set status = 'exported', exported_at = now()
     where tenant_id = v_tenant and id = any (v_ids) and status = 'approved'
    returning id
  loop
    perform private.ts_log(v_tenant, v_week, 'exported', jsonb_build_object('format', p_format, 'path', p_storage_path));
  end loop;

  select count(e.id)::int, coalesce(sum(e.duration_minutes), 0)::int into v_entries, v_minutes
    from public.ts_entries e
   where e.tenant_id = v_tenant and e.week_id = any (v_ids);

  v_row := private.record_file_export('timesheets', 'Timesheets', p_format, p_from, p_to, p_storage_path,
    jsonb_build_object('week_count', cardinality(v_ids), 'entry_count', v_entries, 'total_minutes', v_minutes));

  return v_row;
end
$$;

revoke all on function public.ts_record_export(uuid[], date, date, text, text) from public, anon;
grant execute on function public.ts_record_export(uuid[], date, date, text, text) to authenticated;

