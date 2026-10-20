-- Platform admin: only listed admins get in, everything is audited, branding is validated,
-- owners can't change branding or modules, logos are private to their business.
begin;
select plan(30);

insert into auth.users (id, email) values
  ('ad000000-0000-0000-0000-000000000001', 'admin-fixture@pa.test'),
  ('a1000000-0000-0000-0000-000000000001', 'owner-a@pa.test'),
  ('a1000000-0000-0000-0000-000000000002', 'worker-a@pa.test'),
  ('b1000000-0000-0000-0000-000000000001', 'owner-b@pa.test'),
  ('c1000000-0000-0000-0000-000000000009', 'new-person@pa.test');
insert into public.platform_admins (user_id, note) values ('ad000000-0000-0000-0000-000000000001', 'test admin');
insert into public.tenants (id, name, features) values
  ('a1000000-0000-0000-0000-00000000000a', 'Business A', '{"timesheets": true}'),
  ('b1000000-0000-0000-0000-00000000000b', 'Business B', '{}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-00000000000a', 'Owner A', 'owner'),
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-00000000000a', 'Worker A', 'worker'),
  ('b1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-00000000000b', 'Owner B', 'owner');
insert into storage.objects (bucket_id, name) values ('branding', 'a1000000-0000-0000-0000-00000000000a/logo/a.png');

create function pg_temp.as_admin() returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', 'ad000000-0000-0000-0000-000000000001', 'platform_admin', true, 'role', 'authenticated')::text, true) $$;
create function pg_temp.as_user(p_user uuid, p_tenant uuid, p_role text, p_forged boolean default false) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'tenant_id', p_tenant, 'app_role', p_role,
    'platform_admin', p_forged, 'role', 'authenticated')::text, true) $$;

---------------------------------------------------------------- token hook
select is(public.custom_access_token_hook('{"user_id":"ad000000-0000-0000-0000-000000000001","claims":{}}') #>> '{claims,platform_admin}', 'true',
  'token hook marks platform admins');
select is(public.custom_access_token_hook('{"user_id":"a1000000-0000-0000-0000-000000000001","claims":{}}') -> 'claims',
  '{"tenant_id":"a1000000-0000-0000-0000-00000000000a","app_role":"owner"}'::jsonb, 'token hook unchanged for business users');

---------------------------------------------------------------- who gets in
select pg_temp.as_user('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select throws_ok($$ select * from public.platform_list_tenants() $$, '42501', null, 'an owner cannot use platform functions');
select is(public.platform_whoami(), false, 'whoami is false for an owner');
reset role;
select pg_temp.as_user('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-00000000000a', 'owner', true);
set local role authenticated;
select throws_ok($$ select * from public.platform_list_tenants() $$, '42501', null, 'a token claim alone is not enough (must be listed)');
reset role;

---------------------------------------------------------------- admin actions
select pg_temp.as_admin();
set local role authenticated;
select is(public.platform_whoami(), true, 'whoami is true for a listed admin');
select is((select count(*)::int from public.platform_list_tenants()
  where id in ('a1000000-0000-0000-0000-00000000000a', 'b1000000-0000-0000-0000-00000000000b')), 2, 'admin sees every business');
select is((public.platform_create_tenant('New Client Ltd', 'Europe/Dublin')).name, 'New Client Ltd', 'admin creates a business');
select throws_ok($$ select public.platform_create_tenant('Bad TZ', 'Mars/Olympus') $$, '22023', null, 'unknown time zone refused');
select lives_ok($$ select public.platform_set_features('b1000000-0000-0000-0000-00000000000b', '{"timesheets": {"enabled": true}}') $$, 'admin switches a module on');
select throws_ok($$ select public.platform_set_features('b1000000-0000-0000-0000-00000000000b', '{"timesheets": "yes"}') $$, '22023', null, 'bad feature value refused');

select lives_ok($$ select public.platform_set_branding('a1000000-0000-0000-0000-00000000000a',
  '{"colors":{"primary":"#1F4E79","accent":"#8A3B12"},"pdfName":"Business A Ltd","roleLabels":{"worker":"Operative","supervisor":"Foreman"},
    "logoPath":"a1000000-0000-0000-0000-00000000000a/logo/a.png"}') $$, 'admin sets branding');
select throws_ok($$ select public.platform_set_branding('a1000000-0000-0000-0000-00000000000a', '{"colors":{"primary":"#FFD700"}}') $$,
  '22023', null, 'a colour too light for white text is refused');
select throws_ok($$ select public.platform_set_branding('a1000000-0000-0000-0000-00000000000a', '{"colors":{"primary":"blue"}}') $$,
  '22023', null, 'a colour that is not #RRGGBB is refused');
select throws_ok($$ select public.platform_set_branding('a1000000-0000-0000-0000-00000000000a', '{"logoPath":"b1000000-0000-0000-0000-00000000000b/logo/x.png"}') $$,
  '22023', null, 'a logo from another business folder is refused');
select throws_ok($$ select public.platform_set_branding('a1000000-0000-0000-0000-00000000000a', '{"roleLabels":{"pilot":"Captain"}}') $$,
  '22023', null, 'an unknown role label is refused');

select is(public.platform_set_module_settings('a1000000-0000-0000-0000-00000000000a', 'timesheets', '{"approval":"supervisor"}') #>> '{timesheets,approval}',
  'supervisor', 'admin sets module settings for a business');
select throws_ok($$ select public.platform_set_module_settings('a1000000-0000-0000-0000-00000000000a', 'timesheets', '{"approval":"sometimes"}') $$,
  '22023', null, 'module settings are validated on the platform path too');
reset role;

-- Week start can't change once weeks exist: the check must look at the business being edited.
insert into public.ts_entries (tenant_id, worker_id, work_date, duration_minutes, created_by, week_id)
values ('a1000000-0000-0000-0000-00000000000a', 'a1000000-0000-0000-0000-000000000002', '2026-10-12', 60, 'a1000000-0000-0000-0000-000000000002', gen_random_uuid());
select pg_temp.as_admin();
set local role authenticated;
select throws_ok($$ select public.platform_set_module_settings('a1000000-0000-0000-0000-00000000000a', 'timesheets', '{"weekStartsOn":"sunday"}') $$,
  '22023', null, 'week-start lock checks the business being edited');

select is((select count(*)::int from public.platform_tenant_people('a1000000-0000-0000-0000-00000000000a') where email like '%@pa.test'), 2,
  'admin sees a business''s people with emails');
select is((public.platform_add_member('b1000000-0000-0000-0000-00000000000b', 'c1000000-0000-0000-0000-000000000009', 'New Person', 'manager')).role,
  'manager', 'admin adds a person to a business');
select throws_ok($$ select public.platform_add_member('a1000000-0000-0000-0000-00000000000a', 'c1000000-0000-0000-0000-000000000009', 'Again', 'worker') $$,
  '23505', null, 'a person can belong to only one business');
select is((public.platform_update_member('a1000000-0000-0000-0000-000000000002', 'Worker A', 'supervisor', true)).role, 'supervisor', 'admin changes a role');
select is((select string_agg(action, ',' order by action) from public.platform_audit_log()),
  'branding_set,features_set,member_added,member_updated,settings_set,tenant_created', 'every successful admin action is in the audit log (refused ones change nothing)');
select is((select count(*)::int from storage.objects where bucket_id = 'branding'), 1, 'admin can see logos');
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('branding', 'b1000000-0000-0000-0000-00000000000b/logo/b.png') $$, 'admin can upload a logo');
reset role;

---------------------------------------------------------------- business users
select pg_temp.as_user('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select throws_ok($$ update public.tenants set branding = '{"colors":{"primary":"#000000"}}' $$, '42501', null, 'an owner cannot change branding directly');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('branding', 'a1000000-0000-0000-0000-00000000000a/logo/z.png') $$,
  '42501', null, 'an owner cannot upload a logo');
reset role;
select pg_temp.as_user('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
select is((select count(*)::int from storage.objects where bucket_id = 'branding'), 1, 'staff can load their own business logo only');
reset role;
select pg_temp.as_user('b1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-00000000000b', 'owner');
set local role authenticated;
select throws_ok($$ select * from public.platform_audit $$, '42501', null, 'business users cannot read the platform audit');
reset role;

select * from finish();
rollback;
