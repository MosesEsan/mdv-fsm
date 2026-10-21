// Minimal shared UI primitives. Neutral colours here; each business's brand colours
// (tenants.branding) arrive through ThemeProvider, so no client is named in code.
// Sizes follow the flows board's design guide (spacing 4/8/12/16/24, fields and buttons 48, the big action 52).
import { createContext, useContext, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
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

export function Screen({ children, scroll = true, contentStyle }: { children: ReactNode; scroll?: boolean; contentStyle?: ViewStyle }) {
  return scroll ? (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.screenContent, contentStyle]} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screen, styles.screenContent, contentStyle]}>{children}</View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

/** The big title at the top of a screen (26, bold). */
export function Title({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={styles.title}>{children}</Text>;
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

const NOTICE = {
  bad: { bg: '#FFEBE9', border: colors.danger, text: '#82071E', mark: colors.danger },
  warn: { bg: '#FFF8E5', border: '#E8CF8A', text: '#5C3D00', mark: colors.warning },
  ok: { bg: '#E6F4EA', border: '#9BD3AE', text: '#0F5323', mark: colors.success },
  info: { bg: '#F0F2F4', border: colors.border, text: colors.text, mark: colors.muted },
} as const;

/** A boxed message: problems after Save, warnings, confirmations. Words plus a mark, never colour alone. */
export function Notice({ tone = 'info', title, children }: { tone?: keyof typeof NOTICE; title: string; children?: ReactNode }) {
  const t = NOTICE[tone];
  return (
    <View accessibilityRole={tone === 'bad' ? 'alert' : undefined} style={[styles.notice, { backgroundColor: t.bg, borderColor: t.border }]}>
      <View style={[styles.noticeMark, { backgroundColor: t.mark }]}><Text style={styles.noticeMarkText}>{tone === 'ok' ? '✓' : '!'}</Text></View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{title}</Text>
        {children ? <Text style={{ fontSize: 15, color: t.text }}>{children}</Text> : null}
      </View>
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  /** accent: the business's second colour (e.g. Log extra work); ok: green (e.g. Mark as completed). */
  variant?: 'primary' | 'secondary' | 'danger' | 'accent' | 'ok';
  /** 'lg' is the one big action on a screen (52 high); 'sm' fits in cards and bars (44). */
  size?: 'sm' | 'md' | 'lg';
  /** Ionicons name shown before the title. */
  icon?: string;
  disabled?: boolean;
  busy?: boolean;
};

export function Button({ title, onPress, variant = 'primary', size = 'md', icon, disabled, busy }: ButtonProps) {
  const theme = useTheme();
  const filled = variant !== 'secondary';
  const bg = variant === 'danger' ? colors.danger : variant === 'ok' ? colors.success : variant === 'accent' ? theme.accent
    : variant === 'primary' ? theme.primary : colors.surface;
  const fg = filled ? '#fff' : colors.text;
  const font = size === 'lg' ? 17 : size === 'sm' ? 15 : 16;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        size === 'lg' && { minHeight: 52 },
        size === 'sm' && { minHeight: 44, paddingHorizontal: 14, paddingVertical: 8 },
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        !filled && { borderWidth: 1, borderColor: colors.border },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon ? <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={font + 1} color={fg} /> : null}
          <Text style={[styles.buttonText, { fontSize: font, color: fg }]}>{title}</Text>
        </View>
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
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  heading: { fontSize: 18, fontWeight: '600', color: colors.text },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  hint: { fontSize: 13, color: colors.muted },
  error: { fontSize: 14, color: colors.danger },
  fieldError: { fontSize: 13, fontWeight: '600', color: colors.danger },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.text, backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.surface },
  chipText: { fontSize: 14, color: colors.text },
  notice: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  noticeMark: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  noticeMarkText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

type TextFieldProps = {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
  /** A problem with this field, shown under it in red. */
  error?: string | null;
  /** Hides what's typed (passwords). */
  secure?: boolean;
  editable?: boolean; multiline?: boolean; autoCapitalize?: 'none' | 'sentences' | 'words'; keyboardType?: 'default' | 'numbers-and-punctuation' | 'email-address' | 'phone-pad';
};

/** Labelled text box used by core forms: label above, hint or problem below. */
export function TextField({ label, value, onChange, placeholder, hint, error, secure, editable = true, multiline, autoCapitalize, keyboardType }: TextFieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { minHeight: 84, textAlignVertical: 'top' }, error ? { borderColor: colors.danger } : null]}
        value={value} onChangeText={onChange} placeholder={placeholder} accessibilityLabel={label} accessibilityHint={hint}
        editable={editable} multiline={multiline} secureTextEntry={secure} autoCapitalize={secure ? 'none' : autoCapitalize} autoCorrect={secure ? false : undefined}
        keyboardType={keyboardType} />
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
