import { Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { BrandMark } from '@/core/branding/BrandMark';
import { Button, Card, Notice, Screen, TextField, Title, colors } from '@/core/ui';
import { usePasswordRecovery } from './usePasswordRecovery';

export function ResetPasswordScreen() {
  const router = useRouter();
  const form = usePasswordRecovery();

  if (form.saved) {
    return <Screen contentStyle={{ paddingTop: 60, gap: 20 }}><BrandMark /><Card style={{ gap: 14 }}>
      <Notice tone="ok" title="Password updated">Sign in with your new password.</Notice>
      <Button title="Go to sign in" onPress={() => router.replace('/(auth)/login')} />
    </Card></Screen>;
  }

  if (!form.session) {
    return <Screen contentStyle={{ paddingTop: 60, gap: 20 }}><BrandMark /><Card style={{ gap: 14 }}>
      <Notice tone="bad" title="This reset link is invalid or has expired">Request a new password reset email and use the newest link.</Notice>
      <Button title="Request a new link" onPress={() => router.replace('/(auth)/forgot-password' as Href)} />
      <Button title="Back to sign in" variant="secondary" onPress={() => router.replace('/(auth)/login')} />
    </Card></Screen>;
  }

  return (
    <Screen contentStyle={{ paddingTop: 40, gap: 20 }}>
      <BrandMark />
      <Title>Choose a new password</Title>
      <Text style={{ color: colors.muted, fontSize: 15 }}>This will replace the password for {form.session.user.email ?? 'your account'}.</Text>
      <Card style={{ gap: 14 }}>
        <TextField label="New password" value={form.password} onChange={form.setPassword} secure hint={form.passwordRule} />
        <TextField label="Type it again" value={form.again} onChange={form.setAgain} secure />
        {form.problem ? <Notice tone="bad" title={form.problem} /> : null}
        <Button title="Save new password" size="lg" busy={form.busy} onPress={() => void form.save()} />
        <Button title="Cancel and sign out" variant="secondary" onPress={() => void form.cancel()} />
      </Card>
    </Screen>
  );
}
