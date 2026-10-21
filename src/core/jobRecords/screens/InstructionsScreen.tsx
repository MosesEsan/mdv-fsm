import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button, ErrorText, Screen, colors, styles } from '@/core/ui';
import { AppBar, LoadFailed, LoadingCards } from '@/core/ui/kit';
import { useJobMutations, useJobRecord } from '../hooks';

type Props = { jobId: string; onDone: () => void };

/** Edit a job's instructions on a full screen (owner and manager), so the keyboard never hides the text. */
export function InstructionsScreen({ jobId, onDone }: Props) {
  const record = useJobRecord(jobId);
  const { instructions } = useJobMutations();
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => {
    if (draft === null && record.data) setDraft(record.data.instructions ?? '');
  }, [draft, record.data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title="Edit instructions" sub={record.data?.summary ?? null} onBack={onDone} />
      <Screen>
        {record.isLoading ? <LoadingCards n={1} /> : null}
        {record.error && !record.data ? <LoadFailed what="this job" onRetry={() => void record.refetch()} /> : null}
        {draft !== null ? (
          <>
            <TextInput value={draft} onChangeText={setDraft} multiline autoFocus accessibilityLabel="Instructions"
              placeholder="What needs doing, access, materials, anything the team should know"
              style={[styles.input, { minHeight: 220, textAlignVertical: 'top' }]} />
            <ErrorText error={instructions.error} />
            <Button title="Save" size="lg" busy={instructions.isPending}
              onPress={() => instructions.mutate({ id: jobId, text: draft }, { onSuccess: onDone })} />
            <Button title="Cancel" variant="secondary" onPress={onDone} />
          </>
        ) : null}
      </Screen>
    </View>
  );
}
