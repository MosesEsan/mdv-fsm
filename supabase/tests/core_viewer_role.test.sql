-- Read-only "viewer" role (Accounts Administrator).
begin;
select plan(14);

insert into auth.users (id, email) values
  ('e0000000-0000-0000-0000-000000000001', 'owner-e@test.local'),
  ('e0000000-0000-0000-0000-000000000002', 'worker-e@test.local'),
  ('e0000000-0000-0000-0000-000000000003', 'accounts-e@test.local');
insert into public.tenants (id, name, features, settings) values
  ('e0000000-0000-0000-0000-00000000000e', 'Viewer Co', '{"timesheets": true}',
   '{"timesheets": {"logAgainst": "customer", "materials": "optional", "approval": "none"}}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-00000000000e', 'Owner', 'owner'),
  ('e0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-00000000000e', 'Jack', 'worker'),
  ('e0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-00000000000e', 'Accounts', 'viewer');
insert into public.customers (id, tenant_id, name) values
  ('e0000000-0000-0000-0000-0000000000c1', 'e0000000-0000-0000-0000-00000000000e', 'Hotel');

create function pg_temp.act_as(p_user uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'tenant_id', 'e0000000-0000-0000-0000-00000000000e', 'app_role', p_role, 'role', 'authenticated')::text, true);
$$;

select pg_temp.act_as('e0000000-0000-0000-0000-000000000002', 'worker');
set local role authenticated;
select lives_ok($$ select public.ts_save_visit(jsonb_build_object('started_at', '2026-10-13 09:00+01', 'ended_at', '2026-10-13 10:00+01',
  'customer_id', 'e0000000-0000-0000-0000-0000000000c1', 'notes', 'Fixed light'), '[{"item":"Lamp","quantity":1,"unit":"each"}]') $$, 'worker logs a visit');
reset role;

select pg_temp.act_as('e0000000-0000-0000-0000-000000000003', 'viewer');
set local role authenticated;
select is((select count(*)::int from public.ts_entries), 1, 'viewer sees everyone''s visits');
select is((select count(*)::int from public.ts_entry_materials), 1, 'viewer sees materials');
select is((select count(*)::int from public.ts_weeks), 1, 'viewer sees weeks');
select is((select count(*)::int from public.customers), 1, 'viewer sees customers');
select throws_ok($$ update public.ts_entries set notes = 'changed' $$, '42501', null, 'viewer can''t change a visit');
select throws_ok($$ delete from public.ts_entries $$, '42501', null, 'viewer can''t delete a visit');
select throws_ok($$ delete from public.ts_entry_materials $$, '42501', null, 'viewer can''t remove materials');
select throws_ok($$ select public.ts_save_visit(jsonb_build_object('started_at', '2026-10-14 09:00+01', 'ended_at', '2026-10-14 10:00+01',
  'customer_id', 'e0000000-0000-0000-0000-0000000000c1', 'notes', 'x')) $$, '42501', null, 'viewer can''t log time');
select throws_ok($$ insert into public.customers (tenant_id, name) values ('e0000000-0000-0000-0000-00000000000e', 'New') $$, '42501', null,
  'viewer can''t add customers');
select throws_ok($$ select public.update_tenant_settings('timesheets', '{"materials":"off"}') $$, null, null, 'viewer can''t change settings');
select throws_ok($$ select public.ts_clock_in() $$, null, null, 'viewer can''t clock in');
reset role;

select is((select notes from public.ts_entries), 'Fixed light', 'the visit is unchanged');

-- Every business table has the write block (new tables must get one too).
select is_empty($$
  select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and c.relname not in ('profiles', 'file_exports', 'ts_events', 'platform_admins', 'platform_audit')
     and not exists (select 1 from pg_trigger t where t.tgrelid = c.oid and t.tgname = 'zz_block_viewer_writes') $$,
  'every business table refuses writes from viewers');

select * from finish();
rollback;
