import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSession } from '@/core/auth/AuthProvider';
import { isFeatureEnabled } from '@/core/features';
import { getModules } from '@/core/modules/registry';
import { Button, Card, ErrorText, Heading, Loading, Muted, Screen, styles } from '@/core/ui';
import { useCreateTenant, useTenants } from './api';
import { Field } from './Field';

/** Every business on the platform, plus a form to add one. */
export function TenantListScreen() {
  const router = useRouter();
  const { signOut } = useSession();
  const tenants = useTenants();
  const create = useCreateTenant();
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Europe/Dublin');
  const open = (id: string) => router.push(`/admin/${id}` as Href);

  const onCreate = () =>
    create.mutate({ name: name.trim(), timezone: timezone.trim() }, {
      onSuccess: (t) => { setName(''); open((t as { id: string }).id); },
    });

  return (
    <Screen>
      <Heading>Businesses</Heading>
      {tenants.isLoading ? <Loading /> : null}
      <ErrorText error={tenants.error} />
      {(tenants.data ?? []).map((t) => {
        const on = getModules().filter((m) => isFeatureEnabled(t.features, m.feature)).map((m) => m.title);
        return (
          <Pressable key={t.id} accessibilityRole="button" onPress={() => open(t.id)} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}>
            <Heading>{t.name}</Heading>
            <Text style={styles.muted}>{`${t.active_people} active people · ${t.owners} owner${t.owners === 1 ? '' : 's'} · ${t.timezone}`}</Text>
            <Text style={styles.muted}>{on.length ? `Modules: ${on.join(', ')}` : 'No modules switched on'}</Text>
            {t.owners === 0 ? <Text style={styles.error}>No owner yet: invite one under People.</Text> : null}
          </Pressable>
        );
      })}
      {tenants.data?.length === 0 ? <Muted>No businesses yet.</Muted> : null}
      <Card>
        <Heading>Add a business</Heading>
        <Field label="Business name" value={name} onChange={setName} placeholder="e.g. Murphy Flooring Ltd" />
        <Field label="Time zone" value={timezone} onChange={setTimezone} hint="Used for dates, weeks and reports." />
        <ErrorText error={create.error} />
        <Button title="Create business" onPress={onCreate} busy={create.isPending} disabled={name.trim().length === 0} />
      </Card>
      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
