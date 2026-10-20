import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useJobFiles } from '@/core/jobFiles';
import { jobSectionsFor } from '@/core/jobs/sections';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { formatDay, localDate } from '@/core/dates';
import { Button, Card, ErrorText, Heading, Loading, Muted, Screen, colors, styles } from '@/core/ui';
import { useJobContext, useJobMutations, useJobRecord, useJobRecordsLive, useJobUpdates } from '../hooks';
import { STATUS_LABEL, firstName, nextStatuses, type JobStatus } from '../rules';
import { JobPhotosByStage } from '../components/JobPhotosByStage';
import { StatusPill } from '../components/StatusPill';
import { UpdatesFeed } from '../components/UpdatesFeed';

type Props = { jobId: string; onEdit: () => void; onPost: (stage?: 'completion') => void };

const DAY_MS = 24 * 3600_000;

/** One job: details, photos by stage, module sections, the updates feed and status buttons. */
export function JobScreen({ jobId, onEdit, onPost }: Props) {
  useJobRecordsLive();
  const { tz, today, userId, isManager } = useJobContext();
  const { isFeatureEnabled } = useTenantSettings();
  const record = useJobRecord(jobId);
  const updates = useJobUpdates(jobId);
  const files = useJobFiles(jobId);
  const { setStatus, edit, remove } = useJobMutations();
  const [confirming, setConfirming] = useState<JobStatus | null>(null);

  const r = record.data;
  if (!r) return <Screen>{record.isLoading ? <Loading /> : <ErrorText error={record.error ?? 'This job could not be found, or you are not on it.'} />}</Screen>;

  const open = r.status !== 'completed' && r.status !== 'cancelled';
  const address = r.site_address ?? r.customer_address;
  const completionPhotos = (files.data ?? []).filter((f) => f.stage === 'completion').length;
  const created = `Job created ${formatDay(localDate(new Date(r.created_at), tz))}${r.created_by_name ? ` by ${firstName(r.created_by_name)}` : ''}`;

  const move = (s: JobStatus) => setStatus.mutate({ id: jobId, status: s }, { onSuccess: () => setConfirming(null) });

  return (
    <Screen>
      <Card>
        <StatusPill status={r.status} />
        <Text style={[styles.label, { fontSize: 20 }]}>{r.summary ?? 'Untitled job'}</Text>
        <Text style={{ color: colors.text }}>{[r.customer_name, address].filter(Boolean).join(' · ')}</Text>
        <Muted>
          {r.status === 'completed' && r.completed_at
            ? `Completed ${formatDay(localDate(new Date(r.completed_at), tz))}${r.completed_by_name ? ` by ${firstName(r.completed_by_name)}` : ''}`
            : r.start_on ? `Starts ${formatDay(r.start_on)}` : 'No start date yet'}
        </Muted>
        <View style={styles.row}>
          {address ? <View style={{ flex: 1 }}><Button title="Open in maps" variant="secondary" onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`)} /></View> : null}
          {r.customer_phone ? <View style={{ flex: 1 }}><Button title="Call customer" variant="secondary" onPress={() => Linking.openURL(`tel:${r.customer_phone!.replace(/\s/g, '')}`)} /></View> : null}
        </View>
        {isManager ? <Button title="Edit job" variant="secondary" onPress={onEdit} /> : null}
      </Card>

      {r.instructions ? (
        <Card><Heading>Instructions</Heading><Text style={{ color: colors.text, fontSize: 15 }}>{r.instructions}</Text></Card>
      ) : null}

      <Card>
        <Heading>Who's on it</Heading>
        <Muted>{r.people.length ? r.people.map((p) => firstName(p.name)).join(', ') : 'Nobody yet'}</Muted>
      </Card>

      {open || isManager ? <Button title="Post an update" onPress={() => onPost()} /> : <Muted>This job is finished, so updates are closed.</Muted>}

      <JobPhotosByStage files={files.data} isLoading={files.isLoading} error={files.error} jobId={jobId} isCompleted={!open} />

      {jobSectionsFor(isFeatureEnabled).map(({ id, Component }) => <Component key={id} jobId={jobId} canEdit={open || isManager} />)}

      <UpdatesFeed
        updates={updates.data} isLoading={updates.isLoading} error={updates.error} files={files.data} tz={tz} today={today}
        createdLine={created}
        canChange={(u) => isManager || (u.authorId === userId && open && Date.now() - new Date(u.createdAt).getTime() < DAY_MS)}
        onEdit={(id, body) => edit.mutateAsync({ id, body })}
        onDelete={(id) => remove.mutateAsync(id)}
      />

      {isManager ? (
        <Card>
          <Heading>Status</Heading>
          {confirming === 'completed' ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.text }}>
                {completionPhotos ? `Mark this job completed? It has ${completionPhotos} completion photo${completionPhotos === 1 ? '' : 's'}.` : 'There are no completion photos yet. Mark it completed anyway?'}
              </Text>
              <Muted>The team can't post to a completed job. You can reopen it later.</Muted>
              <View style={styles.row}>
                <View style={{ flex: 1 }}><Button title="Yes, completed" busy={setStatus.isPending} onPress={() => move('completed')} /></View>
                <View style={{ flex: 1 }}><Button title="Not yet" variant="secondary" onPress={() => setConfirming(null)} /></View>
              </View>
              {!completionPhotos ? <Button title="Add completion photos first" variant="secondary" onPress={() => { setConfirming(null); onPost('completion'); }} /> : null}
            </View>
          ) : (
            <View style={styles.row}>
              {nextStatuses(r.status).map((s) => (
                <View key={s} style={{ flex: 1 }}>
                  <Button
                    title={s === 'in_progress' && !open ? 'Reopen' : s === 'completed' ? 'Mark completed' : `Mark ${STATUS_LABEL[s].toLowerCase()}`}
                    variant={s === 'completed' ? 'primary' : 'secondary'} busy={setStatus.isPending}
                    onPress={() => (s === 'completed' ? setConfirming('completed') : move(s))}
                  />
                </View>
              ))}
            </View>
          )}
          <ErrorText error={setStatus.error} />
        </Card>
      ) : null}
    </Screen>
  );
}
