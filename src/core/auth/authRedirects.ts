function normalizeBasePath(value?: string): string {
  const trimmed = value?.trim().replace(/^\/+|\/+$/g, '') ?? '';
  return trimmed ? `/${trimmed}` : '';
}

export function webAuthRedirectUrl(path: string, origin: string, basePath?: string): string {
  const route = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalizeBasePath(basePath)}${route}`;
}

export function isPasswordRecoveryUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('type') === 'recovery'
      || new URLSearchParams(parsed.hash.replace(/^#/, '')).get('type') === 'recovery';
  } catch {
    return false;
  }
}
