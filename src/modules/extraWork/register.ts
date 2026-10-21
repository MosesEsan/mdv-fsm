// Extra work: things done on a job that weren't in the original job, logged so they get invoiced.
// Switched on with tenants.features.extra_work. Plugs into job records; core never imports this.
import { registerUploadHook } from '@/core/jobFiles';
import { registerJobAction, registerJobListAddon, registerJobSection, type JobRowTag } from '@/core/jobs/sections';
import { isManagerRole } from '@/core/auth/claims';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { registerModule } from '@/core/modules/registry';
import { EXTRA_WORK, linkEntryFile } from './api';
import { ExtraWorkBanner } from './components/ExtraWorkBanner';
import { ExtraWorkSection } from './components/ExtraWorkSection';
import { useOpenExtraCount } from './home';
import { useOpenCounts } from './hooks';
import { openLabel } from './rules';

registerModule({
  id: EXTRA_WORK,
  feature: EXTRA_WORK,
  title: 'Extra work',
  nav: [{ path: '/extra-work', title: 'Extra work', description: 'Extras logged on jobs, ready to invoice', roles: ['owner', 'manager'], order: 0.5, icon: 'flag-outline', useCount: useOpenExtraCount, tab: true }],
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
  // Only the owner and manager see the red tags (the people on site don't invoice).
  useRowTags: () => {
    const isManager = isManagerRole(useAuthClaims()?.role);
    const counts = useOpenCounts().data ?? {};
    if (!isManager) return {};
    return Object.fromEntries(Object.entries(counts).map(([jobId, n]): [string, JobRowTag[]] => [jobId, [{ label: openLabel(n), tone: 'danger' }]]));
  },
});

registerJobAction({ id: EXTRA_WORK, feature: EXTRA_WORK, label: 'Log extra work', icon: 'flag', variant: 'accent', href: (jobId) => `/extra-work/new?jobId=${jobId}` });
