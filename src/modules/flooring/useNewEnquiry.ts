import { useState } from 'react';
import { customerValues, type Customer, type CustomerInput } from '@/core/customers/rules';
import { zonedInstant } from '@/core/dates';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { useEnquiryMutations } from './enquiryHooks';
import { enquiryProblems, type EnquiryForm } from './enquiryRules';

/** State and rules for logging a new enquiry; one server call saves customer, job, enquiry and viewing. */
export function useNewEnquiry(onSaved: (jobId: string) => void) {
  const tz = useTenantSettings().timezone ?? 'Europe/Dublin';
  const { create } = useEnquiryMutations();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<EnquiryForm>({
    customerId: null, newCustomer: null, summary: '', siteAddress: '', source: 'phone', details: '', viewingDate: '', viewingTime: '',
  });
  const update = (patch: Partial<EnquiryForm>) => setForm((f) => ({ ...f, ...patch }));
  const problems = enquiryProblems(form);

  const pickCustomer = (c: Customer | null) => { setCustomer(c); update({ customerId: c?.id ?? null, newCustomer: null }); };
  const setNewCustomer = (c: CustomerInput | null) => { setCustomer(null); update({ customerId: null, newCustomer: c }); };

  const submit = () => {
    if (problems.length) return;
    create.mutate({
      customerId: form.customerId,
      newCustomer: form.newCustomer ? customerValues(form.newCustomer) : null,
      summary: form.summary.trim(), siteAddress: form.siteAddress.trim(), source: form.source, details: form.details.trim(),
      viewingAt: form.viewingDate ? zonedInstant(form.viewingDate, form.viewingTime || '10:00', tz) : null,
    }, { onSuccess: onSaved });
  };

  return { form, update, customer, pickCustomer, setNewCustomer, problems, submit, saving: create.isPending, error: create.error };
}
