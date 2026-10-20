import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { CustomerFields, toInput, customerProblems, customerValues, useCustomer, useCustomerMutations, type CustomerInput } from '@/core/customers';
import { formatDay, isValidTime, localDate, localTime, zonedInstant } from '@/core/dates';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { Button, Card, ErrorText, Heading, Loading, Muted, Screen, TextField, styles } from '@/core/ui';
import { useEnquiry, useEnquiryMutations } from '../enquiryHooks';
import { sourceLabel, stageLabel } from '../enquiryRules';

type Props = { jobId: string; onOpenViewing: () => void; onBookWork: () => void };

/** One enquiry: the customer, what they want, the viewing time, and what to do next. */
export function EnquiryScreen({ jobId, onOpenViewing, onBookWork }: Props) {
  const tz = useTenantSettings().timezone ?? 'Europe/Dublin';
  const q = useEnquiry(jobId);
  const e = q.data;
  const m = useEnquiryMutations(jobId);
  const customer = useCustomer(e?.customer_id);
  const { update: updateCustomer } = useCustomerMutations();
  const [editCustomer, setEditCustomer] = useState<CustomerInput | null>(null);
  const [viewing, setViewing] = useState({ date: '', time: '' });
  const [lostReason, setLostReason] = useState<string | null>(null);

  useEffect(() => {
    if (e) {
      const at = e.viewed_at ? new Date(e.viewed_at) : null;
      setViewing({ date: at ? localDate(at, tz) : '', time: at ? localTime(at, tz) : '' });
    }
  }, [e?.viewed_at, tz]); // eslint-disable-line react-hooks/exhaustive-deps

  if (q.isLoading) return <Loading />;
  if (!e) return <Screen><ErrorText error={q.error ?? 'Enquiry not found'} /></Screen>;

  const viewingOk = viewing.date === '' || (/^\d{4}-\d{2}-\d{2}$/.test(viewing.date) && (viewing.time === '' || isValidTime(viewing.time)));
  const c = customer.data;

  return (
    <Screen>
      <Card>
        <Heading>{e.job_summary ?? 'Enquiry'}</Heading>
        <Text style={styles.label}>{stageLabel(e.stage)}</Text>
        <Muted>{`${sourceLabel(e.source)}, received ${formatDay(localDate(new Date(e.received_at), tz))}`}</Muted>
        {e.site_address ? <Text>{e.site_address}</Text> : null}
        {e.details ? <Text>{e.details}</Text> : null}
        {e.lost_reason ? <Muted>{`Not going ahead: ${e.lost_reason}`}</Muted> : null}
      </Card>

      <Card>
        <Heading>Customer</Heading>
        {editCustomer ? (
          <View style={{ gap: 8 }}>
            <CustomerFields value={editCustomer} onChange={setEditCustomer} />
            {customerProblems(editCustomer).map((p) => <Muted key={p}>{p}</Muted>)}
            <ErrorText error={updateCustomer.error} />
            <Button title="Save customer" busy={updateCustomer.isPending} disabled={customerProblems(editCustomer).length > 0 || !c}
              onPress={() => c && updateCustomer.mutate({ id: c.id, values: customerValues(editCustomer) }, { onSuccess: () => setEditCustomer(null) })} />
            <Button title="Cancel" variant="secondary" onPress={() => setEditCustomer(null)} />
          </View>
        ) : c ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>{c.name}</Text>
            {c.address ? <Text style={styles.muted}>{c.address}</Text> : null}
            {c.notes ? <Text style={styles.muted}>{c.notes}</Text> : null}
            <View style={[styles.row, { flexWrap: 'wrap' }]}>
              {c.phone ? <Button title={`Call ${c.phone}`} variant="secondary" onPress={() => Linking.openURL(`tel:${c.phone!.replace(/\s/g, '')}`)} /> : null}
              {c.email ? <Button title="Email" variant="secondary" onPress={() => Linking.openURL(`mailto:${c.email}`)} /> : null}
              <Button title="Edit" variant="secondary" onPress={() => setEditCustomer(toInput(c))} />
            </View>
          </View>
        ) : <Loading />}
      </Card>

      <Card>
        <Heading>Viewing</Heading>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><TextField label="Date" value={viewing.date} onChange={(d) => setViewing((v) => ({ ...v, date: d }))} placeholder="2026-11-04" /></View>
          <View style={{ flex: 1 }}><TextField label="Time" value={viewing.time} onChange={(t) => setViewing((v) => ({ ...v, time: t }))} placeholder="10:00" keyboardType="numbers-and-punctuation" /></View>
        </View>
        {!viewingOk ? <Muted>Enter the date like 2026-11-04 and the time like 10:00.</Muted> : null}
        <ErrorText error={m.viewingTime.error} />
        <Button title="Save viewing time" variant="secondary" disabled={!viewingOk} busy={m.viewingTime.isPending}
          onPress={() => m.viewingTime.mutate(viewing.date ? zonedInstant(viewing.date, viewing.time || '10:00', tz) : null)} />
        <Button title={e.room_count > 0 ? `Open viewing (${e.room_count} room${e.room_count === 1 ? '' : 's'})` : 'Start the viewing'} onPress={onOpenViewing} />
      </Card>

      <Card>
        <Heading>Next</Heading>
        {e.next_booking_at ? <Muted>{`Work booked for ${formatDay(localDate(new Date(e.next_booking_at), tz))} at ${localTime(new Date(e.next_booking_at), tz)}`}</Muted> : null}
        {e.status === 'open' ? <Button title="Book the work" onPress={onBookWork} /> : null}
        <ErrorText error={m.outcome.error} />
        {e.status === 'lost' ? (
          <Button title="Reopen this enquiry" variant="secondary" busy={m.outcome.isPending} onPress={() => m.outcome.mutate({ lost: false, reason: null })} />
        ) : lostReason === null ? (
          <Button title="Not going ahead" variant="secondary" onPress={() => setLostReason('')} />
        ) : (
          <View style={{ gap: 8 }}>
            <TextField label="Why not? (optional)" value={lostReason} onChange={setLostReason} placeholder="e.g. Price, went elsewhere, postponed" />
            <Button title="Mark as not going ahead" variant="danger" busy={m.outcome.isPending}
              onPress={() => m.outcome.mutate({ lost: true, reason: lostReason.trim() || null }, { onSuccess: () => setLostReason(null) })} />
            <Button title="Cancel" variant="secondary" onPress={() => setLostReason(null)} />
          </View>
        )}
      </Card>
    </Screen>
  );
}
