import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDay, localDate, today } from '@/core/dates';
import { Button, Card, colors, useTheme } from '@/core/ui';
import { useMyUpcoming, useScheduleContext } from '../hooks';
import { timeLabel } from '../rules';

/** On a fitter's Home: today's first job and one button (flows board: Fitter home). */
export function TodayCard() {
  const router = useRouter();
  const theme = useTheme();
  const { tz } = useScheduleContext();
  const upcoming = useMyUpcoming();
  const day = today(tz);
  const first = (upcoming.data ?? [])
    .filter((b) => localDate(new Date(b.startsAt), tz) === day)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const label = `Today · ${formatDay(day)}`;
  if (upcoming.isLoading) return null;
  if (!first) {
    return (
      <Card>
        <Text style={labelStyle}>{label}</Text>
        <Text style={{ fontSize: 14, color: colors.muted }}>Nothing booked for you today.</Text>
      </Card>
    );
  }
  return (
    <Card>
      <Text style={[labelStyle, { color: theme.accent }]}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
        {`${timeLabel(first.startsAt, tz)}–${timeLabel(first.endsAt, tz)} ${first.jobSummary ?? 'Job'}`}
      </Text>
      {first.siteAddress ? <Text style={{ fontSize: 14, color: colors.muted }}>{first.siteAddress}</Text> : null}
      <View style={{ marginTop: 4 }}>
        <Button title="Open job sheet" onPress={() => router.push({ pathname: '/my-jobs/[bookingId]', params: { bookingId: first.id } })} />
      </View>
    </Card>
  );
}

const labelStyle = { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const, color: colors.muted };
