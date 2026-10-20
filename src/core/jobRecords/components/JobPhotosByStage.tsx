import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, ErrorText, Heading, Loading, Muted, styles } from '@/core/ui';
import { PHOTO_STAGES, usePendingUploads, type JobFile, type PhotoStage } from '@/core/jobFiles';
import { STAGE_LABEL } from '../rules';
import { PhotoStrip } from './PhotoStrip';

type Props = { files: JobFile[] | undefined; isLoading: boolean; error: unknown; jobId: string; isCompleted: boolean };

/** All of a job's photos, filtered by Before / Progress / Completion, plus any still uploading. */
export function JobPhotosByStage({ files, isLoading, error, jobId, isCompleted }: Props) {
  const [stage, setStage] = useState<PhotoStage | 'all'>('all');
  const { pending, retry } = usePendingUploads(jobId);
  const photos = useMemo(() => (files ?? []).filter((f) => f.thumbUrl && (f.kind === 'photo' || f.stage != null)), [files]);
  const count = (s: PhotoStage | 'all') => (s === 'all' ? photos.length : photos.filter((p) => p.stage === s).length);
  const shown = photos.filter((p) => stage === 'all' || p.stage === stage);
  const waiting = pending.filter((p) => stage === 'all' || p.stage === stage);
  const failing = pending.some((p) => p.attempts > 0);

  return (
    <Card>
      <Heading>{`Photos · ${photos.length}`}</Heading>
      <View style={styles.wrap}>
        <Chip label={`All ${count('all')}`} selected={stage === 'all'} onPress={() => setStage('all')} />
        {PHOTO_STAGES.map((s) => <Chip key={s} label={`${STAGE_LABEL[s]} ${count(s)}`} selected={stage === s} onPress={() => setStage(s)} />)}
      </View>
      {isLoading ? <Loading /> : null}
      <ErrorText error={error} />
      <PhotoStrip photos={[
        ...shown.map((p) => ({ id: p.id, thumbUrl: p.thumbUrl, url: p.url, label: p.stage ? STAGE_LABEL[p.stage] : undefined })),
        ...waiting.map((p) => ({ id: p.id, thumbUrl: p.thumbUri, url: null, waiting: true })),
      ]} />
      {!isLoading && shown.length === 0 && waiting.length === 0 ? (
        <Muted>{stage === 'completion' && !isCompleted ? 'Completion photos are added when the work is finished.' : 'No photos here yet.'}</Muted>
      ) : null}
      {pending.length > 0 ? (
        <View style={{ gap: 6 }}>
          <Muted>{`${pending.length} photo${pending.length === 1 ? '' : 's'} waiting to upload${failing ? ' (no signal? it will keep trying)' : '…'}`}</Muted>
          {failing ? <Button title="Try again now" variant="secondary" onPress={() => void retry()} /> : null}
        </View>
      ) : null}
    </Card>
  );
}
