import { getSupabase } from '@/core/supabase';
import type { RoomValues } from './rules';

export const FLOORING = 'flooring';
export const VIEWING_PHOTOS = 'viewing';

export type Room = RoomValues & { id: string; sort_order: number };
export type Viewing = { id: string; job_id: string; viewed_at: string | null; notes: string | null; est_duration_hours: number | null; rooms: Room[] };
export type ViewingJob = { id: string; summary: string | null; siteAddress: string | null; viewingId: string | null; viewedAt: string | null; roomCount: number };

export const flooringKeys = {
  all: ['flooring'] as const,
  viewing: (jobId: string) => ['flooring', 'viewing', jobId] as const,
  jobs: ['flooring', 'viewing-jobs'] as const,
};

function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }

export async function fetchViewing(jobId: string): Promise<Viewing | null> {
  const { data, error } = await getSupabase()
    .from('fl_viewings')
    .select('id, job_id, viewed_at, notes, est_duration_hours, rooms:fl_viewing_rooms!fl_viewing_rooms_viewing_fk(id, name, length_m, width_m, area_m2, floor_type, notes, sort_order)')
    .eq('job_id', jobId)
    .maybeSingle();
  fail(error);
  if (!data) return null;
  const v = data as unknown as Viewing;
  const num = (x: unknown) => (x === null || x === undefined ? null : Number(x));
  return {
    ...v, est_duration_hours: num(v.est_duration_hours),
    rooms: [...(v.rooms ?? [])].sort((a, b) => a.sort_order - b.sort_order)
      .map((r) => ({ ...r, length_m: num(r.length_m), width_m: num(r.width_m), area_m2: num(r.area_m2) })),
  };
}

export async function fetchViewingJobs(): Promise<ViewingJob[]> {
  const { data, error } = await getSupabase()
    .from('jobs')
    .select('id, summary, site_address, created_at, fl_viewings!fl_viewings_job_fk(id, viewed_at, fl_viewing_rooms!fl_viewing_rooms_viewing_fk(id))')
    .order('created_at', { ascending: false })
    .limit(200);
  fail(error);
  type Row = { id: string; summary: string | null; site_address: string | null; fl_viewings: { id: string; viewed_at: string | null; fl_viewing_rooms: { id: string }[] }[] | { id: string; viewed_at: string | null; fl_viewing_rooms: { id: string }[] } | null };
  return ((data ?? []) as unknown as Row[]).map((r) => {
    const v = Array.isArray(r.fl_viewings) ? r.fl_viewings[0] : r.fl_viewings;
    return { id: r.id, summary: r.summary, siteAddress: r.site_address, viewingId: v?.id ?? null, viewedAt: v?.viewed_at ?? null, roomCount: v?.fl_viewing_rooms?.length ?? 0 };
  });
}

/** Creates the job's viewing the first time, then updates it. */
export async function saveViewing(tenantId: string, jobId: string, v: { viewed_at: string | null; notes: string | null; est_duration_hours: number | null }): Promise<string> {
  const { data, error } = await getSupabase().from('fl_viewings')
    .upsert({ tenant_id: tenantId, job_id: jobId, ...v }, { onConflict: 'tenant_id,job_id' })
    .select('id').single();
  fail(error);
  return (data as { id: string }).id;
}

export async function saveRoom(tenantId: string, viewingId: string, room: RoomValues & { id?: string; sort_order: number }): Promise<void> {
  const row = { tenant_id: tenantId, viewing_id: viewingId, ...room };
  const { error } = room.id
    ? await getSupabase().from('fl_viewing_rooms').update(row).eq('id', room.id)
    : await getSupabase().from('fl_viewing_rooms').insert(row);
  fail(error);
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await getSupabase().from('fl_viewing_rooms').delete().eq('id', id);
  fail(error);
}
