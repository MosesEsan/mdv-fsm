// Registers the Flooring module with core: menu entries and its job sheet section.
import { registerJobSection } from '@/core/jobs/sections';
import { registerModule } from '@/core/modules/registry';
import { FLOORING } from './api';
import { ViewingSection } from './components/ViewingSection';
import { useNewEnquiryCount } from './home';

registerModule({
  id: FLOORING,
  feature: FLOORING,
  title: 'Flooring',
  nav: [
    { path: '/flooring/enquiries', title: 'Enquiries', description: 'New work coming in, and what’s next', roles: ['owner', 'manager'], order: 1, icon: 'chatbubble-outline', useCount: useNewEnquiryCount },
    { path: '/flooring/prices', title: 'Prices', description: 'Price list and what goes on every quote', roles: ['owner'], order: 4, icon: 'pricetag-outline' },
    { path: '/flooring/viewings', title: 'Viewings', description: 'Measure rooms and take photos', roles: ['owner', 'manager'], order: 2, icon: 'home-outline' },
  ],
});

registerJobSection({ id: 'flooring-viewing', feature: FLOORING, order: 10, Component: ViewingSection });
