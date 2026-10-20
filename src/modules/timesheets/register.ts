// Registers the Timesheets module with core: menu entries and settings.
// Imported once from src/modules/index.ts (the composition root).
import { registerModule } from '@/core/modules/registry';
import { registerModuleSettings } from '@/core/settings/registry';
import { timesheetsSettingsFields, timesheetsSettingsSchema, type TimesheetsSettings } from './schemas/settings';

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
    { path: '/timesheets', title: 'My hours', description: 'Add your hours and send in your week', roles: 'all', order: 10 },
    { path: '/timesheets/approvals', title: 'Sign-offs', description: 'Check and sign off weekly hours', roles: ['owner', 'manager', 'supervisor'], order: 11 },
    { path: '/timesheets/reports', title: 'Hours & export', description: 'Totals and files for payroll', roles: ['owner', 'manager'], order: 12 },
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
