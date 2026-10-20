// The quote as HTML (turned into a PDF on the device). Pure, so it is unit-tested.
import { euro, lineTotal, totals, unitLabel, type LineInput } from './quoteRules';

export type QuoteDoc = {
  business: { name: string; logoUrl?: string | null; phone?: string | null; email?: string | null; address?: string | null; vatNumber?: string | null; colour?: string };
  customer: { name: string; address?: string | null; phone?: string | null; email?: string | null };
  job: { summary: string; siteAddress?: string | null };
  number: number; date: string; validUntil?: string | null;
  lines: LineInput[]; vatRate: number | null; notes?: string | null; terms?: string | null;
};

const esc = (s: string | null | undefined) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const lines2br = (s: string | null | undefined) => esc(s).replace(/\n/g, '<br>');

export function quoteHtml(d: QuoteDoc): string {
  const t = totals(d.lines, d.vatRate);
  const colour = /^#[0-9A-Fa-f]{6}$/.test(d.business.colour ?? '') ? d.business.colour : '#1F2328';
  const rows = d.lines.map((l) => `
      <tr><td>${esc(l.description)}</td><td class="n">${esc(l.quantity)} ${esc(unitLabel(l.unit))}</td>
      <td class="n">${euro(Number(l.unitPrice.replace(',', '.')) || 0)}</td><td class="n">${euro(lineTotal(l))}</td></tr>`).join('');
  const contact = [d.business.phone, d.business.email].filter(Boolean).map(esc).join(' · ');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 18mm; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1F2328; font-size: 11pt; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${colour}; padding-bottom: 10px; }
  header img { max-height: 60px; max-width: 180px; }
  h1 { color: ${colour}; font-size: 20pt; margin: 0; }
  .muted { color: #59636E; } .n { text-align: right; white-space: nowrap; }
  .cols { display: flex; gap: 24px; margin: 18px 0; } .cols > div { flex: 1; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; border-bottom: 1px solid #D1D9E0; padding: 6px 4px; font-size: 9.5pt; color: #59636E; }
  td { border-bottom: 1px solid #EEF1F4; padding: 6px 4px; vertical-align: top; }
  .totals td { border: none; } .grand td { font-weight: 700; font-size: 13pt; border-top: 2px solid ${colour}; }
  footer { margin-top: 24px; font-size: 9.5pt; }
  </style></head><body>
  <header>
    <div>${d.business.logoUrl ? `<img src="${esc(d.business.logoUrl)}" alt="">` : ''}<h1>${esc(d.business.name)}</h1>
      <div class="muted">${lines2br(d.business.address)}${contact ? `<br>${contact}` : ''}${d.business.vatNumber ? `<br>VAT no. ${esc(d.business.vatNumber)}` : ''}</div></div>
    <div class="n"><h1>Quote</h1><div>No. ${d.number}</div><div>${esc(d.date)}</div>${d.validUntil ? `<div class="muted">Valid until ${esc(d.validUntil)}</div>` : ''}</div>
  </header>
  <div class="cols">
    <div><strong>For</strong><br>${esc(d.customer.name)}<br><span class="muted">${lines2br(d.customer.address)}</span></div>
    <div><strong>Job</strong><br>${esc(d.job.summary)}${d.job.siteAddress ? `<br><span class="muted">${lines2br(d.job.siteAddress)}</span>` : ''}</div>
  </div>
  <table>
    <thead><tr><th>Description</th><th class="n">Quantity</th><th class="n">Price</th><th class="n">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
    <tbody class="totals">
      ${d.vatRate !== null ? `<tr><td colspan="3" class="n">Subtotal</td><td class="n">${euro(t.subtotal)}</td></tr>
      <tr><td colspan="3" class="n">VAT ${d.vatRate}%</td><td class="n">${euro(t.vat)}</td></tr>` : ''}
      <tr class="grand"><td colspan="3" class="n">Total</td><td class="n">${euro(t.total)}</td></tr>
    </tbody>
  </table>
  ${d.notes ? `<p>${lines2br(d.notes)}</p>` : ''}
  ${d.terms ? `<footer class="muted">${lines2br(d.terms)}</footer>` : ''}
  </body></html>`;
}
