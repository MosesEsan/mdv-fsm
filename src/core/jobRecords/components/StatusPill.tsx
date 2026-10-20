import { Text } from 'react-native';
import { statusLabel, statusTone } from '../rules';

const TONES = {
  neutral: { bg: '#EEF1F4', fg: '#3D4954' },
  warning: { bg: '#FDF1DC', fg: '#8A5A00' },
  success: { bg: '#E3F3E8', fg: '#1E6B3A' },
  danger: { bg: '#FBE4E1', fg: '#9A2A1C' },
} as const;

export function Pill({ label, tone }: { label: string; tone: keyof typeof TONES }) {
  const t = TONES[tone];
  return (
    <Text style={{ alignSelf: 'flex-start', backgroundColor: t.bg, color: t.fg, fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' }}>
      {label}
    </Text>
  );
}

export const StatusPill = ({ status }: { status: string }) => <Pill label={statusLabel(status)} tone={statusTone(status)} />;
