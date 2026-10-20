import { useState } from 'react';
import { today, type WeekDay } from './calendar';
import { periodFor, periodProblem, type Period, type PeriodPreset } from './periods';

/** State for a period picker: a preset, or custom dates. */
export function usePeriodSelection(timezone: string, weekStartsOn: WeekDay, initial: Exclude<PeriodPreset, 'custom'> = 'last_week') {
  const [preset, setPreset] = useState<PeriodPreset>(initial);
  const [custom, setCustom] = useState<Period>(() => periodFor(initial, today(timezone), weekStartsOn));
  const period = preset === 'custom' ? custom : periodFor(preset, today(timezone), weekStartsOn);
  return { preset, setPreset, custom, setCustom, period, problem: preset === 'custom' ? periodProblem(custom) : null };
}

export type PeriodSelection = ReturnType<typeof usePeriodSelection>;
