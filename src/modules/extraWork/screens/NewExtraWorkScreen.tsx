import { useState } from 'react';
import { usePickPhotos } from '@/core/jobFiles';
import { PickedPhotos } from '@/core/jobRecords/components/PickedPhotos';
import { Button, Card, ErrorText, Heading, Muted, Screen, TextField } from '@/core/ui';
import { useExtraMutations } from '../hooks';
import { emptyExtraForm, extraProblems, type ExtraForm } from '../rules';

/** Log extra work on a job, from site. No prices: the office prices it when invoicing. */
export function NewExtraWorkScreen({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const { add } = useExtraMutations();
  const photos = usePickPhotos();
  const [form, setForm] = useState<ExtraForm>(emptyExtraForm);
  const [tried, setTried] = useState(false);
  const set = (k: keyof ExtraForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const problems = extraProblems(form);
  const submit = () => {
    setTried(true);
    if (problems.length) return;
    add.mutate({ jobId, form, photos: photos.photos }, { onSuccess: () => { photos.clear(); onDone(); } });
  };
  return (
    <Screen>
      <Card>
        <TextField label="What extra work?" value={form.what} onChange={set('what')} placeholder="e.g. Replaced rotten joist under bath" autoCapitalize="sentences" />
        <TextField label="Why was it needed?" value={form.why} onChange={set('why')} multiline hint="Optional. Helps when the customer asks." autoCapitalize="sentences" />
        <TextField label="Hours" value={form.hours} onChange={set('hours')} placeholder="1.5" hint="Optional" keyboardType="numbers-and-punctuation" />
        <TextField label="Materials used" value={form.materials} onChange={set('materials')} hint="Optional" autoCapitalize="sentences" />
      </Card>
      <Card>
        <Heading>Photos</Heading>
        <PickedPhotos {...photos} />
      </Card>
      {tried && problems.length ? <ErrorText error={problems.join('\n')} /> : null}
      <ErrorText error={add.error} />
      <Button title="Log extra work" busy={add.isPending} onPress={submit} />
      <Muted>The office sees this straight away and adds it to the invoice.</Muted>
    </Screen>
  );
}
