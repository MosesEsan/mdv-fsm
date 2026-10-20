import { useEffect, useState } from 'react';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { useBranding } from '@/core/branding';
import { useCustomer } from '@/core/customers';
import { addDays, formatDay, today } from '@/core/dates';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { useEnquiry } from './enquiryHooks';
import { useViewing } from './hooks';
import { fetchQuote } from './quoteApi';
import { makeAndShareQuotePdf } from './quotePdf';
import { usePrices, useQuote, useQuoteMutations, useQuoteProfile } from './quoteHooks';
import { lineFromPrice, lineProblems, linesFromRooms, newKey, toPayload, totals, type LineInput, type PriceItem } from './quoteRules';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Everything the quote screen needs: lines, VAT, validity, totals, save, make the PDF and share. Owner only. */
export function useQuoteEditor(jobId: string, quoteId: string | null, onCreated: (id: string) => void) {
  const tz = useTenantSettings().timezone ?? 'Europe/Dublin';
  const tenantId = useAuthClaims()?.tenantId as string;
  const quote = useQuote(quoteId);
  const prices = usePrices();
  const profile = useQuoteProfile();
  const viewing = useViewing(jobId);
  const enquiry = useEnquiry(jobId);
  const customer = useCustomer(enquiry.data?.customer_id);
  const brand = useBranding();
  const m = useQuoteMutations();

  const [lines, setLines] = useState<LineInput[]>([]);
  const [vatRate, setVatRate] = useState<number | null>(null);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [ready, setReady] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Fill the form once, from the saved quote or (new) from the measured rooms and the defaults.
  useEffect(() => {
    if (ready) return;
    if (quoteId) {
      if (!quote.data) return;
      const { quote: q, lines: l } = quote.data;
      setLines(l.map((x) => ({ key: newKey(), description: x.description, quantity: String(x.quantity), unit: x.unit, unitPrice: x.unit_price.toFixed(2) })));
      setVatRate(q.vat_rate); setValidUntil(q.valid_until ?? ''); setNotes(q.notes ?? '');
      setReady(true);
    } else if (prices.isSuccess && profile.isSuccess && viewing.isSuccess) {
      setLines(linesFromRooms(viewing.data?.rooms ?? [], prices.data ?? []));
      setVatRate(profile.data?.default_vat_rate ?? null);
      setValidUntil(addDays(today(tz), profile.data?.default_valid_days ?? 30));
      setReady(true);
    }
  }, [ready, quoteId, quote.data, prices.isSuccess, profile.isSuccess, viewing.isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = quote.data?.quote.status ?? 'draft';
  const locked = status !== 'draft';
  const problems = [...lineProblems(lines), ...(validUntil && !DATE.test(validUntil) ? ['Enter "valid until" like 2026-11-30'] : [])];
  const sums = totals(lines, vatRate);

  const updateLine = (key: string, patch: Partial<LineInput>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: string) => setLines((ls) => ls.filter((l) => l.key !== key));
  const addLine = () => setLines((ls) => [...ls, { key: newKey(), description: '', quantity: '1', unit: 'item', unitPrice: '' }]);
  const addFromPrice = (p: PriceItem) => setLines((ls) => [...ls, lineFromPrice(p)]);

  const save = async (): Promise<string> => {
    const id = await m.save.mutateAsync({ id: quoteId ?? undefined, jobId, vatRate, validUntil: validUntil || null, notes, lines: toPayload(lines) });
    if (!quoteId) onCreated(id);
    return id;
  };

  /** Save, make the PDF, keep a copy on the job (owner only), open the share sheet, mark as sent. */
  const sendPdf = async () => {
    setPdfError(null);
    setPdfBusy(true);
    try {
      const id = locked ? (quoteId as string) : await save();
      const number = quote.data?.quote.number ?? (await fetchQuote(id))?.quote.number ?? 0;
      const c = customer.data;
      const e = enquiry.data;
      const fileId = await makeAndShareQuotePdf(tenantId, jobId, {
        business: {
          name: brand.branding.pdfName || brand.name || '', logoUrl: brand.logoUrl, colour: brand.primary,
          phone: profile.data?.phone, email: profile.data?.email, address: profile.data?.address, vatNumber: profile.data?.vat_number,
        },
        customer: { name: c?.name ?? e?.customer_name ?? '', address: c?.address, phone: c?.phone, email: c?.email },
        job: { summary: e?.job_summary ?? '', siteAddress: e?.site_address },
        number, date: formatDay(today(tz)), validUntil: validUntil && DATE.test(validUntil) ? formatDay(validUntil) : null,
        lines, vatRate, notes, terms: profile.data?.terms,
      });
      if (!locked) await m.status.mutateAsync({ id, status: 'sent', pdfFileId: fileId ?? undefined });
    } catch (err) {
      setPdfError((err as Error).message);
    } finally {
      setPdfBusy(false);
    }
  };

  return {
    ready, locked, status, quote: quote.data?.quote, lines, vatRate, setVatRate, validUntil, setValidUntil, notes, setNotes,
    updateLine, removeLine, addLine, addFromPrice, prices: (prices.data ?? []).filter((p) => p.active), sums, problems,
    save, saving: m.save.isPending, saveError: m.save.error,
    sendPdf, pdfBusy, pdfError,
    setStatus: (s: 'accepted' | 'declined') => quoteId && m.status.mutate({ id: quoteId, status: s }),
    copy: () => quoteId && m.copy.mutate(quoteId, { onSuccess: onCreated }),
    statusError: m.status.error ?? m.copy.error,
  };
}
