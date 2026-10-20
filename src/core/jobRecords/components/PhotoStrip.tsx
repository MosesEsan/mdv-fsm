import { useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import { styles } from '@/core/ui';

export type StripPhoto = { id: string; thumbUrl: string | null; url: string | null; label?: string; waiting?: boolean };

/** A wrap of square thumbnails; tap one to see it full screen with its label. */
export function PhotoStrip({ photos, size = 96 }: { photos: StripPhoto[]; size?: number }) {
  const [open, setOpen] = useState<StripPhoto | null>(null);
  return (
    <>
      <View style={styles.wrap}>
        {photos.map((p) => (
          <Pressable key={p.id} accessibilityRole="imagebutton" accessibilityLabel={p.label ?? 'Photo'}
            onPress={() => p.url && setOpen(p)} disabled={!p.url}>
            {p.thumbUrl ? (
              <Image source={{ uri: p.thumbUrl }} style={{ width: size, height: size, borderRadius: 8, backgroundColor: '#eee', opacity: p.waiting ? 0.5 : 1 }} />
            ) : (
              <View style={{ width: size, height: size, borderRadius: 8, backgroundColor: '#eee' }} />
            )}
            {p.waiting ? <Text style={[styles.muted, { fontSize: 12 }]}>Waiting</Text> : null}
          </Pressable>
        ))}
      </View>
      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close photo" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' }} onPress={() => setOpen(null)}>
          {open?.url ? <Image source={{ uri: open.url }} style={{ width: '100%', height: '78%' }} resizeMode="contain" /> : null}
          {open?.label ? <Text style={{ color: '#fff', textAlign: 'center', marginTop: 12, fontSize: 15 }}>{open.label}</Text> : null}
          <Text style={{ color: '#c5cdd4', textAlign: 'center', marginTop: 8 }}>Tap to close</Text>
        </Pressable>
      </Modal>
    </>
  );
}
