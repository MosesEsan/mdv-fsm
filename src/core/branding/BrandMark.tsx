import { Image, Text, View } from 'react-native';
import { colors, useTheme } from '@/core/ui';
import { useBranding } from './useBranding';

/** "Brightwood Flooring" → "BF". Pure, so it's unit-tested. */
export function brandInitials(name: string | null | undefined): string {
  return String(name ?? '').trim().split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/** The business's logo (or its initials on the main colour) next to its name, as on the sign-in screens. */
export function BrandMark({ size = 52 }: { size?: number }) {
  const { name, logoUrl } = useBranding();
  const theme = useTheme();
  if (!name && !logoUrl) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={{ width: size, height: size, borderRadius: 14 }} resizeMode="contain" accessibilityLabel={`${name ?? 'Business'} logo`} />
      ) : (
        <View style={{ width: size, height: size, borderRadius: 14, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: Math.round(size * 0.37), fontWeight: '800' }}>{brandInitials(name)}</Text>
        </View>
      )}
      {name ? <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flexShrink: 1 }}>{name}</Text> : null}
    </View>
  );
}
