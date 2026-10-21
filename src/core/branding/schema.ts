// Branding (tenants.branding): colours, logo, name on documents, job titles per role.
// Server mirror: private.validate_branding() + private.contrast_with_white(). Set by the platform team.
import { z } from 'zod';
import type { AppRole } from '@/core/auth/claims';

export const BRAND_ROLES = ['owner', 'manager', 'supervisor', 'worker', 'fitter', 'viewer'] as const;
export type BrandRole = (typeof BRAND_ROLES)[number];

export const DEFAULT_ROLE_LABELS: Record<BrandRole, string> = {
  owner: 'Owner', manager: 'Manager', supervisor: 'Supervisor', worker: 'Worker', fitter: 'Fitter', viewer: 'View only',
};

export const MIN_CONTRAST = 4.5;
const HEX = /^#[0-9A-Fa-f]{6}$/;

/** WCAG contrast of a #RRGGBB colour against white text, rounded to 2 places (same as SQL). */
export function contrastWithWhite(hex: string): number {
  const ch = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
  return Math.round((1.05 / (l + 0.05)) * 100) / 100;
}

const colour = z.string().regex(HEX);

/** Lenient on read: anything invalid is dropped, so a bad value never breaks the app. */
export const brandingSchema = z.object({
  logoPath: z.string().nullable().optional().catch(undefined),
  colors: z.object({
    primary: colour.optional().catch(undefined),
    accent: colour.optional().catch(undefined),
  }).optional().catch(undefined),
  pdfName: z.string().max(100).optional().catch(undefined),
  roleLabels: z.object(Object.fromEntries(BRAND_ROLES.map((r) => [r, z.string().min(1).max(40).optional().catch(undefined)])) as unknown as Record<BrandRole, z.ZodType<string | undefined>>)
    .optional().catch(undefined),
});

export type Branding = z.output<typeof brandingSchema>;

export function parseBranding(raw: unknown): Branding {
  const r = brandingSchema.safeParse(raw && typeof raw === 'object' ? raw : {});
  return r.success ? (JSON.parse(JSON.stringify(r.data)) as Branding) : {}; // drop keys left undefined
}

export function roleLabel(branding: Branding | undefined, role: AppRole | undefined): string {
  if (!role) return '';
  return branding?.roleLabels?.[role as BrandRole] ?? DEFAULT_ROLE_LABELS[role as BrandRole] ?? role;
}

/** Plain-English problems before saving (the server checks the same rules). */
export function brandingProblems(b: { colors?: { primary?: string; accent?: string }; pdfName?: string; roleLabels?: Partial<Record<BrandRole, string>> }): string[] {
  const out: string[] = [];
  for (const [name, value] of Object.entries(b.colors ?? {})) {
    if (!value) continue;
    if (!HEX.test(value)) out.push(`The ${name} colour must look like #1F6FEB`);
    else if (contrastWithWhite(value) < MIN_CONTRAST) {
      out.push(`The ${name} colour is too light for white text (contrast ${contrastWithWhite(value)}:1, needs ${MIN_CONTRAST}:1). Pick a darker shade.`);
    }
  }
  if (b.pdfName !== undefined && (b.pdfName.trim().length < 1 || b.pdfName.length > 100)) out.push('The name on documents must be 1–100 characters');
  for (const [role, label] of Object.entries(b.roleLabels ?? {})) {
    if (label !== undefined && (label.trim().length < 1 || label.length > 40)) out.push(`The job title for ${role} must be 1–40 characters`);
  }
  return out;
}
