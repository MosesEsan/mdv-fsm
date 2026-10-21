import { describe, expect, it } from 'vitest';
import { jobRecordsChannelTopic } from '../realtime';

describe('jobRecordsChannelTopic', () => {
  it('creates a fresh topic for overlapping subscriptions in the same tenant', () => {
    const first = jobRecordsChannelTopic('tenant-1');
    const second = jobRecordsChannelTopic('tenant-1');

    expect(first).toMatch(/^job-records:tenant-1:/);
    expect(second).toMatch(/^job-records:tenant-1:/);
    expect(second).not.toBe(first);
  });
});
