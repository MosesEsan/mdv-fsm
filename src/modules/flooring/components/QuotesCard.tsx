import { Pressable, Text } from 'react-native';
import { Button, Card, Heading, Muted, styles } from '@/core/ui';
import { QUOTE_STATUS, euro } from '../quoteRules';
import { useIsOwner, useJobQuotes } from '../quoteHooks';

/** On the enquiry: the job's quotes and a "Start a quote" button. Renders nothing for anyone but the owner. */
export function QuotesCard({ jobId, onOpen }: { jobId: string; onOpen: (quoteId: string | null) => void }) {
  const owner = useIsOwner();
  const q = useJobQuotes(jobId);
  if (!owner) return null;
  return (
    <Card>
      <Heading>Quotes</Heading>
      {q.data?.length === 0 ? <Muted>No quote yet.</Muted> : null}
      {(q.data ?? []).map((x) => (
        <Pressable key={x.id} accessibilityRole="button" onPress={() => onOpen(x.id)} style={{ paddingVertical: 8, borderTopWidth: 1, borderColor: '#d1d9e0' }}>
          <Text style={styles.label}>{`Quote ${x.number} · ${QUOTE_STATUS[x.status]} · ${euro(x.total)}`}</Text>
          <Text style={styles.muted}>{`${x.line_count} line${x.line_count === 1 ? '' : 's'}${x.valid_until ? ` · valid until ${x.valid_until}` : ''}`}</Text>
        </Pressable>
      ))}
      <Button title="Start a quote" variant="secondary" onPress={() => onOpen(null)} />
    </Card>
  );
}
