import { useEffect, useMemo, useState } from 'react';
import { today } from '@/core/dates';
import { useBookings, useScheduleContext, useScheduleMutations } from './hooks';
import { bookingToForm, clashesFor, formProblems, formToRange, type BookingForm } from './rules';

/** State and rules for adding or changing one booking. `bookingId` 'new' starts a blank form on `date`
 * (today if empty), optionally with a job already picked (e.g. from an enquiry). */
export function useBookingForm(bookingId: string, date: string, onSaved: () => void, presetJobId?: string) {
  const { tz } = useScheduleContext();
  const isNew = bookingId === 'new';
  const [form, setForm] = useState<BookingForm>({ date: date || today(tz), start: '08:30', end: '16:30', userIds: [], jobId: presetJobId ?? null });
  const [notes, setNotes] = useState('');
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const days = useMemo(() => [form.date], [form.date]);
  const dayBookings = useBookings(days);
  const { save, cancel } = useScheduleMutations();

  const existing = isNew ? undefined : dayBookings.data?.find((b) => b.id === bookingId);
  useEffect(() => {
    if (existing && loadedId !== existing.id) {
      setForm(bookingToForm(existing, tz));
      setNotes(existing.notes ?? '');
      setLoadedId(existing.id);
    }
  }, [existing, loadedId, tz]);

  const problems = formProblems(form);
  const range = problems.length === 0 ? formToRange(form, tz) : null;
  const clashes = range ? clashesFor(dayBookings.data ?? [], form.userIds, range.startsAt, range.endsAt, isNew ? undefined : bookingId) : [];

  const update = (patch: Partial<BookingForm>) => setForm((f) => ({ ...f, ...patch }));
  const togglePerson = (id: string) =>
    update({ userIds: form.userIds.includes(id) ? form.userIds.filter((u) => u !== id) : [...form.userIds, id] });

  const submit = () => {
    if (!range || !form.jobId) return;
    save.mutate({ id: isNew ? undefined : bookingId, jobId: form.jobId, ...range, userIds: form.userIds, notes }, { onSuccess: onSaved });
  };
  const cancelBooking = () => { if (!isNew) cancel.mutate(bookingId, { onSuccess: onSaved }); };

  return {
    form, notes, setNotes, update, togglePerson, problems, clashes, submit, cancelBooking, isNew,
    existing, isLoading: !isNew && dayBookings.isLoading,
    notFound: !isNew && !dayBookings.isLoading && !existing && loadedId === null,
    saving: save.isPending, error: save.error ?? cancel.error, cancelling: cancel.isPending,
  };
}
