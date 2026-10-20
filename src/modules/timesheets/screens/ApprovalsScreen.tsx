import { Pressable, Text, View } from 'react-native';
import { Button, ErrorText, Loading, Muted, Screen, colors, styles } from '@/core/ui';
import { StatusBadge, WeekPicker } from '../components/WeekBits';
import { useApprovals } from '../hooks/useApprovals';
import { readyContext, useTimesheetsContext, type ReadyTimesheetsContext } from '../hooks/useTimesheetsContext';
import { formatMinutes } from '@/core/dates';

export function ApprovalsScreen({ onOpenWeek }: { onOpenWeek: (weekId: string) => void }) {
  const ctx = readyContext(useTimesheetsContext());
  if (!ctx) return <Loading />;
  if (!ctx.actor.isManager && !ctx.actor.isSupervisor) return <Screen><Muted>Only managers and supervisors can see this.</Muted></Screen>;
  return <Approvals ctx={ctx} onOpenWeek={onOpenWeek} />;
}

function Approvals({ ctx, onOpenWeek }: { ctx: ReadyTimesheetsContext; onOpenWeek: (weekId: string) => void }) {
  const a = useApprovals(ctx);
  return (
    <Screen>
      <WeekPicker weekStart={a.weekStart} onChange={a.setWeekStart} />
      {a.isLoading ? <Loading /> : <ErrorText error={a.error} />}
      {a.waitingCount > 1 ? (
        <Button title={`Sign off all ${a.waitingCount} waiting`} onPress={a.approveAll} busy={a.approvingAll} />
      ) : null}
      {a.bulkResult?.failed ? <ErrorText error={`${a.bulkResult.failed} could not be signed off. Open them to see why.`} /> : null}
      <ErrorText error={a.bulkError} />
      {!a.isLoading && a.rows.length === 0 ? <Muted>No timesheets for this week yet.</Muted> : null}
      {a.rows.map((r) => (
        <Pressable key={r.week_id} accessibilityRole="button" onPress={() => onOpenWeek(r.week_id)} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.label}>{r.name}</Text>
            <Text style={styles.label}>{formatMinutes(r.rounded_minutes)}</Text>
          </View>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <StatusBadge status={r.status} />
            {r.hasOvertime ? <Text style={{ color: colors.warning }}>{`${formatMinutes(r.overtime_minutes)} overtime`}</Text> : null}
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
