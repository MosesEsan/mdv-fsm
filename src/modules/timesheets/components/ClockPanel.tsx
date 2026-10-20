import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, ErrorText, Muted, styles } from '@/core/ui';
import { useClockCancel, useClockIn, useClockOut, useClockSession, useCostCodes, useJobOptions } from '../api/hooks';
import type { TimesheetsSettings } from '../schemas/settings';
import { formatMinutes, minutesBetween } from '@/core/dates';
import { localTime } from '@/core/dates';
import { OptionPicker } from './OptionPicker';

type Props = { workerId: string; settings: TimesheetsSettings; timezone: string };

/** Clock in / clock out. Times come from the server; the phone only shows the running timer. */
export function ClockPanel({ workerId, settings, timezone }: Props) {
  const session = useClockSession(workerId);
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const cancel = useClockCancel();
  const showJob = settings.logAgainst === 'job';
  const jobs = useJobOptions(showJob && !session.data);
  const costCodes = useCostCodes(settings.costCodes && !session.data);
  const [jobId, setJobId] = useState<string | null>(null);
  const [costCodeId, setCostCodeId] = useState<string | null>(null);
  const [breakText, setBreakText] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!session.data) return;
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, [session.data]);

  if (session.isLoading) return null;
  const open = session.data;

  if (open) {
    const started = new Date(open.started_at);
    return (
      <Card>
        <Text style={styles.label}>{`Clocked in at ${localTime(started, timezone)}`}</Text>
        <Muted>{`${formatMinutes(Math.max(0, minutesBetween(started, now)))} so far`}</Muted>
        {settings.breaks === 'manual' ? (
          <View style={styles.row}>
            <Text style={styles.muted}>Break</Text>
            <TextInput style={[styles.input, { width: 80 }]} value={breakText} onChangeText={setBreakText} keyboardType="number-pad" placeholder="0" accessibilityLabel="Break in minutes" />
            <Text style={styles.muted}>minutes</Text>
          </View>
        ) : settings.breaks === 'fixed' ? (
          <Muted>{`A ${settings.fixedBreakMinutes}-minute break will be taken off.`}</Muted>
        ) : null}
        <ErrorText error={clockOut.error ?? cancel.error} />
        <Button title="Clock out" onPress={() => clockOut.mutate({ breakMinutes: breakText ? Number(breakText) : undefined })} busy={clockOut.isPending} />
        <Button title="Cancel clock-in" variant="secondary" onPress={() => cancel.mutate(undefined)} busy={cancel.isPending} />
      </Card>
    );
  }

  return (
    <Card>
      {showJob ? <OptionPicker label="Job" options={jobs.data} value={jobId} onChange={setJobId} required={settings.requireJob} emptyText="No jobs available." /> : null}
      {settings.costCodes ? <OptionPicker label="Work category" options={costCodes.data} value={costCodeId} onChange={setCostCodeId} /> : null}
      <ErrorText error={clockIn.error} />
      <Button
        title="Clock in"
        onPress={() => clockIn.mutate({ jobId, costCodeId })}
        disabled={showJob && settings.requireJob && !jobId}
        busy={clockIn.isPending}
      />
    </Card>
  );
}
