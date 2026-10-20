import { Button, ErrorText, Heading, Loading, Muted, Screen } from '@/core/ui';
import { ClockPanel } from '../components/ClockPanel';
import { EntryCard } from '../components/WeekBits';
import { useDay } from '../hooks/useDay';
import { readyContext, useTimesheetsContext, type ReadyTimesheetsContext } from '../hooks/useTimesheetsContext';
import { formatMinutes } from '@/core/dates';
import { formatDay, today, type IsoDate } from '@/core/dates';

type Props = {
  date: IsoDate;
  /** Defaults to the signed-in person. Managers/supervisors pass another worker. */
  workerId?: string;
  onAddEntry: (date: IsoDate, workerId: string) => void;
  onOpenEntry: (entryId: string) => void;
};

export function DayScreen(props: Props) {
  const ctx = readyContext(useTimesheetsContext());
  if (!ctx) return <Loading />;
  return <Day {...props} ctx={ctx} />;
}

function Day({ date, workerId, onAddEntry, onOpenEntry, ctx }: Props & { ctx: ReadyTimesheetsContext }) {
  const worker = workerId ?? ctx.userId;
  const isSelf = worker === ctx.userId;
  const day = useDay({ workerId: worker, date, settings: ctx.settings, timezone: ctx.timezone, actor: ctx.actor });

  return (
    <Screen>
      <Heading>{`${formatDay(date)} · ${formatMinutes(day.totalMinutes)}`}</Heading>
      {day.showClock && isSelf && date === today(ctx.timezone) ? (
        <ClockPanel workerId={worker} settings={ctx.settings} timezone={ctx.timezone} />
      ) : null}
      {day.isLoading ? <Loading /> : <ErrorText error={day.error} />}
      {day.entries.map((e) => (
        <EntryCard key={e.id} entry={e} timezone={ctx.timezone} jobLabel={day.jobLabel(e.job_id)} onPress={() => onOpenEntry(e.id)} />
      ))}
      {!day.isLoading && day.entries.length === 0 ? <Muted>No hours on this day.</Muted> : null}
      <ErrorText error={day.copyError} />
      {day.canCopyYesterday ? <Button title="Copy yesterday" variant="secondary" onPress={day.copyYesterday} busy={day.copying} /> : null}
      {day.canAddManual ? <Button title="Add hours" onPress={() => onAddEntry(date, worker)} /> : null}
      {!day.canEdit ? <Muted>This week has been sent in, so it can’t be changed.</Muted> : null}
    </Screen>
  );
}
