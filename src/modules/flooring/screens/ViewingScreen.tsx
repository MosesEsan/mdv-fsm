import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { isValidTime, localDate, localTime, zonedInstant } from '@/core/dates';
import { JobPhotos } from '@/core/jobFiles';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { Button, Card, ErrorText, Heading, Loading, Muted, Screen, TextField, styles } from '@/core/ui';
import { VIEWING_PHOTOS } from '../api';
import { RoomEditor } from '../components/RoomEditor';
import { useViewing, useViewingMutations } from '../hooks';
import { parseMetres, totalArea } from '../rules';

/** The viewing for one job: when, rooms and measurements, notes, time needed, photos. Tablet-friendly. */
export function ViewingScreen({ jobId, jobTitle }: { jobId: string; jobTitle?: string }) {
  const tz = useTenantSettings().timezone ?? 'Europe/Dublin';
  const q = useViewing(jobId);
  const m = useViewingMutations(jobId);
  const v = q.data;
  const [details, setDetails] = useState({ date: '', time: '', notes: '', hours: '' });
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  useEffect(() => {
    if (q.isSuccess) {
      const at = v?.viewed_at ? new Date(v.viewed_at) : null;
      setDetails({
        date: at ? localDate(at, tz) : '', time: at ? localTime(at, tz) : '',
        notes: v?.notes ?? '', hours: v?.est_duration_hours?.toString() ?? '',
      });
    }
  }, [q.isSuccess, v?.id, v?.viewed_at, v?.notes, v?.est_duration_hours, tz]);

  if (q.isLoading) return <Loading />;
  const rooms = v?.rooms ?? [];

  const hours = parseMetres(details.hours); // same number rules
  const dateOk = details.date === '' || (/^\d{4}-\d{2}-\d{2}$/.test(details.date) && (details.time === '' || isValidTime(details.time)));
  const hoursOk = hours === null || (!Number.isNaN(hours) && hours > 0 && hours <= 500);
  const saveDetails = () => m.saveDetails.mutate({
    viewed_at: details.date ? zonedInstant(details.date, details.time || '09:00', tz).toISOString() : null,
    notes: details.notes.trim() || null,
    est_duration_hours: hours,
  });

  return (
    <Screen>
      {jobTitle ? <Heading>{jobTitle}</Heading> : null}
      <ErrorText error={q.error} />
      <Card>
        <Heading>Viewing</Heading>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><TextField label="Date" value={details.date} onChange={(d) => setDetails((x) => ({ ...x, date: d }))} placeholder="2026-11-02" /></View>
          <View style={{ flex: 1 }}><TextField label="Time" value={details.time} onChange={(t) => setDetails((x) => ({ ...x, time: t }))} placeholder="10:00" keyboardType="numbers-and-punctuation" /></View>
        </View>
        <TextField label="Time needed for the job (hours)" value={details.hours} onChange={(h) => setDetails((x) => ({ ...x, hours: h }))} keyboardType="numbers-and-punctuation" placeholder="e.g. 6" />
        <TextField label="Notes" value={details.notes} onChange={(n) => setDetails((x) => ({ ...x, notes: n }))} multiline placeholder="Access, subfloor, parking…" />
        {!dateOk ? <Muted>Enter the date like 2026-11-02 and the time like 10:00.</Muted> : null}
        {!hoursOk ? <Muted>Time needed must be a number of hours, like 6 or 7.5.</Muted> : null}
        <ErrorText error={m.saveDetails.error} />
        {m.saveDetails.isSuccess ? <Muted>Saved.</Muted> : null}
        <Button title="Save viewing" onPress={saveDetails} busy={m.saveDetails.isPending} disabled={!dateOk || !hoursOk} />
      </Card>

      <Card>
        <Heading>{`Rooms${rooms.length ? ` · ${totalArea(rooms)} m² in total` : ''}`}</Heading>
        {rooms.length === 0 && editing !== 'new' ? <Muted>No rooms measured yet.</Muted> : null}
        {rooms.map((r) => editing === r.id ? (
          <RoomEditor key={r.id} room={r} busy={m.saveRoom.isPending} error={m.saveRoom.error ?? m.deleteRoom.error}
            onSave={(room) => m.saveRoom.mutate({ viewingId: v?.id, room: { ...room, id: r.id, sort_order: r.sort_order } }, { onSuccess: () => setEditing(null) })}
            onCancel={() => setEditing(null)}
            onDelete={() => m.deleteRoom.mutate(r.id, { onSuccess: () => setEditing(null) })} />
        ) : (
          <Pressable key={r.id} accessibilityRole="button" onPress={() => setEditing(r.id)} style={{ paddingVertical: 8, borderTopWidth: 1, borderColor: '#d1d9e0' }}>
            <Text style={styles.label}>{`${r.name} · ${r.area_m2 ?? '–'} m²`}</Text>
            <Text style={styles.muted}>{[r.length_m && r.width_m ? `${r.length_m} × ${r.width_m} m` : null, r.floor_type, r.notes].filter(Boolean).join(' · ')}</Text>
          </Pressable>
        ))}
        {editing === 'new' ? (
          <RoomEditor busy={m.saveRoom.isPending} error={m.saveRoom.error}
            onSave={(room) => m.saveRoom.mutate({ viewingId: v?.id, room: { ...room, sort_order: rooms.length } }, { onSuccess: () => setEditing(null) })}
            onCancel={() => setEditing(null)} />
        ) : (
          <Button title="Add room" variant="secondary" onPress={() => setEditing('new')} disabled={editing !== null} />
        )}
      </Card>

      <JobPhotos jobId={jobId} kind={VIEWING_PHOTOS} title="Viewing photos" canAdd />
    </Screen>
  );
}
