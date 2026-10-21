-- Timesheets: materials used on an entry (a visit). Item, quantity, unit. Never a price.
-- Switched on per business with the timesheets setting materials = 'optional'.
-- Units: 'each' (whole numbers) and 'm' (metres, up to 2 decimals). Mirror: src/modules/timesheets/rules/materials.ts

alter table public.ts_entries add constraint ts_entries_tenant_id_id_key unique (tenant_id, id);

create table public.ts_entry_materials (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  entry_id   uuid not null,
  item       text not null check (length(btrim(item)) between 1 and 120),
  quantity   numeric not null,
  unit       text not null check (unit in ('each', 'm')),
  position   smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint ts_entry_materials_entry_fk foreign key (tenant_id, entry_id)
    references public.ts_entries (tenant_id, id) on delete cascade,
  constraint ts_entry_materials_qty_positive check (quantity > 0 and quantity < 100000),
  constraint ts_entry_materials_qty_each_whole check (unit <> 'each' or quantity = trunc(quantity)),
  constraint ts_entry_materials_qty_2dp check (quantity = round(quantity, 2))
);
create index ts_entry_materials_entry_idx on public.ts_entry_materials (tenant_id, entry_id, position);

-- Writes follow the parent entry: setting on, and the entry's week still open.
create or replace function private.ts_entry_materials_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  r      public.ts_entry_materials := case when tg_op = 'DELETE' then old else new end;
  v_week public.ts_weeks;
begin
  if tg_op <> 'DELETE' and private.timesheets_settings(r.tenant_id) ->> 'materials' = 'off' then
    raise exception 'Materials aren''t switched on for this business' using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' and (new.tenant_id <> old.tenant_id or new.entry_id <> old.entry_id) then
    raise exception 'A material can''t be moved to another entry' using errcode = '42501';
  end if;
  select w.* into v_week from public.ts_entries e
    join public.ts_weeks w on w.tenant_id = e.tenant_id and w.id = e.week_id
   where e.tenant_id = r.tenant_id and e.id = r.entry_id;
  if found then
    perform private.ts_assert_week_writable(v_week);
  end if;
  if tg_op <> 'DELETE' then
    new.item := btrim(new.item);
    return new;
  end if;
  return old;
end
$$;

create trigger ts_entry_materials_before_write
  before insert or update or delete on public.ts_entry_materials
  for each row execute function private.ts_entry_materials_before_write();

alter table public.ts_entry_materials enable row level security;

-- Visible and writable exactly when the parent entry is (inherits ts_entries RLS).
create policy ts_entry_materials_select on public.ts_entry_materials
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and exists (select 1 from public.ts_entries e
                      where e.tenant_id = ts_entry_materials.tenant_id and e.id = ts_entry_materials.entry_id));

create policy ts_entry_materials_write on public.ts_entry_materials
  for all to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and exists (select 1 from public.ts_entries e
                      where e.tenant_id = ts_entry_materials.tenant_id and e.id = ts_entry_materials.entry_id))
  with check (tenant_id = (select private.current_tenant_id())
              and exists (select 1 from public.ts_entries e
                           where e.tenant_id = ts_entry_materials.tenant_id and e.id = ts_entry_materials.entry_id));

grant select, insert, update, delete on public.ts_entry_materials to authenticated;
