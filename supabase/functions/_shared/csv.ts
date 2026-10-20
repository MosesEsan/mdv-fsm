// CSV building (pure). UTF-8 with BOM so Excel keeps names like Seán; formula-safe.

export type CsvValue = string | number | null | undefined;

/**
 * One CSV cell. Quotes when needed, and neutralises spreadsheet formulas: free text such as
 * notes could otherwise start with = + - @ and run as a formula when opened in Excel.
 */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: CsvValue[][]): string {
  return '\uFEFF' + [header.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\r\n') + '\r\n';
}

/** 510 → "8.50" (payroll systems usually want decimal hours). */
export function decimalHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

/** 510 → "8:30". */
export function hoursMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}
