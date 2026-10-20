import { Pressable, Switch, Text, View } from 'react-native';
import { formatDay, formatMinutes } from '@/core/dates';
import { PeriodPicker } from '@/core/dates/PeriodPicker';
import { Button, Card, Chip, ErrorText, Heading, Loading, Muted, Screen, styles } from '@/core/ui';
import type { ReportGroup } from '../api/reports';
import { useHoursReportScreen } from '../hooks/useHoursReport';
import { readyContext, useTimesheetsContext, type ReadyTimesheetsContext } from '../hooks/useTimesheetsContext';

const groups: { value: ReportGroup; label: string }[] = [
  { value: 'worker', label: 'By person' },
  { value: 'job', label: 'By job' },
  { value: 'week', label: 'By week' },
];

export function HoursReportScreen() {
  const ctx = readyContext(useTimesheetsContext());
  if (!ctx) return <Loading />;
  if (!ctx.actor.isManager) return <Screen><Muted>Only the owner or a manager can see reports.</Muted></Screen>;
  return <HoursReport ctx={ctx} />;
}

function HoursReport({ ctx }: { ctx: ReadyTimesheetsContext }) {
  const r = useHoursReportScreen(ctx);
  const rounded = r.roundingStep > 0;

  return (
    <Screen>
      <Card>
        <PeriodPicker selection={r.selection} />
        <View style={styles.wrap}>
          {groups.map((g) => <Chip key={g.value} label={g.label} selected={r.group === g.value} onPress={() => r.setGroup(g.value)} />)}
        </View>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.muted}>Only signed-off weeks</Text>
          <Switch value={r.onlySignedOff} onValueChange={r.setOnlySignedOff} accessibilityLabel="Only signed-off weeks" />
        </View>
      </Card>

      {r.isLoading ? <Loading /> : <ErrorText error={r.error} />}
      {!r.isLoading && !r.problem && r.rows.length === 0 ? <Muted>No hours in this period.</Muted> : null}
      {r.rows.length ? (
        <Card>
          {r.rows.map((row) => (
            <View key={row.group_key} style={[styles.row, { justifyContent: 'space-between', paddingVertical: 4 }]}>
              <Text style={[styles.label, { flex: 1 }]} numberOfLines={1}>
                {r.group === 'week' ? `Week of ${formatDay(row.label)}` : row.label}
              </Text>
              <Text style={styles.label}>{formatMinutes(rounded ? row.rounded_minutes : row.total_minutes)}</Text>
            </View>
          ))}
          <View style={[styles.row, { justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#d1d9e0', paddingTop: 8 }]}>
            <Heading>Total</Heading>
            <Heading>{formatMinutes(rounded ? r.roundedMinutes : r.totalMinutes)}</Heading>
          </View>
          {rounded ? <Muted>{`Each entry rounded to the nearest ${r.roundingStep} minutes. Exact: ${formatMinutes(r.totalMinutes)}.`}</Muted> : null}
        </Card>
      ) : null}

      {r.canExport ? (
        <Card>
          <Heading>Export for payroll</Heading>
          <Muted>{`Includes signed-off weeks that start between ${formatDay(r.period.from)} and ${formatDay(r.period.to)}. Exported weeks are locked.`}</Muted>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.muted}>Include weeks exported before</Text>
            <Switch value={r.includeExported} onValueChange={r.setIncludeExported} accessibilityLabel="Include weeks exported before" />
          </View>
          <ErrorText error={r.exportError ?? r.openError} />
          {r.notice ? <Muted>{r.notice}</Muted> : null}
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Button title="Spreadsheet (CSV)" onPress={() => r.exportAs('csv')} disabled={Boolean(r.problem)} busy={r.exporting} /></View>
            <View style={{ flex: 1 }}><Button title="PDF summary" variant="secondary" onPress={() => r.exportAs('pdf')} disabled={Boolean(r.problem)} busy={r.exporting} /></View>
          </View>
        </Card>
      ) : null}

      {r.pastExports.length ? (
        <Card>
          <Text style={styles.label}>Earlier exports</Text>
          {r.pastExports.map((e) => (
            <Pressable key={e.id} accessibilityRole="button" onPress={() => r.openExport(e.storage_path)} style={{ paddingVertical: 6 }}>
              <Text style={styles.label}>{`${e.format.toUpperCase()} · ${e.period_from ? formatDay(e.period_from) : ''} – ${e.period_to ? formatDay(e.period_to) : ''}`}</Text>
              <Muted>{`${Number(e.meta.week_count ?? 0)} weeks · ${formatMinutes(Number(e.meta.total_minutes ?? 0))} · ${new Date(e.created_at).toLocaleDateString('en-IE', { timeZone: ctx.timezone })}`}</Muted>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
