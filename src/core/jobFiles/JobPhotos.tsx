import { useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import { Button, Card, ErrorText, Heading, Loading, Muted, styles } from '@/core/ui';
import { useAddPhotos, useJobFiles, usePendingUploads } from './hooks';

type Props = { jobId: string; kind?: string; title: string; canAdd?: boolean; addKind?: string };

/** Photo grid for a job (one kind, or all), with Take photo / Choose photos when allowed. */
export function JobPhotos({ jobId, kind, title, canAdd, addKind }: Props) {
  const files = useJobFiles(jobId, kind);
  const { pending, retry } = usePendingUploads(jobId);
  const photos = useAddPhotos(jobId, addKind ?? kind ?? 'site');
  const [open, setOpen] = useState<string | null>(null);
  const images = (files.data ?? []).filter((f) => f.thumbUrl);
  const failing = pending.some((p) => p.attempts > 0);

  return (
    <Card>
      <Heading>{title}</Heading>
      {files.isLoading ? <Loading /> : null}
      <ErrorText error={files.error ?? photos.error} />
      <View style={styles.wrap}>
        {images.map((f) => (
          <Pressable key={f.id} accessibilityRole="imagebutton" accessibilityLabel={f.caption ?? 'Photo'} onPress={() => setOpen(f.url)}>
            <Image source={{ uri: f.thumbUrl as string }} style={{ width: 96, height: 96, borderRadius: 8, backgroundColor: '#eee' }} />
          </Pressable>
        ))}
        {pending.map((p) => <Image key={p.id} source={{ uri: p.thumbUri }} style={{ width: 96, height: 96, borderRadius: 8, opacity: 0.5 }} />)}
      </View>
      {!files.isLoading && images.length === 0 && pending.length === 0 ? <Muted>No photos yet.</Muted> : null}
      {pending.length > 0 ? (
        <View style={{ gap: 6 }}>
          <Muted>{`${pending.length} photo${pending.length === 1 ? '' : 's'} waiting to upload${failing ? ' (no signal? it will keep trying)' : '…'}`}</Muted>
          {failing ? <Button title="Try again now" variant="secondary" onPress={() => void retry()} /> : null}
        </View>
      ) : null}
      {canAdd ? (
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Button title="Take photo" onPress={() => photos.add('camera')} busy={photos.busy} /></View>
          <View style={{ flex: 1 }}><Button title="Choose photos" variant="secondary" onPress={() => photos.add('library')} disabled={photos.busy} /></View>
        </View>
      ) : null}
      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' }} onPress={() => setOpen(null)}>
          {open ? <Image source={{ uri: open }} style={{ width: '100%', height: '80%' }} resizeMode="contain" /> : null}
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 12 }}>Tap to close</Text>
        </Pressable>
      </Modal>
    </Card>
  );
}
