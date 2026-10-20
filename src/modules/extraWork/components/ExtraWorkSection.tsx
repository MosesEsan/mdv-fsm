import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { firstName, useJobContext, whenLabel } from '@/core/jobRecords';
import type { JobSectionProps } from '@/core/jobs/sections';
import { Card, ErrorText, styles } from '@/core/ui';
import { ListRow, Pill, SectionLabel } from '@/core/ui/kit';
import { useJobExtraEntries } from '../hooks';

/** On a job page: extra work logged on this job, each with whether it's on an invoice yet. */
export function ExtraWorkSection({ jobId }: JobSectionProps) {
  const router = useRouter();
  const { tz, today } = useJobContext();
  const entries = useJobExtraEntries(jobId);
  const list = entries.data ?? [];
  return (
    <Card>
      <SectionLabel>{`Extra work · ${list.length}`}</SectionLabel>
      <ErrorText error={entries.error} />
      {!entries.isLoading && list.length === 0 ? <Text style={styles.muted}>Anything done that wasn’t in the instructions goes here, so it gets charged.</Text> : null}
      {list.map((e) => (
        <ListRow key={e.id} title={e.what} onPress={() => router.push({ pathname: '/extra-work/[entryId]', params: { entryId: e.id } })}
          lines={[`${firstName(e.loggedByName)} · ${whenLabel(e.createdAt, tz, today)}${e.hours != null ? ` · about ${e.hours} h` : ''}`]}>
          {e.invoicedAt ? <Pill label="Added to invoice" tone="green" icon="checkmark" /> : <Pill label="Not on an invoice yet" tone="red" icon="flag" />}
        </ListRow>
      ))}
    </Card>
  );
}
