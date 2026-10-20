// Shared pieces from the flows board's design guide: coloured top bar, pills, photo grid and viewer,
// bottom sheet, and empty / loading / failed states. Import from '@/core/ui/kit'.
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, colors, useTheme } from './index';

type IconName = keyof typeof Ionicons.glyphMap;

/** Coloured top bar: back arrow (when there's somewhere to go back to), title, a second line, and an optional action. */
export function AppBar({ title, sub, onBack, right, below, lead }: {
  title: string; sub?: string | null; onBack?: () => void; right?: ReactNode; below?: ReactNode; lead?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.primary, paddingTop: insets.top, paddingHorizontal: 10, paddingBottom: below ? 12 : 0 }}>
      <View style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
        ) : null}
        {lead}
        <View style={{ flex: 1, minWidth: 0, paddingLeft: onBack ? 0 : 6 }}>
          <Text accessibilityRole="header" numberOfLines={1} style={{ color: '#fff', fontSize: 19, fontWeight: '700' }}>{title}</Text>
          {sub ? <Text numberOfLines={1} style={{ color: '#fff', opacity: 0.92, fontSize: 13 }}>{sub}</Text> : null}
        </View>
        {right ? <View style={{ marginRight: 4 }}>{right}</View> : null}
      </View>
      {below ? <View style={{ paddingHorizontal: 6, paddingTop: 10 }}>{below}</View> : null}
    </View>
  );
}

const PILL = {
  grey: { bg: '#F0F2F4', fg: '#59636E' },
  blue: { bg: '#E6EEF5', fg: '#24527A' },
  amber: { bg: '#FFF4D6', fg: '#6B4700' },
  green: { bg: '#E6F4EA', fg: '#116329' },
  red: { bg: '#FFEBE9', fg: '#A40E26' },
} as const;
export type PillTone = keyof typeof PILL;

/** Small status tag: always words, often with an icon, never colour alone. */
export function Pill({ label, tone = 'grey', icon }: { label: string; tone?: PillTone; icon?: string }) {
  const t = PILL[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: t.bg, alignSelf: 'flex-start' }}>
      {icon ? <Ionicons name={icon as IconName} size={12} color={t.fg} /> : null}
      <Text style={{ fontSize: 12, fontWeight: '700', color: t.fg }}>{label}</Text>
    </View>
  );
}

/** Small uppercase heading inside a card ("PHOTOS · 12"). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.muted }}>{children}</Text>;
}

/** Dashed box saying what will appear here, with the first action. */
export function EmptyBox({ icon, title, text, children }: { icon: string; title: string; text: string; children?: ReactNode }) {
  return (
    <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, paddingVertical: 28, paddingHorizontal: 18, alignItems: 'center', gap: 10, backgroundColor: colors.surface }}>
      <Ionicons name={icon as IconName} size={40} color={colors.muted} />
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', maxWidth: 300 }}>{text}</Text>
      {children}
    </View>
  );
}

/** Grey placeholder cards in the shape of the real rows. */
export function LoadingCards({ n = 3 }: { n?: number }) {
  return (
    <View accessibilityLabel="Loading" style={{ gap: 12 }}>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 8 }}>
          <View style={{ height: 16, width: '45%', borderRadius: 6, backgroundColor: '#E4E8EC' }} />
          <View style={{ height: 12, borderRadius: 6, backgroundColor: '#EEF1F4' }} />
          <View style={{ height: 12, width: '70%', borderRadius: 6, backgroundColor: '#EEF1F4' }} />
        </View>
      ))}
      <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>Getting the latest…</Text>
    </View>
  );
}

/** Failed load: says why, offers Try again, and that nothing saved is lost. */
export function LoadFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={{ borderWidth: 1, borderColor: colors.danger, backgroundColor: '#FFEBE9', borderRadius: 10, padding: 14, gap: 6 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#82071E' }}>{`Couldn’t load ${what}`}</Text>
      <Text style={{ fontSize: 15, color: '#82071E' }}>It looks like there’s no internet right now. Check your signal and try again. Nothing you saved has been lost.</Text>
      <View style={{ alignSelf: 'flex-start' }}><Button title="Try again" variant="secondary" size="sm" onPress={onRetry} /></View>
    </View>
  );
}

export type GridPhoto = { id: string; thumbUrl: string | null; url?: string | null; label?: string | null; waiting?: boolean };

/** Photo tiles: 3 across at 4:3 with labels, or 4 across square (inside updates). */
export function PhotoGrid({ photos, columns = 3, square, labels = true, onOpen }: {
  photos: GridPhoto[]; columns?: 3 | 4; square?: boolean; labels?: boolean; onOpen?: (index: number) => void;
}) {
  const [w, setW] = useState(0);
  const gap = 8;
  const size = w ? (w - gap * (columns - 1)) / columns : 0;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {size ? photos.map((p, i) => (
        <Pressable key={p.id} accessibilityRole="imagebutton" accessibilityLabel={`Open photo${p.label ? `: ${p.label}` : ''}`}
          disabled={!onOpen || p.waiting} onPress={() => onOpen?.(i)}
          style={{ width: size, height: square ? size : size * 0.75, borderRadius: 10, overflow: 'hidden', backgroundColor: '#C9D3DB', opacity: p.waiting ? 0.5 : 1 }}>
          {p.thumbUrl ? <Image source={{ uri: p.thumbUrl }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" /> : null}
          {p.waiting ? (
            <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: colors.warning, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Waiting</Text>
            </View>
          ) : null}
          {labels && p.label ? (
            <View style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(31,35,40,0.8)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, maxWidth: size - 12 }}>
              <Text numberOfLines={1} style={{ color: '#fff', fontSize: 12 }}>{p.label}</Text>
            </View>
          ) : null}
        </Pressable>
      )) : null}
    </View>
  );
}

/** Full-screen photo viewer with a label, close, and previous / next. */
export function PhotoViewer({ photos, index, onIndex, onClose }: {
  photos: { url: string | null; label: string }[]; index: number | null; onIndex: (i: number) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const open = index !== null && photos.length > 0;
  const i = open ? Math.min(index!, photos.length - 1) : 0;
  const p = photos[i];
  const round = { minWidth: 48, minHeight: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <Modal visible={open} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#11161B', paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12, paddingHorizontal: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 }}>
          <Text style={{ flex: 1, color: '#fff', fontSize: 15 }}>{p ? `${p.label} · ${i + 1} of ${photos.length}` : ''}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={round}><Ionicons name="close" size={24} color="#fff" /></Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {p?.url ? <Image source={{ uri: p.url }} style={{ width: '100%', height: '100%' }} resizeMode="contain" accessibilityLabel={p.label} /> : <ActivityIndicator color="#fff" />}
        </View>
        {photos.length > 1 ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous photo" onPress={() => onIndex((i + photos.length - 1) % photos.length)} style={round}><Ionicons name="chevron-back" size={24} color="#fff" /></Pressable>
            <Text style={{ color: '#C5CDD4', fontSize: 13 }}>Use the arrows for more</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Next photo" onPress={() => onIndex((i + 1) % photos.length)} style={round}><Ionicons name="chevron-forward" size={24} color="#fff" /></Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/** Bottom sheet for "are you sure" and one-more-detail questions. Tap outside to close. */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(31,35,40,0.45)', justifyContent: 'flex-end' }}>
        <Pressable accessibilityViewIsModal onPress={() => {}} style={{ backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '88%', width: '100%', maxWidth: 600, alignSelf: 'center' }}>
          <ScrollView contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 12 }} keyboardShouldPersistTaps="handled">
            <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#D1D9E0' }} />
            <Text accessibilityRole="header" style={{ fontSize: 19, fontWeight: '700', color: colors.text }}>{title}</Text>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Round initials (people in the updates feed). */
export function Avatar({ name, grey }: { name: string; grey?: boolean }) {
  const theme = useTheme();
  const letters = name.trim().split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  return (
    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: grey ? '#F0F2F4' : tintOf(theme.primary), alignItems: 'center', justifyContent: 'center' }}>
      {grey ? <Ionicons name="add" size={16} color={colors.muted} /> : <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>{letters}</Text>}
    </View>
  );
}

/** A very light version of a colour, for icon squares and avatars (the board's --tint). */
export function tintOf(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#EEF2F6';
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.9);
  const [r, g, b] = [mix((n >> 16) & 255), mix((n >> 8) & 255), mix(n & 255)];
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** A tappable list row: title, up to two muted lines, extra content (pills), and a chevron. */
export function ListRow({ title, lines, children, onPress }: { title: string; lines?: (string | null | undefined)[]; children?: ReactNode; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.8 : 1 })}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{title}</Text>
        {(lines ?? []).filter(Boolean).map((l, i) => <Text key={i} style={{ fontSize: 13, color: colors.muted }}>{l}</Text>)}
        {children ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>{children}</View> : null}
      </View>
      <Text style={{ color: colors.muted, fontSize: 22 }}>›</Text>
    </Pressable>
  );
}
