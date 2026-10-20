// Small display pieces: status badge, week picker, day row, entry card.
import { Pressable, Text, View } from 'react-native';
import { Button, colors, styles } from '@/core/ui';
import type { TsEntry, WeekStatus } from '../schemas/types';
import { formatMinutes } from '@/core/dates';
import { statusLabel } from '../services/weekRules';
import { addDays, formatDay, localTime, type IsoDate } from '@/core/dates';

const statusColor: Record<WeekStatus, string> = {
  draft: colors.muted,
  submitted: colors.warning,
  approved: colors.success,
  rejected: colors.danger,
  exported: colors.primary,
};

export function StatusBadge({ status }: { status: WeekStatus | undefined }) {
  const s = status ?? 'draft';
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: statusColor[s] }}>
      <Text style={{ color: statusColor[s], fontSize: 13, fontWeight: '600' }}>{statusLabel[s]}</Text>
    </View>
  );
}

export function WeekPicker({ weekStart, onChange }: { weekStart: IsoDate; onChange: (weekStart: IsoDate) => void }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between' }]}>
      <Button title="‹ Prev" variant="secondary" onPress={() => onChange(addDays(weekStart, -7))} />
      <Text style={styles.label}>{`${formatDay(weekStart)} – ${formatDay(addDays(weekStart, 6))}`}</Text>
      <Button title="Next ›" variant="secondary" onPress={() => onChange(addDays(weekStart, 7))} />
    </View>
  );
}

export function DayRow({ date, minutes, onPress }: { date: IsoDate; minutes: number; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, styles.row, { justifyContent: 'space-between', opacity: pressed ? 0.8 : 1 }]}>
      <Text style={styles.label}>{formatDay(date)}</Text>
      <Text style={minutes ? styles.label : styles.muted}>{minutes ? formatMinutes(minutes) : '—'}</Text>
    </Pressable>
  );
}

export function EntryCard({ entry, timezone, jobLabel, onPress }: { entry: TsEntry; timezone: string; jobLabel?: string; onPress?: () => void }) {
  const times = entry.started_at && entry.ended_at
    ? `${localTime(new Date(entry.started_at), timezone)} – ${localTime(new Date(entry.ended_at), timezone)}`
    : 'Total hours';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={styles.label}>{times}</Text>
        <Text style={styles.label}>{formatMinutes(entry.duration_minutes)}</Text>
      </View>
      {jobLabel ? <Text style={styles.muted}>{jobLabel}</Text> : null}
      {entry.break_minutes ? <Text style={styles.muted}>{`${entry.break_minutes} min break`}</Text> : null}
      {entry.source === 'clock' ? <Text style={styles.muted}>Clocked</Text> : null}
      {entry.notes ? <Text style={styles.muted}>{entry.notes}</Text> : null}
    </Pressable>
  );
}
