import { Text, TextInput, View } from 'react-native';
import { Muted, styles } from '@/core/ui';

type Props = {
  editable: boolean;       // breaks = 'manual'
  value: string;
  onChange: (value: string) => void;
  note: string | null;     // e.g. fixed-break explanation
};

export function BreakField({ editable, value, onChange, note }: Props) {
  if (!editable) return note ? <Muted>{note}</Muted> : null;
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>Break</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, { width: 80 }]} value={value} onChangeText={onChange} placeholder="0" keyboardType="number-pad" accessibilityLabel="Break in minutes" />
        <Text style={styles.muted}>minutes</Text>
      </View>
    </View>
  );
}
