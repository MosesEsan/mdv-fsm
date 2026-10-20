import { describe, expect, it } from 'vitest';
import { csvCell, decimalHours, hoursMinutes, toCsv } from './csv.ts';
import { isIsoDate, periodProblem } from './dates.ts';
import { filePath } from './files.ts';
import { pdfSafeText } from './pdf/text.ts';

describe('csv', () => {
  it('hours formats', () => {
    expect(decimalHours(510)).toBe('8.50');
    expect(decimalHours(20)).toBe('0.33');
    expect(hoursMinutes(510)).toBe('8:30');
  });
  it('quotes commas, quotes and new lines', () => {
    expect(csvCell('Plot 7, Block B')).toBe('"Plot 7, Block B"');
    expect(csvCell('He said "ok"')).toBe('"He said ""ok"""');
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"');
    expect(csvCell(null)).toBe('');
  });
  it('neutralises spreadsheet formulas in free text, leaves numbers alone', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+353 87 123')).toBe("'+353 87 123");
    expect(csvCell(-5)).toBe('-5');
  });
  it('BOM, header, CRLF lines', () => {
    expect(toCsv(['A', 'B'], [['Seán', 1], [null, 'x,y']])).toBe('\uFEFFA,B\r\nSeán,1\r\n,"x,y"\r\n');
  });
});

describe('dates', () => {
  it('period checks', () => {
    expect(isIsoDate('2026-10-05')).toBe(true);
    expect(isIsoDate('05/10/2026')).toBe(false);
    expect(periodProblem('2026-10-05', '2026-10-18')).toBe(null);
    expect(periodProblem('2026-10-18', '2026-10-05')).toContain('before');
    expect(periodProblem('2024-01-01', '2026-10-05')).toContain('year');
  });
});

describe('file paths', () => {
  const t = '0b5c2c3e-1111-4222-8333-444455556666';
  it('builds tenant/module/folder/name', () => {
    expect(filePath(t, 'timesheets', 'exports', 'a_b.csv')).toBe(`${t}/timesheets/exports/a_b.csv`);
  });
  it('refuses anything that could escape the folder', () => {
    expect(() => filePath('not-a-tenant', 'timesheets', 'exports', 'a.csv')).toThrow();
    expect(() => filePath(t, '../other', 'exports', 'a.csv')).toThrow();
    expect(() => filePath(t, 'timesheets', 'exports', '../a.csv')).toThrow();
    expect(() => filePath(t, 'timesheets', 'exports', 'a/b.csv')).toThrow();
  });
});

describe('pdf text', () => {
  it('keeps Irish and Western European letters, simplifies others', () => {
    expect(pdfSafeText('Seán Ó Briain — Zoë')).toBe('Seán Ó Briain — Zoë');
    expect(pdfSafeText('Łukasz Żółkowski')).toBe('Lukasz Zólkowski');
    expect(pdfSafeText('Дмитрий')).toBe('???????');
  });
});
