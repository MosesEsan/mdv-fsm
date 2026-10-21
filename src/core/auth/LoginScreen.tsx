import { useState } from 'react';
import { Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import { brandInitials } from '@/core/branding/BrandMark';
import { Button, Card, Notice, Screen, TextField, colors, useTheme } from '@/core/ui';
import { useSession } from './AuthProvider';

/**
 * Sign in for returning users (flows board: Sign-in states). Before signing in we don't know the business,
 * so the mark shows the app's name from the build (a white-label build carries the client's own name).
 */
export function LoginScreen() {
  const { signIn } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const appName = Constants.expoConfig?.name ?? 'Field Service';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) { setProblem('Enter your email and password.'); return; }
    setProblem(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: 40, gap: 22, flexGrow: 1 }}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <View style={{ width: 76, height: 76, borderRadius: 14, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{brandInitials(appName)}</Text>
        </View>
        <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' }}>{appName}</Text>
        <Text style={{ fontSize: 14, color: colors.muted }}>Sign in to see your jobs</Text>
      </View>
      <Card style={{ padding: 18, gap: 14 }}>
        <TextField label="Email" value={email} onChange={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Password" value={password} onChange={setPassword} secure />
        {problem ? <Notice tone="bad" title={problem} /> : null}
        <Button title="Sign in" size="lg" busy={busy} onPress={() => void submit()} />
        <Button title="Forgot your password?" variant="secondary" onPress={() => router.push('/(auth)/forgot-password' as Href)} />
      </Card>
      <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 'auto' }}>
        New here? Your manager sends you an invite by email.
      </Text>
    </Screen>
  );
}
