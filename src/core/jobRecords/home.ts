// Job records' Home piece: a getting-started step for a new business.
import { registerGettingStarted, useHasRows } from '@/core/modules/home';
import { JOB_RECORDS } from './api';

registerGettingStarted({
  id: 'job-records-first-job', feature: JOB_RECORDS, roles: ['owner', 'manager'], order: 2, path: '/jobs/new',
  title: 'Add your first job', description: 'Customer, address, instructions and who’s on it',
  useDone: () => useHasRows('jobs', JOB_RECORDS),
});
