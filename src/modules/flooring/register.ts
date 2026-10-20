// Registers the Flooring module with core: menu entries and its job sheet section.
import { registerJobSection } from '@/core/jobs/sections';
import { registerModule } from '@/core/modules/registry';
import { FLOORING } from './api';
import { ViewingSection } from './components/ViewingSection';

registerModule({
  id: FLOORING,
  feature: FLOORING,
  title: 'Flooring',
  nav: [
    { path: '/flooring/enquiries', title: 'Enquiries', description: 'Calls and messages, viewings and what to do next', roles: ['owner', 'manager'], order: 4 },
    { path: '/flooring/viewings', title: 'Viewings', description: 'Measure up rooms and take photos', roles: ['owner', 'manager'], order: 5 },
  ],
});

registerJobSection({ id: 'flooring-viewing', feature: FLOORING, order: 10, Component: ViewingSection });
