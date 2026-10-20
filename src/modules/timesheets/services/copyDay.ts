// "Copy yesterday": turns a day's manual entries into payloads for another day,
// keeping the same local start/finish times (correct across summer-time changes).
import type { TsEntry, TsEntryPayload } from '../schemas/types';
import { localTime, shiftInstants, type IsoDate } from '@/core/dates';

export function copyEntriesToDay(entries: TsEntry[], targetDate: IsoDate, timeZone: string): TsEntryPayload[] {
  return entries
    .filter((e) => e.source === 'manual')
    .map((e) => {
      const base = {
        tenant_id: e.tenant_id,
        worker_id: e.worker_id,
        work_date: targetDate,
        job_id: e.job_id,
        cost_code_id: e.cost_code_id,
        notes: e.notes,
        break_minutes: e.break_minutes,
      };
      if (!e.started_at || !e.ended_at) {
        return { ...base, started_at: null, ended_at: null, break_minutes: 0, duration_minutes: e.duration_minutes };
      }
      const { startedAt, endedAt } = shiftInstants(
        targetDate,
        localTime(new Date(e.started_at), timeZone),
        localTime(new Date(e.ended_at), timeZone),
        timeZone,
      );
      return {
        ...base,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_minutes: e.duration_minutes, // recomputed by the database
      };
    });
}
