import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/core/auth/AuthProvider';
import { PHOTO_STAGES, usePickPhotos, type PhotoStage } from '@/core/jobFiles';
import { Button, Chip, ErrorText, Screen, TextField, colors, styles } from '@/core/ui';
import { AppBar, PhotoGrid } from '@/core/ui/kit';
import { useJobMutations, useJobRecord } from '../hooks';
import { STAGE_HINT, STAGE_LABEL, firstName, updateProblems } from '../rules';

type Props = { jobId: string; initialStage?: PhotoStage; onDone: () => void };

/** Post an update: photo stage, photos, a few words (flows board: Post update). */
export function PostUpdateScreen({ jobId, initialStage = 'progress', onDone }: Props) {
  const router = useRouter();
  const { session } = useSession();
  const record = useJobRecord(jobId);
  const { post } = useJobMutations();
  const photos = usePickPhotos();
  const [stage, setStage] = useState<PhotoStage>(initialStage);
  const [body, setBody] = useState('');
  const [tried, setTried] = useState(false);
  const problems = updateProblems(body, photos.photos.length);
  const me = firstName(typeof session?.user.user_metadata?.full_name === 'string' ? session.user.user_metadata.full_name : null);
  const r = record.data;

  const submit = () => {
    setTried(true);
    if (problems.length) return;
    post.mutate({ jobId, body, stage, photos: photos.photos }, { onSuccess: () => { photos.clear(); onDone(); } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title="Post update" sub={r ? [r.summary, r.customer_name].filter(Boolean).join(' · ') : null} onBack={() => (router.canGoBack() ? router.back() : onDone())} />
      <Screen>
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>Photos</Text>
          <View style={styles.wrap}>
            {PHOTO_STAGES.map((s) => <Chip key={s} label={STAGE_LABEL[s]} selected={stage === s} onPress={() => setStage(s)} />)}
          </View>
          <Text style={styles.hint}>{STAGE_HINT[stage]}</Text>
          {photos.photos.length ? <PhotoGrid photos={photos.photos.map((p) => ({ id: p.uri, thumbUrl: p.thumbUri }))} onOpen={(i) => photos.remove(photos.photos[i].uri)} /> : null}
          {photos.photos.length ? <Text style={styles.hint}>Tap a photo to take it off.</Text> : null}
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Button title="Take photo" icon="camera-outline" busy={photos.busy} onPress={() => photos.pick('camera')} /></View>
            <View style={{ flex: 1 }}><Button title="Choose photos" variant="secondary" busy={photos.busy} onPress={() => photos.pick('library')} /></View>
          </View>
          <ErrorText error={photos.error} />
        </View>
        <TextField label="What happened" value={body} onChange={setBody} multiline autoCapitalize="sentences" placeholder="e.g. Floor tiles down, grouting tomorrow"
          error={tried && problems.length ? problems[0] : null} />
        <Text style={styles.hint}>{`Posted as ${me}, with today’s date and time. Everyone on the job sees it.`}</Text>
        <ErrorText error={post.error} />
        <Button title="Post update" icon="send" size="lg" busy={post.isPending} onPress={submit} />
      </Screen>
    </View>
  );
}
