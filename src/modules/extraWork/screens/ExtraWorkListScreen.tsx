import { useState } from 'react';
import { View } from 'react-native';
import { useTabs } from '@/core/modules/TabBar';
import { useRouter } from 'expo-router';
import { firstName, useJobContext, whenLabel } from '@/core/jobRecords';
import { Chip, Screen, colors, styles } from '@/core/ui';
import { AppBar, EmptyBox, ListRow, LoadFailed, LoadingCards } from '@/core/ui/kit';
import { useExtraEntries, useExtraWorkLive } from '../hooks';

/** For the office: extra work across all jobs, not on an invoice yet or already added (flows board). */
export function ExtraWorkListScreen({ onOpen }: { onOpen: (entryId: string) => void }) {
  useExtraWorkLive();
  const router = useRouter();
  const isTab = useTabs().length > 1; // a tab's first screen: no back arrow
  const { tz, today } = useJobContext();
  const [f, setF] = useState<'open' | 'done'>('open');
  const entries = useExtraEntries('all');
  const all = entries.data ?? [];
  const list = all.filter((x) => (f === 'open' ? !x.invoicedAt : !!x.invoicedAt));
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title="Extra work" sub="All jobs" onBack={!isTab && router.canGoBack() ? () => router.back() : undefined} />
      <Screen>
        {entries.isLoading ? <LoadingCards /> : null}
        {entries.error && !entries.data ? <LoadFailed what="extra work" onRetry={() => void entries.refetch()} /> : null}
        {entries.data ? (
          <>
            <View style={styles.wrap}>
              <Chip label={`Not on an invoice · ${all.filter((x) => !x.invoicedAt).length}`} selected={f === 'open'} onPress={() => setF('open')} />
              <Chip label={`Added · ${all.filter((x) => x.invoicedAt).length}`} selected={f === 'done'} onPress={() => setF('done')} />
            </View>
            {list.length === 0 ? (
              f === 'open'
                ? <EmptyBox icon="checkmark-circle-outline" title="All extra work is on an invoice" text="New extra work from the team shows here until you tick it off." />
                : <EmptyBox icon="checkmark-circle-outline" title="Nothing added yet" text="Extra work you tick off shows here." />
            ) : null}
            {list.map((x) => (
              <ListRow key={x.id} title={x.what} onPress={() => onOpen(x.id)} lines={[
                [x.customerName, x.jobSummary].filter(Boolean).join(' · '),
                `${firstName(x.loggedByName)} · ${whenLabel(x.createdAt, tz, today)}${x.hours != null ? ` · about ${x.hours} h` : ''}`,
              ]} />
            ))}
          </>
        ) : null}
      </Screen>
    </View>
  );
}
