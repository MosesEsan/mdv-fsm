import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, colors, styles } from '@/core/ui';
import { AppBar, EmptyBox, ListRow, LoadFailed, LoadingCards } from '@/core/ui/kit';
import { useCustomerList } from '../hooks';

/** Every customer, searchable by name, phone, email or street. Tap one for their details and jobs. */
export function CustomersScreen({ onOpen }: { onOpen: (customerId: string) => void }) {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const list = useCustomerList(term);
  const rows = list.data ?? [];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title="Customers" sub={list.data ? `${rows.length}${rows.length === 500 ? '+' : ''} ${term.trim() ? 'found' : 'customers'}` : null}
        onBack={router.canGoBack() ? () => router.back() : undefined}
        below={(
          <TextInput value={term} onChangeText={setTerm} placeholder="Search name, phone or street" accessibilityLabel="Search customers"
            autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" placeholderTextColor={colors.muted}
            style={[styles.input, { borderColor: 'transparent' }]} />
        )} />
      <Screen>
        {list.isLoading ? <LoadingCards /> : null}
        {list.error && !list.data ? <LoadFailed what="your customers" onRetry={() => void list.refetch()} /> : null}
        {list.data && rows.length === 0 ? (
          term.trim()
            ? <EmptyBox icon="search-outline" title="No customers match" text="Try part of the name, the phone number or the street." />
            : <EmptyBox icon="people-outline" title="No customers yet" text="Customers are added when you create a job. They show here with all their jobs." />
        ) : null}
        {rows.map((c) => (
          <ListRow key={c.id} title={c.name} lines={[[c.phone, c.address].filter(Boolean).join(' · ')]} onPress={() => onOpen(c.id)} />
        ))}
        {rows.length === 500 ? <Text style={styles.hint}>Showing the first 500. Search to find others.</Text> : null}
      </Screen>
    </View>
  );
}
