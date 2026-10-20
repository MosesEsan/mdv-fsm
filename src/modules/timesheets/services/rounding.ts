// Mirror of private.ts_round(): nearest step, halves round up. Used only for display;
// stored durations are always exact.
export function roundMinutes(minutes: number, step: number): number {
  if (!step || step <= 0) return minutes;
  return Math.round(minutes / step) * step;
}

export function roundedTotal(durations: number[], step: number): number {
  return durations.reduce((sum, d) => sum + roundMinutes(d, step), 0);
}
