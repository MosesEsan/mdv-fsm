import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { JobSectionProps } from '@/core/jobs/sections';
import { Button, Card, Heading, Muted, styles } from '@/core/ui';
import { useViewing } from '../hooks';
import { totalArea } from '../rules';

/** On the job sheet: rooms measured at the viewing (no prices), and a link to the viewing for managers. */
export function ViewingSection({ jobId, canEdit }: JobSectionProps) {
  const router = useRouter();
  const q = useViewing(jobId);
  const v = q.data;
  if (q.isLoading || (!v && !canEdit)) return null;
  const rooms = v?.rooms ?? [];
  return (
    <Card>
      <Heading>{`Rooms${rooms.length ? ` · ${totalArea(rooms)} m²` : ''}`}</Heading>
      {v?.est_duration_hours ? <Muted>{`Time needed: about ${v.est_duration_hours} hours`}</Muted> : null}
      {rooms.length === 0 ? <Muted>No rooms measured yet.</Muted> : null}
      {rooms.map((r) => (
        <Text key={r.id} style={styles.label}>
          {`${r.name}: ${r.area_m2 ?? '–'} m²`}
          <Text style={styles.muted}>{[r.length_m && r.width_m ? `  (${r.length_m} × ${r.width_m} m)` : '', r.floor_type ? `  ${r.floor_type}` : '', r.notes ? `  ${r.notes}` : ''].join('')}</Text>
        </Text>
      ))}
      {v?.notes ? <Text>{v.notes}</Text> : null}
      {canEdit ? <Button title="Open viewing" variant="secondary" onPress={() => router.push({ pathname: '/flooring/viewings/[jobId]', params: { jobId } })} /> : null}
    </Card>
  );
}
