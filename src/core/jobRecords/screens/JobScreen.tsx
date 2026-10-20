import { useMemo, useState } from 'react';
import { Linking, Text, TextInput, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { usePendingUploads, useJobFiles, type JobFile } from '@/core/jobFiles';
import { formatDay, localDate } from '@/core/dates';
import { jobActionsFor, jobListAddons, jobSectionsFor, type JobRowTag } from '@/core/jobs/sections';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { Button, Card, Chip, ErrorText, Notice, Screen, colors, styles } from '@/core/ui';
import { AppBar, Avatar, LoadFailed, LoadingCards, Pill, PhotoGrid, PhotoViewer, SectionLabel, Sheet } from '@/core/ui/kit';
import type { JobUpdate } from '../api';
import { useJobContext, useJobMutations, useJobRecord, useJobRecordsLive, useJobUpdates, usePeople } from '../hooks';
import { STAGE_LABEL, firstName, photoLabel, statusPill, whenLabel } from '../rules';

type Props = { jobId: string; onPost: (stage?: 'completion') => void; onEdit: () => void };
type Tab = 'all' | 'before' | 'progress' | 'completion';

const DAY_MS = 24 * 3600_000;

/** One job (flows board: The job page). Everything about the job on one page, actions at the bottom. */
export function JobScreen({ jobId, onPost, onEdit }: Props) {
  useJobRecordsLive();
  const router = useRouter();
  const { tz, today, userId, isManager } = useJobContext();
  const { isFeatureEnabled } = useTenantSettings();
  const record = useJobRecord(jobId);
  const updates = useJobUpdates(jobId);
  const files = useJobFiles(jobId);
  const people = usePeople();
  const { pending } = usePendingUploads(jobId);
  const { setStatus, edit, remove, instructions, people: setPeople } = useJobMutations();
  const [tab, setTab] = useState<Tab>('all');
  const [viewer, setViewer] = useState<{ list: JobFile[]; i: number } | null>(null);
  const [sheet, setSheet] = useState<'complete' | 'people' | 'instr' | null>(null);
  const [draft, setDraft] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  // Tags from modules (e.g. extra work not yet invoiced), every add-on's hook in a fixed order.
  const addons = jobListAddons();
  const tagSets = addons.map((a) => (a.useRowTags ? a.useRowTags() : {}));
  const tags: JobRowTag[] = tagSets.flatMap((t, i) => (isFeatureEnabled(addons[i].feature) ? t[jobId] ?? [] : []));

  const nameOf = useMemo(() => {
    const m = new Map((people.data ?? []).map((p) => [p.id, p.fullName]));
    return (id: string | null | undefined) => (id ? m.get(id) ?? null : null);
  }, [people.data]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/jobs'));
  const r = record.data;
  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppBar title="Job" onBack={back} />
        <Screen>{record.isLoading ? <LoadingCards n={4} /> : <LoadFailed what="this job" onRetry={() => void record.refetch()} />}</Screen>
      </View>
    );
  }

  const open = r.status !== 'completed' && r.status !== 'cancelled';
  const onIt = r.people.some((p) => p.id === userId);
  const address = r.site_address ?? r.customer_address;
  const photos = (files.data ?? []).filter((f) => f.thumbUrl && (f.kind === 'photo' || f.stage != null));
  const count = (t: Tab) => (t === 'all' ? photos.length : photos.filter((p) => p.stage === t).length);
  const shown = photos.filter((p) => tab === 'all' || p.stage === tab);
  const waiting = pending.filter((p) => tab === 'all' || p.stage === tab);
  const completionCount = count('completion');
  const p = statusPill(r.status);
  const town = address?.split(',').pop()?.trim();

  const meta = [
    r.start_on ? `Start ${formatDay(r.start_on)}` : null,
    r.people.length ? `On it: ${r.people.map((x) => firstName(x.name)).join(', ')}` : 'No one assigned yet',
  ].filter(Boolean).join(' · ');

  const openPeople = () => { setPicked(r.people.map((x) => x.id)); setSheet('people'); };
  const savePeople = () => {
    const before = r.people.map((x) => x.id);
    setPeople.mutate({ jobId, add: picked.filter((id) => !before.includes(id)), remove: before.filter((id) => !picked.includes(id)) }, { onSuccess: () => setSheet(null) });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title={r.summary ?? 'Job'} sub={[r.customer_name, town].filter(Boolean).join(' · ')} onBack={back} />
      <Screen>
        <Card>
          <View style={styles.wrap}>
            <Pill label={p.label} tone={p.tone} icon={p.icon} />
            {isManager ? tags.map((t) => <Pill key={t.label} label={t.label} tone={t.tone === 'danger' ? 'red' : 'amber'} icon="flag" />) : null}
          </View>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            {r.customer_name ? <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 }}>{r.customer_name}</Text> : <View />}
            {isManager ? <Text accessibilityRole="button" onPress={onEdit} style={{ fontSize: 14, fontWeight: '600', color: colors.muted, paddingVertical: 6 }}>Edit details</Text> : null}
          </View>
          {address ? <Text style={styles.muted}>{address}</Text> : null}
          <View style={styles.wrap}>
            {address ? <Button title="Maps" icon="location-outline" variant="secondary" size="sm" onPress={() => void Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`)} /> : null}
            {r.customer_phone ? <Button title={`Call ${r.customer_phone}`} variant="secondary" size="sm" onPress={() => void Linking.openURL(`tel:${r.customer_phone!.replace(/\s/g, '')}`)} /> : null}
          </View>
        </Card>

        <Card>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <SectionLabel>Instructions</SectionLabel>
            {isManager && open ? <Button title="Edit" variant="secondary" size="sm" onPress={() => { setDraft(r.instructions ?? ''); setSheet('instr'); }} /> : null}
          </View>
          <Text style={{ fontSize: 15, color: colors.text }}>{r.instructions || 'No instructions yet.'}</Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{meta}</Text>
          {isManager && open ? (
            <View style={{ alignSelf: 'flex-start' }}><Button title={r.people.length ? 'Change who’s on it' : 'Assign people'} variant="secondary" size="sm" onPress={openPeople} /></View>
          ) : null}
        </Card>

        <Card>
          <SectionLabel>{`Photos · ${photos.length}`}</SectionLabel>
          <View style={styles.wrap}>
            {(['all', 'before', 'progress', 'completion'] as Tab[]).map((t) => (
              <Chip key={t} label={`${t === 'all' ? 'All' : STAGE_LABEL[t]} ${count(t)}`} selected={tab === t} onPress={() => setTab(t)} />
            ))}
          </View>
          {shown.length || waiting.length ? (
            <PhotoGrid
              photos={[...shown.map((f) => ({ id: f.id, thumbUrl: f.thumbUrl, label: f.caption })), ...waiting.map((w) => ({ id: w.id, thumbUrl: w.thumbUri, waiting: true }))]}
              onOpen={(i) => i < shown.length && setViewer({ list: shown, i })}
            />
          ) : (
            <Text style={styles.muted}>{tab === 'completion' && open ? 'Completion photos are added when the work is finished.' : 'No photos here yet.'}</Text>
          )}
          {pending.length ? <Text style={{ fontSize: 13, color: colors.warning }}>{`${pending.length} photo${pending.length === 1 ? '' : 's'} waiting to upload. No signal? It will keep trying.`}</Text> : null}
        </Card>

        {jobSectionsFor(isFeatureEnabled).map(({ id, Component }) => <Component key={id} jobId={jobId} canEdit={open && (isManager || onIt)} />)}

        <Card style={{ gap: 0 }}>
          <View style={{ marginBottom: 6 }}><SectionLabel>{`Updates · ${(updates.data ?? []).length}`}</SectionLabel></View>
          {updates.error ? <ErrorText error={updates.error} /> : null}
          {(updates.data ?? []).length === 0 && !updates.isLoading ? <Text style={[styles.muted, { paddingVertical: 8 }]}>No updates yet. Post the first one when work starts.</Text> : null}
          {(updates.data ?? []).map((u, i) => (
            <UpdateItem key={u.id} u={u} first={i === 0} tz={tz} today={today}
              photos={(files.data ?? []).filter((f) => f.updateId === u.id && f.thumbUrl)}
              onOpenPhoto={(list, idx) => setViewer({ list, i: idx })}
              canChange={isManager || (u.authorId === userId && open && Date.now() - new Date(u.createdAt).getTime() < DAY_MS)}
              onEdit={(body) => edit.mutateAsync({ id: u.id, body })} onDelete={() => remove.mutateAsync(u.id)} />
          ))}
          <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: (updates.data ?? []).length ? 1 : 0, borderColor: colors.border, alignItems: 'center' }}>
            <Avatar name="" grey />
            <Text style={{ fontSize: 13, color: colors.muted, flex: 1 }}>
              {`Job created${r.created_by_name ? ` by ${firstName(r.created_by_name)}` : ''} · ${formatDay(localDate(new Date(r.created_at), tz))}`}
            </Text>
          </View>
        </Card>

        {open && (isManager || onIt) ? (
          <>
            <View style={styles.row}>
              <View style={{ flex: 1 }}><Button title="Post update" icon="camera-outline" size="lg" onPress={() => onPost()} /></View>
              {jobActionsFor(isFeatureEnabled).map((a) => (
                <View key={a.id} style={{ flex: 1 }}>
                  <Button title={a.label} icon={a.icon} size="lg" variant={a.variant ?? 'secondary'} onPress={() => router.push(a.href(jobId) as Href)} />
                </View>
              ))}
            </View>
            {isManager ? <Button title="Mark as completed" icon="checkmark" variant="ok" onPress={() => setSheet('complete')} /> : null}
            {isManager && r.status === 'todo' ? <Button title="Mark as in progress" variant="secondary" busy={setStatus.isPending} onPress={() => setStatus.mutate({ id: jobId, status: 'in_progress' })} /> : null}
          </>
        ) : null}
        {r.status === 'completed' ? (
          <>
            <Notice tone="ok" title={`Completed${r.completed_at ? ` ${formatDay(localDate(new Date(r.completed_at), tz))}` : ''}.`}>Kept here for good, with every photo and update.</Notice>
            {isManager ? <Button title="Reopen" variant="secondary" busy={setStatus.isPending} onPress={() => setStatus.mutate({ id: jobId, status: 'in_progress' })} /> : null}
          </>
        ) : null}
        <ErrorText error={setStatus.error} />
      </Screen>

      <PhotoViewer
        photos={(viewer?.list ?? []).map((f) => ({ url: f.url, label: photoLabel(f.caption, f.stage, nameOf(f.uploadedBy)) }))}
        index={viewer?.i ?? null} onIndex={(i) => setViewer((v) => (v ? { ...v, i } : v))} onClose={() => setViewer(null)} />

      <Sheet visible={sheet === 'complete'} title="Mark as completed?" onClose={() => setSheet(null)}>
        {completionCount
          ? <Text style={{ fontSize: 15, color: colors.muted }}>{`${completionCount} completion photo${completionCount > 1 ? 's' : ''} on the job.`}</Text>
          : <Notice tone="warn" title="No completion photos yet.">You can still complete it, but photos help if the customer asks later.</Notice>}
        {tags.filter((t) => t.tone === 'danger').map((t) => <Notice key={t.label} tone="bad" title={`${t.label}.`} />)}
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Button title="Mark as completed" variant="ok" busy={setStatus.isPending} onPress={() => setStatus.mutate({ id: jobId, status: 'completed' }, { onSuccess: () => setSheet(null) })} /></View>
          <View style={{ flex: 1 }}><Button title="Not yet" variant="secondary" onPress={() => setSheet(null)} /></View>
        </View>
        {!completionCount ? <Button title="Add completion photos first" variant="secondary" onPress={() => { setSheet(null); onPost('completion'); }} /> : null}
      </Sheet>

      <Sheet visible={sheet === 'people'} title="Who’s on it" onClose={() => setSheet(null)}>
        <View style={styles.wrap}>
          {(people.data ?? []).filter((x) => x.role !== 'owner').map((x) => (
            <Chip key={x.id} label={firstName(x.fullName)} selected={picked.includes(x.id)}
              onPress={() => setPicked((s) => (s.includes(x.id) ? s.filter((y) => y !== x.id) : [...s, x.id]))} />
          ))}
        </View>
        <Text style={{ fontSize: 13, color: colors.muted }}>People you add see the job straight away. People you take off stop seeing it.</Text>
        <ErrorText error={setPeople.error} />
        <Button title="Done" busy={setPeople.isPending} onPress={savePeople} />
      </Sheet>

      <Sheet visible={sheet === 'instr'} title="Edit instructions" onClose={() => setSheet(null)}>
        <TextInput value={draft} onChangeText={setDraft} multiline accessibilityLabel="Instructions"
          style={[styles.input, { minHeight: 140, textAlignVertical: 'top' }]} />
        <ErrorText error={instructions.error} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Button title="Save" busy={instructions.isPending} onPress={() => instructions.mutate({ id: jobId, text: draft }, { onSuccess: () => setSheet(null) })} /></View>
          <View style={{ flex: 1 }}><Button title="Cancel" variant="secondary" onPress={() => setSheet(null)} /></View>
        </View>
      </Sheet>
    </View>
  );
}

/** One update in the timeline: initials, who and when, the words, and its photos (4 across). */
function UpdateItem({ u, first, tz, today, photos, onOpenPhoto, canChange, onEdit, onDelete }: {
  u: JobUpdate; first: boolean; tz: string; today: string; photos: JobFile[];
  onOpenPhoto: (list: JobFile[], i: number) => void; canChange: boolean;
  onEdit: (body: string) => Promise<unknown>; onDelete: () => Promise<unknown>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [failed, setFailed] = useState<unknown>(null);
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderColor: colors.border }}>
      <Avatar name={u.authorName ?? '?'} />
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Text style={{ fontSize: 13, color: colors.muted }}>
          <Text style={{ fontWeight: '700', color: colors.text }}>{firstName(u.authorName)}</Text>
          {` · ${whenLabel(u.createdAt, tz, today)}${u.editedAt ? ' · edited' : ''}`}
        </Text>
        {editing !== null ? (
          <View style={{ gap: 8 }}>
            <TextInput value={editing} onChangeText={setEditing} multiline accessibilityLabel="Update" style={[styles.input, { minHeight: 84, textAlignVertical: 'top' }]} />
            <View style={styles.row}>
              <Button title="Save" size="sm" onPress={() => { setFailed(null); onEdit(editing).then(() => setEditing(null), setFailed); }} />
              <Button title="Cancel" size="sm" variant="secondary" onPress={() => setEditing(null)} />
            </View>
          </View>
        ) : u.body ? <Text style={{ fontSize: 15, color: colors.text }}>{u.body}</Text> : null}
        {photos.length ? <PhotoGrid columns={4} square labels={false} photos={photos.map((f) => ({ id: f.id, thumbUrl: f.thumbUrl }))} onOpen={(i) => onOpenPhoto(photos, i)} /> : null}
        {canChange && editing === null ? (
          <View style={styles.row}>
            <Text accessibilityRole="button" onPress={() => setEditing(u.body ?? '')} style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>Edit</Text>
            <Text accessibilityRole="button" onPress={() => { setFailed(null); onDelete().catch(setFailed); }} style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>Delete</Text>
          </View>
        ) : null}
        <ErrorText error={failed} />
      </View>
    </View>
  );
}
