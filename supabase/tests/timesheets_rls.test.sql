-- Timesheets visibility: own vs assigned vs whole tenant, cross-tenant, feature flag.
begin;
select plan(14);

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'owner-a@test.local'),
  ('a0000000-0000-0000-0000-000000000002', 'worker-a@test.local'),
  ('a0000000-0000-0000-0000-000000000003', 'worker-a2@test.local'),
  ('a0000000-0000-0000-0000-000000000004', 'super-a@test.local'),
  ('b0000000-0000-0000-0000-000000000001', 'owner-b@test.local'),
  ('c0000000-0000-0000-0000-000000000001', 'worker-c@test.local');
insert into public.tenants (id, name, features) values
  ('a0000000-0000-0000-0000-00000000000a', 'Tenant A', '{"timesheets": {"enabled": true}}'),
  ('b0000000-0000-0000-0000-00000000000b', 'Tenant B', '{"timesheets": true}'),
  ('c0000000-0000-0000-0000-00000000000c', 'Tenant C (flag off)', '{}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'Owner A', 'owner'),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000a', 'Worker A', 'worker'),
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-00000000000a', 'Worker A2', 'worker'),
  ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-00000000000a', 'Supervisor A', 'supervisor'),
  ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000b', 'Owner B', 'owner'),
  ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000c', 'Worker C', 'worker');
insert into public.ts_assignments (tenant_id, supervisor_id, worker_id) values
  ('a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002');

-- Seed one entry each for Worker A and Worker A2 (as postgres; trigger creates the weeks).
insert into public.ts_entries (tenant_id, worker_id, work_date, started_at, ended_at, duration_minutes, created_by, week_id) values
  ('a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000002', '2026-10-12',
   '2026-10-12 08:00+01', '2026-10-12 16:00+01', 1, 'a0000000-0000-0000-0000-000000000002', gen_random_uuid()),
  ('a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000003', '2026-10-12',
   '2026-10-12 08:00+01', '2026-10-12 12:00+01', 1, 'a0000000-0000-0000-0000-000000000003', gen_random_uuid());

create function pg_temp.act_as(p_user uuid, p_tenant uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'tenant_id', p_tenant, 'app_role', p_role, 'role', 'authenticated')::text, true);
$$;

---------------------------------------------------------------- worker
select pg_temp.act_as('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;

select is((select count(*)::int from public.ts_entries), 1, 'worker sees only their own entries');
select is((select count(*)::int from public.ts_weeks), 1, 'worker sees only their own weeks');
select is((select count(*)::int from public.v_ts_weekly), 1, 'weekly view respects RLS');

select throws_ok($$
  insert into public.ts_entries (tenant_id, worker_id, work_date, started_at, ended_at, duration_minutes)
  values ('a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000003', '2026-10-13',
          '2026-10-13 08:00+01', '2026-10-13 09:00+01', 1) $$,
  '42501', null, 'worker cannot log hours for someone else');

update public.ts_entries set notes = 'hacked' where worker_id = 'a0000000-0000-0000-0000-000000000003';
reset role;
select is((select notes from public.ts_entries where worker_id = 'a0000000-0000-0000-0000-000000000003'), null,
  'worker cannot change someone else''s entry');

set local role authenticated;
select throws_ok($$
  insert into public.ts_weeks (tenant_id, worker_id, week_start)
  values ('a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000002', '2026-10-05') $$,
  '42501', null, 'worker cannot create or change weeks directly');
reset role;

---------------------------------------------------------------- supervisor
select pg_temp.act_as('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-00000000000a', 'supervisor');
set local role authenticated;
select is((select count(*)::int from public.ts_entries), 1, 'supervisor sees only assigned workers');
select is((select worker_id from public.ts_entries), 'a0000000-0000-0000-0000-000000000002'::uuid, '…and it is the assigned worker');
reset role;

---------------------------------------------------------------- owner
select pg_temp.act_as('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select is((select count(*)::int from public.ts_entries), 2, 'owner sees the whole tenant');
reset role;

---------------------------------------------------------------- other tenant
select pg_temp.act_as('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000b', 'owner');
set local role authenticated;
select is((select count(*)::int from public.ts_entries), 0, 'no cross-tenant entries');
select is((select count(*)::int from public.ts_weeks), 0, 'no cross-tenant weeks');
select is((select count(*)::int from public.ts_assignments), 0, 'no cross-tenant assignments');
reset role;

---------------------------------------------------------------- flag off
select pg_temp.act_as('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000c', 'worker');
set local role authenticated;
select throws_ok($$
  insert into public.ts_entries (tenant_id, worker_id, work_date, duration_minutes)
  values ('c0000000-0000-0000-0000-00000000000c', 'c0000000-0000-0000-0000-000000000001', '2026-10-13', 60) $$,
  null, null, 'flag off: cannot add hours');
select throws_ok($$ select public.ts_clock_in() $$, '42501', null, 'flag off: cannot clock in');
reset role;

select * from finish();
rollback;
