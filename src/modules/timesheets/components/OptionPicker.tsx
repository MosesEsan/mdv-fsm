import { Text, View } from 'react-native';
import { Chip, Muted, styles } from '@/core/ui';
import type { Option } from '../schemas/types';

type Props = {
  label: string;
  options: Option[] | undefined;
  value: string | null;
  onChange: (id: string | null) => void;
  required?: boolean;
  disabled?: boolean;
  emptyText?: string;
};

/** Job or cost-code picker. Tapping the selected chip clears it (when not required). */
export function OptionPicker({ label, options, value, onChange, required, disabled, emptyText }: Props) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}{required ? '' : ' (optional)'}</Text>
      {!options?.length ? <Muted>{emptyText ?? 'Nothing to pick yet.'}</Muted> : null}
      <View style={styles.wrap}>
        {options?.map((o) => (
          <Chip
            key={o.id}
            label={o.label}
            selected={o.id === value}
            disabled={disabled}
            onPress={() => onChange(o.id === value && !required ? null : o.id)}
          />
        ))}
      </View>
    </View>
  );
}
