import { ErrorText, Loading, Screen } from '@/core/ui';
import { useDeleteEntry, useEntry, useSaveEntry, useWeekFor } from '../api/hooks';
import { EntryForm } from '../components/EntryForm';
import { useEntryForm } from '../hooks/useEntryForm';
import { readyContext, useTimesheetsContext, type ReadyTimesheetsContext } from '../hooks/useTimesheetsContext';
import type { TsEntry } from '../schemas/types';
import { canEditWeek } from '../services/weekRules';
import { weekStartFor, type IsoDate } from '@/core/dates';

type Props =
  | { entryId: string; date?: undefined; workerId?: undefined; onDone: () => void }
  | { entryId?: undefined; date: IsoDate; workerId?: string; onDone: () => void };

export function EntryFormScreen(props: Props) {
  const ctx = readyContext(useTimesheetsContext());
  const existing = useEntry(props.entryId);
  if (!ctx) return <Loading />;
  if (props.entryId && existing.isLoading) return <Loading />;
  if (props.entryId && existing.error) return <Screen><ErrorText error={existing.error} /></Screen>;
  return <EntryFormBody {...props} existing={existing.data ?? null} ctx={ctx} />;
}

function EntryFormBody({ existing, date, workerId, onDone, ctx }: Props & { existing: TsEntry | null; ctx: ReadyTimesheetsContext }) {
  const worker = existing?.worker_id ?? workerId ?? ctx.userId;
  const workDate = existing?.work_date ?? (date as IsoDate);
  const form = useEntryForm({ settings: ctx.settings, timezone: ctx.timezone, tenantId: ctx.tenantId, workerId: worker, workDate, existing });
  const week = useWeekFor(worker, weekStartFor(workDate, ctx.settings.weekStartsOn));
  const save = useSaveEntry();
  const remove = useDeleteEntry();

  // Clock times can only be corrected by a manager.
  const isClocked = existing?.source === 'clock';
  const editable = canEditWeek(week.data?.status, ctx.actor) && (!isClocked || ctx.actor.isManager);

  return (
    <Screen>
      <EntryForm
        form={form}
        editable={editable}
        saving={save.isPending}
        deleting={remove.isPending}
        saveError={save.error ?? remove.error}
        onSave={() => form.result.ok && save.mutate({ id: existing?.id, payload: form.result.payload }, { onSuccess: onDone })}
        onDelete={existing ? () => remove.mutate(existing.id, { onSuccess: onDone }) : undefined}
      />
    </Screen>
  );
}
