import { Text, TextInput, View } from 'react-native';
import { Button, Card, ErrorText, Muted, styles } from '@/core/ui';
import { useCostCodes, useJobOptions } from '../api/hooks';
import type { useEntryForm } from '../hooks/useEntryForm';
import { formatMinutes } from '@/core/dates';
import { BreakField } from './BreakField';
import { DurationFields } from './DurationFields';
import { OptionPicker } from './OptionPicker';
import { StartEndFields } from './StartEndFields';

type Props = {
  form: ReturnType<typeof useEntryForm>;
  editable: boolean;
  saving: boolean;
  deleting?: boolean;
  saveError: unknown;
  onSave: () => void;
  onDelete?: () => void;
};

/** Switches on the entry mode; each mode's inputs are their own small component. */
export function EntryForm({ form, editable, saving, deleting, saveError, onSave, onDelete }: Props) {
  const jobs = useJobOptions(form.showJob);
  const costCodes = useCostCodes(form.showCostCode);
  const { values, setField, result } = form;

  return (
    <Card>
      {form.mode === 'start_end' ? (
        <>
          <StartEndFields start={values.start} end={values.end} onChange={setField} editable={editable} />
          <BreakField editable={editable && form.breakEditable} value={values.breakMinutes} onChange={(v) => setField('breakMinutes', v)} note={form.fixedBreakNote} />
        </>
      ) : (
        <DurationFields hours={values.hours} minutes={values.minutes} onChange={setField} editable={editable} />
      )}

      {form.showJob ? (
        <OptionPicker label="Job" options={jobs.data} value={values.jobId} onChange={(id) => setField('jobId', id)} required={form.jobRequired} disabled={!editable} emptyText="No jobs available." />
      ) : null}
      {form.showCostCode ? (
        <OptionPicker label="Work category" options={costCodes.data} value={values.costCodeId} onChange={(id) => setField('costCodeId', id)} disabled={!editable} emptyText="No categories set up yet." />
      ) : null}

      <View style={{ gap: 4 }}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={[styles.input, { minHeight: 60 }]} value={values.notes} onChangeText={(v) => setField('notes', v)} multiline editable={editable} accessibilityLabel="Notes" />
      </View>

      {result.ok ? <Muted>{`Time worked: ${formatMinutes(result.durationMinutes)}${result.breakMinutes ? ` (after a ${result.breakMinutes}-minute break)` : ''}`}</Muted> : null}
      {!result.ok && result.error ? <ErrorText error={result.error} /> : null}
      <ErrorText error={saveError} />

      {editable ? (
        <View style={{ gap: 8 }}>
          <Button title="Save" onPress={onSave} disabled={!result.ok} busy={saving} />
          {onDelete ? <Button title="Delete" variant="danger" onPress={onDelete} busy={deleting} /> : null}
        </View>
      ) : (
        <Muted>This week can’t be changed.</Muted>
      )}
    </Card>
  );
}
