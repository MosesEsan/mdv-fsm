import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { usePickPhotos } from '@/core/jobFiles';
import { CustomerPicker, customerProblems, customerValues, type Customer, type CustomerInput } from '@/core/customers';
import { Button, Card, Chip, ErrorText, Heading, Loading, Muted, Screen, TextField, styles } from '@/core/ui';
import { useJobMutations, useJobRecord, usePeople } from '../hooks';
import { emptyJobForm, firstName, jobFormProblems, type JobForm } from '../rules';
import { PickedPhotos } from '../components/PickedPhotos';

type Props = { jobId: string | null; onSaved: (jobId: string) => void };

/** New job, or edit one: what, who for, where, instructions, start date, who's on it, before photos. */
export function JobEditScreen({ jobId, onSaved }: Props) {
  const isNew = !jobId;
  const record = useJobRecord(jobId ?? '');
  const people = usePeople();
  const { save } = useJobMutations();
  const photos = usePickPhotos();
  const [form, setForm] = useState<JobForm>(emptyJobForm);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState<CustomerInput | null>(null);
  const [tried, setTried] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  useEffect(() => {
    const r = record.data;
    if (isNew || loaded || !r) return;
    setForm({ summary: r.summary ?? '', siteAddress: r.site_address ?? '', instructions: r.instructions ?? '', startOn: r.start_on ?? '', peopleIds: r.people.map((p) => p.id) });
    if (r.customer_id) setCustomer({ id: r.customer_id, name: r.customer_name ?? '', phone: r.customer_phone, email: null, address: r.customer_address, notes: null });
    setLoaded(true);
  }, [record.data, isNew, loaded]);

  if (!isNew && !loaded) return <Screen>{record.isLoading ? <Loading /> : <ErrorText error={record.error ?? 'This job could not be found.'} />}</Screen>;

  const set = <K extends keyof JobForm>(k: K, v: JobForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const togglePerson = (id: string) => set('peopleIds', form.peopleIds.includes(id) ? form.peopleIds.filter((x) => x !== id) : [...form.peopleIds, id]);
  const problems = [...jobFormProblems(form, !!customer || !!newCustomer), ...(newCustomer ? customerProblems(newCustomer) : [])];

  const submit = () => {
    setTried(true);
    if (problems.length) return;
    const nc = newCustomer ? customerValues(newCustomer) : null;
    save.mutate({
      job: {
        id: jobId, summary: form.summary.trim(), siteAddress: form.siteAddress.trim(), instructions: form.instructions.trim(),
        startOn: form.startOn.trim() || null, customerId: customer?.id ?? null,
        newCustomer: nc ? { name: nc.name, phone: nc.phone, email: nc.email, address: nc.address } : null, peopleIds: form.peopleIds,
      },
      beforePhotos: photos.photos,
    }, { onSuccess: (id) => { photos.clear(); onSaved(id); } });
  };

  return (
    <Screen>
      <Card>
        <TextField label="What's the job?" value={form.summary} onChange={(v) => set('summary', v)} placeholder="e.g. Bathroom refit, leaking tap, repaint hall" autoCapitalize="sentences" />
      </Card>
      <Card>
        <Heading>Customer</Heading>
        <CustomerPicker selected={customer} onSelect={setCustomer} newCustomer={newCustomer} onNewCustomer={setNewCustomer} />
      </Card>
      <Card>
        <TextField label="Site address" value={form.siteAddress} onChange={(v) => set('siteAddress', v)} hint="Leave blank to use the customer's address" />
        <TextField label="Instructions for the team" value={form.instructions} onChange={(v) => set('instructions', v)} multiline placeholder="Access, key safe, what to do, what to watch out for" />
        <TextField label="Start date" value={form.startOn} onChange={(v) => set('startOn', v)} placeholder="2026-10-22" hint="Optional" keyboardType="numbers-and-punctuation" />
      </Card>
      <Card>
        <Heading>Who's on it</Heading>
        {people.isLoading ? <Loading /> : null}
        <ErrorText error={people.error} />
        <View style={styles.wrap}>
          {(people.data ?? []).map((p) => <Chip key={p.id} label={firstName(p.fullName)} selected={form.peopleIds.includes(p.id)} onPress={() => togglePerson(p.id)} />)}
        </View>
        <Muted>Only the people picked here (and managers) can see this job.</Muted>
      </Card>
      <Card>
        <Heading>{isNew ? 'Before photos' : 'Add before photos'}</Heading>
        <PickedPhotos {...photos} />
      </Card>
      {tried && problems.length ? <ErrorText error={problems.join('\n')} /> : null}
      <ErrorText error={save.error} />
      <Button title={isNew ? 'Create job' : 'Save changes'} busy={save.isPending} onPress={submit} />
    </Screen>
  );
}
