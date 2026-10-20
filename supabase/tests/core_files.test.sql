-- Core generated files: who can see export history and files, per tenant and per module flag.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('c1000000-0000-0000-0000-000000000001', 'owner@files.test'),
  ('c1000000-0000-0000-0000-000000000002', 'worker@files.test'),
  ('c2000000-0000-0000-0000-000000000001', 'owner-b@files.test');
insert into public.tenants (id, name, features) values
  ('c1000000-0000-0000-0000-00000000000a', 'Files A', '{"timesheets": true, "quotes": false}'),
  ('c2000000-0000-0000-0000-00000000000b', 'Files B', '{"timesheets": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000a', 'Owner A', 'owner'),
  ('c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-00000000000a', 'Worker A', 'worker'),
  ('c2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-00000000000b', 'Owner B', 'owner');

-- One file for an enabled module, one for a module that's switched off.
insert into public.file_exports (tenant_id, module, title, format, storage_path, created_by) values
  ('c1000000-0000-0000-0000-00000000000a', 'timesheets', 'Timesheets', 'csv', 'c1000000-0000-0000-0000-00000000000a/timesheets/exports/a.csv', 'c1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-00000000000a', 'quotes', 'Quotes', 'pdf', 'c1000000-0000-0000-0000-00000000000a/quotes/q.pdf', 'c1000000-0000-0000-0000-000000000001');
insert into storage.objects (bucket_id, name) values
  ('exports', 'c1000000-0000-0000-0000-00000000000a/timesheets/exports/a.csv'),
  ('exports', 'c1000000-0000-0000-0000-00000000000a/quotes/q.pdf');

select throws_ok($$ insert into public.file_exports (tenant_id, module, title, format, storage_path, created_by)
  values ('c1000000-0000-0000-0000-00000000000a', 'timesheets', 'X', 'csv', 'c2000000-0000-0000-0000-00000000000b/timesheets/x.csv', 'c1000000-0000-0000-0000-000000000001') $$,
  '23514', null, 'file path must be inside the row''s own tenant and module folder');

create function pg_temp.act_as(p_user uuid, p_tenant uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'tenant_id', p_tenant, 'app_role', p_role, 'role', 'authenticated')::text, true);
$$;

select pg_temp.act_as('c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select is((select string_agg(module, ',') from public.file_exports), 'timesheets', 'owner sees exports only for modules switched on');
select is((select count(*)::int from storage.objects where bucket_id = 'exports'), 1, 'owner can open files only for modules switched on');
select throws_ok($$ select private.record_file_export('timesheets', 'X', 'csv', null, null, 'c1000000-0000-0000-0000-00000000000a/timesheets/x.csv') $$,
  '42501', null, 'the core helper is not callable from the app');
select throws_ok($$ insert into public.file_exports (tenant_id, module, title, format, storage_path, created_by)
  values ('c1000000-0000-0000-0000-00000000000a', 'timesheets', 'X', 'csv', 'c1000000-0000-0000-0000-00000000000a/timesheets/x.csv', 'c1000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'the app cannot write export history directly');
reset role;

select pg_temp.act_as('c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
select is((select (select count(*) from public.file_exports) + (select count(*) from storage.objects))::int, 0, 'workers see no exports or files');
reset role;

select pg_temp.act_as('c2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-00000000000b', 'owner');
set local role authenticated;
select is((select count(*)::int from public.file_exports), 0, 'another business sees no export history');
select is((select count(*)::int from storage.objects), 0, 'another business sees no files');
reset role;

select * from finish();
rollback;
