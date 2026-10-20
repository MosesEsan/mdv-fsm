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

-- Demo property maintenance business: job records and extra work on. Invented customers.
-- People, who's on each job, updates and extra work come from scripts/seed-users.ts (they need logins).
insert into public.tenants (id, name, features, branding)
values ('00000000-0000-0000-0000-000000000003', 'AG Property Maintenance', '{"job_records": true, "extra_work": true}',
        '{"colors": {"primary": "#1973B3", "accent": "#13406C"}, "pdfName": "AG Property Maintenance"}')
on conflict (id) do update set name = excluded.name, features = excluded.features, branding = excluded.branding;

insert into public.customers (id, tenant_id, name, phone, address)
values
  ('00000000-0000-0000-0003-0000000000c1', '00000000-0000-0000-0000-000000000003', 'Mary Collins', '087 412 6610', '14 Main Street, Swords'),
  ('00000000-0000-0000-0003-0000000000c2', '00000000-0000-0000-0000-000000000003', 'Tom Hennessy', '086 233 9014', '3 Cedar Grove, Malahide'),
  ('00000000-0000-0000-0003-0000000000c3', '00000000-0000-0000-0000-000000000003', 'Orla Kenny', '085 778 0213', '27 The Avenue, Portmarnock'),
  ('00000000-0000-0000-0003-0000000000c4', '00000000-0000-0000-0000-000000000003', 'Declan Ward', '087 901 4472', '9 Seafield Road, Clontarf'),
  ('00000000-0000-0000-0003-0000000000c5', '00000000-0000-0000-0000-000000000003', 'Brian and Ann Moore', '086 551 3029', '41 Forest Park, Swords'),
  ('00000000-0000-0000-0003-0000000000c6', '00000000-0000-0000-0000-000000000003', 'Siobhán Daly', '085 220 8831', '2 Abbey Court, Howth'),
  ('00000000-0000-0000-0003-0000000000c7', '00000000-0000-0000-0000-000000000003', 'Joe Murphy', '087 330 1125', '15 Strand Road, Sutton'),
  ('00000000-0000-0000-0003-0000000000c8', '00000000-0000-0000-0000-000000000003', 'Helen Brady', '086 404 7726', '6 Church Road, Malahide')
on conflict (id) do nothing;

insert into public.jobs (id, tenant_id, customer_id, summary, site_address, instructions, start_on, status, created_at)
values
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0003-0000000000c1', 'Bathroom renovation', '14 Main Street, Swords',
   'Full bathroom: strip out, new shower enclosure, tiling floor to ceiling, new vanity and toilet. Customer has chosen the grey 60x30 tiles (in the garage). Water off at the stopcock under the kitchen sink. Mary works from home, keep the hall clear.',
   '2026-10-13', 'in_progress', '2026-10-12 17:00+01'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0003-0000000000c2', 'Leaking shower tray, reseal and regrout', '3 Cedar Grove, Malahide',
   'Water coming through the kitchen ceiling under the en-suite. Check the tray seal and the waste first. Customer away Thursday, key in the safe (code with Gary).',
   '2026-10-22', 'todo', '2026-10-19 15:30+01'),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0003-0000000000c3', 'Paint hall, stairs and landing', '27 The Avenue, Portmarnock',
   'Walls in Mist Grey matt, woodwork in white satin. Paint is on site. Fill the crack above the front door first.',
   '2026-10-19', 'in_progress', '2026-10-15 12:00+01'),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0003-0000000000c4', 'Replace kitchen sink tap', '9 Seafield Road, Clontarf',
   'Customer is buying the tap. Fit when it arrives.', null, 'todo', '2026-10-20 09:00+01'),
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0003-0000000000c5', 'Bathroom renovation', '41 Forest Park, Swords',
   'Walk-in shower, tiled floor, wall-hung vanity.', '2026-07-21', 'completed', '2026-07-15 10:00+01'),
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0003-0000000000c6', 'Ensuite bathroom refit', '2 Abbey Court, Howth',
   'Shower tray, tiling and new toilet.', '2026-09-01', 'completed', '2026-08-25 11:00+01'),
  ('00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0003-0000000000c7', 'Fix fence panels after storm', '15 Strand Road, Sutton',
   'Three panels down on the left side. Replacement panels at the builders'' merchant.', '2026-10-06', 'completed', '2026-10-05 09:00+01'),
  ('00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0003-0000000000c8', 'Bathroom tiles regrout', '6 Church Road, Malahide',
   'Regrout the shower walls and reseal the bath.', '2026-05-12', 'completed', '2026-05-08 10:00+01')
on conflict (id) do nothing;

-- Finished jobs keep their real finish dates.
update public.jobs j set completed_at = v.done::timestamptz
  from (values ('00000000-0000-0000-0003-000000000005', '2026-08-01 16:30+01'), ('00000000-0000-0000-0003-000000000006', '2026-09-09 15:45+01'),
               ('00000000-0000-0000-0003-000000000007', '2026-10-06 15:15+01'), ('00000000-0000-0000-0003-000000000008', '2026-05-13 14:15+01')) as v(id, done)
 where j.id = v.id::uuid and j.status = 'completed';
