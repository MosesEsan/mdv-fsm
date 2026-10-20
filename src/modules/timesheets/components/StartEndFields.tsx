import { Text, TextInput, View } from 'react-native';
import { Muted, styles } from '@/core/ui';

type Props = {
  start: string;
  end: string;
  onChange: (field: 'start' | 'end', value: string) => void;
  editable: boolean;
};

// Plain HH:MM inputs keep dependencies at zero; swap for a native time picker if preferred.
export function StartEndFields({ start, end, onChange, editable }: Props) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.label}>Start</Text>
          <TextInput style={styles.input} value={start} onChangeText={(v) => onChange('start', v)} placeholder="08:00" keyboardType="numbers-and-punctuation" editable={editable} accessibilityLabel="Start time" />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.label}>Finish</Text>
          <TextInput style={styles.input} value={end} onChangeText={(v) => onChange('end', v)} placeholder="16:30" keyboardType="numbers-and-punctuation" editable={editable} accessibilityLabel="Finish time" />
        </View>
      </View>
      <Muted>A finish time earlier than the start counts as the next day.</Muted>
    </View>
  );
}
