import { Text, View } from 'react-native';
import { addDays, formatDay, weekStartFor } from '@/core/dates';
import { Button, Card, Screen, colors, styles } from '@/core/ui';
import { AppBar, EmptyBox, ListRow, LoadFailed, LoadingCards, SectionLabel } from '@/core/ui/kit';
import { useVisitCustomers, useVisitPeople, useVisits } from '../api';
import { hoursLabel } from '../rules';
import { useVisitContext } from '../useVisitContext';

type Props = { onLog: () => void; onOpen: (id: string) => void };

/** Flows board "MDC: Today": hours today and this week, today's visits, Log a visit. */
export function VisitsTodayScreen({ onLog, onOpen }: Props) {
  const c = useVisitContext();
  const weekStart = weekStartFor(c.today, c.settings?.weekStartsOn ?? 'monday');
  const visits = useVisits(weekStart, addDays(weekStart, 6));
  const customers = useVisitCustomers();
  const people = useVisitPeople();
  const name = (list: { id: string; name: string }[] | undefined, id: string | null) => list?.find((x) => x.id === id)?.name ?? '';

  const mine = (visits.data ?? []).filter((v) => v.worker_id === c.userId);
  const sum = (l: typeof mine) => l.reduce((s, v) => s + v.duration_minutes, 0);
  const todays = (visits.data ?? []).filter((v) => v.work_date === c.today && (c.isManager || v.worker_id === c.userId));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title="Today" sub={formatDay(c.today)} />
      <Screen>
        {visits.isLoading ? <LoadingCards n={2} /> : null}
        {visits.error && !visits.data ? <LoadFailed what="your visits" onRetry={() => void visits.refetch()} /> : null}
        {visits.data ? (
          <>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Card style={{ flex: 1 }}><Text style={styles.muted}>Today</Text><Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>{hoursLabel(sum(mine.filter((v) => v.work_date === c.today)))}</Text></Card>
              <Card style={{ flex: 1 }}><Text style={styles.muted}>This week</Text><Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>{hoursLabel(sum(mine))}</Text></Card>
            </View>
            {!c.isViewer ? <Button title="Log a visit" icon="add" size="lg" onPress={onLog} /> : null}
            <SectionLabel>{c.isManager ? 'Today’s visits, everyone' : 'Your visits today'}</SectionLabel>
            {todays.length === 0 ? <EmptyBox icon="flash-outline" title="No visits logged today" text="Each visit you log shows here, and in the monthly report for that customer." /> : null}
            {todays.map((v) => (
              <ListRow key={v.id} title={name(customers.data, v.customer_id) || 'Customer'} onPress={() => onOpen(v.id)}
                lines={[`${c.timeOf(v.started_at)}–${c.timeOf(v.ended_at)} · ${hoursLabel(v.duration_minutes)}${c.isManager ? ` · ${name(people.data, v.worker_id)}` : ''}`, v.notes]} />
            ))}
          </>
        ) : null}
      </Screen>
    </View>
  );
}
