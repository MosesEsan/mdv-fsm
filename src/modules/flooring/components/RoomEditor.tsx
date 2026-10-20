import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, ErrorText, TextField, styles } from '@/core/ui';
import type { Room } from '../api';
import { previewArea, roomProblems, roomValues, type RoomInput, type RoomValues } from '../rules';

// Common floor types as quick picks; anything else can be typed.
const QUICK_TYPES = ['Laminate', 'Engineered wood', 'Solid wood', 'Vinyl / LVT', 'Carpet', 'Tiles'];

const toInput = (r?: Room): RoomInput => ({
  name: r?.name ?? '', length: r?.length_m?.toString() ?? '', width: r?.width_m?.toString() ?? '',
  area: r?.length_m && r?.width_m ? '' : r?.area_m2?.toString() ?? '', floorType: r?.floor_type ?? '', notes: r?.notes ?? '',
});

type Props = { room?: Room; busy: boolean; error: unknown; onSave: (v: RoomValues) => void; onCancel: () => void; onDelete?: () => void };

export function RoomEditor({ room, busy, error, onSave, onCancel, onDelete }: Props) {
  const [r, setR] = useState<RoomInput>(() => toInput(room));
  const set = (patch: Partial<RoomInput>) => setR((x) => ({ ...x, ...patch }));
  const problems = roomProblems(r);
  const area = previewArea(r);
  const hasSides = Boolean(r.length.trim() || r.width.trim());

  return (
    <View style={{ gap: 8, paddingVertical: 8 }}>
      <TextField label="Room" value={r.name} onChange={(v) => set({ name: v })} placeholder="e.g. Kitchen" autoCapitalize="words" />
      <View style={styles.row}>
        <View style={{ flex: 1 }}><TextField label="Length (m)" value={r.length} onChange={(v) => set({ length: v })} keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 1 }}><TextField label="Width (m)" value={r.width} onChange={(v) => set({ width: v })} keyboardType="numbers-and-punctuation" /></View>
      </View>
      {!hasSides ? <TextField label="Or area (m²)" value={r.area} onChange={(v) => set({ area: v })} keyboardType="numbers-and-punctuation" hint="For odd-shaped rooms" /> : null}
      <Text style={styles.label}>{area ? `Area: ${area} m²` : 'Area: –'}</Text>
      <Text style={styles.label}>Floor</Text>
      <View style={styles.wrap}>
        {QUICK_TYPES.map((t) => <Chip key={t} label={t} selected={r.floorType === t} onPress={() => set({ floorType: r.floorType === t ? '' : t })} />)}
      </View>
      <TextField label="Floor (other)" value={QUICK_TYPES.includes(r.floorType) ? '' : r.floorType} onChange={(v) => set({ floorType: v })} placeholder="e.g. Herringbone oak" />
      <TextField label="Notes" value={r.notes} onChange={(v) => set({ notes: v })} multiline placeholder="Door bars, skirting, furniture to move…" />
      {problems.map((p) => <Text key={p} style={styles.muted}>{p}</Text>)}
      <ErrorText error={error} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}><Button title="Save room" onPress={() => onSave(roomValues(r))} busy={busy} disabled={problems.length > 0} /></View>
        <View style={{ flex: 1 }}><Button title="Cancel" variant="secondary" onPress={onCancel} /></View>
      </View>
      {onDelete ? <Button title="Remove room" variant="danger" onPress={onDelete} /> : null}
    </View>
  );
}
