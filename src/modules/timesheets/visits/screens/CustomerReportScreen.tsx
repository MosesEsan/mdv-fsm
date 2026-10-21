import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openStoredFile } from '@/core/files/storage';
import { formatDay } from '@/core/dates';
import { Button, Card, Chip, Notice, Screen, colors, styles } from '@/core/ui';
import { AppBar, EmptyBox, LoadFailed, LoadingCards, SectionLabel } from '@/core/ui/kit';
import { formatQuantity, materialTotals } from '../../schemas/visit';
import { useCustomerExport, useCustomerReport, useVisitCustomers } from '../api';
import { hoursLabel, monthLabel, shiftMonth } from '../rules';
import { useVisitContext } from '../useVisitContext';

type Props = { initialCustomer?: string; initialMonth?: string; onOpen: (id: string) => void };

/**
 * Flows board "MDC: Monthly report for invoicing" (web first). One line per visit, totals per person
 * and materials. PDF and CSV come from the server; Print opens the same PDF to print from.
 */
export function CustomerReportScreen({ initialCustomer, initialMonth, onOpen }: Props) {
  const c = useVisitContext();
  const customers = useVisitCustomers();
  const [customer, setCustomer] = useState<string | undefined>(initialCustomer);
  const [month, setMonth] = useState(initialMonth ?? c.today.slice(0, 7));
  const chosen = customer ?? customers.data?.[0]?.id;
  const report = useCustomerReport(chosen, month);
  const run = useCustomerExport();
  const [note, setNote] = useState<string | null>(null);

  const lines = report.data ?? [];
  const total = lines.reduce((s, l) => s + l.duration_minutes, 0);
  const perPerson = [...new Map(lines.map((l) => [l.worker_id, l.worker_name])).entries()].map(([id, name]) => ({
    name, visits: lines.filter((l) => l.worker_id === id).length, minutes: lines.filter((l) => l.worker_id === id).reduce((s, l) => s + l.duration_minutes, 0),
  }));
  const mats = materialTotals(lines.flatMap((l) => l.materials.map((m) => ({ ...m, quantity: Number(m.quantity) }))));
  const customerName = customers.data?.find((x) => x.id === chosen)?.name ?? '';

  async function download(format: 'pdf' | 'csv', print = false) {
    if (!chosen) return;
    setNote(null);
    const r = await run.mutateAsync({ customerId: chosen, month, format }).catch(() => null);
    if (!r) return;
    if (r.empty) { setNote(r.message); return; }
    await openStoredFile(r.path, print ? undefined : r.fileName);
    if (print) setNote(Platform.OS === 'web' ? 'The report opened in a new tab. Use Print there.' : 'The report opened. Use Share or Print there.');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title="Monthly report" sub={customerName ? `${customerName} · ${monthLabel(month)}` : monthLabel(month)} />
      <Screen>
        {customers.isLoading ? <LoadingCards n={1} /> : null}
        {customers.data?.length === 0 ? <EmptyBox icon="business-outline" title="No customers yet" text="Customers are added when the first visit for them is logged." /> : null}
        <View style={styles.wrap}>
          {(customers.data ?? []).map((x) => <Chip key={x.id} label={x.name} selected={chosen === x.id} onPress={() => setCustomer(x.id)} />)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(shiftMonth(month, -1))} style={{ padding: 10 }}><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{monthLabel(month)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(shiftMonth(month, 1))} style={{ padding: 10 }}><Ionicons name="chevron-forward" size={22} color={colors.text} /></Pressable>
        </View>

        {report.isLoading ? <LoadingCards /> : null}
        {report.error ? <LoadFailed what="the report" onRetry={() => void report.refetch()} /> : null}
        {report.data && lines.length === 0 ? <EmptyBox icon="document-text-outline" title={`No visits in ${monthLabel(month)}`} text="Pick another month or customer." /> : null}
        {lines.length ? (
          <>
            <View style={styles.wrap}>
              <Button title="Download PDF" icon="document-outline" size="sm" busy={run.isPending} onPress={() => void download('pdf')} />
              <Button title="Download CSV" icon="grid-outline" size="sm" variant="secondary" onPress={() => void download('csv')} />
              <Button title="Print" icon="print-outline" size="sm" variant="secondary" onPress={() => void download('pdf', true)} />
            </View>
            {note ? <Notice tone="info" title={note} /> : null}
            {run.error ? <Notice tone="bad" title="The download didn’t work">{String((run.error as Error).message ?? '')}</Notice> : null}

            {lines.map((l) => (
              <Pressable key={l.entry_id} accessibilityRole="button" onPress={() => onOpen(l.entry_id)}
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{`${formatDay(l.work_date)} · ${l.worker_name}`}</Text>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{hoursLabel(l.duration_minutes)}</Text>
                </View>
                <Text style={styles.muted}>{`${l.start_local ?? ''}–${l.finish_local ?? ''}`}</Text>
                <Text style={{ color: colors.text }}>{l.notes}</Text>
                {l.materials.map((m, i) => <Text key={i} style={styles.muted}>{`${m.item} × ${formatQuantity(Number(m.quantity), m.unit)}`}</Text>)}
                {l.corrected_by_name ? <Text style={{ color: colors.warning, fontWeight: '600' }}>{`Corrected by ${l.corrected_by_name}`}</Text> : null}
              </Pressable>
            ))}

            <Card>
              <SectionLabel>Totals</SectionLabel>
              <Row label={`Total hours (${lines.length} visit${lines.length === 1 ? '' : 's'})`} value={hoursLabel(total)} bold />
              {perPerson.map((p) => <Row key={p.name} label={`${p.name} · ${p.visits} visit${p.visits === 1 ? '' : 's'}`} value={hoursLabel(p.minutes)} />)}
              {mats.length ? <><SectionLabel>Materials used</SectionLabel>{mats.map((m) => <Row key={`${m.item}|${m.unit}`} label={m.item} value={formatQuantity(m.quantity, m.unit)} />)}</> : null}
            </Card>
          </>
        ) : null}
      </Screen>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: colors.text, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: bold ? '700' : '600' }}>{value}</Text>
    </View>
  );
}
