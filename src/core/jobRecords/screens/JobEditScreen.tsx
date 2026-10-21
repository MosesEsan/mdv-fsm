import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCustomerSearch, type Customer } from '@/core/customers';
import { choosePhotoSource, usePickPhotos } from '@/core/jobFiles';
import { Button, Card, Chip, ErrorText, Notice, Screen, TextField, colors, styles } from '@/core/ui';
import { AppBar, ListRow, LoadingCards, PhotoGrid, SectionLabel } from '@/core/ui/kit';
import { useJobMutations, useJobRecord, usePeople } from '../hooks';
import { firstName } from '../rules';

type Props = { jobId: string | null; onSaved: (jobId: string) => void };
type Form = { title: string; name: string; phone: string; address: string; instructions: string; startOn: string; people: string[] };
const empty: Form = { title: '', name: '', phone: '', address: '', instructions: '', startOn: '', people: [] };
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Plain-English problems, listed above Save after the first try (flows board: New job). */
export function newJobProblems(f: Form): string[] {
  const out: string[] = [];
  if (!f.title.trim()) out.push('Add what the job is.');
  if (!f.name.trim()) out.push('Add the customer’s name.');
  if (!f.address.trim()) out.push('Add the address.');
  if (f.startOn.trim() && !ISO.test(f.startOn.trim())) out.push('Write the start date like 2026-10-22, or leave it blank.');
  return out;
}

/** New job, or edit one: the job, the customer, instructions, who's on it and before photos, on one screen. */
export function JobEditScreen({ jobId, onSaved }: Props) {
  const router = useRouter();
  const isNew = !jobId;
  const record = useJobRecord(jobId ?? '');
  const people = usePeople();
  const { save } = useJobMutations();
  const photos = usePickPhotos();
  const [f, setF] = useState<Form>(empty);
  const [picked, setPicked] = useState<Customer | null>(null);
  const [find, setFind] = useState('');
  const [tried, setTried] = useState(false);
  const [loaded, setLoaded] = useState(isNew);
  const search = useCustomerSearch(find.trim().length >= 2 ? find : '');

  useEffect(() => {
    const r = record.data;
    if (isNew || loaded || !r) return;
    setF({ title: r.summary ?? '', name: r.customer_name ?? '', phone: r.customer_phone ?? '', address: r.site_address ?? r.customer_address ?? '',
      instructions: r.instructions ?? '', startOn: r.start_on ?? '', people: r.people.map((p) => p.id) });
    if (r.customer_id) setPicked({ id: r.customer_id, name: r.customer_name ?? '', phone: r.customer_phone, email: null, address: r.customer_address, notes: null });
    setLoaded(true);
  }, [record.data, isNew, loaded]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/jobs'));
  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const pick = (c: Customer) => { setPicked(c); setFind(''); setF((x) => ({ ...x, name: c.name, phone: c.phone ?? '', address: x.address || c.address || '' })); };
  // Typing a different name means a different (new) customer.
  const samePicked = picked && picked.name === f.name.trim() && (picked.phone ?? '') === f.phone.trim();
  const problems = newJobProblems(f);

  const chooseSource = () => choosePhotoSource(photos.pick, 'Before photos');

  const submit = () => {
    setTried(true);
    if (problems.length) return;
    save.mutate({
      job: {
        id: jobId, summary: f.title.trim(), siteAddress: f.address.trim(), instructions: f.instructions.trim(), startOn: f.startOn.trim() || null,
        customerId: samePicked ? picked!.id : null,
        newCustomer: samePicked ? null : { name: f.name.trim(), phone: f.phone.trim() || null, email: null, address: f.address.trim() || null },
        peopleIds: f.people,
      },
      beforePhotos: photos.photos,
    }, { onSuccess: (id) => { photos.clear(); onSaved(id); } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title={isNew ? 'New job' : 'Edit job'} onBack={back} />
      {!loaded ? <Screen><LoadingCards /></Screen> : (
        <Screen>
          <Card style={{ gap: 12 }}>
            <TextField label="What’s the job?" value={f.title} onChange={set('title')} placeholder="e.g. Bathroom renovation" autoCapitalize="sentences"
              error={tried && !f.title.trim() ? 'Add what the job is.' : null} />
          </Card>

          <Card style={{ gap: 12 }}>
            <SectionLabel>Customer</SectionLabel>
            <TextField label="Find a past customer" value={find} onChange={setFind} placeholder="Name or street" autoCapitalize="none" />
            {find.trim().length >= 2 && (search.data ?? []).slice(0, 5).map((c) => <ListRow key={c.id} title={c.name} lines={[c.address]} onPress={() => pick(c)} />)}
            <TextField label="Name" value={f.name} onChange={set('name')} autoCapitalize="words" error={tried && !f.name.trim() ? 'Add the customer’s name.' : null} />
            <TextField label="Phone" value={f.phone} onChange={set('phone')} keyboardType="phone-pad" />
            <TextField label="Address" value={f.address} onChange={set('address')} autoCapitalize="words" error={tried && !f.address.trim() ? 'Add the address.' : null} />
          </Card>

          <Card style={{ gap: 12 }}>
            <TextField label="Instructions for the team" value={f.instructions} onChange={set('instructions')} multiline autoCapitalize="sentences"
              placeholder="What needs doing, materials, access, anything to watch out for" />
            <TextField label="Start date (optional)" value={f.startOn} onChange={set('startOn')} placeholder="e.g. 2026-10-22" keyboardType="numbers-and-punctuation" />
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Who’s on it</Text>
              <View style={styles.wrap}>
                {(people.data ?? []).filter((p) => p.role !== 'owner').map((p) => (
                  <Chip key={p.id} label={firstName(p.fullName)} selected={f.people.includes(p.id)}
                    onPress={() => set('people')(f.people.includes(p.id) ? f.people.filter((x) => x !== p.id) : [...f.people, p.id])} />
                ))}
              </View>
              <Text style={styles.hint}>They see the job on their phone as soon as you save.</Text>
            </View>
          </Card>

          <Card style={{ gap: 10 }}>
            <SectionLabel>{isNew ? 'Before photos' : 'Add before photos'}</SectionLabel>
            {photos.photos.length ? (
              <PhotoGrid photos={photos.photos.map((p) => ({ id: p.uri, thumbUrl: p.thumbUri }))} onOpen={(i) => photos.remove(photos.photos[i].uri)} />
            ) : null}
            {photos.photos.length ? <Text style={styles.hint}>Tap a photo to take it off.</Text> : null}
            <Button title="Take or choose photos" icon="camera-outline" variant="secondary" busy={photos.busy} onPress={chooseSource} />
            <ErrorText error={photos.error} />
          </Card>

          {tried && problems.length ? <Notice tone="bad" title="Before you save:">{problems.map((p) => `• ${p}`).join('\n')}</Notice> : null}
          <ErrorText error={save.error} />
          <Button title={isNew ? 'Save job' : 'Save changes'} size="lg" busy={save.isPending} onPress={submit} />
        </Screen>
      )}
    </View>
  );
}
