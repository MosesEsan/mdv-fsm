import type { ReactNode } from 'react';
import { ThemeProvider } from '@/core/ui';
import { useBranding } from './useBranding';

/** Applies the signed-in business's colours to the whole app. */
export function BrandTheme({ children }: { children: ReactNode }) {
  const { primary, accent } = useBranding();
  return <ThemeProvider primary={primary} accent={accent}>{children}</ThemeProvider>;
}
