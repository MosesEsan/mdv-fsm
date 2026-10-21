import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { LandingScreen } from '@/core/landing/LandingScreen';
import { shouldShowLandingPage } from '@/core/landing/rootRoute';

export default function LandingRoute() {
  return shouldShowLandingPage(Platform.OS)
    ? <LandingScreen />
    : <Redirect href="/(auth)/login" />;
}
