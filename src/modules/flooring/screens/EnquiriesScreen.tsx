import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatDay, localDate, localTime } from '@/core/dates';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { Button, Chip, ErrorText, Heading, Loading, Muted, Screen, styles } from '@/core/ui';
import { useEnquiries } from '../enquiryHooks';
import { groupByStage, sourceLabel } from '../enquiryRules';

/** All enquiries, grouped by where they have got to. */
export function EnquiriesScreen({ onOpen, onNew }: { onOpen: (jobId: string) => void; onNew: () => void }) {
  const tz = useTenantSettings().timezone ?? 'Europe/Dublin';
  const [scope, setScope] = useState<'open' | 'all'>('open');
  const q = useEnquiries(scope);
  const when = (iso: string) => `${formatDay(localDate(new Date(iso), tz))} ${localTime(new Date(iso), tz)}`;

  return (
    <Screen>
      <Button title="New enquiry" onPress={onNew} />
      <View style={styles.wrap}>
        <Chip label="Open" selected={scope === 'open'} onPress={() => setScope('open')} />
        <Chip label="All, including not going ahead" selected={scope === 'all'} onPress={() => setScope('all')} />
      </View>
      {q.isLoading ? <Loading /> : null}
      <ErrorText error={q.error} />
      {q.data?.length === 0 ? <Muted>No enquiries yet.</Muted> : null}
      {groupByStage(q.data ?? []).map((g) => (
        <View key={g.stage} style={{ gap: 8 }}>
          <Heading>{`${g.label} (${g.items.length})`}</Heading>
          {g.items.map((e) => (
            <Pressable key={e.enquiry_id} accessibilityRole="button" onPress={() => onOpen(e.job_id)} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}>
              <Text style={styles.label}>{`${e.customer_name ?? 'Customer'} · ${e.job_summary ?? ''}`}</Text>
              <Text style={styles.muted}>{[e.customer_phone, e.site_address].filter(Boolean).join(' · ')}</Text>
              <Text style={styles.muted}>
                {[
                  `${sourceLabel(e.source)}, ${formatDay(localDate(new Date(e.received_at), tz))}`,
                  e.viewed_at ? `Viewing ${when(e.viewed_at)}` : null,
                  e.next_booking_at ? `Work ${when(e.next_booking_at)}` : null,
                ].filter(Boolean).join(' · ')}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </Screen>
  );
}
