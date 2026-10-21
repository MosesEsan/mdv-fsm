-- Timesheets for visit-style businesses (MDC): settings, customer logging, materials, "Corrected by".
begin;
select plan(30);

insert into auth.users (id, email) values
  ('c0000000-0000-0000-0000-000000000001', 'owner-c@test.local'),
  ('c0000000-0000-0000-0000-000000000002', 'jack-c@test.local'),
  ('c0000000-0000-0000-0000-000000000003', 'michael-c@test.local'),
  ('d0000000-0000-0000-0000-000000000001', 'owner-d@test.local');
insert into public.tenants (id, name, features) values
  ('c0000000-0000-0000-0000-00000000000c', 'Visits Co', '{"timesheets": true}'),
  ('d0000000-0000-0000-0000-00000000000d', 'Other Co',  '{"timesheets": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000c', 'Martin', 'owner'),
  ('c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000000c', 'Jack', 'worker'),
  ('c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-00000000000c', 'Michael', 'worker'),
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-00000000000d', 'Other owner', 'owner');
insert into public.customers (id, tenant_id, name) values
  ('c0000000-0000-0000-0000-0000000000c1', 'c0000000-0000-0000-0000-00000000000c', 'Harbour Hotel'),
  ('d0000000-0000-0000-0000-0000000000d1', 'd0000000-0000-0000-0000-00000000000d', 'Not yours');

create function pg_temp.act_as(p_user uuid, p_role text, p_tenant uuid default 'c0000000-0000-0000-0000-00000000000c') returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'tenant_id', p_tenant, 'app_role', p_role, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.as_martin() returns void language sql as $$ select pg_temp.act_as('c0000000-0000-0000-0000-000000000001', 'owner') $$;
create function pg_temp.as_jack() returns void language sql as $$ select pg_temp.act_as('c0000000-0000-0000-0000-000000000002', 'worker') $$;
create function pg_temp.as_michael() returns void language sql as $$ select pg_temp.act_as('c0000000-0000-0000-0000-000000000003', 'worker') $$;
create function pg_temp.visit(p_start text, p_end text, p_notes text default 'Replaced fittings',
                              p_customer text default 'c0000000-0000-0000-0000-0000000000c1',
                              p_materials jsonb default '[]') returns uuid language sql as $$
  select public.ts_save_visit(jsonb_build_object(
    'started_at', ('2026-10-13 ' || p_start)::timestamp at time zone 'Europe/Dublin',
    'ended_at',   ('2026-10-13 ' || p_end)::timestamp at time zone 'Europe/Dublin',
    'customer_id', p_customer, 'notes', p_notes), p_materials);
$$;

---------------------------------------------------------------- settings
select pg_temp.as_martin();
set local role authenticated;
select throws_ok($$ select public.update_tenant_settings('timesheets', '{"materials":"priced"}') $$, '22023', null, 'materials must be off or optional');
select throws_ok($$ select public.update_tenant_settings('timesheets', '{"logAgainst":"site"}') $$, '22023', null, 'logAgainst rejects unknown values');
select lives_ok($$ select public.update_tenant_settings('timesheets',
  '{"logAgainst":"customer","materials":"optional","approval":"none","roundingMinutes":0,"overtimeWeeklyAfterMinutes":null}') $$,
  'MDC settings save');
reset role;
select is(private.settings_defaults__timesheets() ->> 'materials', 'off', 'materials are off by default');
select is(private.timesheets_settings('c0000000-0000-0000-0000-00000000000c') ->> 'logAgainst', 'customer', 'business now logs against customers');

---------------------------------------------------------------- customers for staff
select pg_temp.as_jack();
set local role authenticated;
select is((select count(*)::int from public.customers), 1, 'staff see their business''s customers (and no one else''s)');
select lives_ok($$ insert into public.customers (tenant_id, name) values ('c0000000-0000-0000-0000-00000000000c', 'Quay Hotel') $$,
  'staff can add a new customer by name');
select throws_ok($$ insert into public.customers (tenant_id, name) values ('d0000000-0000-0000-0000-00000000000d', 'Sneaky') $$,
  '42501', null, 'staff can''t add a customer to another business');
select is_empty($$ update public.customers set name = 'Renamed' where name = 'Harbour Hotel' returning 1 $$,
  'staff can''t rename customers');
reset role;

---------------------------------------------------------------- logging a visit
select pg_temp.as_jack();
set local role authenticated;
select lives_ok($$ select pg_temp.visit('09:00', '11:30', 'Replaced 4 downlights',
  p_materials => '[{"item":"LED downlight","quantity":4,"unit":"each"},{"item":"2.5mm cable","quantity":12.5,"unit":"m"}]') $$,
  'Jack logs a visit with materials');
select is((select duration_minutes from public.ts_entries where notes = 'Replaced 4 downlights'), 150, 'hours worked out from the times');
select is((select count(*)::int from public.ts_entry_materials), 2, 'materials saved with the visit');
select is((select customer_id from public.ts_entries where notes = 'Replaced 4 downlights'),
  'c0000000-0000-0000-0000-0000000000c1'::uuid, 'visit is logged against the customer');
select throws_ok($$ select pg_temp.visit('12:00', '13:00', 'x', p_customer => null) $$, '23502', 'Choose a customer, or add a new one.', 'customer is required');
select throws_ok($$ select pg_temp.visit('12:00', '13:00', '  ') $$, '23502', 'Add a short note of the work done.', 'work done is required');
select throws_ok($$ select pg_temp.visit('12:00', '13:00', repeat('a', 501)) $$, '22023', null, 'work done is at most 500 characters');
select throws_ok($$ select public.ts_save_visit(jsonb_build_object('started_at', '2026-10-14 06:00+01', 'ended_at', '2026-10-14 23:00+01',
  'customer_id', 'c0000000-0000-0000-0000-0000000000c1', 'notes', 'long')) $$, '22023', 'That''s over 16 hours. Check the times.', 'at most 16 hours');
select throws_ok($$ select pg_temp.visit('12:00', '13:00', 'x', 'd0000000-0000-0000-0000-0000000000d1') $$, '23503', null,
  'a customer from another business is refused');
select throws_ok($$ select pg_temp.visit('12:00', '13:00', 'x', p_materials => '[{"item":"Socket","quantity":1.5,"unit":"each"}]') $$,
  '23514', null, '"each" needs a whole number');
select throws_ok($$ select pg_temp.visit('12:00', '13:00', 'x', p_materials => '[{"item":"Cable","quantity":1.234,"unit":"m"}]') $$,
  '23514', null, 'metres allow at most 2 decimals');
select throws_ok($$ select pg_temp.visit('12:00', '13:00', 'x', p_materials => '[{"item":"Cable","quantity":0,"unit":"m"}]') $$,
  '23514', null, 'quantity must be more than 0');
select is((select count(*)::int from public.ts_entries), 1, 'failed saves leave nothing behind');
select is((select corrected_by from public.ts_entries), null, 'Jack''s own visit is not marked corrected');
reset role;

---------------------------------------------------------------- other workers and the owner
select pg_temp.as_michael();
set local role authenticated;
select is((select count(*)::int from public.ts_entries), 0, 'Michael can''t see Jack''s visits');
select is((select count(*)::int from public.ts_entry_materials), 0, '...or their materials');
reset role;

select pg_temp.as_martin();
set local role authenticated;
select lives_ok($$ select public.ts_save_visit(jsonb_build_object('id', (select id from public.ts_entries),
  'started_at', '2026-10-13 09:00+01', 'ended_at', '2026-10-13 11:00+01',
  'customer_id', 'c0000000-0000-0000-0000-0000000000c1', 'notes', 'Replaced 4 downlights'),
  '[{"item":"LED downlight","quantity":4,"unit":"each"}]') $$, 'Martin corrects Jack''s visit');
select is((select corrected_by from public.ts_entries), 'c0000000-0000-0000-0000-000000000001'::uuid, 'visit shows Corrected by Martin');
select is((select count(*)::int from public.ts_events where action = 'entry_changed'), 1, 'the correction is in the history');
select is((select count(*)::int from public.ts_entry_materials), 1, 'materials replaced by the correction');
reset role;

select pg_temp.as_jack();
set local role authenticated;
select is((select corrected_by from public.ts_entries), 'c0000000-0000-0000-0000-000000000001'::uuid, 'Jack sees it was corrected');
reset role;

select * from finish();
rollback;
