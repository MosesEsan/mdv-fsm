// Extra work's Home piece: entries not on an invoice yet.
import { useRowCount } from '@/core/modules/home';
import { getSupabase } from '@/core/supabase';
import { EXTRA_WORK } from './api';

export const useOpenExtraCount = () =>
  useRowCount('extra-work-open', EXTRA_WORK, async () => {
    const { count, error } = await getSupabase().from('xw_entries').select('id', { count: 'exact', head: true }).is('invoiced_at', null);
    if (error) throw new Error(error.message);
    return count ?? 0;
  });
