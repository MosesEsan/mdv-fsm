import { useState } from 'react';
import { Button, Card, ErrorText, Heading, Muted } from '@/core/ui';
import { useUpdateTenant, type TenantRow } from '../api';
import { Field } from '../Field';

export function DetailsSection({ tenant }: { tenant: TenantRow }) {
  const save = useUpdateTenant(tenant.id);
  const [name, setName] = useState(tenant.name);
  const [timezone, setTimezone] = useState(tenant.timezone);
  return (
    <Card>
      <Heading>Details</Heading>
      <Field label="Business name" value={name} onChange={setName} />
      <Field label="Time zone" value={timezone} onChange={setTimezone} hint="For example Europe/Dublin or Europe/London." />
      <Muted>{`Business ID: ${tenant.id}`}</Muted>
      <ErrorText error={save.error} />
      {save.isSuccess ? <Muted>Saved.</Muted> : null}
      <Button title="Save" onPress={() => save.mutate({ name: name.trim(), timezone: timezone.trim() })} busy={save.isPending} disabled={!name.trim()} />
    </Card>
  );
}
