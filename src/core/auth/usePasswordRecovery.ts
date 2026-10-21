import { useState } from 'react';
import { useSession } from './AuthProvider';
import { PASSWORD_RULE, passwordProblem } from './passwordRules';

export function usePasswordResetRequest() {
  const { requestPasswordReset } = useSession();
  const [email, setEmail] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim()) { setProblem('Enter your email address.'); return; }
    setProblem(null);
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return { email, setEmail, problem, sent, busy, submit };
}

export function usePasswordRecovery() {
  const { session, setPassword, signOut } = useSession();
  const [password, setPasswordValue] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const validation = passwordProblem(password, again);
    setProblem(validation);
    if (validation) return;
    setBusy(true);
    try {
      await setPassword(password);
      await signOut();
      setSaved(true);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return {
    session, password, setPassword: setPasswordValue, again, setAgain, problem, saved, busy,
    passwordRule: PASSWORD_RULE, save, cancel: signOut,
  };
}
