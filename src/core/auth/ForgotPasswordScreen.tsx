import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandMark } from '@/core/branding/BrandMark';
import { Button, Card, Notice, Screen, TextField, Title, colors } from '@/core/ui';
import { usePasswordResetRequest } from './usePasswordRecovery';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const form = usePasswordResetRequest();

  return (
    <Screen contentStyle={{ paddingTop: 40, gap: 20 }}>
      <BrandMark />
      <Title>Reset your password</Title>
      <Text style={{ color: colors.muted, fontSize: 15 }}>Enter your sign-in email and we’ll send you a secure reset link.</Text>
      <Card style={{ gap: 14 }}>
        {form.sent ? (
          <Notice tone="ok" title="Check your email">If an account exists for that address, a password reset link is on its way.</Notice>
        ) : (
          <>
            <TextField label="Email" value={form.email} onChange={form.setEmail} keyboardType="email-address" autoCapitalize="none" />
            {form.problem ? <Notice tone="bad" title={form.problem} /> : null}
            <Button title="Send reset link" size="lg" busy={form.busy} onPress={() => void form.submit()} />
          </>
        )}
        <Button title="Back to sign in" variant="secondary" onPress={() => router.replace('/(auth)/login')} />
      </Card>
    </Screen>
  );
}
