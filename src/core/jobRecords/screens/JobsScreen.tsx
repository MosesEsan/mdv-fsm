import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { jobListAddons, type JobRowTag } from '@/core/jobs/sections';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { Button, Card, Chip, ErrorText, Loading, Muted, Screen, TextField, colors, styles } from '@/core/ui';
import { useJobContext, useJobList, useJobRecordsLive } from '../hooks';
import { jobRowLine, type JobFilter } from '../rules';
import { Pill, StatusPill } from '../components/StatusPill';

type Props = { onOpen: (jobId: string) => void; onNew: () => void };

/** Every job the person can see: search, Active / Completed, and a New job button for managers. */
export function JobsScreen({ onOpen, onNew }: Props) {
  useJobRecordsLive();
  const { tz, today, isManager } = useJobContext();
  const { isFeatureEnabled } = useTenantSettings();
  const [filter, setFilter] = useState<JobFilter>('active');
  const [query, setQuery] = useState('');
  const list = useJobList(filter, query);

  // Hooks run in a fixed order: every registered add-on, switched on or not.
  const addons = jobListAddons();
  const tagSets = addons.map((a) => (a.useRowTags ? a.useRowTags() : {}));
  const on = addons.map((a) => isFeatureEnabled(a.feature));
  const tagsFor = (id: string): JobRowTag[] => tagSets.flatMap((t, i) => (on[i] ? t[id] ?? [] : []));

  const rows = list.data ?? [];
  return (
    <Screen>
      {addons.map((a, i) => (on[i] && a.Banner ? <a.Banner key={a.id} /> : null))}
      {isManager ? <Button title="New job" onPress={onNew} /> : null}
      <TextField label="Search" value={query} onChange={setQuery} placeholder="Address, customer, or words from an update" autoCapitalize="none" />
      <View style={styles.wrap}>
        <Chip label="Active" selected={filter === 'active'} onPress={() => setFilter('active')} />
        <Chip label="Completed" selected={filter === 'completed'} onPress={() => setFilter('completed')} />
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
      </View>
      {list.isLoading ? <Loading /> : null}
      <ErrorText error={list.error} />
      {!list.isLoading && rows.length === 0 ? (
        <Muted>{query.trim() ? 'No jobs match that search.' : filter === 'completed' ? 'No completed jobs yet.' : isManager ? 'No jobs yet. Add the first one.' : 'You are not on any jobs yet.'}</Muted>
      ) : null}
      {rows.map((j) => (
        <Pressable key={j.id} accessibilityRole="button" onPress={() => onOpen(j.id)}>
          <Card>
            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <Text style={[styles.label, { flex: 1 }]}>{j.summary ?? 'Untitled job'}</Text>
              <StatusPill status={j.status} />
            </View>
            <Text style={{ color: colors.text }}>{[j.customer_name, j.site_address].filter(Boolean).join(' · ')}</Text>
            <Muted>{jobRowLine(j, tz, today)}{j.people_count ? ` · ${j.people_count} on it` : ''}</Muted>
            {tagsFor(j.id).length ? <View style={styles.wrap}>{tagsFor(j.id).map((t) => <Pill key={t.label} label={t.label} tone={t.tone} />)}</View> : null}
            {query.trim() && j.matched ? <Muted>Matched in the updates</Muted> : null}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
