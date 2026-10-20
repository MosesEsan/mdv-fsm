import { Linking, Text } from 'react-native';
import { formatDay, localDate } from '@/core/dates';
import { Button, Card, ErrorText, Heading, Loading, Muted, Screen, styles } from '@/core/ui';
import { JobPhotos } from '@/core/jobFiles';
import { jobSectionsFor } from '@/core/jobs/sections';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { useJobSheet, useScheduleContext } from '../hooks';
import { timeLabel } from '../rules';

/** What the person on site needs: when, where, who to call, notes. Never prices. */
export function JobSheetScreen({ bookingId, onEdit }: { bookingId: string; onEdit?: () => void }) {
  const { tz, canEdit } = useScheduleContext();
  const q = useJobSheet(bookingId);
  const { isFeatureEnabled } = useTenantSettings();
  if (q.isLoading) return <Loading />;
  const s = q.data;
  if (!s) return <Screen><ErrorText error={q.error ?? 'Job sheet not found'} /></Screen>;
  const address = s.site_address ?? s.customer_address;

  return (
    <Screen>
      <Card>
        <Heading>{s.job_summary ?? 'Job'}</Heading>
        <Text style={styles.label}>{`${formatDay(localDate(new Date(s.starts_at), tz))}, ${timeLabel(s.starts_at, tz)}–${timeLabel(s.ends_at, tz)}`}</Text>
        {s.status === 'cancelled' ? <Text style={styles.error}>This booking was cancelled.</Text> : null}
        <Muted>{`With: ${s.people.map((p) => p.name ?? 'Someone').join(', ') || 'no one yet'}`}</Muted>
      </Card>
      <Card>
        <Heading>Where</Heading>
        <Text style={styles.label}>{address ?? 'No address yet'}</Text>
        {address ? <Button title="Open in maps" variant="secondary" onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`)} /> : null}
      </Card>
      <Card>
        <Heading>Customer</Heading>
        <Text style={styles.label}>{s.customer_name ?? 'No customer details'}</Text>
        {s.customer_phone ? <Button title={`Call ${s.customer_phone}`} variant="secondary" onPress={() => Linking.openURL(`tel:${s.customer_phone!.replace(/\s/g, '')}`)} /> : null}
      </Card>
      {s.notes ? <Card><Heading>Notes</Heading><Text>{s.notes}</Text></Card> : null}
      {jobSectionsFor(isFeatureEnabled).map(({ id, Component }) => (
        <Component key={id} jobId={s.job_id} bookingId={s.booking_id} canEdit={canEdit} />
      ))}
      <JobPhotos jobId={s.job_id} title="Photos" />
      {canEdit && onEdit ? <Button title="Change booking" onPress={onEdit} /> : null}
    </Screen>
  );
}
