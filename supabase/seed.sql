insert into public.tenants (id, name, features)
values
  ('00000000-0000-0000-0000-000000000001', 'Demo Flooring', '{"timesheets": true, "scheduling": true, "flooring": true}'),
  ('00000000-0000-0000-0000-000000000002', 'Demo Construction', '{"timesheets": {"enabled": true}}')
on conflict (id) do update set name = excluded.name, features = excluded.features;

insert into public.jobs (id, tenant_id, summary, status)
values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Flooring survey', 'enquiry'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Oak flooring installation', 'enquiry'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Snagging visit', 'enquiry'),
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000002', 'New build plot 1', 'enquiry'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000002', 'Warehouse fit-out', 'enquiry'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000002', 'Site inspection', 'enquiry')
on conflict (id) do nothing;
