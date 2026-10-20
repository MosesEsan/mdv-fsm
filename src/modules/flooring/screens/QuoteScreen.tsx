import { Text, View } from 'react-native';
import { openJobFile } from '@/core/jobFiles';
import { Button, Card, Chip, ErrorText, Heading, Loading, Muted, Screen, TextField, styles } from '@/core/ui';
import { QUOTE_STATUS, UNITS, euro, lineTotal } from '../quoteRules';
import { useIsOwner } from '../quoteHooks';
import { useQuoteEditor } from '../useQuoteEditor';

const VAT_CHOICES: [number | null, string][] = [[null, 'No VAT'], [13.5, '13.5%'], [23, '23%']];

type Props = { jobId: string; quoteId: string | null; onCreated: (id: string) => void };

/** Build a quote from the measured rooms and the price list, then make the PDF and share it. Owner only. */
export function QuoteScreen({ jobId, quoteId, onCreated }: Props) {
  const owner = useIsOwner();
  const q = useQuoteEditor(jobId, quoteId, onCreated);
  if (!owner) return <Screen><Muted>Only the owner can see quotes.</Muted></Screen>;
  if (!q.ready) return <Loading />;
  const ed = !q.locked;

  return (
    <Screen>
      <Card>
        <Heading>{q.quote ? `Quote ${q.quote.number} · ${QUOTE_STATUS[q.status]}` : 'New quote'}</Heading>
        {q.locked ? <Muted>This quote has been sent, so it can't be changed. Make a new version to change it.</Muted> : null}
        {!q.quote ? <Muted>Lines start from the rooms measured at the viewing. Prices come from your price list where the floor matches.</Muted> : null}
      </Card>

      <Card>
        <Heading>Lines</Heading>
        {q.lines.map((l, i) => (
          <View key={l.key} style={{ gap: 6, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderColor: '#d1d9e0' }}>
            <TextField label={`Line ${i + 1}`} value={l.description} onChange={(v) => q.updateLine(l.key, { description: v })} editable={ed} />
            <View style={styles.row}>
              <View style={{ flex: 1 }}><TextField label="Quantity" value={l.quantity} onChange={(v) => q.updateLine(l.key, { quantity: v })} keyboardType="numbers-and-punctuation" editable={ed} /></View>
              <View style={{ flex: 1 }}><TextField label="Price (€)" value={l.unitPrice} onChange={(v) => q.updateLine(l.key, { unitPrice: v })} keyboardType="numbers-and-punctuation" editable={ed} /></View>
            </View>
            <View style={styles.wrap}>
              {UNITS.map(([u, label]) => <Chip key={u} label={label} selected={l.unit === u} disabled={!ed} onPress={() => q.updateLine(l.key, { unit: u })} />)}
            </View>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.label}>{euro(lineTotal(l))}</Text>
              {ed ? <Button title="Remove" variant="secondary" onPress={() => q.removeLine(l.key)} /> : null}
            </View>
          </View>
        ))}
        {ed ? (
          <>
            <Button title="Add a line" variant="secondary" onPress={q.addLine} />
            {q.prices.length ? <Muted>Add from your price list:</Muted> : <Muted>Tip: add your prices under Prices to fill these in faster.</Muted>}
            <View style={styles.wrap}>
              {q.prices.map((p) => <Chip key={p.id} label={`${p.name} ${euro(p.unit_price)}`} selected={false} onPress={() => q.addFromPrice(p)} />)}
            </View>
          </>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.label}>VAT</Text>
        <View style={styles.wrap}>
          {VAT_CHOICES.map(([v, label]) => <Chip key={label} label={label} selected={q.vatRate === v} disabled={!ed} onPress={() => q.setVatRate(v)} />)}
        </View>
        <TextField label="Valid until" value={q.validUntil} onChange={q.setValidUntil} placeholder="2026-11-30" editable={ed} />
        <TextField label="Notes on the quote" value={q.notes} onChange={q.setNotes} multiline editable={ed} placeholder="e.g. Includes moving furniture and removing old carpet" />
        {q.vatRate !== null ? <Text style={styles.muted}>{`Subtotal ${euro(q.sums.subtotal)} · VAT ${euro(q.sums.vat)}`}</Text> : null}
        <Heading>{`Total ${euro(q.sums.total)}`}</Heading>
      </Card>

      {ed ? q.problems.map((p) => <Muted key={p}>{p}</Muted>) : null}
      <ErrorText error={q.saveError ?? q.pdfError ?? q.statusError} />
      {ed ? <Button title="Save draft" variant="secondary" onPress={() => void q.save()} busy={q.saving} disabled={q.problems.length > 0} /> : null}
      <Button title={q.locked ? 'Share the PDF again' : 'Make PDF and share'} onPress={() => void q.sendPdf()} busy={q.pdfBusy} disabled={ed && q.problems.length > 0} />
      {q.quote?.pdf_file_id ? <Button title="Open saved PDF" variant="secondary" onPress={() => void openJobFile(q.quote!.pdf_file_id!, `Quote ${q.quote!.number}.pdf`)} /> : null}
      {q.status === 'sent' ? (
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Button title="Customer accepted" onPress={() => q.setStatus('accepted')} /></View>
          <View style={{ flex: 1 }}><Button title="Customer declined" variant="secondary" onPress={() => q.setStatus('declined')} /></View>
        </View>
      ) : null}
      {q.locked ? <Button title="Make a new version" variant="secondary" onPress={q.copy} /> : null}
    </Screen>
  );
}
