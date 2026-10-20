import { Text, TextInput, View } from 'react-native';
import { Chip, ErrorText, Muted, styles } from '@/core/ui';
import { formatDay } from './calendar';
import { presetLabels, type PeriodPreset } from './periods';
import type { PeriodSelection } from './usePeriodSelection';

/** Preset chips (this week, last month…) or custom dates. Pair with usePeriodSelection(). */
export function PeriodPicker({ selection }: { selection: PeriodSelection }) {
  const s = selection;
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>Period</Text>
      <View style={styles.wrap}>
        {(Object.keys(presetLabels) as PeriodPreset[]).map((p) => (
          <Chip key={p} label={presetLabels[p]} selected={s.preset === p} onPress={() => s.setPreset(p)} />
        ))}
      </View>
      {s.preset === 'custom' ? (
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} value={s.custom.from} onChangeText={(from) => s.setCustom({ ...s.custom, from })} placeholder="2026-10-05" accessibilityLabel="From date" />
          <Text style={styles.muted}>to</Text>
          <TextInput style={[styles.input, { flex: 1 }]} value={s.custom.to} onChangeText={(to) => s.setCustom({ ...s.custom, to })} placeholder="2026-10-11" accessibilityLabel="To date" />
        </View>
      ) : (
        <Muted>{`${formatDay(s.period.from)} – ${formatDay(s.period.to)}`}</Muted>
      )}
      <ErrorText error={s.problem} />
    </View>
  );
}
