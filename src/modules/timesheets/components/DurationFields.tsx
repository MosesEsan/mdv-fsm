import { Text, TextInput, View } from 'react-native';
import { styles } from '@/core/ui';

type Props = {
  hours: string;
  minutes: string;
  onChange: (field: 'hours' | 'minutes', value: string) => void;
  editable: boolean;
};

export function DurationFields({ hours, minutes, onChange, editable }: Props) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>Time worked</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, { width: 80 }]} value={hours} onChangeText={(v) => onChange('hours', v)} placeholder="8" keyboardType="number-pad" editable={editable} accessibilityLabel="Hours" />
        <Text style={styles.muted}>hours</Text>
        <TextInput style={[styles.input, { width: 80 }]} value={minutes} onChangeText={(v) => onChange('minutes', v)} placeholder="0" keyboardType="number-pad" editable={editable} accessibilityLabel="Minutes" />
        <Text style={styles.muted}>minutes</Text>
      </View>
    </View>
  );
}
