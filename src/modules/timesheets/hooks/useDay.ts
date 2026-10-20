import { useMemo } from 'react';
import { useEntries, useJobOptions, useSaveEntries, useWeekFor } from '../api/hooks';
import type { TimesheetsSettings } from '../schemas/settings';
import { copyEntriesToDay } from '../services/copyDay';
import { canEditWeek, type Actor } from '../services/weekRules';
import { addDays, weekStartFor, type IsoDate } from '@/core/dates';

type Args = { workerId: string | undefined; date: IsoDate; settings: TimesheetsSettings; timezone: string; actor: Actor };

/** One day's entries for a worker, plus "copy yesterday". */
export function useDay({ workerId, date, settings, timezone, actor }: Args) {
  const yesterday = addDays(date, -1);
  const entries = useEntries(workerId, yesterday, date); // one query covers both days
  const week = useWeekFor(workerId, weekStartFor(date, settings.weekStartsOn));
  const jobs = useJobOptions(settings.logAgainst === 'job');
  const copy = useSaveEntries();

  const todays = useMemo(() => (entries.data ?? []).filter((e) => e.work_date === date), [entries.data, date]);
  const yesterdays = useMemo(() => (entries.data ?? []).filter((e) => e.work_date === yesterday && e.source === 'manual'), [entries.data, yesterday]);
  const jobLabel = (id: string | null) => (id ? jobs.data?.find((j) => j.id === id)?.label : undefined);

  const canEdit = canEditWeek(week.data?.status, actor);
  // Workers in clock mode can't add manual entries; managers can (corrections).
  const canAddManual = canEdit && (settings.entryMode !== 'clock' || actor.isManager);

  return {
    entries: todays,
    totalMinutes: todays.reduce((s, e) => s + e.duration_minutes, 0),
    jobLabel,
    canEdit,
    canAddManual,
    showClock: settings.entryMode === 'clock',
    canCopyYesterday: canAddManual && todays.length === 0 && yesterdays.length > 0,
    copyYesterday: () => copy.mutate(copyEntriesToDay(yesterdays, date, timezone)),
    copying: copy.isPending,
    copyError: copy.error,
    isLoading: entries.isLoading,
    error: entries.error,
  };
}
