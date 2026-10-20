import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, ErrorText, Heading, Muted, Screen, styles } from '@/core/ui';
import { useSession } from './AuthProvider';

/** Where invite links land (web): choose a password, then continue into the app. */
export function SetPasswordScreen() {
  const router = useRouter();
  const { session, setPassword } = useSession();
  const [password, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const problem = password.length > 0 && password.length < 8 ? 'Use at least 8 characters' : confirm && confirm !== password ? 'The passwords don’t match' : null;

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      await setPassword(password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!session) {
    return (
      <Screen>
        <Heading>Set your password</Heading>
        <Muted>This link has expired or was already used. Ask for a new invite.</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Heading>Welcome — set your password</Heading>
        <Muted>{session.user.email ?? ''}</Muted>
        <View style={{ gap: 4 }}>
          <Text style={styles.label}>New password</Text>
          <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPw} accessibilityLabel="New password" />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={styles.label}>Type it again</Text>
          <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} accessibilityLabel="Confirm password" />
        </View>
        <ErrorText error={problem ?? error} />
        <Button title="Save and continue" onPress={save} disabled={password.length < 8 || confirm !== password} busy={busy} />
      </Card>
    </Screen>
  );
}
