// Job records register like any module. Switched on with tenants.features.job_records.
import { registerModule } from '@/core/modules/registry';
import { JOB_RECORDS } from './api';
import './home';

registerModule({
  id: JOB_RECORDS,
  feature: JOB_RECORDS,
  title: 'Jobs',
  nav: [{ path: '/jobs', title: 'Jobs', description: 'Every job, its photos and updates', roles: 'all', order: 0, icon: 'clipboard-outline' }],
});
