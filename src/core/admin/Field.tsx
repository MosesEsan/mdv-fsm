import { TextField } from '@/core/ui';

type Props = { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string };

/** Admin text box (no auto-capitalising: emails, colours, time zones). */
export function Field(props: Props) {
  return <TextField {...props} autoCapitalize="none" />;
}
