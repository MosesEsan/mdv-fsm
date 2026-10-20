import { Text, View } from 'react-native';
import { CustomerPicker } from '@/core/customers';
import { Button, Card, Chip, ErrorText, Heading, Muted, Screen, TextField, styles } from '@/core/ui';
import { SOURCES } from '../enquiryRules';
import { useNewEnquiry } from '../useNewEnquiry';

/** Log a call or message: who, what they want, how they got in touch, and the viewing if it's arranged. */
export function NewEnquiryScreen({ onSaved }: { onSaved: (jobId: string) => void }) {
  const e = useNewEnquiry(onSaved);
  return (
    <Screen>
      <Card>
        <Heading>Customer</Heading>
        <CustomerPicker selected={e.customer} onSelect={e.pickCustomer} newCustomer={e.form.newCustomer} onNewCustomer={e.setNewCustomer} />
      </Card>
      <Card>
        <Heading>What they want</Heading>
        <TextField label="Looking for" value={e.form.summary} onChange={(v) => e.update({ summary: v })} placeholder="e.g. Oak floor, kitchen and hall" />
        <TextField label="Site address" value={e.form.siteAddress} onChange={(v) => e.update({ siteAddress: v })}
          hint="Leave blank to use the customer's address" multiline />
        <Text style={styles.label}>How they got in touch</Text>
        <View style={styles.wrap}>
          {SOURCES.map(([key, label]) => <Chip key={key} label={label} selected={e.form.source === key} onPress={() => e.update({ source: key })} />)}
        </View>
        <TextField label="Details" value={e.form.details} onChange={(v) => e.update({ details: v })} multiline placeholder="Rooms, budget, timing, anything they mentioned" />
      </Card>
      <Card>
        <Heading>Viewing</Heading>
        <Muted>Optional. You can add it later.</Muted>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><TextField label="Date" value={e.form.viewingDate} onChange={(v) => e.update({ viewingDate: v })} placeholder="2026-11-04" /></View>
          <View style={{ flex: 1 }}><TextField label="Time" value={e.form.viewingTime} onChange={(v) => e.update({ viewingTime: v })} placeholder="10:00" keyboardType="numbers-and-punctuation" /></View>
        </View>
      </Card>
      {e.problems.map((p) => <Muted key={p}>{p}</Muted>)}
      <ErrorText error={e.error} />
      <Button title="Save enquiry" onPress={e.submit} busy={e.saving} disabled={e.problems.length > 0} />
    </Screen>
  );
}
