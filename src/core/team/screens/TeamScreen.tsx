import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { isOwnerRole } from '@/core/auth/claims';
import { useSession } from '@/core/auth/AuthProvider';
import { useBranding } from '@/core/branding';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { Button, Chip, ErrorText, Notice, Screen, TextField, colors, styles } from '@/core/ui';
import { AppBar, EmptyBox, ListRow, LoadFailed, LoadingCards, Pill, Sheet } from '@/core/ui/kit';
import { useTeam, useTeamMutations } from '../hooks';
import { inviteProblems, memberStatus, teamRoleOptions, type Member, type TeamRole } from '../rules';

/** Owner only: everyone in the business; invite someone; change what they do or switch their access off. */
export function TeamScreen() {
  const router = useRouter();
  const { claims } = useSession();
  const owner = isOwnerRole(claims?.role);
  const brand = useBranding();
  const { isFeatureEnabled } = useTenantSettings();
  const team = useTeam(owner);
  const { invite, update } = useTeamMutations();
  const roles = teamRoleOptions(isFeatureEnabled);

  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: TeamRole | null }>({ name: '', email: '', role: 'worker' });
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [draft, setDraft] = useState<{ name: string; role: string; active: boolean }>({ name: '', role: 'worker', active: true });

  const back = () => (router.canGoBack() ? router.back() : router.replace('/settings'));
  const problems = inviteProblems(form);
  const label = (role: string) => brand.roleLabel(role as never) || role;

  const sendInvite = () => {
    setTried(true);
    if (problems.length || !form.role) return;
    invite.mutate({ fullName: form.name.trim(), email: form.email.trim(), role: form.role }, {
      onSuccess: () => { setSent(form.email.trim()); setInviting(false); setTried(false); setForm({ name: '', email: '', role: 'worker' }); },
    });
  };
  const openMember = (m: Member) => { setEditing(m); setDraft({ name: m.full_name ?? '', role: m.role, active: m.active }); update.reset(); };
  const save = (next: { name: string; role: string; active: boolean }) => {
    if (!editing) return;
    update.mutate({ id: editing.id, fullName: next.name.trim(), role: next.role, active: next.active }, { onSuccess: () => setEditing(null) });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title="Team" sub={brand.name} onBack={back} />
      <Screen>
        {!owner ? <EmptyBox icon="lock-closed-outline" title="Only the owner manages the team" text="Ask the owner to invite someone or change their access." /> : (
          <>
            <Button title="Invite someone" icon="person-add-outline" onPress={() => { setInviting(true); invite.reset(); setSent(null); }} />
            {sent ? <Notice tone="ok" title={`Invite sent to ${sent}.`}>They’ll get an email to pick a password, then they can sign in.</Notice> : null}
            {team.isLoading ? <LoadingCards /> : null}
            {team.error && !team.data ? <LoadFailed what="your team" onRetry={() => void team.refetch()} /> : null}
            {(team.data ?? []).map((m) => {
              const me = m.id === claims?.userId;
              const s = memberStatus(m);
              const locked = me || m.role === 'owner';
              return (
                <ListRow key={m.id} title={`${m.full_name ?? m.email ?? 'Unnamed'}${me ? ' (you)' : ''}`} lines={[[label(m.role), m.email].filter(Boolean).join(' · ')]}
                  onPress={() => (locked ? undefined : openMember(m))}>
                  {s ? <Pill label={s.label} tone={s.tone} icon={s.tone === 'amber' ? 'mail-outline' : 'close-circle-outline'} /> : null}
                </ListRow>
              );
            })}
            <Text style={styles.hint}>People whose access is off can’t sign in. On a phone that’s already signed in, it can take up to an hour to apply.</Text>
          </>
        )}
      </Screen>

      <Sheet visible={inviting} title="Invite someone" onClose={() => setInviting(false)}>
        <TextField label="Name" value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} autoCapitalize="words" />
        <TextField label="Email" value={form.email} onChange={(email) => setForm((f) => ({ ...f, email }))} keyboardType="email-address" autoCapitalize="none"
          hint="They’ll get an email with a link to pick a password." />
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>What they do</Text>
          <View style={styles.wrap}>{roles.map((r) => <Chip key={r} label={label(r)} selected={form.role === r} onPress={() => setForm((f) => ({ ...f, role: r }))} />)}</View>
          <Text style={styles.hint}>A {label('manager').toLowerCase()} can add jobs and assign people. Others see only the jobs they’re on.</Text>
        </View>
        {tried && problems.length ? <Notice tone="bad" title="Before you send:">{problems.map((p) => `• ${p}`).join('\n')}</Notice> : null}
        <ErrorText error={invite.error} />
        <Button title="Send invite" icon="send" busy={invite.isPending} onPress={sendInvite} />
      </Sheet>

      <Sheet visible={editing !== null} title={editing?.full_name ?? 'Team member'} onClose={() => setEditing(null)}>
        <TextField label="Name" value={draft.name} onChange={(name) => setDraft((d) => ({ ...d, name }))} autoCapitalize="words" />
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>What they do</Text>
          <View style={styles.wrap}>{roles.map((r) => <Chip key={r} label={label(r)} selected={draft.role === r} onPress={() => setDraft((d) => ({ ...d, role: r }))} />)}</View>
        </View>
        <ErrorText error={update.error} />
        <Button title="Save" busy={update.isPending} onPress={() => save(draft)} />
        {draft.active
          ? <Button title="Switch off their access" icon="close-circle-outline" variant="danger" busy={update.isPending} onPress={() => save({ ...draft, active: false })} />
          : <Button title="Switch their access back on" variant="secondary" busy={update.isPending} onPress={() => save({ ...draft, active: true })} />}
      </Sheet>
    </View>
  );
}
