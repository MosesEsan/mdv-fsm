// Pure logo checks (unit-tested). Mirrors the branding bucket's limits.
export const LOGO_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
export const LOGO_MAX_BYTES = 1024 * 1024;

export function logoProblem(file: { type: string; size: number }): string | null {
  if (!LOGO_TYPES[file.type]) return 'The logo must be a PNG, JPEG or WebP image';
  if (file.size > LOGO_MAX_BYTES) return 'The logo must be 1 MB or smaller';
  return null;
}

export const logoPathFor = (tenantId: string, type: string, id: string) => `${tenantId}/logo/${id}.${LOGO_TYPES[type]}`;

