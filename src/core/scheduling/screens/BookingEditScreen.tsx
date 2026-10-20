import { useState } from 'react';
import { Text, View } from 'react-native';
import { formatDay } from '@/core/dates';
import { Button, Card, Chip, ErrorText, Heading, Loading, Muted, Screen, TextField, styles } from '@/core/ui';
import { useJobOptions, usePeople, useScheduleContext, useScheduleMutations } from '../hooks';
import { timeLabel } from '../rules';
import { useBookingForm } from '../useBookingForm';

type Props = { bookingId: string; date: string; onDone: () => void };

/** Add or change a booking: job, day, times, who's going. Warns about clashes before saving. */
export function BookingEditScreen({ bookingId, date, onDone }: Props) {
  const { tz, canEdit } = useScheduleContext();
  const f = useBookingForm(bookingId, date, onDone);
  const people = usePeople();
  const jobs = useJobOptions(canEdit);
  const { createJob } = useScheduleMutations();
  const [newJob, setNewJob] = useState({ summary: '', siteAddress: '' });
  const names = new Map((people.data ?? []).map((p) => [p.id, p.fullName]));

  if (!canEdit) return <Screen><Muted>Only the owner or a manager can change the schedule.</Muted></Screen>;
  if (f.isLoading) return <Loading />;
  if (f.notFound) return <Screen><Muted>This booking couldn't be found. It may have been moved to another day.</Muted></Screen>;

  const jobList = (jobs.data ?? []).filter((j) => j.status !== 'cancelled');

  return (
    <Screen>
      <Card>
        <Heading>{f.isNew ? 'New booking' : 'Change booking'}</Heading>
        <Text style={styles.label}>Job</Text>
        {jobs.isLoading ? <Loading /> : null}
        <View style={styles.wrap}>
          {jobList.slice(0, 30).map((j) => (
            <Chip key={j.id} label={j.summary ?? j.siteAddress ?? 'Job'} selected={f.form.jobId === j.id}
              disabled={!f.isNew && f.form.jobId !== j.id} onPress={() => f.update({ jobId: j.id })} />
          ))}
        </View>
        {f.isNew ? (
          <View style={{ gap: 8 }}>
            <Muted>Or add a new job:</Muted>
            <TextField label="What's the job" value={newJob.summary} onChange={(v) => setNewJob((n) => ({ ...n, summary: v }))} placeholder="e.g. Oak floor, kitchen" />
            <TextField label="Address" value={newJob.siteAddress} onChange={(v) => setNewJob((n) => ({ ...n, siteAddress: v }))} />
            <ErrorText error={createJob.error} />
            <Button title="Add job" variant="secondary" busy={createJob.isPending} disabled={!newJob.summary.trim()}
              onPress={() => createJob.mutate({ summary: newJob.summary.trim(), siteAddress: newJob.siteAddress.trim() },
                { onSuccess: (j) => { f.update({ jobId: j.id }); setNewJob({ summary: '', siteAddress: '' }); } })} />
          </View>
        ) : null}
      </Card>
      <Card>
        <TextField label="Day" value={f.form.date} onChange={(v) => f.update({ date: v })} hint={/^\d{4}-\d{2}-\d{2}$/.test(f.form.date) ? formatDay(f.form.date) : 'Like 2026-11-02'} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}><TextField label="Start" value={f.form.start} onChange={(v) => f.update({ start: v })} placeholder="08:30" keyboardType="numbers-and-punctuation" /></View>
          <View style={{ flex: 1 }}><TextField label="Finish" value={f.form.end} onChange={(v) => f.update({ end: v })} placeholder="16:30" keyboardType="numbers-and-punctuation" /></View>
        </View>
        <Text style={styles.label}>Who's going</Text>
        <View style={styles.wrap}>
          {(people.data ?? []).map((p) => <Chip key={p.id} label={p.fullName} selected={f.form.userIds.includes(p.id)} onPress={() => f.togglePerson(p.id)} />)}
        </View>
        <TextField label="Notes for the job sheet" value={f.notes} onChange={f.setNotes} multiline />
      </Card>
      {f.clashes.map((c) => (
        <Text key={c.id} style={styles.error}>
          {`Clash: ${c.userIds.filter((u) => f.form.userIds.includes(u)).map((u) => names.get(u) ?? 'Someone').join(', ')} already booked ${timeLabel(c.startsAt, tz)}–${timeLabel(c.endsAt, tz)}.`}
        </Text>
      ))}
      {f.problems.map((p) => <Muted key={p}>{p}</Muted>)}
      <ErrorText error={f.error} />
      <Button title={f.isNew ? 'Book it' : 'Save changes'} onPress={f.submit} busy={f.saving} disabled={f.problems.length > 0 || f.clashes.length > 0} />
      {!f.isNew ? <Button title="Cancel this booking" variant="danger" onPress={f.cancelBooking} busy={f.cancelling} /> : null}
    </Screen>
  );
}
