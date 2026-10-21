import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, useTheme } from '@/core/ui';
import type { NavItem } from './registry';
import { useModuleNav } from './useModuleNav';

const SETTINGS_TAB: NavItem = { path: '/settings', title: 'Settings', roles: 'all', icon: 'settings-outline' };

/**
 * Bottom tabs for a business that opens on a start-here screen (e.g. job records):
 * every menu entry marked `tab`, then Settings. Empty for other businesses, which use Home tiles.
 */
export function useTabs(): NavItem[] {
  const { items } = useModuleNav();
  if (!items.some((i) => i.startHere)) return [];
  return [...items.filter((i) => i.tab), SETTINGS_TAB];
}

/** Rendered at the bottom of each tab's first screen. Nothing when the business has no tabs. */
export function TabBar() {
  const tabs = useTabs();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  if (tabs.length < 2) return null;
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingBottom: insets.bottom }}>
      {tabs.map((t) => <Tab key={t.path} item={t} active={pathname === t.path || pathname.startsWith(`${t.path}/`)} />)}
    </View>
  );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const count = item.useCount ? item.useCount() : undefined;
  const color = active ? theme.primary : colors.muted;
  const icon = (active ? (item.icon ?? 'apps-outline').replace('-outline', '') : item.icon ?? 'apps-outline') as keyof typeof Ionicons.glyphMap;
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={count ? `${item.title}, ${count}` : item.title}
      onPress={() => { if (!active) router.replace(item.path as Href); }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8, paddingBottom: 6, minHeight: 56 }}>
      <View>
        <Ionicons name={icon} size={24} color={color} />
        {count ? (
          <View style={{ position: 'absolute', top: -4, right: -12, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{count}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color, marginTop: 2 }}>{item.title}</Text>
    </Pressable>
  );
}
