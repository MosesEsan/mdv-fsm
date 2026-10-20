import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { firstName, useJobContext, whenLabel } from '@/core/jobRecords';
import { Card, Chip, ErrorText, Loading, Muted, Screen, styles } from '@/core/ui';
import { useExtraEntries, useExtraWorkLive } from '../hooks';
import { extraDetailLine } from '../rules';

/** For the office: every extra logged on site, waiting to go on an invoice (or all of them). */
export function ExtraWorkListScreen({ onOpen }: { onOpen: (entryId: string) => void }) {
  useExtraWorkLive();
  const { tz, today } = useJobContext();
  const [scope, setScope] = useState<'open' | 'all'>('open');
  const entries = useExtraEntries(scope);
  const list = entries.data ?? [];
  return (
    <Screen>
      <View style={styles.wrap}>
        <Chip label="To invoice" selected={scope === 'open'} onPress={() => setScope('open')} />
        <Chip label="All" selected={scope === 'all'} onPress={() => setScope('all')} />
      </View>
      {entries.isLoading ? <Loading /> : null}
      <ErrorText error={entries.error} />
      {!entries.isLoading && list.length === 0 ? <Muted>{scope === 'open' ? 'Nothing waiting to be invoiced.' : 'No extra work logged yet.'}</Muted> : null}
      {list.map((e) => (
        <Pressable key={e.id} accessibilityRole="button" onPress={() => onOpen(e.id)}>
          <Card>
            <Text style={styles.label}>{e.what}</Text>
            <Muted>{e.jobSummary ?? 'Job'}</Muted>
            <Muted>{[extraDetailLine(e), `${firstName(e.loggedByName)}, ${whenLabel(e.createdAt, tz, today)}`, e.invoicedAt ? 'Added to invoice' : null].filter(Boolean).join(' · ')}</Muted>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
