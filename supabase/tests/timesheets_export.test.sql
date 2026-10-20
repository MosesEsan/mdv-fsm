-- Timesheets reports and export: who sees what, signed-off only, exported weeks lock, tenant isolation, storage access.
begin;
select plan(22);

insert into auth.users (id, email) values
  ('e0000000-0000-0000-0000-000000000001', 'owner-a@export.test'),
  ('e0000000-0000-0000-0000-000000000002', 'worker1-a@export.test'),
  ('e0000000-0000-0000-0000-000000000003', 'worker2-a@export.test'),
  ('e0000000-0000-0000-0000-000000000004', 'super-a@export.test'),
  ('f0000000-0000-0000-0000-000000000001', 'owner-b@export.test');
insert into public.tenants (id, name, features) values
  ('e0000000-0000-0000-0000-00000000000a', 'Export A', '{"timesheets": true}'),
  ('f0000000-0000-0000-0000-00000000000b', 'Export B', '{"timesheets": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-00000000000a', 'Owner A', 'owner'),
  ('e0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-00000000000a', 'Aoife Worker', 'worker'),
  ('e0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-00000000000a', 'Brian Worker', 'worker'),
  ('e0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-00000000000a', 'Super A', 'supervisor'),
  ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-00000000000b', 'Owner B', 'owner');
insert into public.ts_assignments (tenant_id, supervisor_id, worker_id) values
  ('e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002');
insert into public.jobs (id, tenant_id, summary) values
  ('e0000000-0000-0000-0000-00000000aa01', 'e0000000-0000-0000-0000-00000000000a', 'Plot 7');

create function pg_temp.act_as(p_user uuid, p_tenant uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'tenant_id', p_tenant, 'app_role', p_role, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.seed(p_worker uuid, p_date date, p_start text, p_end text, p_job uuid default null) returns void language sql as $$
  insert into public.ts_entries (tenant_id, worker_id, work_date, started_at, ended_at, duration_minutes, job_id, created_by, week_id)
  values ('e0000000-0000-0000-0000-00000000000a', p_worker, p_date,
          (p_date || ' ' || p_start)::timestamp at time zone 'Europe/Dublin',
          (p_date || ' ' || p_end)::timestamp at time zone 'Europe/Dublin', 1, p_job, p_worker, gen_random_uuid());
$$;

-- Aoife: week of 5 Oct = 480 + 247 min (signed off); week of 12 Oct = 60 min (draft). Brian: 60 min, submitted only.
select pg_temp.seed('e0000000-0000-0000-0000-000000000002', '2026-10-06', '08:00', '16:00', 'e0000000-0000-0000-0000-00000000aa01');
select pg_temp.seed('e0000000-0000-0000-0000-000000000002', '2026-10-07', '08:00', '12:07');
select pg_temp.seed('e0000000-0000-0000-0000-000000000002', '2026-10-13', '08:00', '09:00');
select pg_temp.seed('e0000000-0000-0000-0000-000000000003', '2026-10-06', '09:00', '10:00');

select pg_temp.act_as('e0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
do $$ begin perform public.ts_submit_week((select id from public.ts_weeks where week_start = '2026-10-05')); end $$;
reset role;
select pg_temp.act_as('e0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
do $$ begin perform public.ts_submit_week((select id from public.ts_weeks where week_start = '2026-10-05')); end $$;
reset role;
select pg_temp.act_as('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
do $$ begin perform public.ts_decide_week((select id from public.ts_weeks
  where week_start = '2026-10-05' and worker_id = 'e0000000-0000-0000-0000-000000000002'), 'approve'); end $$;

---------------------------------------------------------------- report (owner)
select is((select count(*)::int from public.ts_hours_report('2026-10-05', '2026-10-18', 'worker')), 2,
  'owner report by person: both workers');
select is((select total_minutes from public.ts_hours_report('2026-10-05', '2026-10-18', 'worker') where label = 'Aoife Worker'), 787,
  'exact total for Aoife');
select is((select rounded_minutes from public.ts_hours_report('2026-10-05', '2026-10-18', 'worker') where label = 'Aoife Worker'), 780,
  'rounded total uses the 15-minute setting per entry');
select is((select total_minutes from public.ts_hours_report('2026-10-05', '2026-10-18', 'worker', true) where label = 'Aoife Worker'), 727,
  'signed-off only leaves out draft weeks');
select is((select count(*)::int from public.ts_hours_report('2026-10-05', '2026-10-18', 'worker', true)), 1,
  'signed-off only leaves out Brian (not signed off)');
select is((select string_agg(label, ',' order by sort_key) from public.ts_hours_report('2026-10-05', '2026-10-18', 'job')), 'No job,Plot 7',
  'report by job, with a No job group');
select is((select string_agg(label, ',' order by sort_key) from public.ts_hours_report('2026-10-05', '2026-10-18', 'week')), '2026-10-05,2026-10-12',
  'report by week');
select throws_ok($$ select * from public.ts_hours_report('2026-10-05', '2026-10-18', 'colour') $$, '22023', null, 'unknown grouping is rejected');
reset role;

---------------------------------------------------------------- report scoping
select pg_temp.act_as('e0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-00000000000a', 'supervisor');
set local role authenticated;
select is((select string_agg(label, ',') from public.ts_hours_report('2026-10-05', '2026-10-18', 'worker')), 'Aoife Worker',
  'supervisor report shows only assigned people');
select throws_ok($$ select * from public.ts_export_rows('2026-10-05', '2026-10-18') $$, '42501', null, 'supervisor cannot export');
reset role;
select pg_temp.act_as('e0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
select is((select string_agg(label, ',') from public.ts_hours_report('2026-10-05', '2026-10-18', 'worker')), 'Brian Worker',
  'worker report shows only their own hours');
reset role;

---------------------------------------------------------------- export (owner)
select pg_temp.act_as('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select is((select count(*)::int from public.ts_export_rows('2026-10-05', '2026-10-11')), 2,
  'export rows: only signed-off weeks (Aoife''s 2 entries)');
select is((select start_local || '-' || finish_local from public.ts_export_rows('2026-10-05', '2026-10-11') where work_date = '2026-10-06'),
  '08:00-16:00', 'export times are local (Irish) times');
select throws_ok($$ select public.ts_record_export(array(select week_id from public.ts_export_rows('2026-10-05', '2026-10-11')),
  '2026-10-05', '2026-10-11', 'csv', 'f0000000-0000-0000-0000-00000000000b/timesheets/exports/x.csv') $$,
  '22023', null, 'export path must be in the caller''s own tenant folder');
select is((public.ts_record_export(array(select distinct week_id from public.ts_export_rows('2026-10-05', '2026-10-11')),
  '2026-10-05', '2026-10-11', 'csv', 'e0000000-0000-0000-0000-00000000000a/timesheets/exports/a.csv')).meta ->> 'entry_count', '2',
  'export recorded with entry count');
select is((select status from public.ts_weeks where week_start = '2026-10-05' and worker_id = 'e0000000-0000-0000-0000-000000000002'),
  'exported', 'week marked exported');
select is((select count(*)::int from public.ts_events where action = 'exported'), 1, 'export logged in history');
select is((select count(*)::int from public.ts_export_rows('2026-10-05', '2026-10-11')), 0, 'exported weeks are left out next time…');
select is((select count(*)::int from public.ts_export_rows('2026-10-05', '2026-10-11', true)), 2, '…unless asked to include them again');
reset role;

select pg_temp.act_as('e0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
select throws_ok($$ delete from public.ts_entries where work_date = '2026-10-06' $$, '42501', null, 'exported week is locked');
reset role;

---------------------------------------------------------------- other tenant + storage
insert into storage.objects (bucket_id, name) values ('exports', 'e0000000-0000-0000-0000-00000000000a/timesheets/exports/a.csv');

select pg_temp.act_as('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-00000000000b', 'owner');
set local role authenticated;
select is((select (select count(*) from public.file_exports) + (select count(*) from storage.objects))::int, 0,
  'another tenant sees no exports or files');
reset role;
select pg_temp.act_as('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select is((select count(*)::int from storage.objects where bucket_id = 'exports'), 1, 'owner can download their export file');
reset role;

select * from finish();
rollback;
