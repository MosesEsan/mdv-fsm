import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { JobSectionProps } from '@/core/jobs/sections';
import { Button, Card, ErrorText, Heading, Loading, Muted, colors, styles } from '@/core/ui';
import { useJobExtraEntries } from '../hooks';
import { extraDetailLine } from '../rules';

/** On a job page: extra work logged on this job, and a button to log more. */
export function ExtraWorkSection({ jobId, canEdit }: JobSectionProps) {
  const router = useRouter();
  const entries = useJobExtraEntries(jobId);
  const list = entries.data ?? [];
  const open = list.filter((e) => !e.invoicedAt).length;
  return (
    <Card>
      <Heading>{`Extra work${open ? ` · ${open} to invoice` : ''}`}</Heading>
      {entries.isLoading ? <Loading /> : null}
      <ErrorText error={entries.error} />
      {!entries.isLoading && list.length === 0 ? <Muted>Anything not in the original job: log it here so it gets invoiced.</Muted> : null}
      {list.map((e) => (
        <Pressable key={e.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/extra-work/[entryId]', params: { entryId: e.id } })}
          style={{ paddingTop: 8, borderTopWidth: 1, borderColor: colors.border, gap: 2 }}>
          <Text style={styles.label}>{e.what}</Text>
          <Muted>{[extraDetailLine(e), e.invoicedAt ? 'Added to invoice' : 'Not invoiced yet'].filter(Boolean).join(' · ')}</Muted>
        </Pressable>
      ))}
      {canEdit ? (
        <View><Button title="Log extra work" variant="secondary" onPress={() => router.push({ pathname: '/extra-work/new', params: { jobId } })} /></View>
      ) : null}
    </Card>
  );
}
