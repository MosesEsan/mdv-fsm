import { useState } from 'react';
import { BRAND_ROLES, DEFAULT_ROLE_LABELS, brandingProblems, parseBranding, type BrandRole } from '@/core/branding';
import { Button, Card, ErrorText, Heading, Muted } from '@/core/ui';
import { Text } from 'react-native';
import { styles } from '@/core/ui';
import { useSetBranding, type TenantRow } from '../api';
import { Field } from '../Field';

/** What each role is called in this business. Only the wording changes; what each role can do stays the same. */
export function JobTitlesSection({ tenant }: { tenant: TenantRow }) {
  const current = parseBranding(tenant.branding).roleLabels ?? {};
  const save = useSetBranding(tenant.id);
  const [labels, setLabels] = useState<Partial<Record<BrandRole, string>>>(current);

  const cleaned = Object.fromEntries(
    Object.entries(labels).map(([k, v]) => [k, v?.trim()]).filter(([, v]) => v),
  ) as Partial<Record<BrandRole, string>>;
  const problems = brandingProblems({ roleLabels: cleaned });

  return (
    <Card>
      <Heading>Job titles</Heading>
      <Muted>Leave a box blank to use the standard title. Permissions don't change.</Muted>
      {BRAND_ROLES.map((role) => (
        <Field key={role} label={DEFAULT_ROLE_LABELS[role]} value={labels[role] ?? ''} placeholder={DEFAULT_ROLE_LABELS[role]}
          onChange={(v) => setLabels((l) => ({ ...l, [role]: v }))} />
      ))}
      {problems.map((p) => <Text key={p} style={styles.error}>{p}</Text>)}
      <ErrorText error={save.error} />
      {save.isSuccess ? <Muted>Saved.</Muted> : null}
      <Button title="Save job titles" busy={save.isPending} disabled={problems.length > 0}
        onPress={() => save.mutate({ ...(tenant.branding ?? {}), roleLabels: cleaned })} />
    </Card>
  );
}
