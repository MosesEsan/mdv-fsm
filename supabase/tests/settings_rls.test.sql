-- Tenant settings: read/write rules and validation.  Run: supabase test db
-- Seeds assume core columns tenants(id, name, features), profiles(id, tenant_id, full_name, role).
begin;
select plan(13);

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'owner-a@test.local'),
  ('a0000000-0000-0000-0000-000000000002', 'worker-a@test.local'),
  ('b0000000-0000-0000-0000-000000000001', 'owner-b@test.local');
insert into public.tenants (id, name, features) values
  ('a0000000-0000-0000-0000-00000000000a', 'Tenant A', '{"timesheets": true}'),
  ('b0000000-0000-0000-0000-00000000000b', 'Tenant B', '{"timesheets": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'Owner A', 'owner'),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000a', 'Worker A', 'worker'),
  ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000b', 'Owner B', 'owner');

create function pg_temp.act_as(p_user uuid, p_tenant uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'tenant_id', p_tenant, 'app_role', p_role, 'role', 'authenticated')::text, true);
$$;

-- Existing tenants get an empty object (all defaults).
select is((select settings from public.tenants where id = 'a0000000-0000-0000-0000-00000000000a'), '{}'::jsonb,
  'new column defaults to {} for existing tenants');

---------------------------------------------------------------- worker
select pg_temp.act_as('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;

select is((select count(*)::int from public.tenants where id = 'a0000000-0000-0000-0000-00000000000a'), 1,
  'worker can read their tenant settings');

select throws_ok($$ select public.update_tenant_settings('timesheets', '{"breaks":"fixed"}') $$,
  '42501', null, 'worker cannot update settings through the RPC');

do $$ begin
  update public.tenants set settings = '{"timesheets":{"breaks":"fixed"}}';
exception when others then null;
end $$;
reset role;
select is((select settings from public.tenants where id = 'a0000000-0000-0000-0000-00000000000a'), '{}'::jsonb,
  'worker cannot update settings directly');

---------------------------------------------------------------- owner
select pg_temp.act_as('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;

do $$ begin
  update public.tenants set settings = '{"timesheets":{"junk":1}}';
exception when others then null;
end $$;
reset role;
select is((select settings from public.tenants where id = 'a0000000-0000-0000-0000-00000000000a'), '{}'::jsonb,
  'owner cannot bypass the RPC with a direct update');

set local role authenticated;
select lives_ok($$ select public.update_tenant_settings('timesheets', '{"breaks":"fixed","fixedBreakMinutes":45}') $$,
  'owner can save valid settings');
select is((select settings -> 'timesheets' ->> 'fixedBreakMinutes' from public.tenants
            where id = 'a0000000-0000-0000-0000-00000000000a'), '45', 'saved value is stored');

select throws_ok($$ select public.update_tenant_settings('timesheets', '{"entryMode":"weekly"}') $$,
  '22023', null, 'invalid value is rejected');
select throws_ok($$ select public.update_tenant_settings('timesheets', '{"fixedBreakMinutes":"30"}') $$,
  '22023', null, 'wrong type is rejected');
select throws_ok($$ select public.update_tenant_settings('timesheets', '{"surprise":true}') $$,
  '22023', null, 'unknown key is rejected');
select throws_ok($$ select public.update_tenant_settings('payroll', '{}') $$,
  '22023', null, 'unknown namespace is rejected');

---------------------------------------------------------------- other tenant
reset role;
select pg_temp.act_as('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000b', 'owner');
set local role authenticated;
select is((select count(*)::int from public.tenants where id = 'a0000000-0000-0000-0000-00000000000a'), 0,
  'another tenant cannot read tenant A settings');
reset role;

-- Contract: the app's Zod defaults are checked against this same function by a unit test.
select is(private.settings_defaults__timesheets() ->> 'entryMode', 'start_end', 'SQL defaults are defined');

select * from finish();
rollback;
