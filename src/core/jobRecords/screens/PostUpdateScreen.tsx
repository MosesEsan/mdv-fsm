import { useState } from 'react';
import { View } from 'react-native';
import { PHOTO_STAGES, usePickPhotos, type PhotoStage } from '@/core/jobFiles';
import { Button, Card, Chip, ErrorText, Heading, Muted, Screen, TextField, styles } from '@/core/ui';
import { useJobMutations } from '../hooks';
import { STAGE_HINT, STAGE_LABEL, updateProblems } from '../rules';
import { PickedPhotos } from '../components/PickedPhotos';

type Props = { jobId: string; initialStage?: PhotoStage; onDone: () => void };

/** Post an update: a few words and/or photos, tagged Before, Progress or Completion. */
export function PostUpdateScreen({ jobId, initialStage = 'progress', onDone }: Props) {
  const { post } = useJobMutations();
  const photos = usePickPhotos();
  const [stage, setStage] = useState<PhotoStage>(initialStage);
  const [body, setBody] = useState('');
  const [tried, setTried] = useState(false);
  const problems = updateProblems(body, photos.photos.length);

  const submit = () => {
    setTried(true);
    if (problems.length) return;
    post.mutate({ jobId, body, stage, photos: photos.photos }, { onSuccess: () => { photos.clear(); onDone(); } });
  };

  return (
    <Screen>
      <Card>
        <Heading>Photos</Heading>
        <View style={styles.wrap}>
          {PHOTO_STAGES.map((s) => <Chip key={s} label={STAGE_LABEL[s]} selected={stage === s} onPress={() => setStage(s)} />)}
        </View>
        <Muted>{STAGE_HINT[stage]}</Muted>
        <PickedPhotos {...photos} />
      </Card>
      <Card>
        <TextField label="What's happening?" value={body} onChange={setBody} multiline placeholder="e.g. Old suite out, found rot under the floor, Gary to call the customer" autoCapitalize="sentences" />
      </Card>
      {tried && problems.length ? <ErrorText error={problems.join('\n')} /> : null}
      <ErrorText error={post.error} />
      <Button title="Post update" busy={post.isPending} onPress={submit} />
      <Muted>Photos upload in the background. If there's no signal they wait and go when it's back.</Muted>
    </Screen>
  );
}
