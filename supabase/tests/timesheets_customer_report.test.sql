-- Customer × month report and recording a customer report export.
begin;
select plan(11);

insert into auth.users (id, email) values
  ('f0000000-0000-0000-0000-000000000001', 'owner-f@test.local'),
  ('f0000000-0000-0000-0000-000000000002', 'jack-f@test.local'),
  ('f0000000-0000-0000-0000-000000000003', 'accounts-f@test.local');
insert into public.tenants (id, name, features, settings) values
  ('f0000000-0000-0000-0000-00000000000f', 'Report Co', '{"timesheets": true}',
   '{"timesheets": {"logAgainst": "customer", "materials": "optional", "approval": "none"}}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-00000000000f', 'Martin', 'owner'),
  ('f0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-00000000000f', 'Jack', 'worker'),
  ('f0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-00000000000f', 'Michael', 'viewer');
insert into public.customers (id, tenant_id, name) values
  ('f0000000-0000-0000-0000-0000000000c1', 'f0000000-0000-0000-0000-00000000000f', 'Harbourside Hotel'),
  ('f0000000-0000-0000-0000-0000000000c2', 'f0000000-0000-0000-0000-00000000000f', 'Granary');

create function pg_temp.act_as(p_user uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'tenant_id', 'f0000000-0000-0000-0000-00000000000f', 'app_role', p_role, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.visit(p_day text, p_s text, p_f text, p_c text, p_notes text, p_m jsonb default '[]') returns uuid language sql as $$
  select public.ts_save_visit(jsonb_build_object('started_at', (p_day || ' ' || p_s)::timestamp at time zone 'Europe/Dublin',
    'ended_at', (p_day || ' ' || p_f)::timestamp at time zone 'Europe/Dublin', 'customer_id', p_c, 'notes', p_notes), p_m);
$$;

select pg_temp.act_as('f0000000-0000-0000-0000-000000000002', 'worker');
set local role authenticated;
select pg_temp.visit('2026-10-07', '09:00', '12:00', 'f0000000-0000-0000-0000-0000000000c1', 'Downlights', '[{"item":"LED downlight","quantity":12,"unit":"each"}]');
select pg_temp.visit('2026-09-30', '09:00', '10:00', 'f0000000-0000-0000-0000-0000000000c1', 'September visit');
select pg_temp.visit('2026-10-08', '09:00', '10:00', 'f0000000-0000-0000-0000-0000000000c2', 'Other customer');
reset role;
select pg_temp.act_as('f0000000-0000-0000-0000-000000000001', 'owner');
set local role authenticated;
select pg_temp.visit('2026-10-02', '08:00', '10:30', 'f0000000-0000-0000-0000-0000000000c1', 'Lighting column', '[{"item":"6mm cable","quantity":15,"unit":"m"}]');
select public.ts_save_visit(jsonb_build_object('id', (select id from public.ts_entries where notes = 'Downlights'),
  'started_at', '2026-10-07 09:00+01', 'ended_at', '2026-10-07 11:30+01', 'customer_id', 'f0000000-0000-0000-0000-0000000000c1', 'notes', 'Downlights'),
  '[{"item":"LED downlight","quantity":12,"unit":"each"}]');

create temp table r as select * from public.ts_customer_month_report('f0000000-0000-0000-0000-0000000000c1', '2026-10-15');
select is((select count(*)::int from r), 2, 'one line per visit for that customer and month only');
select is((select notes from r order by work_date limit 1), 'Lighting column', 'lines are in date order');
select is((select start_local || '–' || finish_local from r where notes = 'Lighting column'), '08:00–10:30', 'times in the business''s time zone');
select is((select duration_minutes from r where notes = 'Downlights'), 150, 'hours are after the correction');
select is((select corrected_by_name from r where notes = 'Downlights'), 'Martin', 'corrected visits name who corrected them');
select is((select materials from r where notes = 'Lighting column'), '[{"item": "6mm cable", "unit": "m", "quantity": 15}]'::jsonb, 'materials included');
reset role;

select pg_temp.act_as('f0000000-0000-0000-0000-000000000003', 'viewer');
set local role authenticated;
select is((select count(*)::int from public.ts_customer_month_report('f0000000-0000-0000-0000-0000000000c1', '2026-10-01')), 2, 'accounts sees the whole report');
select lives_ok($$ select public.ts_record_customer_report('f0000000-0000-0000-0000-0000000000c1', '2026-10-01', 'pdf',
  'f0000000-0000-0000-0000-00000000000f/timesheets/exports/report.pdf') $$, 'accounts can record an export');
select is((select title from public.file_exports), 'Customer report — Harbourside Hotel, October 2026', 'export titled by customer and month');
reset role;

select pg_temp.act_as('f0000000-0000-0000-0000-000000000002', 'worker');
set local role authenticated;
select is((select count(*)::int from public.ts_customer_month_report('f0000000-0000-0000-0000-0000000000c1', '2026-10-01')), 1, 'a worker''s report only has his own visits');
select throws_ok($$ select public.ts_record_customer_report('f0000000-0000-0000-0000-0000000000c1', '2026-10-01', 'pdf',
  'f0000000-0000-0000-0000-00000000000f/timesheets/exports/x.pdf') $$, '42501', null, 'workers can''t export reports');
reset role;

select * from finish();
rollback;
