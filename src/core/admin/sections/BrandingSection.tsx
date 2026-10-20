import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { brandingProblems, contrastWithWhite, parseBranding, useLogoUrl } from '@/core/branding';
import { Button, Card, Chip, ErrorText, Heading, Muted, ThemeProvider, styles } from '@/core/ui';
import { useSetBranding, type TenantRow } from '../api';
import { Field } from '../Field';
import { pickImageFile, uploadLogo } from '../logo';

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** Logo, colours and the name on documents, with a live preview of buttons in those colours. */
export function BrandingSection({ tenant }: { tenant: TenantRow }) {
  const current = parseBranding(tenant.branding);
  const save = useSetBranding(tenant.id);
  const [primary, setPrimary] = useState(current.colors?.primary ?? '');
  const [accent, setAccent] = useState(current.colors?.accent ?? '');
  const [pdfName, setPdfName] = useState(current.pdfName ?? '');
  const [logoPath, setLogoPath] = useState(current.logoPath ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const logo = useLogoUrl(logoPath);

  const colors = { ...(primary ? { primary } : {}), ...(accent ? { accent } : {}) };
  const problems = brandingProblems({ colors, ...(pdfName ? { pdfName } : {}) });

  const onPickLogo = async () => {
    setUploadError(null);
    const file = await pickImageFile();
    if (!file) return;
    setUploading(true);
    try { setLogoPath(await uploadLogo(tenant.id, file)); } catch (e) { setUploadError((e as Error).message); } finally { setUploading(false); }
  };

  const onSave = () => {
    const next: Record<string, unknown> = { ...(tenant.branding ?? {}), colors };
    if (pdfName.trim()) next.pdfName = pdfName.trim(); else delete next.pdfName;
    if (logoPath) next.logoPath = logoPath; else delete next.logoPath;
    save.mutate(next);
  };

  const ratio = (hex: string) => (HEX.test(hex) ? ` · contrast ${contrastWithWhite(hex)}:1` : '');

  return (
    <Card>
      <Heading>Branding</Heading>
      <Text style={styles.label}>Logo</Text>
      <View style={styles.row}>
        {logo.data ? <Image source={{ uri: logo.data }} style={{ width: 64, height: 64 }} resizeMode="contain" accessibilityLabel="Current logo" /> : <Muted>No logo yet.</Muted>}
        <Button title={logoPath ? 'Replace logo' : 'Upload logo'} variant="secondary" onPress={onPickLogo} busy={uploading} />
        {logoPath ? <Button title="Remove" variant="secondary" onPress={() => setLogoPath(null)} /> : null}
      </View>
      <Muted>PNG, JPEG or WebP, up to 1 MB. A square logo works best.</Muted>
      <ErrorText error={uploadError} />
      <Field label="Main colour" value={primary} onChange={setPrimary} placeholder="#1F4E79" hint={`Buttons and headers${ratio(primary)}`} />
      <Field label="Accent colour" value={accent} onChange={setAccent} placeholder="#8A3B12" hint={`Selected options${ratio(accent)}`} />
      <Field label="Name on documents" value={pdfName} onChange={setPdfName} placeholder={tenant.name} hint="Shown at the top of PDFs. Leave blank to use the business name." />
      <Text style={styles.label}>Preview</Text>
      <ThemeProvider primary={HEX.test(primary) ? primary : undefined} accent={HEX.test(accent) ? accent : undefined}>
        <View style={[styles.row, { flexWrap: 'wrap' }]}>
          <Button title="Main button" onPress={() => {}} />
          <Chip label="Selected" selected onPress={() => {}} />
          <Chip label="Not selected" selected={false} onPress={() => {}} />
        </View>
      </ThemeProvider>
      {problems.map((p) => <Text key={p} style={styles.error}>{p}</Text>)}
      <ErrorText error={save.error} />
      {save.isSuccess ? <Muted>Saved. Staff see the new look next time they open the app.</Muted> : null}
      <Button title="Save branding" onPress={onSave} busy={save.isPending} disabled={problems.length > 0 || uploading} />
    </Card>
  );
}
