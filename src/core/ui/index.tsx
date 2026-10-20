// Minimal shared UI primitives. Neutral colours here; each business's brand colours
// (tenants.branding) arrive through ThemeProvider, so no client is named in code.
import { createContext, useContext, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

export const colors = {
  text: '#1f2328',
  muted: '#59636e',
  border: '#d1d9e0',
  surface: '#ffffff',
  background: '#f6f8fa',
  primary: '#1f6feb',
  danger: '#cf222e',
  success: '#1a7f37',
  warning: '#9a6700',
};

export type Theme = { primary: string; accent: string };
const ThemeContext = createContext<Theme>({ primary: colors.primary, accent: colors.primary });

/** Supplies brand colours to every Button and Chip below it. Missing colours fall back to neutral ones. */
export function ThemeProvider({ primary, accent, children }: { primary?: string; accent?: string; children: ReactNode }) {
  const p = primary ?? colors.primary;
  return <ThemeContext.Provider value={{ primary: p, accent: accent ?? p }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return scroll ? (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screen, styles.screenContent]}>{children}</View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  return <Text style={styles.error}>{message}</Text>;
}

export function Loading() {
  return <ActivityIndicator style={{ marginTop: 32 }} />;
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  busy?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled, busy }: ButtonProps) {
  const theme = useTheme();
  const filled = variant !== 'secondary';
  const bg = variant === 'danger' ? colors.danger : variant === 'primary' ? theme.primary : colors.surface;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        !filled && { borderWidth: 1, borderColor: colors.border },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={filled ? '#fff' : colors.text} />
      ) : (
        <Text style={[styles.buttonText, { color: filled ? '#fff' : colors.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.chip, selected && { backgroundColor: theme.accent, borderColor: theme.accent }, disabled && { opacity: 0.6 }]}
    >
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8 },
  heading: { fontSize: 18, fontWeight: '600', color: colors.text },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  error: { fontSize: 14, color: colors.danger },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.text, backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.surface },
  chipText: { fontSize: 14, color: colors.text },
});

type TextFieldProps = {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
  editable?: boolean; multiline?: boolean; autoCapitalize?: 'none' | 'sentences' | 'words'; keyboardType?: 'default' | 'numbers-and-punctuation' | 'email-address' | 'phone-pad';
};

/** Labelled text box used by core forms. */
export function TextField({ label, value, onChange, placeholder, hint, editable = true, multiline, autoCapitalize, keyboardType }: TextFieldProps) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, multiline && { minHeight: 72, textAlignVertical: 'top' }]} value={value} onChangeText={onChange}
        placeholder={placeholder} accessibilityLabel={label} editable={editable} multiline={multiline} autoCapitalize={autoCapitalize} keyboardType={keyboardType} />
      {hint ? <Text style={styles.muted}>{hint}</Text> : null}
    </View>
  );
}
