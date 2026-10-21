// Registers the Timesheets module with core: menu entries and settings.
// Imported once from src/modules/index.ts (the composition root).
import { registerModule } from '@/core/modules/registry';
import { registerModuleSettings } from '@/core/settings/registry';
import { timesheetsSettingsFields, timesheetsSettingsSchema, type TimesheetsSettings } from './schemas/settings';
import { useWaitingSignOffs } from './home';

declare module '@/core/settings/registry' {
  interface ModuleSettingsMap {
    timesheets: TimesheetsSettings;
  }
}

export const TIMESHEETS = 'timesheets';

type Ts = { logAgainst?: string; approval?: string } | undefined;
const ts = (s: Record<string, unknown> | undefined) => s?.timesheets as Ts;
/** Set up for customer visits (e.g. MDC Electrical): visits, entries and the monthly customer report. */
const visits = (s: Record<string, unknown> | undefined) => ts(s)?.logAgainst === 'customer';
const weekly = (s: Record<string, unknown> | undefined) => !visits(s);

registerModule({
  id: TIMESHEETS,
  feature: TIMESHEETS,
  title: 'Timesheets',
  nav: [
    { path: '/timesheets', title: 'My hours', description: 'Clock in, and send in your week', roles: ['manager', 'supervisor', 'worker', 'fitter'], order: 21, icon: 'time-outline', when: weekly },
    { path: '/timesheets/approvals', title: 'Sign-offs', description: 'Timesheets waiting for you', roles: ['owner', 'manager', 'supervisor'], order: 5, icon: 'checkmark-done-outline', useCount: useWaitingSignOffs,
      when: (s) => weekly(s) && ts(s)?.approval !== 'none' },
    { path: '/timesheets/reports', title: 'Hours & export', description: 'Totals and files for payroll', roles: ['owner', 'manager'], order: 6, icon: 'document-text-outline', when: weekly },
    // Customer visits. Each is a "start here" screen, so the app opens on the first one the person can see, with tabs.
    { path: '/visits', title: 'Today', description: 'Log a visit', roles: ['owner', 'manager', 'supervisor', 'worker', 'fitter'], order: 1, icon: 'today-outline', when: visits, startHere: true, tab: true },
    { path: '/visit-entries', title: 'Entries', description: 'Every visit, by month', roles: ['owner', 'manager', 'supervisor', 'worker', 'fitter', 'viewer'], order: 2, icon: 'list-outline', when: visits, startHere: true, tab: true },
    { path: '/visit-report', title: 'Report', description: 'Monthly report per customer', roles: ['owner', 'manager', 'viewer'], order: 3, icon: 'document-text-outline', when: visits, startHere: true, tab: true },
  ],
});

registerModuleSettings({
  namespace: TIMESHEETS,
  feature: TIMESHEETS,
  title: 'Timesheets',
  description: 'How your staff record their hours and who signs them off.',
  schema: timesheetsSettingsSchema,
  fields: timesheetsSettingsFields,
});
