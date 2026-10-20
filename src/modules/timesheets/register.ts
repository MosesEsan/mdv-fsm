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

registerModule({
  id: TIMESHEETS,
  feature: TIMESHEETS,
  title: 'Timesheets',
  nav: [
    { path: '/timesheets', title: 'My hours', description: 'Clock in, and send in your week', roles: ['manager', 'supervisor', 'worker', 'fitter'], order: 21, icon: 'time-outline' },
    { path: '/timesheets/approvals', title: 'Sign-offs', description: 'Timesheets waiting for you', roles: ['owner', 'manager', 'supervisor'], order: 5, icon: 'checkmark-done-outline', useCount: useWaitingSignOffs },
    { path: '/timesheets/reports', title: 'Hours & export', description: 'Totals and files for payroll', roles: ['owner', 'manager'], order: 6, icon: 'document-text-outline' },
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
