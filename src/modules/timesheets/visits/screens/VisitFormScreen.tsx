import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { addDays, localTime } from '@/core/dates';
import { Button, Chip, Notice, Screen, TextField, colors, styles } from '@/core/ui';
import { AppBar, LoadFailed, LoadingCards, SectionLabel } from '@/core/ui/kit';
import { MATERIAL_UNITS, UNIT_LABELS } from '../../schemas/visit';
import { useSaveVisit, useVisit, useVisitCustomers, useVisitPeople, useVisits } from '../api';
import { cleanMaterials, draftMinutes, hoursLabel, recentCustomers, rememberedUnit, visitProblems, type VisitDraft } from '../rules';
import { useVisitContext } from '../useVisitContext';

type Props = { id?: string; onBack: () => void; onSaved: (id: string) => void };

/** Flows board "MDC: Log a visit" and "Correct Jack's visit". New, edit own, or (owner) correct someone's. */
export function VisitFormScreen({ id, onBack, onSaved }: Props) {
  const c = useVisitContext();
  const existing = useVisit(id);
  const recent = useVisits(addDays(c.today, -60), c.today);
  const customers = useVisitCustomers();
  const people = useVisitPeople();
  const save = useSaveVisit(c.tenantId);

  const [d, setD] = useState<VisitDraft>(() => ({
    date: c.today, start: '', finish: localTime(new Date(), c.tz), customerId: null, newCustomer: '', workDone: '', materials: [],
  }));
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tried, setTried] = useState(false);
  const [loaded, setLoaded] = useState(!id);

  useEffect(() => {
    const v = existing.data;
    if (!id || loaded || !v) return;
    setD({
      date: v.work_date, start: c.timeOf(v.started_at), finish: c.timeOf(v.ended_at), customerId: v.customer_id, newCustomer: '',
      workDone: v.notes ?? '', materials: v.materials.map((m) => ({ item: m.item, quantity: String(m.quantity), unit: m.unit })),
    });
    setLoaded(true);
  }, [id, loaded, existing.data, c]);

  const pastMaterials = useMemo(() => (recent.data ?? []).flatMap((v) => v.materials), [recent.data]);
  const recentIds = recentCustomers(recent.data ?? []);
  const chipCustomers = showAll ? customers.data ?? [] : (customers.data ?? []).filter((x) => recentIds.includes(x.id) || x.id === d.customerId);
  const worker = existing.data?.worker_id;
  const correcting = Boolean(id && worker && worker !== c.userId);
  const workerName = people.data?.find((p) => p.id === worker)?.name ?? 'their';
  const minutes = draftMinutes(d.start, d.finish);
  const problems = visitProblems(d, c.today, c.instants);
  const set = (patch: Partial<VisitDraft>) => setD((x) => ({ ...x, ...patch }));
  const setMat = (i: number, patch: Partial<VisitDraft['materials'][number]>) =>
    set({ materials: d.materials.map((m, j) => (j === i ? { ...m, ...patch } : m)) });

  async function onSave() {
    setTried(true);
    if (problems.length) return;
    const { startedAt, endedAt } = c.instants(d.date, d.start, d.finish);
    const saved = await save.mutateAsync({
      id, workerId: worker,
      newCustomer: d.customerId ? undefined : d.newCustomer,
      visit: { customerId: d.customerId ?? undefined, startedAt, endedAt, workDone: d.workDone.trim(), materials: cleanMaterials(d.materials) },
    }).catch(() => null);
    if (saved) onSaved(saved);
  }

  const title = !id ? 'Log a visit' : correcting ? `Correct ${workerName}’s visit` : 'Edit visit';
  if (id && !loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppBar title={title} onBack={onBack} />
        <Screen>{existing.error ? <LoadFailed what="this visit" onRetry={() => void existing.refetch()} /> : <LoadingCards n={2} />}</Screen>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title={title} onBack={onBack} />
      <Screen>
        {correcting ? <Notice tone="info" title={`Your change will show as “Corrected by you” on ${workerName}’s visit.`} /> : null}

        <SectionLabel>Customer</SectionLabel>
        <View style={styles.wrap}>
          {chipCustomers.map((x) => (
            <Chip key={x.id} label={x.name} selected={d.customerId === x.id} onPress={() => { set({ customerId: x.id, newCustomer: '' }); setAddingCustomer(false); }} />
          ))}
          {!showAll && (customers.data?.length ?? 0) > chipCustomers.length ? <Chip label="All customers…" selected={false} onPress={() => setShowAll(true)} /> : null}
          <Chip label="New customer" selected={addingCustomer} onPress={() => { setAddingCustomer(true); set({ customerId: null }); }} />
        </View>
        {addingCustomer ? <TextField label="New customer’s name" value={d.newCustomer} onChange={(v) => set({ newCustomer: v })} placeholder="e.g. Harbourside Hotel" autoCapitalize="words" /> : null}

        <SectionLabel>When</SectionLabel>
        <View style={styles.wrap}>
          <Chip label="Today" selected={d.date === c.today} onPress={() => set({ date: c.today })} />
          <Chip label="Yesterday" selected={d.date === addDays(c.today, -1)} onPress={() => set({ date: addDays(c.today, -1) })} />
        </View>
        <TextField label="Date" value={d.date} onChange={(v) => set({ date: v })} hint="YYYY-MM-DD" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><TextField label="Start" value={d.start} onChange={(v) => set({ start: v })} placeholder="08:00" keyboardType="numbers-and-punctuation" /></View>
          <View style={{ flex: 1 }}><TextField label="Finish" value={d.finish} onChange={(v) => set({ finish: v })} placeholder="10:30" keyboardType="numbers-and-punctuation" /></View>
        </View>
        <Text style={styles.muted}>{minutes ? `Hours: ${hoursLabel(minutes)}` : 'Hours work out when both times are in.'}</Text>

        <TextField label="Work done" value={d.workDone} onChange={(v) => set({ workDone: v })} multiline placeholder="e.g. Replaced 4 downlights in reception" />

        {c.materialsOn ? (
          <>
            <SectionLabel>Materials used</SectionLabel>
            {d.materials.map((m, i) => (
              <View key={i} style={{ gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.surface }}>
                <TextField label="Item" value={m.item} onChange={(v) => setMat(i, { item: v, unit: rememberedUnit(v, pastMaterials) ?? m.unit })} />
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
                  <View style={{ flex: 1 }}><TextField label="Quantity" value={m.quantity} onChange={(v) => setMat(i, { quantity: v })} keyboardType="numbers-and-punctuation" /></View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {MATERIAL_UNITS.map((u) => <Chip key={u} label={UNIT_LABELS[u]} selected={m.unit === u} onPress={() => setMat(i, { unit: u })} />)}
                  </View>
                </View>
                <Pressable accessibilityRole="button" onPress={() => set({ materials: d.materials.filter((_, j) => j !== i) })}>
                  <Text style={{ color: colors.danger, fontWeight: '600' }}>Remove</Text>
                </Pressable>
              </View>
            ))}
            <Button title="Add material" icon="add" variant="secondary" onPress={() => set({ materials: [...d.materials, { item: '', quantity: '', unit: 'each' }] })} />
          </>
        ) : null}

        {tried && problems.length ? <Notice tone="bad" title="Check these before saving">{problems.map((p) => <Text key={p} style={{ color: colors.text }}>{`• ${p}`}</Text>)}</Notice> : null}
        {save.error ? <Notice tone="bad" title="Couldn’t save the visit">{String((save.error as Error).message ?? '')}</Notice> : null}
        <Button title={correcting ? 'Save correction' : 'Save visit'} size="lg" busy={save.isPending} onPress={() => void onSave()} />
      </Screen>
    </View>
  );
}
