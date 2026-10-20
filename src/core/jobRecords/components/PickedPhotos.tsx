import { Image, Pressable, Text, View } from 'react-native';
import type { PreparedPhoto } from '@/core/jobFiles';
import { Button, ErrorText, styles } from '@/core/ui';

type Props = {
  photos: PreparedPhoto[]; error: string | null; busy: boolean;
  pick: (source: 'camera' | 'library') => void; remove: (uri: string) => void;
};

/** Photos picked on a form but not saved yet. Tap one to take it off. */
export function PickedPhotos({ photos, error, busy, pick, remove }: Props) {
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}><Button title="Take photo" variant="secondary" busy={busy} onPress={() => pick('camera')} /></View>
        <View style={{ flex: 1 }}><Button title="Choose photos" variant="secondary" busy={busy} onPress={() => pick('library')} /></View>
      </View>
      <ErrorText error={error} />
      {photos.length ? (
        <View style={styles.wrap}>
          {photos.map((p) => (
            <Pressable key={p.uri} accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => remove(p.uri)}>
              <Image source={{ uri: p.thumbUri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
              <Text style={[styles.muted, { fontSize: 12, textAlign: 'center' }]}>Remove</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
