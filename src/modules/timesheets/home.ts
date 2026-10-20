// Timesheets' Home pieces: how many weeks are waiting to be signed off.
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { useRowCount } from '@/core/modules/home';
import { getSupabase } from '@/core/supabase';

/** Sent-in weeks from other people (RLS limits supervisors to their own people). */
export function useWaitingSignOffs(): number | undefined {
  const me = useAuthClaims()?.userId ?? '';
  return useRowCount(`timesheets-waiting-${me}`, 'timesheets', async () => {
    const { count, error } = await getSupabase().from('ts_weeks').select('id', { count: 'exact', head: true }).eq('status', 'submitted').neq('worker_id', me);
    if (error) throw new Error(error.message);
    return count ?? 0;
  });
}
