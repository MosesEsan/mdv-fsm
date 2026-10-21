import { Tabs } from 'expo-router';
import { BrandTabBar } from '@/core/modules/TabBar';

/**
 * Bottom tabs (Expo Router). Each tab keeps its own history. Which tabs a business sees comes from the
 * module menu (`tab: true` entries + Settings); the bar draws only those. Businesses without tabs see Home tiles
 * and no bar. A tab's route name is its menu path without the slash.
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BrandTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="extra-work" />
      <Tabs.Screen name="visits" />
      <Tabs.Screen name="visit-entries" />
      <Tabs.Screen name="visit-report" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
