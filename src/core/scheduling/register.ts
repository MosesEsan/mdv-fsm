// Core scheduling registers its own menu entries, like any module. Switched on with tenants.features.scheduling.
import { registerModule } from '@/core/modules/registry';
import './home';

export const SCHEDULING = 'scheduling';

registerModule({
  id: SCHEDULING,
  feature: SCHEDULING,
  title: 'Schedule',
  nav: [
    { path: '/schedule', title: 'Schedule', description: 'Who’s going where this week', roles: ['owner', 'manager'], order: 3, icon: 'calendar-outline' },
    { path: '/my-jobs', title: 'My jobs', description: 'Your next two weeks', roles: ['manager', 'supervisor', 'worker', 'fitter'], order: 20, icon: 'list-outline' },
  ],
});
