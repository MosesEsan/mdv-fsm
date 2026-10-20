import { TextField } from '@/core/ui';
import type { CustomerInput } from './rules';

/** The customer's details as form fields (used when adding or editing a customer). */
export function CustomerFields({ value, onChange }: { value: CustomerInput; onChange: (v: CustomerInput) => void }) {
  const set = (patch: Partial<CustomerInput>) => onChange({ ...value, ...patch });
  return (
    <>
      <TextField label="Name" value={value.name} onChange={(v) => set({ name: v })} autoCapitalize="words" />
      <TextField label="Phone" value={value.phone} onChange={(v) => set({ phone: v })} keyboardType="phone-pad" />
      <TextField label="Email" value={value.email} onChange={(v) => set({ email: v })} keyboardType="email-address" autoCapitalize="none" />
      <TextField label="Address" value={value.address} onChange={(v) => set({ address: v })} multiline />
      <TextField label="Notes about the customer" value={value.notes} onChange={(v) => set({ notes: v })} multiline />
    </>
  );
}
