// Customers list for businesses using job records. Core: customers are shared by every module.
import { registerModule } from '@/core/modules/registry';

registerModule({
  id: 'customers',
  feature: 'job_records',
  title: 'Customers',
  nav: [{ path: '/customers', title: 'Customers', description: 'Everyone you’ve worked for, and their jobs', roles: ['owner', 'manager'], order: 0.3, icon: 'people-outline', tab: true }],
});
