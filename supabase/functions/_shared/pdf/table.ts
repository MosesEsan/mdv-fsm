// A simple A4 table document: title, subtitle lines, column headers, groups of rows kept together
// on a page, and an optional total row. Modules describe the content; this handles the layout.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1';
import { pdfSafeText } from './text.ts';

export type PdfColumn = { header: string; /** share of the page width */ width: number; align?: 'left' | 'right' };
export type PdfRow = { cells: (string | null)[]; bold?: boolean; /** column indexes to make bold */ boldCells?: number[] };
export type TablePdf = {
  title: string;
  subtitle?: string[];
  columns: PdfColumn[];
  /** Each group is kept on one page and followed by a thin line. */
  groups: PdfRow[][];
  total?: PdfRow;
  /** "Page 1 of 3" at the foot of every page. */
  pageNumbers?: boolean;
};

const A4: [number, number] = [595.28, 841.89];
const M = 40;
const ROW = 16;

export async function buildTablePdf(spec: TablePdf): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const grey = rgb(0.4, 0.4, 0.4);
  const contentWidth = A4[0] - 2 * M;
  const totalShare = spec.columns.reduce((s, c) => s + c.width, 0);
  let x = M;
  const cols = spec.columns.map((c) => {
    const w = (c.width / totalShare) * contentWidth;
    const col = { ...c, x, w };
    x += w;
    return col;
  });

  let page: PDFPage = doc.addPage(A4);
  let y = A4[1] - M;

  const draw = (text: string, at: number, f: PDFFont, size: number, color = rgb(0, 0, 0)) =>
    page.drawText(pdfSafeText(text), { x: at, y, size, font: f, color });
  const rule = () =>
    page.drawLine({ start: { x: M, y: y - 4 }, end: { x: A4[0] - M, y: y - 4 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  const row = (r: PdfRow) => {
    cols.forEach((c, i) => {
      const f = r.bold || r.boldCells?.includes(i) ? bold : font;
      const text = pdfSafeText(r.cells[i] ?? '');
      if (!text) return;
      const at = c.align === 'right' ? c.x + c.w - f.widthOfTextAtSize(text, 10) - (i === cols.length - 1 ? 0 : 8) : c.x;
      draw(text, at, f, 10);
    });
    y -= ROW;
  };
  const header = () => {
    row({ cells: cols.map((c) => c.header), bold: true });
    y += ROW;
    rule();
    y -= 18;
  };
  const ensure = (needed: number) => {
    if (y - needed < M) {
      page = doc.addPage(A4);
      y = A4[1] - M;
      header();
    }
  };

  draw(spec.title, M, bold, 16);
  y -= 20;
  for (const line of spec.subtitle ?? []) {
    draw(line, M, font, 9, grey);
    y -= 13;
  }
  y -= 15;
  header();

  for (const group of spec.groups) {
    ensure(ROW * group.length + 8);
    group.forEach(row);
    rule();
    y -= 12;
  }
  if (spec.total) {
    ensure(ROW);
    row(spec.total);
  }
  if (spec.pageNumbers) {
    const pages = doc.getPages();
    pages.forEach((p, i) => {
      const label = `Page ${i + 1} of ${pages.length}`;
      p.drawText(label, { x: A4[0] - M - font.widthOfTextAtSize(label, 8), y: M / 2, size: 8, font, color: grey });
    });
  }
  return doc.save();
}
