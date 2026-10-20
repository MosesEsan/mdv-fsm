-- Timesheets: the settings validator checks the business being edited (owner's own, or the one the
-- platform team is editing via platform_set_module_settings), using core private.settings_tenant_id().

create or replace function private.settings_validate__timesheets(p jsonb)
returns jsonb
language plpgsql stable
security definer
set search_path = ''
as $$
declare
  k text;
  v_tenant uuid := private.settings_tenant_id();  -- owner's own tenant, or the one the platform team is editing
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
