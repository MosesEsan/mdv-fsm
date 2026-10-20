import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, ErrorText, Loading, Muted, TextField, styles } from '@/core/ui';
import { CustomerFields } from './CustomerFields';
import { useCustomerSearch } from './hooks';
import { emptyCustomer, type Customer, type CustomerInput } from './rules';

type Props = {
  selected: Customer | null;
  onSelect: (c: Customer | null) => void;
  /** When nobody matches, the person can type a new customer instead. */
  newCustomer: CustomerInput | null;
  onNewCustomer: (c: CustomerInput | null) => void;
};

/** Find an existing customer by name, phone or email, or add a new one. */
export function CustomerPicker({ selected, onSelect, newCustomer, onNewCustomer }: Props) {
  const [term, setTerm] = useState('');
  const search = useCustomerSearch(term);

  if (selected) {
    return (
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>{selected.name}</Text>
        <Text style={styles.muted}>{[selected.phone, selected.email, selected.address].filter(Boolean).join(' · ')}</Text>
        <Button title="Change customer" variant="secondary" onPress={() => onSelect(null)} />
      </View>
    );
  }
  if (newCustomer) {
    return (
      <View style={{ gap: 8 }}>
        <CustomerFields value={newCustomer} onChange={onNewCustomer} />
        <Button title="Pick an existing customer instead" variant="secondary" onPress={() => onNewCustomer(null)} />
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <TextField label="Find a customer" value={term} onChange={setTerm} placeholder="Name, phone or email" />
      {search.isLoading ? <Loading /> : null}
      <ErrorText error={search.error} />
      {term.trim().length >= 2 && search.data?.length === 0 ? <Muted>No one found.</Muted> : null}
      {(term.trim().length >= 2 ? search.data ?? [] : []).map((c) => (
        <Pressable key={c.id} accessibilityRole="button" onPress={() => onSelect(c)} style={{ paddingVertical: 8, borderTopWidth: 1, borderColor: '#d1d9e0' }}>
          <Text style={styles.label}>{c.name}</Text>
          <Text style={styles.muted}>{[c.phone, c.email, c.address].filter(Boolean).join(' · ')}</Text>
        </Pressable>
      ))}
      <Button title="New customer" variant="secondary" onPress={() => onNewCustomer({ ...emptyCustomer(), name: /\d/.test(term) ? '' : term.trim(), phone: /\d/.test(term) ? term.trim() : '' })} />
    </View>
  );
}
