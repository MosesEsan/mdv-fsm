import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { addDays, formatDay, today, weekDays, weekStartFor } from '@/core/dates';
import { Button, Card, Chip, ErrorText, Heading, Loading, Muted, Screen, styles } from '@/core/ui';
import { useBookings, usePeople, useScheduleContext, useScheduleLive } from '../hooks';
import { byDay, timeLabel } from '../rules';

type Props = { onOpen: (bookingId: string, date: string) => void; onAdd: (date: string) => void };

/** The diary: one week, every person (or one), each booking tappable. */
export function ScheduleScreen({ onOpen, onAdd }: Props) {
  useScheduleLive();
  const { tz, canEdit } = useScheduleContext();
  const [weekStart, setWeekStart] = useState(() => weekStartFor(today(tz), 'monday'));
  const [person, setPerson] = useState<string | null>(null);
  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const bookings = useBookings(days);
  const people = usePeople();
  const names = new Map((people.data ?? []).map((p) => [p.id, p.fullName]));

  const shown = (bookings.data ?? []).filter((b) => b.status === 'scheduled' && (!person || b.userIds.includes(person)));
  const grouped = byDay(shown, days, tz);

  return (
    <Screen>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Button title="‹ Previous" variant="secondary" onPress={() => setWeekStart(addDays(weekStart, -7))} />
        <Heading>{`Week of ${formatDay(weekStart)}`}</Heading>
        <Button title="Next ›" variant="secondary" onPress={() => setWeekStart(addDays(weekStart, 7))} />
      </View>
      <View style={styles.wrap}>
        <Chip label="Everyone" selected={person === null} onPress={() => setPerson(null)} />
        {(people.data ?? []).filter((p) => p.role !== 'owner').map((p) => (
          <Chip key={p.id} label={p.fullName} selected={person === p.id} onPress={() => setPerson(p.id)} />
        ))}
      </View>
      {bookings.isLoading ? <Loading /> : null}
      <ErrorText error={bookings.error} />
      {days.map((d) => (
        <Card key={d}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.label}>{formatDay(d)}{d === today(tz) ? ' · Today' : ''}</Text>
            {canEdit ? <Button title="Add" variant="secondary" onPress={() => onAdd(d)} /> : null}
          </View>
          {grouped[d].length === 0 ? <Muted>Nothing booked.</Muted> : null}
          {grouped[d].map((b) => (
            <Pressable key={b.id} accessibilityRole="button" onPress={() => onOpen(b.id, d)}
              style={({ pressed }) => [{ paddingVertical: 8, borderTopWidth: 1, borderColor: '#d1d9e0', opacity: pressed ? 0.7 : 1 }]}>
              <Text style={styles.label}>{`${timeLabel(b.startsAt, tz)}–${timeLabel(b.endsAt, tz)}  ${b.jobSummary ?? 'Job'}`}</Text>
              <Text style={styles.muted}>{[b.userIds.map((u) => names.get(u) ?? '').filter(Boolean).join(', ') || 'No one assigned', b.siteAddress].filter(Boolean).join(' · ')}</Text>
            </Pressable>
          ))}
        </Card>
      ))}
    </Screen>
  );
}
