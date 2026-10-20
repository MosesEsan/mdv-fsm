// Scheduling's Home pieces: today's job for staff, and a getting-started step for the office.
import { registerGettingStarted, registerHomeCard, useHasRows } from '@/core/modules/home';
import { TodayCard } from './components/TodayCard';

const SCHEDULING = 'scheduling';

registerHomeCard({ id: 'scheduling-today', feature: SCHEDULING, roles: ['supervisor', 'worker', 'fitter'], order: 1, Component: TodayCard });
registerGettingStarted({
  id: 'scheduling-first-booking', feature: SCHEDULING, roles: ['owner', 'manager'], order: 3, path: '/schedule',
  title: 'Book your first job', description: 'Your team sees it on their phones straight away',
  useDone: () => useHasRows('bookings', SCHEDULING),
});
