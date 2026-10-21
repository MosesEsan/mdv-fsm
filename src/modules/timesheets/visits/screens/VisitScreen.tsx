import { useState } from 'react';
import { Text, View } from 'react-native';
import { formatDay } from '@/core/dates';
import { Button, Card, Notice, Screen, colors, styles } from '@/core/ui';
import { AppBar, LoadFailed, LoadingCards, Pill, SectionLabel, Sheet } from '@/core/ui/kit';
import { formatQuantity } from '../../schemas/visit';
import { useDeleteVisit, useVisit, useVisitCustomers, useVisitPeople } from '../api';
import { hoursLabel } from '../rules';
import { useVisitContext } from '../useVisitContext';

type Props = { id: string; onBack: () => void; onEdit: () => void; onDeleted: () => void; onReport: (customerId: string, month: string) => void };

/** Flows board "MDC: A visit": details, materials, who logged it, "Corrected by". Edit own; owner corrects; accounts read only. */
export function VisitScreen({ id, onBack, onEdit, onDeleted, onReport }: Props) {
  const c = useVisitContext();
  const visit = useVisit(id);
  const customers = useVisitCustomers();
  const people = useVisitPeople();
  const del = useDeleteVisit();
  const [confirm, setConfirm] = useState(false);
  const v = visit.data;
  const nameOf = (list: { id: string; name: string }[] | undefined, x: string | null) => list?.find((p) => p.id === x)?.name ?? '';
  const own = v?.worker_id === c.userId;
  const canEdit = !c.isViewer && (own || c.isManager);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title={v ? nameOf(customers.data, v.customer_id) || 'Visit' : 'Visit'} sub={v ? formatDay(v.work_date) : null} onBack={onBack} />
      <Screen>
        {visit.isLoading ? <LoadingCards n={2} /> : null}
        {visit.error ? <LoadFailed what="this visit" onRetry={() => void visit.refetch()} /> : null}
        {visit.data === null ? <Notice tone="warn" title="This visit has been deleted, or you can’t see it." /> : null}
        {v ? (
          <>
            {v.corrected_by ? <Pill label={`Corrected by ${nameOf(people.data, v.corrected_by) || 'the owner'}`} tone="amber" icon="create-outline" /> : null}
            <Card>
              <Text style={styles.muted}>{`${c.timeOf(v.started_at)}–${c.timeOf(v.ended_at)}`}</Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>{hoursLabel(v.duration_minutes)}</Text>
              <Text style={styles.muted}>{`Logged by ${nameOf(people.data, v.worker_id) || 'someone'}`}</Text>
            </Card>
            <SectionLabel>Work done</SectionLabel>
            <Text style={{ fontSize: 16, color: colors.text }}>{v.notes}</Text>
            {v.materials.length ? (
              <>
                <SectionLabel>Materials used</SectionLabel>
                {v.materials.map((m, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 16, color: colors.text }}>{m.item}</Text>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: '600' }}>{formatQuantity(m.quantity, m.unit)}</Text>
                  </View>
                ))}
              </>
            ) : null}
            {canEdit ? <Button title={own ? 'Edit' : 'Correct'} icon="create-outline" onPress={onEdit} /> : null}
            {(c.isManager || c.isViewer) && v.customer_id ? (
              <Button title="Open the month report" variant="secondary" icon="document-text-outline" onPress={() => onReport(v.customer_id!, v.work_date.slice(0, 7))} />
            ) : null}
            {canEdit ? <Button title="Delete visit" variant="secondary" icon="trash-outline" onPress={() => setConfirm(true)} /> : null}
          </>
        ) : null}
      </Screen>
      <Sheet visible={confirm} title="Delete this visit?" onClose={() => setConfirm(false)}>
        <Text style={{ fontSize: 16, color: colors.text }}>It comes out of the hours and the monthly report. This can’t be undone.</Text>
        {del.error ? <Notice tone="bad" title="Couldn’t delete it">{String((del.error as Error).message ?? '')}</Notice> : null}
        <Button title="Delete visit" variant="danger" busy={del.isPending} onPress={() => del.mutate(id, { onSuccess: () => { setConfirm(false); onDeleted(); } })} />
        <Button title="Keep it" variant="secondary" onPress={() => setConfirm(false)} />
      </Sheet>
    </View>
  );
}
