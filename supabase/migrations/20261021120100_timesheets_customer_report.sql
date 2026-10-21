-- Timesheets: customer × month report (visit-style businesses such as MDC Electrical).
-- One line per visit: date, person, work done, start–finish, hours, materials; "Corrected by" when changed.
-- Runs as the caller, so RLS decides what's included: owner, managers and viewers get everyone's visits.
-- PDF and CSV come from the ts-export Edge Function (report = 'customer_month').

create or replace function public.ts_customer_month_report(p_customer uuid, p_month date)
returns table (
  entry_id          uuid,
  work_date         date,
  worker_id         uuid,
  worker_name       text,
  start_local       text,
  finish_local      text,
  duration_minutes  int,
  notes             text,
  materials         jsonb,
  corrected_by_name text
)
language sql stable
security invoker
set search_path = ''
as $$
  select e.id, e.work_date, e.worker_id, coalesce(p.full_name, 'Unknown'),
         to_char(e.started_at at time zone t.timezone, 'HH24:MI'),
         to_char(e.ended_at at time zone t.timezone, 'HH24:MI'),
         e.duration_minutes, e.notes,
         coalesce((select jsonb_agg(jsonb_build_object('item', m.item, 'quantity', m.quantity, 'unit', m.unit) order by m.position)
                     from public.ts_entry_materials m
                    where m.tenant_id = e.tenant_id and m.entry_id = e.id), '[]'::jsonb),
         c.full_name
    from public.ts_entries e
    join public.tenants t on t.id = e.tenant_id
    left join public.profiles p on p.tenant_id = e.tenant_id and p.id = e.worker_id
    left join public.profiles c on c.tenant_id = e.tenant_id and c.id = e.corrected_by
   where e.tenant_id = (select private.current_tenant_id())
     and (select private.feature_enabled('timesheets'))
     and e.customer_id = p_customer
     and e.work_date >= date_trunc('month', p_month)::date
     and e.work_date <  (date_trunc('month', p_month) + interval '1 month')::date
   order by e.work_date, e.started_at nulls last, p.full_name
$$;

revoke all on function public.ts_customer_month_report(uuid, date) from public, anon;
grant execute on function public.ts_customer_month_report(uuid, date) to authenticated;

-- Record a stored customer report in core file_exports (owner, managers and viewers).
create or replace function public.ts_record_customer_report(p_customer uuid, p_month date, p_format text, p_storage_path text)
returns public.file_exports
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := private.current_tenant_id();
  v_name   text;
  v_from   date := date_trunc('month', p_month)::date;
begin
  perform private.ts_require_enabled();
  if not (private.is_manager() or private.is_viewer()) then
    raise exception 'Your account can''t export reports' using errcode = '42501';
  end if;
  if p_format not in ('csv', 'pdf') then
    raise exception 'Format must be csv or pdf' using errcode = '22023';
  end if;
  if p_storage_path is null or p_storage_path not like v_tenant::text || '/timesheets/exports/%' or p_storage_path like '%..%' then
    raise exception 'Invalid export file path' using errcode = '22023';
  end if;
  select name into v_name from public.customers where tenant_id = v_tenant and id = p_customer;
  if v_name is null then
    raise exception 'That customer wasn''t found' using errcode = 'P0002';
  end if;
  return private.record_file_export('timesheets', 'Customer report — ' || v_name || ', ' || to_char(v_from, 'FMMonth YYYY'),
    p_format, v_from, (v_from + interval '1 month - 1 day')::date, p_storage_path,
    jsonb_build_object('report', 'customer_month', 'customer_id', p_customer));
end
$$;

revoke all on function public.ts_record_customer_report(uuid, date, text, text) from public, anon;
grant execute on function public.ts_record_customer_report(uuid, date, text, text) to authenticated;
