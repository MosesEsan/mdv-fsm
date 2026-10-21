import { Linking, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDay } from '@/core/dates';
import { Button, Card, Screen, colors, styles } from '@/core/ui';
import { AppBar, EmptyBox, ListRow, LoadFailed, LoadingCards, Pill, SectionLabel } from '@/core/ui/kit';
import { useCustomer, useCustomerJobs } from '../hooks';

const STATUS: Record<string, { label: string; tone: 'grey' | 'amber' | 'green'; icon?: string }> = {
  todo: { label: 'To do', tone: 'grey' },
  in_progress: { label: 'In progress', tone: 'amber', icon: 'time-outline' },
  completed: { label: 'Completed', tone: 'green', icon: 'checkmark' },
  cancelled: { label: 'Cancelled', tone: 'grey' },
};

/** One customer: how to reach them, and every job done for them (newest first). */
export function CustomerScreen({ customerId, onOpenJob }: { customerId: string; onOpenJob: (jobId: string) => void }) {
  const router = useRouter();
  const customer = useCustomer(customerId);
  const jobs = useCustomerJobs(customerId);
  const c = customer.data;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/customers'));
  if (!c) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppBar title="Customer" onBack={back} />
        <Screen>{customer.isLoading ? <LoadingCards n={2} /> : <LoadFailed what="this customer" onRetry={() => void customer.refetch()} />}</Screen>
      </View>
    );
  }
  const list = jobs.data ?? [];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title={c.name} sub={`${list.length} job${list.length === 1 ? '' : 's'}`} onBack={back} />
      <Screen>
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{c.name}</Text>
          {c.phone ? <Text style={{ fontSize: 15, color: colors.text }}>{c.phone}</Text> : null}
          {c.email ? <Text style={{ fontSize: 15, color: colors.text }}>{c.email}</Text> : null}
          {c.address ? <Text style={styles.muted}>{c.address}</Text> : null}
          <View style={styles.wrap}>
            {c.phone ? <Button title="Call" icon="call-outline" variant="secondary" size="sm" onPress={() => void Linking.openURL(`tel:${c.phone!.replace(/\s/g, '')}`)} /> : null}
            {c.address ? <Button title="Maps" icon="location-outline" variant="secondary" size="sm" onPress={() => void Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(c.address!)}`)} /> : null}
            {c.email ? <Button title="Email" icon="mail-outline" variant="secondary" size="sm" onPress={() => void Linking.openURL(`mailto:${c.email}`)} /> : null}
          </View>
          {c.notes ? <Text style={{ fontSize: 14, color: colors.muted }}>{c.notes}</Text> : null}
        </Card>
        <SectionLabel>{`Jobs · ${list.length}`}</SectionLabel>
        {jobs.isLoading ? <LoadingCards n={2} /> : null}
        {jobs.error ? <LoadFailed what="their jobs" onRetry={() => void jobs.refetch()} /> : null}
        {jobs.data && list.length === 0 ? <EmptyBox icon="clipboard-outline" title="No jobs yet" text="Jobs for this customer will show here." /> : null}
        {list.map((j) => {
          const s = STATUS[j.status] ?? { label: j.status, tone: 'grey' as const };
          const when = j.completed_at ? `Completed ${formatDay(j.completed_at.slice(0, 10))}` : j.start_on ? `Starts ${formatDay(j.start_on)}` : `Added ${formatDay(j.created_at.slice(0, 10))}`;
          return (
            <ListRow key={j.id} title={j.summary ?? 'Untitled job'} lines={[j.site_address, when]} onPress={() => onOpenJob(j.id)}>
              <Pill label={s.label} tone={s.tone} icon={s.icon} />
            </ListRow>
          );
        })}
      </Screen>
    </View>
  );
}
