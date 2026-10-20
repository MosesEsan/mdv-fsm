import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Chip, ErrorText, Heading, Loading, Screen, styles } from '@/core/ui';
import { View } from 'react-native';
import { useAdminTenant } from './api';
import { AuditSection } from './sections/AuditSection';
import { BrandingSection } from './sections/BrandingSection';
import { DetailsSection } from './sections/DetailsSection';
import { JobTitlesSection } from './sections/JobTitlesSection';
import { ModulesSection } from './sections/ModulesSection';
import { PeopleSection } from './sections/PeopleSection';

const TABS = [
  ['details', 'Details'], ['branding', 'Branding'], ['titles', 'Job titles'],
  ['modules', 'Modules'], ['people', 'People'], ['audit', 'History'],
] as const;
type Tab = (typeof TABS)[number][0];

export function TenantDetailScreen({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const tenant = useAdminTenant(tenantId);
  const [tab, setTab] = useState<Tab>('details');

  if (tenant.isLoading) return <Loading />;
  if (!tenant.data) return <Screen><ErrorText error={tenant.error ?? 'Business not found'} /></Screen>;
  const t = tenant.data;

  return (
    <Screen>
      <Button title="← All businesses" variant="secondary" onPress={() => router.replace('/admin')} />
      <Heading>{t.name}</Heading>
      <View style={styles.wrap}>
        {TABS.map(([key, label]) => <Chip key={key} label={label} selected={tab === key} onPress={() => setTab(key)} />)}
      </View>
      {tab === 'details' ? <DetailsSection tenant={t} /> : null}
      {tab === 'branding' ? <BrandingSection tenant={t} /> : null}
      {tab === 'titles' ? <JobTitlesSection tenant={t} /> : null}
      {tab === 'modules' ? <ModulesSection tenant={t} /> : null}
      {tab === 'people' ? <PeopleSection tenant={t} /> : null}
      {tab === 'audit' ? <AuditSection tenantId={t.id} /> : null}
    </Screen>
  );
}
