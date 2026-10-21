import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isPasswordRecoveryUrl, webAuthRedirectUrl } from './authRedirects';

export function authRedirectUrl(path: string): string {
  const route = path.replace(/^\//, '');
  const configuredScheme = Constants.expoConfig?.scheme;
  const scheme = Array.isArray(configuredScheme) ? configuredScheme[0] : configuredScheme;
  const nativeUrl = `${scheme ?? 'field-service'}://${route}`;
  if (Platform.OS !== 'web') return nativeUrl;
  const origin = (globalThis as unknown as { location?: { origin?: string } }).location?.origin;
  if (!origin) return nativeUrl;
  return webAuthRedirectUrl(path, origin, process.env.EXPO_PUBLIC_WEB_BASE_URL);
}

export function currentUrlIsPasswordRecovery(): boolean {
  const href = (globalThis as unknown as { location?: { href?: string } }).location?.href;
  return isPasswordRecoveryUrl(href);
}
