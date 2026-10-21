import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDay } from '@/core/dates';
import { TabBar } from '@/core/modules/TabBar';
import { Chip, Screen, colors, styles } from '@/core/ui';
import { AppBar, EmptyBox, ListRow, LoadFailed, LoadingCards, Pill } from '@/core/ui/kit';
import { useVisitCustomers, useVisitPeople, useVisits } from '../api';
import { hoursLabel, monthBounds, monthLabel, shiftMonth } from '../rules';
import { useVisitContext } from '../useVisitContext';

type Props = { onOpen: (id: string) => void };

/** Flows board "MDC: All entries" (owner and accounts: filter by person and customer) / "My entries" (apprentice). */
export function VisitEntriesScreen({ onOpen }: Props) {
  const c = useVisitContext();
  const [month, setMonth] = useState(c.today.slice(0, 7));
  const [person, setPerson] = useState<string | null>(null);
  const [customer, setCustomer] = useState<string | null>(null);
  const { from, to } = monthBounds(month);
  const visits = useVisits(from, to);
  const customers = useVisitCustomers();
  const people = useVisitPeople();
  const seesAll = c.isManager || c.isViewer;
  const nameOf = (list: { id: string; name: string }[] | undefined, id: string | null) => list?.find((x) => x.id === id)?.name ?? '';

  const rows = (visits.data ?? []).filter((v) => (!person || v.worker_id === person) && (!customer || v.customer_id === customer));
  const total = rows.reduce((s, v) => s + v.duration_minutes, 0);
  const workers = [...new Set((visits.data ?? []).map((v) => v.worker_id))];
  const custs = [...new Set((visits.data ?? []).map((v) => v.customer_id).filter(Boolean))] as string[];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title={seesAll ? 'All entries' : 'My entries'} sub={`${monthLabel(month)} · ${hoursLabel(total)}`} />
      <Screen>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(shiftMonth(month, -1))} style={{ padding: 10 }}><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{monthLabel(month)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={month >= c.today.slice(0, 7)} onPress={() => setMonth(shiftMonth(month, 1))} style={{ padding: 10, opacity: month >= c.today.slice(0, 7) ? 0.3 : 1 }}><Ionicons name="chevron-forward" size={22} color={colors.text} /></Pressable>
        </View>
        {seesAll && workers.length > 1 ? (
          <View style={styles.wrap}>
            <Chip label="Everyone" selected={!person} onPress={() => setPerson(null)} />
            {workers.map((w) => <Chip key={w} label={nameOf(people.data, w) || 'Someone'} selected={person === w} onPress={() => setPerson(w)} />)}
          </View>
        ) : null}
        {custs.length > 1 ? (
          <View style={styles.wrap}>
            <Chip label="All customers" selected={!customer} onPress={() => setCustomer(null)} />
            {custs.map((x) => <Chip key={x} label={nameOf(customers.data, x) || 'Customer'} selected={customer === x} onPress={() => setCustomer(x)} />)}
          </View>
        ) : null}
        {visits.isLoading ? <LoadingCards /> : null}
        {visits.error && !visits.data ? <LoadFailed what="the entries" onRetry={() => void visits.refetch()} /> : null}
        {visits.data && rows.length === 0 ? <EmptyBox icon="list-outline" title={`No visits in ${monthLabel(month)}`} text="Logged visits show here, newest first." /> : null}
        {rows.map((v) => (
          <ListRow key={v.id} title={nameOf(customers.data, v.customer_id) || 'Customer'} onPress={() => onOpen(v.id)}
            lines={[`${formatDay(v.work_date)} · ${c.timeOf(v.started_at)}–${c.timeOf(v.ended_at)} · ${hoursLabel(v.duration_minutes)}${seesAll ? ` · ${nameOf(people.data, v.worker_id)}` : ''}`, v.notes]}>
            {v.corrected_by ? <Pill label="Corrected" tone="amber" icon="create-outline" /> : null}
          </ListRow>
        ))}
      </Screen>
      <TabBar />
    </View>
  );
}
