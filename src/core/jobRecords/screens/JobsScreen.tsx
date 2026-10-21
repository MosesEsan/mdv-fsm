import { useState } from 'react';
import { Image, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/core/auth/AuthProvider';
import { useBranding } from '@/core/branding';
import { brandInitials } from '@/core/branding/BrandMark';
import { jobListAddons, type JobRowTag } from '@/core/jobs/sections';
import { TabBar } from '@/core/modules/TabBar';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { Button, Chip, Screen, colors, styles, useTheme } from '@/core/ui';
import { AppBar, EmptyBox, ListRow, LoadFailed, LoadingCards, Pill, type PillTone } from '@/core/ui/kit';
import { useJobContext, useJobList, useJobRecordsLive } from '../hooks';
import { jobRowLine, statusPill } from '../rules';

type Props = { onOpen: (jobId: string) => void; onNew: () => void };

const TAG_TONE: Record<JobRowTag['tone'], PillTone> = { danger: 'red', warning: 'amber', success: 'green', neutral: 'grey' };

/**
 * Every job the person can see (flows board: Jobs list). Search, Active / Completed with counts,
 * "New job" for the owner and manager. Bottom tabs lead to the rest of the app.
 */
export function JobsScreen({ onOpen, onNew }: Props) {
  useJobRecordsLive();
  const { tz, today, isManager } = useJobContext();
  const { isFeatureEnabled } = useTenantSettings();
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [query, setQuery] = useState('');
  const q = query.trim();
  const list = useJobList('all', q);

  // Hooks run in a fixed order: every registered add-on, switched on or not.
  const addons = jobListAddons();
  const tagSets = addons.map((a) => (a.useRowTags ? a.useRowTags() : {}));
  const on = addons.map((a) => isFeatureEnabled(a.feature));
  const tagsFor = (id: string): JobRowTag[] => tagSets.flatMap((t, i) => (on[i] ? t[id] ?? [] : []));

  const all = list.data ?? [];
  const counts = { active: all.filter((j) => j.status !== 'completed' && j.status !== 'cancelled').length, completed: all.filter((j) => j.status === 'completed').length };
  const rows = q ? all : all.filter((j) => (filter === 'completed' ? j.status === 'completed' : j.status !== 'completed' && j.status !== 'cancelled'));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <JobsBar canAdd={isManager} onNew={onNew} query={query} onQuery={setQuery} />
      <Screen>
        {list.isLoading ? <LoadingCards /> : null}
        {list.error && !list.data ? <LoadFailed what="your jobs" onRetry={() => void list.refetch()} /> : null}
        {list.data ? (
          <>
            {!q ? addons.map((a, i) => (on[i] && a.Banner ? <a.Banner key={a.id} /> : null)) : null}
            {!q ? (
              <View style={styles.wrap}>
                <Chip label={`Active · ${counts.active}`} selected={filter === 'active'} onPress={() => setFilter('active')} />
                <Chip label={`Completed · ${counts.completed}`} selected={filter === 'completed'} onPress={() => setFilter('completed')} />
              </View>
            ) : <Text style={styles.muted}>{`${rows.length} job${rows.length === 1 ? '' : 's'} match "${q}"`}</Text>}
            {rows.length === 0 ? (
              q ? <EmptyBox icon="search-outline" title="No jobs match" text="Try a customer name, a street, or a word from an update." />
                : filter === 'completed' ? <EmptyBox icon="checkmark-circle-outline" title="No completed jobs yet" text="Finished jobs stay here with every photo and update, so you can look back any time." />
                : isManager ? <EmptyBox icon="clipboard-outline" title="No jobs yet" text="Add your first job: the customer, the address and what needs doing."><Button title="New job" icon="add" onPress={onNew} /></EmptyBox>
                : <EmptyBox icon="clipboard-outline" title="No jobs for you yet" text="When you’re added to a job, it shows up here with everything you need." />
            ) : null}
            {rows.map((j) => {
              const p = statusPill(j.status);
              return (
                <ListRow key={j.id} title={j.summary ?? 'Untitled job'} onPress={() => onOpen(j.id)}
                  lines={[[j.customer_name, j.site_address].filter(Boolean).join(' · '), jobRowLine(j, tz, today)]}>
                  <Pill label={p.label} tone={p.tone} icon={p.icon} />
                  {tagsFor(j.id).map((t) => <Pill key={t.label} label={t.label} tone={TAG_TONE[t.tone]} icon={t.tone === 'danger' ? 'flag' : undefined} />)}
                  {j.people_count ? null : <Pill label="No one assigned" icon="person-outline" />}
                </ListRow>
              );
            })}
          </>
        ) : null}
      </Screen>
      <TabBar />
    </View>
  );
}

/** Coloured bar: logo, "Jobs", business and person, New job, and the search box. */
function JobsBar({ canAdd, onNew, query, onQuery }: { canAdd: boolean; onNew: () => void; query: string; onQuery: (v: string) => void }) {
  const theme = useTheme();
  const brand = useBranding();
  const { session } = useSession();
  const router = useRouter();
  const person = typeof session?.user.user_metadata?.full_name === 'string' ? session.user.user_metadata.full_name : null;
  return (
    <AppBar
      title="Jobs"
      sub={[brand.name, person].filter(Boolean).join(' · ')}
      onBack={router.canGoBack() ? () => router.back() : undefined}
      lead={(
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginLeft: 4, marginRight: 6 }}>
          {brand.logoUrl ? <Image source={{ uri: brand.logoUrl }} style={{ width: 40, height: 40 }} resizeMode="contain" accessibilityLabel="Logo" />
            : <Text style={{ color: theme.primary, fontSize: 17, fontWeight: '800' }}>{brandInitials(brand.name)}</Text>}
        </View>
      )}
      right={canAdd ? <Button title="New job" icon="add" variant="accent" size="sm" onPress={onNew} /> : null}
      below={(
        <TextInput value={query} onChangeText={onQuery} placeholder="Search customer, address or what was done" accessibilityLabel="Search jobs"
          autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" placeholderTextColor={colors.muted}
          style={[styles.input, { borderColor: 'transparent' }]} />
      )}
    />
  );
}
