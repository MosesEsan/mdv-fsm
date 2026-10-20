// Minute arithmetic and display shared by every module.

/** Whole minutes between two instants, rounded down (same as SQL floor(epoch/60)). */
export function minutesBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 60_000);
}

/** "8h 30m", "45m", "0m". */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
