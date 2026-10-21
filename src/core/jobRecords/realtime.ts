import { newId } from '@/core/ids';

export function jobRecordsChannelTopic(tenantId: string) {
  return `job-records:${tenantId}:${newId()}`;
}
