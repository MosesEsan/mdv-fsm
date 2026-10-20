import { Text } from 'react-native';
import { useJobFiles } from '@/core/jobFiles';
import { firstName, useJobContext, whenLabel } from '@/core/jobRecords';
import { PhotoStrip } from '@/core/jobRecords/components/PhotoStrip';
import { Button, Card, ErrorText, Heading, Loading, Muted, Screen, colors } from '@/core/ui';
import { useExtraEntry, useExtraMutations } from '../hooks';
import { extraDetailLine } from '../rules';

type Props = { entryId: string; onOpenJob: (jobId: string) => void; onDeleted: () => void };

/** One extra: what, why, hours, materials, photos. The office ticks it off once it's on an invoice. */
export function ExtraWorkEntryScreen({ entryId, onOpenJob, onDeleted }: Props) {
  const { tz, today, userId, isManager } = useJobContext();
  const entry = useExtraEntry(entryId);
  const e = entry.data;
  const files = useJobFiles(e?.jobId ?? '');
  const { invoiced, remove } = useExtraMutations();
  if (!e) return <Screen>{entry.isLoading ? <Loading /> : <ErrorText error={entry.error ?? 'This extra could not be found.'} />}</Screen>;

  const photos = (files.data ?? []).filter((f) => e.fileIds.includes(f.id));
  const canDelete = !e.invoicedAt && (isManager || e.loggedBy === userId);
  return (
    <Screen>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{e.what}</Text>
        <Muted>{`${firstName(e.loggedByName)}, ${whenLabel(e.createdAt, tz, today)}`}</Muted>
        {extraDetailLine(e) ? <Text style={{ color: colors.text }}>{extraDetailLine(e)}</Text> : null}
        {e.why ? <><Heading>Why</Heading><Text style={{ color: colors.text }}>{e.why}</Text></> : null}
        <Button title={e.jobSummary ? `Open job: ${e.jobSummary}` : 'Open job'} variant="secondary" onPress={() => onOpenJob(e.jobId)} />
      </Card>
      {photos.length ? <Card><Heading>Photos</Heading><PhotoStrip photos={photos.map((p) => ({ id: p.id, thumbUrl: p.thumbUrl, url: p.url }))} /></Card> : null}
      {isManager ? (
        <Card>
          <Heading>Invoice</Heading>
          <Muted>{e.invoicedAt ? `Added to invoice ${whenLabel(e.invoicedAt, tz, today)}.` : 'Not on an invoice yet. Tick it off once you have added it in your invoicing software.'}</Muted>
          <Button title={e.invoicedAt ? 'Undo: not invoiced' : 'Added to invoice'} variant={e.invoicedAt ? 'secondary' : 'primary'}
            busy={invoiced.isPending} onPress={() => invoiced.mutate({ id: e.id, invoiced: !e.invoicedAt })} />
          <ErrorText error={invoiced.error} />
        </Card>
      ) : null}
      {canDelete ? <Button title="Delete this extra" variant="danger" busy={remove.isPending} onPress={() => remove.mutate(e.id, { onSuccess: onDeleted })} /> : null}
      <ErrorText error={remove.error} />
    </Screen>
  );
}
