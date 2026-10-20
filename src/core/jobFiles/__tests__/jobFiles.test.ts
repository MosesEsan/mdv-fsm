import { describe, expect, it } from 'vitest';
import { fitWithin, jobFilePaths } from '../paths';
import { afterFailure, dueNow, isAlreadyUploaded, retryDelayMs, type QueuedUpload } from '../queueRules';

const item = (id: string, nextTryAt: number, createdAt = 0): QueuedUpload => ({
  id, tenantId: 't', jobId: 'j', kind: 'site', localUri: 'file://a', thumbUri: 'file://b', width: 1, height: 1, attempts: 0, nextTryAt, createdAt,
});

describe('job files', () => {
  it('builds paths inside the job folder', () => {
    expect(jobFilePaths('t1', 'j1', 'viewing', 'f1')).toEqual({ path: 't1/jobs/j1/viewing/f1.jpg', thumbPath: 't1/jobs/j1/viewing/thumbs/f1.jpg' });
    expect(() => jobFilePaths('t1', 'j1', '../x', 'f1')).toThrow('Invalid file kind');
  });
  it('shrinks the long side only', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600 });
    expect(fitWithin(3000, 4000, 1600)).toEqual({ height: 1600 });
    expect(fitWithin(800, 600, 1600)).toBeNull();
  });
  it('retries with growing waits, oldest first', () => {
    expect([1, 2, 3, 4, 9].map(retryDelayMs)).toEqual([5_000, 30_000, 120_000, 600_000, 600_000]);
    expect(dueNow([item('b', 10, 2), item('a', 5, 1), item('c', 99)], 10).map((i) => i.id)).toEqual(['a', 'b']);
    expect(afterFailure(item('a', 0), 'offline', 1000)).toMatchObject({ attempts: 1, nextTryAt: 6000, lastError: 'offline' });
    expect(isAlreadyUploaded('The resource already exists')).toBe(true);
  });
});

import { newId } from '../../ids';
describe('ids', () => {
  it('makes version-4 UUIDs', () => {
    const a = newId();
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(a)).toBe(true);
    expect(newId() === a).toBe(false);
  });
});
