import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, ErrorText, Heading, Loading, Muted, Screen, styles } from '@/core/ui';
import { DayRow, EntryCard, StatusBadge } from '../components/WeekBits';
import { readyContext, useTimesheetsContext, type ReadyTimesheetsContext } from '../hooks/useTimesheetsContext';
import { useWeekReview } from '../hooks/useWeekReview';
import { formatMinutes } from '@/core/dates';
import type { IsoDate } from '@/core/dates';

type Props = {
  weekId: string;
  /** Open a day to add or fix hours for this worker. */
  onOpenDay: (date: IsoDate, workerId: string) => void;
};

export function WeekReviewScreen(props: Props) {
  const ctx = readyContext(useTimesheetsContext());
  if (!ctx) return <Loading />;
  return <WeekReview {...props} ctx={ctx} />;
}

function WeekReview({ weekId, onOpenDay, ctx }: Props & { ctx: ReadyTimesheetsContext }) {
  const r = useWeekReview(ctx, weekId);
  const [reason, setReason] = useState('');
  const [asking, setAsking] = useState<null | 'reject' | 'reopen'>(null);

  if (r.isLoading) return <Loading />;
  if (r.error || !r.week) return <Screen><ErrorText error={r.error ?? 'Week not found'} /></Screen>;
  const workerId = r.week.worker_id;

  return (
    <Screen>
      <Card>
        <Heading>{`${r.workerName} · ${formatMinutes(r.totalMinutes)}`}</Heading>
        <StatusBadge status={r.week.status} />
        {r.week.reject_reason ? <Muted>{`Sent back: ${r.week.reject_reason}`}</Muted> : null}
      </Card>

      {r.days.map((d) => (
        <View key={d.date} style={{ gap: 6 }}>
          <DayRow date={d.date} minutes={d.minutes} onPress={() => onOpenDay(d.date, workerId)} />
          {d.entries.map((e) => <EntryCard key={e.id} entry={e} timezone={ctx.timezone} />)}
        </View>
      ))}

      <ErrorText error={r.actionError} />
      {asking ? (
        <Card>
          <Text style={styles.label}>{asking === 'reject' ? 'What needs fixing?' : 'Why are you reopening this week?'}</Text>
          <TextInput style={[styles.input, { minHeight: 60 }]} value={reason} onChangeText={setReason} multiline accessibilityLabel="Reason" />
          <Button
            title={asking === 'reject' ? 'Send back' : 'Reopen week'}
            variant={asking === 'reject' ? 'danger' : 'primary'}
            disabled={!reason.trim()}
            busy={r.busy}
            onPress={() => { (asking === 'reject' ? r.reject : r.reopen)(reason.trim()); setAsking(null); setReason(''); }}
          />
          <Button title="Cancel" variant="secondary" onPress={() => setAsking(null)} />
        </Card>
      ) : (
        <View style={{ gap: 8 }}>
          {r.canDecide ? <Button title="Sign off" onPress={r.approve} busy={r.busy} /> : null}
          {r.canDecide ? <Button title="Send back…" variant="secondary" onPress={() => setAsking('reject')} /> : null}
          {r.canReopen ? <Button title="Reopen week…" variant="secondary" onPress={() => setAsking('reopen')} /> : null}
        </View>
      )}

      {r.history.length ? (
        <Card>
          <Text style={styles.label}>History</Text>
          {r.history.map((h) => (
            <Muted key={h.id}>{`${new Date(h.when).toLocaleString('en-IE', { timeZone: ctx.timezone })} · ${h.label} by ${h.by}${h.reason ? `: ${h.reason}` : ''}`}</Muted>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
