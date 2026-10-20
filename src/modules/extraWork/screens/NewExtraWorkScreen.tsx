import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { choosePhotoSource, usePickPhotos } from '@/core/jobFiles';
import { useJobRecord } from '@/core/jobRecords';
import { Button, ErrorText, Notice, Screen, TextField, colors, styles } from '@/core/ui';
import { AppBar, PhotoGrid } from '@/core/ui/kit';
import { useExtraMutations } from '../hooks';
import { emptyExtraForm, extraProblems, type ExtraForm } from '../rules';

/** Log extra work from site (flows board: Log extra work). No prices: the office prices it when invoicing. */
export function NewExtraWorkScreen({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const router = useRouter();
  const record = useJobRecord(jobId);
  const { add } = useExtraMutations();
  const photos = usePickPhotos();
  const [form, setForm] = useState<ExtraForm>(emptyExtraForm);
  const [tried, setTried] = useState(false);
  const set = (k: keyof ExtraForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const problems = extraProblems(form);
  const r = record.data;
  const submit = () => {
    setTried(true);
    if (problems.length) return;
    add.mutate({ jobId, form, photos: photos.photos }, { onSuccess: () => { photos.clear(); onDone(); } });
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title="Log extra work" sub={r ? [r.summary, r.customer_name].filter(Boolean).join(' · ') : null} onBack={() => (router.canGoBack() ? router.back() : onDone())} />
      <Screen>
        <Notice tone="info" title="Anything you did that wasn’t in the instructions.">The office sees it and adds it to the invoice.</Notice>
        <TextField label="What did you do?" value={form.what} onChange={set('what')} placeholder="e.g. Replaced a rotten joist under the bath" autoCapitalize="sentences"
          error={tried && !form.what.trim() ? 'Say what you did.' : null} />
        <TextField label="Why? (optional)" value={form.why} onChange={set('why')} placeholder="e.g. Floor was soft when the bath came out" autoCapitalize="sentences" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}><TextField label="Roughly how long (hours)" value={form.hours} onChange={set('hours')} placeholder="e.g. 2" keyboardType="numbers-and-punctuation" /></View>
          <View style={{ flex: 1 }}><TextField label="Materials used" value={form.materials} onChange={set('materials')} placeholder="e.g. Timber, screws" autoCapitalize="sentences" /></View>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>Photos</Text>
          {photos.photos.length ? <PhotoGrid photos={photos.photos.map((p) => ({ id: p.uri, thumbUrl: p.thumbUri }))} onOpen={(i) => photos.remove(photos.photos[i].uri)} /> : null}
          <Button title="Take or choose photos" icon="camera-outline" variant="secondary" busy={photos.busy} onPress={() => choosePhotoSource(photos.pick)} />
          <ErrorText error={photos.error} />
        </View>
        {tried && problems.length ? <Notice tone="bad" title={problems[0]} /> : null}
        <ErrorText error={add.error} />
        <Button title="Log extra work" icon="flag" variant="accent" size="lg" busy={add.isPending} onPress={submit} />
      </Screen>
    </View>
  );
}
