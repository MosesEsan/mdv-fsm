// Tab menu entries must be top-level routes in app/(app)/(tabs): '/jobs' → route 'jobs', '/' → 'index'.
export function tabRouteName(path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean === '' ? 'index' : clean;
}
