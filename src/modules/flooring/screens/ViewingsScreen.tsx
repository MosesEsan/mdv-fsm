import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { formatDay, localDate } from '@/core/dates';
import { useScheduleMutations } from '@/core/scheduling/hooks';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { Button, Card, ErrorText, Heading, Loading, Muted, Screen, TextField, styles } from '@/core/ui';
import { flooringKeys } from '../api';
import { useViewingJobs } from '../hooks';

/** Jobs and their viewings: open one to measure up, or add a new job. */
export function ViewingsScreen({ onOpen }: { onOpen: (jobId: string, title: string) => void }) {
  const tz = useTenantSettings().timezone ?? 'Europe/Dublin';
  const jobs = useViewingJobs();
  const { createJob } = useScheduleMutations();
  const qc = useQueryClient();
  const [job, setJob] = useState({ summary: '', siteAddress: '' });

  return (
    <Screen>
      <Card>
        <Heading>New job</Heading>
        <TextField label="What's the job" value={job.summary} onChange={(v) => setJob((j) => ({ ...j, summary: v }))} placeholder="e.g. Oak floor, kitchen" />
        <TextField label="Address" value={job.siteAddress} onChange={(v) => setJob((j) => ({ ...j, siteAddress: v }))} />
        <ErrorText error={createJob.error} />
        <Button title="Add and open viewing" busy={createJob.isPending} disabled={!job.summary.trim()}
          onPress={() => createJob.mutate({ summary: job.summary.trim(), siteAddress: job.siteAddress.trim() }, {
            onSuccess: (j) => { setJob({ summary: '', siteAddress: '' }); qc.invalidateQueries({ queryKey: flooringKeys.jobs }); onOpen(j.id, j.summary ?? 'Job'); },
          })} />
      </Card>
      {jobs.isLoading ? <Loading /> : null}
      <ErrorText error={jobs.error} />
      {(jobs.data ?? []).map((j) => (
        <Pressable key={j.id} accessibilityRole="button" onPress={() => onOpen(j.id, j.summary ?? 'Job')} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}>
          <Heading>{j.summary ?? 'Job'}</Heading>
          {j.siteAddress ? <Text style={styles.muted}>{j.siteAddress}</Text> : null}
          <Text style={styles.muted}>
            {j.viewingId
              ? `${j.viewedAt ? `Viewing ${formatDay(localDate(new Date(j.viewedAt), tz))}` : 'Viewing started'} · ${j.roomCount} room${j.roomCount === 1 ? '' : 's'}`
              : 'No viewing yet'}
          </Text>
        </Pressable>
      ))}
      {jobs.data?.length === 0 ? <Muted>No jobs yet.</Muted> : null}
    </Screen>
  );
}
