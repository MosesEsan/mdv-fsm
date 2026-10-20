// Core scheduling registers its own menu entries, like any module. Switched on with tenants.features.scheduling.
import { registerModule } from '@/core/modules/registry';

export const SCHEDULING = 'scheduling';

registerModule({
  id: SCHEDULING,
  feature: SCHEDULING,
  title: 'Schedule',
  nav: [
    { path: '/schedule', title: 'Schedule', description: 'The week ahead for everyone; add and move bookings', roles: ['owner', 'manager'], order: 1 },
    { path: '/my-jobs', title: 'My jobs', description: 'Where you are going and when', roles: 'all', order: 2 },
  ],
});
