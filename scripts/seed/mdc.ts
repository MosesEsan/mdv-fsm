// MDC Electrical (demo): owner, apprentice and accounts logins, plus sample visits matching the flows board.
// SQL (business, settings, customers): supabase/seeds/20_mdc-electrical.sql. Local/dev only.
import type { SupabaseClient } from '@supabase/supabase-js';
import { TENANTS, printLogins, seedUsers, type SeedUser } from './shared';

const USERS: SeedUser[] = [
  { key: 'm-martin', tenant: TENANTS.mdc, role: 'owner', email: 'owner@mdc.test', name: 'Martin' },
  { key: 'm-jack', tenant: TENANTS.mdc, role: 'worker', email: 'jack@mdc.test', name: 'Jack' },
  // Accounts Administrator: read-only role. "Michael" is a placeholder until Martin gives his father's name.
  { key: 'm-michael', tenant: TENANTS.mdc, role: 'viewer', email: 'accounts@mdc.test', name: 'Michael' },
];

const C = (n: number) => `00000000-0000-0000-0004-0000000000c${n}`;
type M = [item: string, quantity: number, unit: 'each' | 'm'];
// [id, who, customer, date, start, finish, work done, materials]
const VISITS: [string, string, number, string, string, string, string, M[]][] = [
  ['e1', 'm-martin', 1, '2026-10-02', '08:00', '10:30', 'Repaired car park lighting column 4', [['Photocell', 1, 'each'], ['LED lamp', 1, 'each']]],
  ['e2', 'm-jack', 1, '2026-10-07', '09:00', '12:00', 'Replaced 12 downlights in reception with LED', [['LED downlight', 12, 'each']]],
  ['e3', 'm-martin', 3, '2026-10-09', '13:00', '15:30', 'Installed call bell in room 7', [['Call point', 1, 'each']]],
  ['e4', 'm-martin', 2, '2026-10-13', '08:00', '12:00', 'New supply for coffee machine', [['6mm T&E cable', 15, 'm'], ['MCB 32A', 1, 'each']]],
  ['e5', 'm-jack', 4, '2026-10-14', '16:00', '18:00', 'Replaced broken socket in lounge', [['Double socket', 1, 'each']]],
  ['e6', 'm-martin', 1, '2026-10-15', '08:30', '11:00', 'Fire alarm fault, replaced detector on level 2', [['Optical smoke detector', 1, 'each']]],
  ['e7', 'm-jack', 1, '2026-10-16', '08:00', '09:30', 'Swapped emergency light test key switch', [['Key switch', 1, 'each']]],
  ['e8', 'm-martin', 2, '2026-10-20', '08:00', '11:30', 'Fault-found tripping kitchen circuit, replaced RCBO', [['RCBO 32A', 1, 'each']]],
  ['e9', 'm-jack', 3, '2026-10-20', '09:00', '12:15', 'PAT testing, 36 items', []],
];
const entryId = (n: number) => `00000000-0000-0000-0004-0000000001${String(n).padStart(2, '0')}`;
// Irish time in October is UTC+1.
const at = (date: string, time: string) => `${date}T${time}:00+01:00`;

export async function seedMdc(supabase: SupabaseClient) {
  const ids = await seedUsers(supabase, USERS);

  for (const [i, [, who, cust, date, start, end, notes, materials]] of VISITS.entries()) {
    const id = entryId(i + 1);
    const { error } = await supabase.from('ts_entries').upsert({
      id, tenant_id: TENANTS.mdc, worker_id: ids[who], created_by: ids[who], work_date: date,
      started_at: at(date, start), ended_at: at(date, end), duration_minutes: 1, // worked out by the database
      customer_id: C(cust), notes,
    }, { onConflict: 'id' });
    if (error) throw error;
    const { error: delError } = await supabase.from('ts_entry_materials').delete().eq('entry_id', id);
    if (delError) throw delError;
    if (materials.length) {
      const { error: matError } = await supabase.from('ts_entry_materials').insert(
        materials.map(([item, quantity, unit], position) => ({ tenant_id: TENANTS.mdc, entry_id: id, item, quantity, unit, position })),
      );
      if (matError) throw matError;
    }
  }

  printLogins('MDC Electrical (demo), 9 sample visits in October 2026:', USERS);
}
