import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandMark } from '@/core/branding/BrandMark';
import { Button, Card, Notice, Screen, TextField, Title, colors } from '@/core/ui';
import { useSession } from './AuthProvider';
import { PASSWORD_RULE, firstNameOf, passwordProblem } from './passwordRules';

/**
 * Where invite links land: "Welcome, Pat", pick a password, then into the app.
 * The rule is shown before typing; problems only after Save (flows board: First sign-in, step 1).
 */
export function SetPasswordScreen() {
  const router = useRouter();
  const { session, setPassword } = useSession();
  const [password, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!session) return <InviteExpired onSignIn={() => router.replace('/(auth)/login')} />;

  const name = firstNameOf(session.user.user_metadata?.full_name);
  const email = session.user.email ?? '';

  const save = async () => {
    const p = passwordProblem(password, again);
    setProblem(p);
    if (p) return;
    setBusy(true);
    try {
      await setPassword(password);
      router.replace('/');
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: 24, gap: 20 }}>
      <BrandMark />
      <View style={{ gap: 6 }}>
        <Title>{name ? `Welcome, ${name}` : 'Welcome'}</Title>
        <Text style={{ fontSize: 16, color: colors.muted }}>
          {`Pick a password to finish setting up your account.${email ? ` You'll sign in with ${email}.` : ''}`}
        </Text>
      </View>
      <Card style={{ padding: 18, gap: 14 }}>
        <TextField label="New password" value={password} onChange={setPw} secure hint={PASSWORD_RULE} />
        <TextField label="Type it again" value={again} onChange={setAgain} secure />
        {problem ? <Notice tone="bad" title={problem} /> : null}
        <Button title="Save and sign in" size="lg" busy={busy} onPress={() => void save()} />
      </Card>
    </Screen>
  );
}

/** The invite link is old or already used (no session arrived with it). */
function InviteExpired({ onSignIn }: { onSignIn: () => void }) {
  return (
    <Screen contentStyle={{ paddingTop: 60, flexGrow: 1, justifyContent: 'center' }}>
      <Card style={{ alignItems: 'center', gap: 12, padding: 24 }}>
        <ClockMark />
        <Text accessibilityRole="header" style={{ fontSize: 21, fontWeight: '700', color: colors.text, textAlign: 'center' }}>This invite link has expired</Text>
        <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center' }}>
          Invite links work for 24 hours. Ask the person who invited you to send a new one. Your account is safe.
        </Text>
        <View style={{ alignSelf: 'stretch' }}><Button title="Go to sign in" variant="secondary" onPress={onSignIn} /></View>
      </Card>
    </Screen>
  );
}

/** A simple clock drawn with views (the app has no icon set yet). */
function ClockMark() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 4, borderColor: colors.warning, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 4, height: 14, borderRadius: 2, backgroundColor: colors.warning, top: 8 }} />
      <View style={{ position: 'absolute', width: 11, height: 4, borderRadius: 2, backgroundColor: colors.warning, left: 20, top: 18 }} />
    </View>
  );
}
