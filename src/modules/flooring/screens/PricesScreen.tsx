import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Button, Card, Chip, ErrorText, Heading, Loading, Muted, Screen, TextField, styles } from '@/core/ui';
import type { QuoteProfile } from '../quoteApi';
import { useIsOwner, usePrices, useQuoteMutations, useQuoteProfile } from '../quoteHooks';
import { UNITS, euro, parseAmount, unitLabel, type PriceItem, type Unit } from '../quoteRules';

const KINDS: [PriceItem['kind'], string][] = [['floor', 'Floors'], ['extra', 'Extras'], ['labour', 'Labour']];
type Draft = { id?: string; kind: PriceItem['kind']; name: string; unit: Unit; price: string; active: boolean };

/** The owner's price list and the details printed on every quote. Owner only. */
export function PricesScreen() {
  const owner = useIsOwner();
  const prices = usePrices();
  const profile = useQuoteProfile();
  const m = useQuoteMutations();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [p, setP] = useState({ phone: '', email: '', address: '', vat: '', terms: '', days: '30', defaultVat: null as number | null });

  useEffect(() => {
    const d = profile.data;
    if (profile.isSuccess) setP({ phone: d?.phone ?? '', email: d?.email ?? '', address: d?.address ?? '', vat: d?.vat_number ?? '', terms: d?.terms ?? '', days: String(d?.default_valid_days ?? 30), defaultVat: d?.default_vat_rate ?? null });
  }, [profile.isSuccess, profile.data]);

  if (!owner) return <Screen><Muted>Only the owner can see prices.</Muted></Screen>;
  if (prices.isLoading || profile.isLoading) return <Loading />;

  const price = draft ? parseAmount(draft.price) : null;
  const draftOk = draft && draft.name.trim() && price !== null && !Number.isNaN(price);
  const days = Number(p.days);
  const profileValues: QuoteProfile = {
    phone: p.phone.trim() || null, email: p.email.trim() || null, address: p.address.trim() || null, vat_number: p.vat.trim() || null,
    terms: p.terms.trim() || null, default_valid_days: days, default_vat_rate: p.defaultVat,
  };

  return (
    <Screen>
      <Muted>Only you (the owner) can see this page and your quotes. Fitters and managers never see prices.</Muted>
      {KINDS.map(([kind, label]) => (
        <Card key={kind}>
          <Heading>{label}</Heading>
          {(prices.data ?? []).filter((x) => x.kind === kind).map((x) => (
            <Pressable key={x.id} accessibilityRole="button" onPress={() => setDraft({ id: x.id, kind: x.kind, name: x.name, unit: x.unit, price: x.unit_price.toFixed(2), active: x.active })}
              style={{ paddingVertical: 6, opacity: x.active ? 1 : 0.5 }}>
              <Text style={styles.label}>{`${x.name} · ${euro(x.unit_price)} per ${unitLabel(x.unit)}${x.active ? '' : ' (not in use)'}`}</Text>
            </Pressable>
          ))}
          <Button title={`Add to ${label.toLowerCase()}`} variant="secondary" onPress={() => setDraft({ kind, name: '', unit: kind === 'floor' ? 'm2' : kind === 'labour' ? 'hour' : 'item', price: '', active: true })} />
        </Card>
      ))}

      {draft ? (
        <Card>
          <Heading>{draft.id ? 'Change price' : 'New price'}</Heading>
          <TextField label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} hint={draft.kind === 'floor' ? 'Use the same name as the floor type at viewings, e.g. Engineered wood, so quotes fill in the price.' : undefined} />
          <TextField label="Price (€)" value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} keyboardType="numbers-and-punctuation" placeholder="45.50" />
          <View style={styles.wrap}>{UNITS.map(([u, l]) => <Chip key={u} label={`per ${l}`} selected={draft.unit === u} onPress={() => setDraft({ ...draft, unit: u })} />)}</View>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.label}>In use</Text>
            <Switch value={draft.active} onValueChange={(v) => setDraft({ ...draft, active: v })} accessibilityLabel="In use" />
          </View>
          <ErrorText error={m.savePrice.error} />
          <Button title="Save price" disabled={!draftOk} busy={m.savePrice.isPending}
            onPress={() => m.savePrice.mutate({ id: draft.id, kind: draft.kind, name: draft.name.trim(), unit: draft.unit, unit_price: price as number, active: draft.active }, { onSuccess: () => setDraft(null) })} />
          <Button title="Cancel" variant="secondary" onPress={() => setDraft(null)} />
        </Card>
      ) : null}

      <Card>
        <Heading>On every quote</Heading>
        <Muted>Your business name, logo and colour come from your branding.</Muted>
        <TextField label="Phone" value={p.phone} onChange={(v) => setP({ ...p, phone: v })} keyboardType="phone-pad" />
        <TextField label="Email" value={p.email} onChange={(v) => setP({ ...p, email: v })} keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Address" value={p.address} onChange={(v) => setP({ ...p, address: v })} multiline />
        <TextField label="VAT number" value={p.vat} onChange={(v) => setP({ ...p, vat: v })} hint="Leave blank if you are not VAT registered" />
        <Text style={styles.label}>Usual VAT on quotes</Text>
        <View style={styles.wrap}>
          {([[null, 'No VAT'], [13.5, '13.5%'], [23, '23%']] as [number | null, string][]).map(([v, l]) => <Chip key={l} label={l} selected={p.defaultVat === v} onPress={() => setP({ ...p, defaultVat: v })} />)}
        </View>
        <TextField label="Quotes are valid for (days)" value={p.days} onChange={(v) => setP({ ...p, days: v })} keyboardType="numbers-and-punctuation" />
        <TextField label="Terms (printed at the bottom)" value={p.terms} onChange={(v) => setP({ ...p, terms: v })} multiline placeholder="e.g. 30% deposit to book. Balance on completion." />
        {!(days >= 1 && days <= 365) ? <Muted>Valid for must be between 1 and 365 days.</Muted> : null}
        <ErrorText error={m.saveProfile.error} />
        {m.saveProfile.isSuccess ? <Muted>Saved.</Muted> : null}
        <Button title="Save quote details" busy={m.saveProfile.isPending} disabled={!(days >= 1 && days <= 365)} onPress={() => m.saveProfile.mutate(profileValues)} />
      </Card>
    </Screen>
  );
}
