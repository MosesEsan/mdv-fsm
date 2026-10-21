import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useJobFiles } from '@/core/jobFiles';
import { firstName, photoLabel, useJobContext, whenLabel } from '@/core/jobRecords';
import { Button, Card, ErrorText, Notice, Screen, colors, styles } from '@/core/ui';
import { AppBar, LoadFailed, LoadingCards, Pill, PhotoGrid, PhotoViewer, SectionLabel } from '@/core/ui/kit';
import { useExtraEntry, useExtraMutations } from '../hooks';

type Props = { entryId: string; onOpenJob: (jobId: string) => void; onDeleted: () => void };

/** One extra (flows board: Tick it off). The owner or manager ticks it once it's on the invoice. */
export function ExtraWorkEntryScreen({ entryId, onOpenJob, onDeleted }: Props) {
  const router = useRouter();
  const { tz, today, userId, isManager } = useJobContext();
  const entry = useExtraEntry(entryId);
  const e = entry.data;
  const files = useJobFiles(e?.jobId ?? '');
  const { invoiced, remove } = useExtraMutations();
  const [viewer, setViewer] = useState<number | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/extra-work'));
  if (!e) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppBar title="Extra work" onBack={back} />
        <Screen>{entry.isLoading ? <LoadingCards n={2} /> : <LoadFailed what="this extra work" onRetry={() => void entry.refetch()} />}</Screen>
      </View>
    );
  }
  const photos = (files.data ?? []).filter((f) => e.fileIds.includes(f.id));
  const canDelete = !e.invoicedAt && (isManager || e.loggedBy === userId);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title="Extra work" sub={[e.jobSummary, e.customerName].filter(Boolean).join(' · ')} onBack={back} />
      <Screen>
        <Card>
          {e.invoicedAt ? <Pill label="Added to invoice" tone="green" icon="checkmark" /> : <Pill label="Not on an invoice yet" tone="red" icon="flag" />}
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{e.what}</Text>
          {e.why ? <Text style={{ fontSize: 15, color: colors.text }}>{e.why}</Text> : null}
          <Text style={{ fontSize: 13, color: colors.muted }}>{`Logged by ${firstName(e.loggedByName)} · ${whenLabel(e.createdAt, tz, today)}`}</Text>
        </Card>
        <View style={styles.row}>
          <Stat label="Roughly how long" value={e.hours != null ? `${e.hours} h` : '–'} />
          <Stat label="Materials" value={e.materials || '–'} small />
        </View>
        {photos.length ? (
          <Card>
            <SectionLabel>Photos</SectionLabel>
            <PhotoGrid photos={photos.map((f) => ({ id: f.id, thumbUrl: f.thumbUrl, label: f.caption }))} onOpen={setViewer} />
          </Card>
        ) : null}
        {isManager ? (
          e.invoicedAt ? (
            <>
              <Notice tone="ok" title={`Added to invoice ${whenLabel(e.invoicedAt, tz, today)}.`} />
              <Button title="Undo" variant="secondary" busy={invoiced.isPending} onPress={() => invoiced.mutate({ id: e.id, invoiced: false })} />
            </>
          ) : (
            <>
              <Button title="Add to invoice" icon="checkmark" variant="ok" size="lg" busy={invoiced.isPending} onPress={() => invoiced.mutate({ id: e.id, invoiced: true })} />
              <Text style={[styles.hint, { textAlign: 'center' }]}>Tick this once it’s on the customer’s invoice in your invoicing software.</Text>
            </>
          )
        ) : <Text style={styles.hint}>The office ticks this off once it’s on the invoice.</Text>}
        <ErrorText error={invoiced.error} />
        <Button title="Open the job" variant="secondary" onPress={() => onOpenJob(e.jobId)} />
        {canDelete ? <Button title="Delete this extra" variant="danger" busy={remove.isPending} onPress={() => remove.mutate(e.id, { onSuccess: onDeleted })} /> : null}
        <ErrorText error={remove.error} />
      </Screen>
      <PhotoViewer photos={photos.map((f) => ({ url: f.url, label: photoLabel(f.caption, f.stage, e.loggedByName) }))} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} />
    </View>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 }}>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: small ? 14 : 20, fontWeight: '700', color: colors.text }}>{value}</Text>
    </View>
  );
}
