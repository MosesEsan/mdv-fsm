import { View } from 'react-native';
import { Button, Card, ErrorText, Heading, Loading, Muted, Screen } from '@/core/ui';
import { DayRow, StatusBadge, WeekPicker } from '../components/WeekBits';
import { useMyWeek } from '../hooks/useMyWeek';
import { readyContext, useTimesheetsContext, type ReadyTimesheetsContext } from '../hooks/useTimesheetsContext';
import { formatMinutes } from '@/core/dates';
import type { IsoDate } from '@/core/dates';

export function MyWeekScreen({ onOpenDay }: { onOpenDay: (date: IsoDate) => void }) {
  const ctx = readyContext(useTimesheetsContext());
  if (!ctx) return <Loading />;
  return <MyWeek ctx={ctx} onOpenDay={onOpenDay} />;
}

function MyWeek({ ctx, onOpenDay }: { ctx: ReadyTimesheetsContext; onOpenDay: (date: IsoDate) => void }) {
  const w = useMyWeek({ workerId: ctx.userId, viewerId: ctx.userId, settings: ctx.settings, timezone: ctx.timezone, actor: ctx.actor });
  return (
    <Screen>
      <WeekPicker weekStart={w.weekStart} onChange={w.setWeekStart} />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Heading>{`Week total: ${formatMinutes(w.totalMinutes)}`}</Heading>
          <StatusBadge status={w.status} />
        </View>
        {w.rejectReason ? <ErrorText error={`Sent back: ${w.rejectReason}`} /> : null}
      </Card>
      {w.isLoading ? <Loading /> : <ErrorText error={w.error} />}
      {w.days.map((d) => <DayRow key={d.date} date={d.date} minutes={d.minutes} onPress={() => onOpenDay(d.date)} />)}
      <ErrorText error={w.submitError} />
      {w.canSubmit ? <Button title={w.submitLabel} onPress={w.submit} busy={w.submitting} /> : null}
      {!w.canSubmit && !w.status ? <Muted>Add your hours, then send in your week.</Muted> : null}
    </Screen>
  );
}
