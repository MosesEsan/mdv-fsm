// Extra work: things done on a job that weren't in the original job, logged so they get invoiced.
// Switched on with tenants.features.extra_work. Plugs into job records; core never imports this.
import { registerUploadHook } from '@/core/jobFiles';
import { registerJobListAddon, registerJobSection, type JobRowTag } from '@/core/jobs/sections';
import { registerModule } from '@/core/modules/registry';
import { EXTRA_WORK, linkEntryFile } from './api';
import { ExtraWorkBanner } from './components/ExtraWorkBanner';
import { ExtraWorkSection } from './components/ExtraWorkSection';
import { useOpenCounts } from './hooks';
import { openLabel } from './rules';
import { useOpenExtraCount } from './home';

registerModule({
  id: EXTRA_WORK,
  feature: EXTRA_WORK,
  title: 'Extra work',
  nav: [{ path: '/extra-work', title: 'Extra work', description: 'Extras logged on jobs, ready to invoice', roles: ['owner', 'manager'], order: 0.5, icon: 'flag-outline', useCount: useOpenExtraCount }],
});

registerJobSection({ id: EXTRA_WORK, feature: EXTRA_WORK, order: 20, Component: ExtraWorkSection });

registerUploadHook(EXTRA_WORK, async (item) => {
  const entryId = item.meta?.entryId;
  if (entryId) await linkEntryFile(item.tenantId, entryId, item.id);
});

registerJobListAddon({
  id: EXTRA_WORK,
  feature: EXTRA_WORK,
  Banner: ExtraWorkBanner,
  useRowTags: () => {
    const counts = useOpenCounts().data ?? {};
    return Object.fromEntries(Object.entries(counts).map(([jobId, n]): [string, JobRowTag[]] => [jobId, [{ label: openLabel(n), tone: 'warning' }]]));
  },
});
