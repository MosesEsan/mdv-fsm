import { useState } from 'react';
import { Text, View } from 'react-native';
import { BRAND_ROLES, parseBranding, roleLabel, type BrandRole } from '@/core/branding';
import { Button, Card, Chip, ErrorText, Heading, Loading, Muted, styles } from '@/core/ui';
import { useInvitePerson, useTenantPeople, useUpdatePerson, type Person, type TenantRow } from '../api';
import { Field } from '../Field';

function RolePicker({ value, onChange, label }: { value: string; onChange: (r: BrandRole) => void; label: (r: string) => string }) {
  return (
    <View style={styles.wrap}>
      {BRAND_ROLES.map((r) => <Chip key={r} label={label(r)} selected={value === r} onPress={() => onChange(r)} />)}
    </View>
  );
}

function status(p: Person): string {
  if (!p.active) return 'Deactivated';
  if (p.last_sign_in_at) return `Last signed in ${p.last_sign_in_at.slice(0, 10)}`;
  return p.invited_at ? `Invited ${p.invited_at.slice(0, 10)}, not signed in yet` : 'Not signed in yet';
}

export function PeopleSection({ tenant }: { tenant: TenantRow }) {
  const people = useTenantPeople(tenant.id);
  const invite = useInvitePerson(tenant.id);
  const update = useUpdatePerson(tenant.id);
  const branding = parseBranding(tenant.branding);
  const label = (r: string) => roleLabel(branding, r);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<BrandRole>(people.data?.some((p) => p.role === 'owner') ? 'worker' : 'owner');
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <>
      <Card>
        <Heading>People</Heading>
        <Muted>Role changes take effect the next time that person's app refreshes its sign-in (within an hour).</Muted>
        {people.isLoading ? <Loading /> : null}
        <ErrorText error={people.error ?? update.error} />
        {(people.data ?? []).map((p) => (
          <View key={p.id} style={{ gap: 6, paddingVertical: 6, borderTopWidth: 1, borderColor: '#d1d9e0' }}>
            <Text style={styles.label}>{`${p.full_name} · ${label(p.role)}`}</Text>
            <Text style={styles.muted}>{`${p.email ?? ''} · ${status(p)}`}</Text>
            {editing === p.id ? (
              <RolePicker value={p.role} label={label} onChange={(r) => { update.mutate({ userId: p.id, fullName: p.full_name, role: r, active: p.active }); setEditing(null); }} />
            ) : null}
            <View style={styles.row}>
              <Button title={editing === p.id ? 'Cancel' : 'Change role'} variant="secondary" onPress={() => setEditing(editing === p.id ? null : p.id)} />
              <Button title={p.active ? 'Deactivate' : 'Reactivate'} variant={p.active ? 'danger' : 'secondary'} busy={update.isPending}
                onPress={() => update.mutate({ userId: p.id, fullName: p.full_name, role: p.role, active: !p.active })} />
            </View>
          </View>
        ))}
        {people.data?.length === 0 ? <Muted>No one yet. Invite the owner first.</Muted> : null}
      </Card>
      <Card>
        <Heading>Invite someone</Heading>
        <Muted>They get an email with a link to set their password.</Muted>
        <Field label="Name" value={fullName} onChange={setFullName} />
        <Field label="Email" value={email} onChange={setEmail} placeholder="name@company.ie" />
        <RolePicker value={role} onChange={setRole} label={label} />
        <ErrorText error={invite.error} />
        {invite.isSuccess ? <Muted>Invite sent.</Muted> : null}
        <Button title="Send invite" busy={invite.isPending} disabled={!email.trim() || !fullName.trim()}
          onPress={() => invite.mutate({ email: email.trim(), fullName: fullName.trim(), role }, { onSuccess: () => { setEmail(''); setFullName(''); } })} />
      </Card>
    </>
  );
}
