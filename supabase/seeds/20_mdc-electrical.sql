-- MDC Electrical (demo), local/dev only. Timesheets set up for customer visits.
-- Settings are assumptions until Martin confirms. Logins and sample visits: scripts/seed/mdc.ts
insert into public.tenants (id, name, features, settings, timezone, branding)
values ('00000000-0000-0000-0000-000000000004', 'MDC Electrical (demo)', '{"timesheets": true}',
        '{"timesheets": {"entryMode": "start_end", "breaks": "off", "approval": "none", "logAgainst": "customer",
          "materials": "optional", "weekStartsOn": "monday", "roundingMinutes": 0,
          "overtimeDailyAfterMinutes": null, "overtimeWeeklyAfterMinutes": null}}',
        'Europe/Dublin',
        '{"colors": {"primary": "#1F6F8B", "accent": "#0F3D4C"}, "pdfName": "MDC Electrical",
          "roleLabels": {"owner": "Owner", "worker": "Apprentice", "viewer": "Accounts Administrator"}}')
on conflict (id) do update set name = excluded.name, features = excluded.features, settings = excluded.settings,
  timezone = excluded.timezone, branding = excluded.branding;

insert into public.customers (id, tenant_id, name)
values
  ('00000000-0000-0000-0004-0000000000c1', '00000000-0000-0000-0000-000000000004', 'Harbourside Hotel'),
  ('00000000-0000-0000-0004-0000000000c2', '00000000-0000-0000-0000-000000000004', 'The Granary Hotel'),
  ('00000000-0000-0000-0004-0000000000c3', '00000000-0000-0000-0000-000000000004', 'Oakfield Nursing Home'),
  ('00000000-0000-0000-0004-0000000000c4', '00000000-0000-0000-0000-000000000004', 'Brennan''s Bar')
on conflict (id) do nothing;
