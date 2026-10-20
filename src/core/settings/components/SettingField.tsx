import { useEffect, useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { Chip, Muted, styles } from '@/core/ui';
import type { AnySettingField } from '../fields';

type Props = {
  field: AnySettingField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly: boolean;
};

export function SettingField({ field, value, onChange, readOnly }: Props) {
  return (
    <View style={{ gap: 6, paddingVertical: 8 }}>
      <Text style={styles.label}>{field.label}</Text>
      {field.description ? <Muted>{field.description}</Muted> : null}
      {field.kind === 'choice' && <ChoiceInput field={field} value={value} onChange={onChange} readOnly={readOnly} />}
      {field.kind === 'toggle' && (
        <Switch value={value === true} onValueChange={onChange} disabled={readOnly} accessibilityLabel={field.label} />
      )}
      {field.kind === 'number' && <NumberInput field={field} value={value} onChange={onChange} readOnly={readOnly} />}
    </View>
  );
}

function ChoiceInput({ field, value, onChange, readOnly }: Props) {
  const options = field.options ?? [];
  const selected = options.find((o) => o.value === String(value));
  // Numeric literal choices (e.g. rounding) are stored as numbers.
  const toValue = (raw: string) => (typeof value === 'number' ? Number(raw) : raw);
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.wrap} accessibilityRole="radiogroup">
        {options.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={o.value === String(value)}
            disabled={readOnly}
            onPress={() => onChange(toValue(o.value))}
          />
        ))}
      </View>
      {selected?.description ? <Muted>{selected.description}</Muted> : null}
    </View>
  );
}

function NumberInput({ field, value, onChange, readOnly }: Props) {
  const [text, setText] = useState(value == null ? '' : String(value));
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => setText(value == null ? '' : String(value)), [value]);

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed === '' && field.emptyLabel) {
      setProblem(null);
      if (value !== null) onChange(null);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < (field.min ?? -Infinity) || n > (field.max ?? Infinity)) {
      setProblem(`Enter a whole number from ${field.min} to ${field.max}`);
      return;
    }
    setProblem(null);
    if (n !== value) onChange(n);
  };

  return (
    <View style={{ gap: 4 }}>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { width: 110 }]}
          value={text}
          onChangeText={setText}
          onBlur={commit}
          onSubmitEditing={commit}
          editable={!readOnly}
          keyboardType="number-pad"
          placeholder={field.emptyLabel}
          accessibilityLabel={field.label}
        />
        {field.unit ? <Muted>{field.unit}</Muted> : null}
      </View>
      {problem ? <Text style={styles.error}>{problem}</Text> : null}
    </View>
  );
}
