-- Timesheets rules: duration per mode, breaks, consistency check, week workflow, clock.
begin;
select plan(21);

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'owner-a@test.local'),
  ('a0000000-0000-0000-0000-000000000002', 'worker-a@test.local');
insert into public.tenants (id, name, features) values
  ('a0000000-0000-0000-0000-00000000000a', 'Tenant A', '{"timesheets": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'Owner A', 'owner'),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000a', 'Worker A', 'worker');

create function pg_temp.act_as(p_user uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'tenant_id', 'a0000000-0000-0000-0000-00000000000a', 'app_role', p_role, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.as_owner() returns void language sql as $$ select pg_temp.act_as('a0000000-0000-0000-0000-000000000001', 'owner') $$;
create function pg_temp.as_worker() returns void language sql as $$ select pg_temp.act_as('a0000000-0000-0000-0000-000000000002', 'worker') $$;

create function pg_temp.add_timed(p_date date, p_start text, p_end text, p_break int default 0) returns public.ts_entries language sql as $$
  insert into public.ts_entries (tenant_id, worker_id, work_date, started_at, ended_at, break_minutes, duration_minutes)
  values ('a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000002', p_date,
          (p_date || ' ' || p_start)::timestamp at time zone 'Europe/Dublin',
          (p_date || ' ' || p_end)::timestamp at time zone 'Europe/Dublin', p_break, 1)
  returning *;
$$;

---------------------------------------------------------------- start_end (default)
select pg_temp.as_worker();
set local role authenticated;
select is((pg_temp.add_timed('2026-10-12', '08:00', '16:30')).duration_minutes, 510, 'start_end: duration = finish − start');
select is((select week_start from public.ts_weeks), '2026-10-12'::date, 'entry is attached to its Monday week');
select throws_ok($$ insert into public.ts_entries (tenant_id, worker_id, work_date, duration_minutes)
  values ('a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000002', '2026-10-13', 120) $$,
  '23502', null, 'start_end: total-hours entry is refused');
select throws_ok($$ select pg_temp.add_timed('2026-10-12', '12:00', '13:00') $$,
  '23P01', null, 'overlapping entries are refused');
select is((pg_temp.add_timed('2026-10-13', '08:00', '10:00', 15)).break_minutes, 0, 'breaks off: typed break is ignored');
reset role;

---------------------------------------------------------------- breaks fixed / manual
select pg_temp.as_owner();
set local role authenticated;
do $do$ begin perform public.update_tenant_settings('timesheets', '{"breaks":"fixed","fixedBreakMinutes":30}'); end $do$;
reset role;
select pg_temp.as_worker();
set local role authenticated;
select is((pg_temp.add_timed('2026-10-14', '08:00', '16:30')).duration_minutes, 480, 'breaks fixed: 30 min taken off');
reset role;
select pg_temp.as_owner();
set local role authenticated;
do $do$ begin perform public.update_tenant_settings('timesheets', '{"breaks":"manual"}'); end $do$;
reset role;
select pg_temp.as_worker();
set local role authenticated;
select is((pg_temp.add_timed('2026-10-15', '08:00', '16:30', 45)).duration_minutes, 465, 'breaks manual: typed break taken off');
reset role;

---------------------------------------------------------------- duration mode
select pg_temp.as_owner();
set local role authenticated;
do $do$ begin perform public.update_tenant_settings('timesheets', '{"entryMode":"duration","breaks":"manual"}'); end $do$;
reset role;
select pg_temp.as_worker();
set local role authenticated;
with e as (
  insert into public.ts_entries (tenant_id, worker_id, work_date, duration_minutes, break_minutes)
  values ('a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000002', '2026-10-16', 450, 20)
  returning *)
select is((select duration_minutes from e), 450, 'duration: typed total is stored as-is');
select is((select break_minutes from public.ts_entries where work_date = '2026-10-16'), 0, 'duration: break forced to 0');
select throws_ok($$ select pg_temp.add_timed('2026-10-17', '08:00', '09:00') $$, '22023', null, 'duration: timed entry is refused');
reset role;

---------------------------------------------------------------- consistency check (even if the trigger is bypassed)
alter table public.ts_entries disable trigger ts_entries_before_write;
select throws_ok($$ insert into public.ts_entries (tenant_id, week_id, worker_id, work_date, started_at, ended_at, duration_minutes, created_by)
  select tenant_id, id, worker_id, '2026-10-12', '2026-10-12 18:00+01', '2026-10-12 19:00+01', 999, worker_id from public.ts_weeks $$,
  '23514', null, 'check: duration must equal finish − start − break');
select throws_ok($$ insert into public.ts_entries (tenant_id, week_id, worker_id, work_date, started_at, duration_minutes, created_by)
  select tenant_id, id, worker_id, '2026-10-12', '2026-10-12 18:00+01', 60, worker_id from public.ts_weeks $$,
  '23514', null, 'check: start without finish is refused');
alter table public.ts_entries enable trigger ts_entries_before_write;

---------------------------------------------------------------- week workflow (approval = manager)
select pg_temp.as_worker();
set local role authenticated;
select is((public.ts_submit_week((select id from public.ts_weeks))).status, 'submitted', 'worker submits week');
select throws_ok($$ update public.ts_entries set notes = 'late change' $$, '42501', null, 'submitted week is read-only to the worker');
reset role;

select pg_temp.as_owner();
set local role authenticated;
update public.ts_entries set notes = 'fixed by office' where work_date = '2026-10-12';
reset role;
select is((select count(*)::int from public.ts_events where action = 'entry_changed'), 1, 'manager edit after submit is logged');

select pg_temp.as_owner();
set local role authenticated;
select throws_ok($$ select public.ts_decide_week((select id from public.ts_weeks), 'reject') $$, '23502', null, 'reject needs a reason');
select is((public.ts_decide_week((select id from public.ts_weeks), 'approve')).status, 'approved', 'manager approves');
reset role;

select pg_temp.as_worker();
set local role authenticated;
select throws_ok($$ delete from public.ts_entries $$, '42501', null, 'approved week is locked');
reset role;

select pg_temp.as_owner();
set local role authenticated;
select is((public.ts_reopen_week((select id from public.ts_weeks), 'Wrong job')).status, 'draft', 'manager reopens');
reset role;

---------------------------------------------------------------- approval = none
select pg_temp.as_owner();
set local role authenticated;
do $do$ begin perform public.update_tenant_settings('timesheets', '{"entryMode":"start_end","approval":"none"}'); end $do$;
reset role;
select pg_temp.as_worker();
set local role authenticated;
select is((public.ts_submit_week((select id from public.ts_weeks))).status, 'approved', 'approval none: submitting approves');
reset role;

---------------------------------------------------------------- clock
select pg_temp.as_owner();
set local role authenticated;
do $do$ begin perform public.update_tenant_settings('timesheets', '{"entryMode":"clock","breaks":"fixed","fixedBreakMinutes":30}'); end $do$;
reset role;
select pg_temp.as_worker();
set local role authenticated;
do $do$ begin perform public.ts_clock_in(); end $do$;
reset role;
update public.ts_clock_sessions set started_at = now() - interval '9 hours';
select pg_temp.as_worker();
set local role authenticated;
select is((public.ts_clock_out()).duration_minutes, 510, 'clock: server times, fixed break applied (9h − 30m)');
reset role;

select * from finish();
rollback;
