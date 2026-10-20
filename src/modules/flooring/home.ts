// Flooring's Home pieces: getting-started steps and the new-enquiries count.
import { registerGettingStarted, useHasRows, useRowCount } from '@/core/modules/home';
import { getSupabase } from '@/core/supabase';
import { FLOORING } from './api';

registerGettingStarted({
  id: 'flooring-prices', feature: FLOORING, roles: ['owner'], order: 1, path: '/flooring/prices',
  title: 'Add your prices', description: 'Floors, extras and labour, used on every quote',
  useDone: () => useHasRows('fl_price_items', FLOORING),
});
registerGettingStarted({
  id: 'flooring-first-enquiry', feature: FLOORING, roles: ['owner', 'manager'], order: 2, path: '/flooring/enquiries/new',
  title: 'Log your first enquiry', description: 'Who got in touch and what they want',
  useDone: () => useHasRows('fl_enquiries', FLOORING),
});

/** New enquiries nobody has booked a viewing for yet. */
export const useNewEnquiryCount = () =>
  useRowCount('flooring-new-enquiries', FLOORING, async () => {
    const { count, error } = await getSupabase().from('fl_v_enquiries').select('job_id', { count: 'exact', head: true }).eq('status', 'open').eq('stage', 'new');
    if (error) throw new Error(error.message);
    return count ?? 0;
  });
