// Pure customer rules (unit-tested). The database tidies and checks the same things.
export type CustomerInput = { name: string; phone: string; email: string; address: string; notes: string };
export type Customer = { id: string; name: string; phone: string | null; email: string | null; address: string | null; notes: string | null };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emptyCustomer = (): CustomerInput => ({ name: '', phone: '', email: '', address: '', notes: '' });

export function customerProblems(c: CustomerInput): string[] {
  const out: string[] = [];
  if (!c.name.trim()) out.push("Enter the customer's name");
  if (!c.phone.trim() && !c.email.trim()) out.push('Add a phone number or an email so you can get back to them');
  if (c.email.trim() && !EMAIL.test(c.email.trim())) out.push('That email address doesn’t look right');
  return out;
}

export function customerValues(c: CustomerInput) {
  const t = (s: string) => s.trim() || null;
  return { name: c.name.trim(), phone: t(c.phone), email: t(c.email)?.toLowerCase() ?? null, address: t(c.address), notes: t(c.notes) };
}

/** Digits only, so "087 123 4567" matches "0871234567". */
export const phoneDigits = (s: string) => s.replace(/\D/g, '');

/** Builds a PostgREST "or" filter for name, email or phone (phone matched on digits). */
export function searchFilter(term: string): string | null {
  const q = term.trim().replace(/[%,()*]/g, ' ').trim();
  if (q.length < 2) return null;
  const parts = [`name.ilike.*${q}*`, `email.ilike.*${q}*`];
  const digits = phoneDigits(q);
  if (digits.length >= 3) parts.push(`phone.ilike.*${digits.split('').join('*')}*`);
  return parts.join(',');
}

export const toInput = (c: Customer): CustomerInput =>
  ({ name: c.name, phone: c.phone ?? '', email: c.email ?? '', address: c.address ?? '', notes: c.notes ?? '' });
