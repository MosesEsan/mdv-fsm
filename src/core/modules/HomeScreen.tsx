import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/core/auth/AuthProvider';
import { useBranding } from '@/core/branding';
import { brandInitials } from '@/core/branding/BrandMark';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { Button, Loading, Muted, Screen, colors, styles, useTheme } from '@/core/ui';
import { allGettingStarted, homeCardsFor, stepsToShow } from './home';
import type { NavItem } from './registry';
import { useModuleNav } from './useModuleNav';

/**
 * Home, built from what features register: no feature is named here (flows board: Owner home, Fitter home).
 * Coloured bar with the business, a getting-started list for a new owner, cards (e.g. today's job), then tiles.
 */
export function HomeScreen() {
  const router = useRouter();
  const { session, claims, isPlatformAdmin, signOut } = useSession();
  const { isFeatureEnabled } = useTenantSettings();
  const { items, isLoading } = useModuleNav();
  const go = (path: string) => router.push(path as Href);

  // Every step's hook runs every render, in a fixed order.
  const allSteps = allGettingStarted();
  const done = allSteps.map((s) => s.useDone());
  const steps = stepsToShow(allSteps, done, claims?.role, isFeatureEnabled);
  const cards = homeCardsFor(claims?.role, isFeatureEnabled);

  // A business whose main screen is a list of its work (e.g. job records) opens straight on it.
  const start = items.find((i) => i.startHere);
  if (start) return <Redirect href={start.path as Href} />;

  const fullName = typeof session?.user.user_metadata?.full_name === 'string' ? session.user.user_metadata.full_name : session?.user.email;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HomeBar personName={fullName ?? ''} />
      <Screen contentStyle={{ gap: 10 }}>
        {steps.length ? (
          <View style={[styles.card, { gap: 10 }]}>
            <Text accessibilityRole="header" style={sectionLabel}>Getting started</Text>
            {steps.map((s, i) => (
              <Row key={s.id} lead={String(i + 1)} title={s.title} sub={s.description} onPress={() => go(s.path)} />
            ))}
          </View>
        ) : null}
        {cards.map(({ id, Component }) => <Component key={id} />)}
        {isLoading ? <Loading /> : null}
        {items.map((item) => <HomeTile key={item.path} item={item} onPress={() => go(item.path)} />)}
        {!isLoading && items.length === 0 ? <Muted>Nothing is switched on for your account yet.</Muted> : null}
        {isPlatformAdmin ? <HomeTile grey item={{ path: '/admin', title: 'Platform admin', description: 'Businesses, branding and invites', roles: 'all', icon: 'business-outline' }} onPress={() => go('/admin')} /> : null}
        <HomeTile grey item={{ path: '/settings', title: 'Settings', description: 'How each feature works for you', roles: 'all', icon: 'settings-outline' }} onPress={() => go('/settings')} />
        <View style={{ marginTop: 8 }}><Button title="Sign out" variant="secondary" onPress={signOut} /></View>
      </Screen>
    </View>
  );
}

const sectionLabel = { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const, color: colors.muted };

/** The business's coloured bar: logo, name, and "Pat Nolan · Owner". */
function HomeBar({ personName }: { personName: string }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { claims } = useSession();
  const brand = useBranding();
  const who = [personName, brand.roleLabel(claims?.role)].filter(Boolean).join(' · ');
  return (
    <View style={{ backgroundColor: theme.primary, paddingTop: insets.top + 8, paddingBottom: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {brand.logoUrl ? (
          <Image source={{ uri: brand.logoUrl }} style={{ width: 52, height: 52 }} resizeMode="contain" accessibilityLabel={`${brand.name ?? 'Business'} logo`} />
        ) : (
          <Text style={{ color: theme.primary, fontSize: 21, fontWeight: '800' }}>{brandInitials(brand.name)}</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text accessibilityRole="header" numberOfLines={1} style={{ color: '#fff', fontSize: 19, fontWeight: '700' }}>{brand.name ?? 'Home'}</Text>
        {who ? <Text numberOfLines={1} style={{ color: '#fff', opacity: 0.92, fontSize: 15 }}>{who}</Text> : null}
      </View>
    </View>
  );
}

/** A feature tile: icon in a tinted square, title, one line, and a count when something needs the person. */
function HomeTile({ item, onPress, grey }: { item: NavItem; onPress: () => void; grey?: boolean }) {
  const theme = useTheme();
  const count = item.useCount ? item.useCount() : undefined;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={count ? `${item.title}, ${count} need you` : item.title} onPress={onPress}
      style={({ pressed }) => [styles.card, { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 72, paddingVertical: 12, paddingHorizontal: 14, opacity: pressed ? 0.8 : 1 }]}>
      <View style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: grey ? '#F0F2F4' : tint(theme.primary) }}>
        <Ionicons name={(item.icon ?? 'apps-outline') as keyof typeof Ionicons.glyphMap} size={22} color={grey ? colors.muted : theme.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{item.title}</Text>
        {item.description ? <Text style={{ fontSize: 14, color: colors.muted }}>{item.description}</Text> : null}
      </View>
      {count ? (
        <View style={{ minWidth: 24, height: 22, borderRadius: 11, paddingHorizontal: 7, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** A list row with a round lead (number or initials), title, one line and a chevron. */
export function Row({ lead, title, sub, onPress }: { lead: string; title: string; sub?: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => [{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, paddingVertical: 12, paddingHorizontal: 14, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.8 : 1 }]}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tint(theme.primary), alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>{lead}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 13, color: colors.muted }}>{sub}</Text> : null}
      </View>
      <Text style={{ color: colors.muted, fontSize: 22 }}>›</Text>
    </Pressable>
  );
}

/** A very light version of the main colour, for icon squares (the board's --tint). */
export function tint(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#EEF2F6';
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.9);
  const [r, g, b] = [mix((n >> 16) & 255), mix((n >> 8) & 255), mix(n & 255)];
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
