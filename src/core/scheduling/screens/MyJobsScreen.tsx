import { Pressable, Text } from 'react-native';
import { formatDay, localDate } from '@/core/dates';
import { ErrorText, Heading, Loading, Muted, Screen, styles } from '@/core/ui';
import { useMyUpcoming, useScheduleContext, useScheduleLive } from '../hooks';
import { timeLabel } from '../rules';

/** The signed-in person's bookings for the next two weeks. */
export function MyJobsScreen({ onOpen }: { onOpen: (bookingId: string) => void }) {
  useScheduleLive();
  const { tz } = useScheduleContext();
  const q = useMyUpcoming();
  let lastDay = '';
  return (
    <Screen>
      {q.isLoading ? <Loading /> : null}
      <ErrorText error={q.error} />
      {q.data?.length === 0 ? <Muted>Nothing booked for you in the next two weeks.</Muted> : null}
      {(q.data ?? []).map((b) => {
        const day = localDate(new Date(b.startsAt), tz);
        const header = day !== lastDay ? <Heading>{formatDay(day)}</Heading> : null;
        lastDay = day;
        return (
          <Pressable key={b.id} accessibilityRole="button" onPress={() => onOpen(b.id)}>
            {header}
            <Text style={[styles.card, styles.label]}>{`${timeLabel(b.startsAt, tz)}–${timeLabel(b.endsAt, tz)}  ${b.jobSummary ?? 'Job'}\n`}
              <Text style={styles.muted}>{b.siteAddress ?? ''}</Text>
            </Text>
          </Pressable>
        );
      })}
    </Screen>
  );
}
