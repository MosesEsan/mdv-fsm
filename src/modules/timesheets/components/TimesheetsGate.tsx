import type { ReactNode } from 'react';
import { FeatureGate } from '@/core/modules/FeatureGate';

/** Wrap the module's routes: nothing renders unless the tenant has Timesheets switched on. */
export function TimesheetsGate({ children }: { children: ReactNode }) {
  return <FeatureGate feature="timesheets" name="Timesheets">{children}</FeatureGate>;
}
