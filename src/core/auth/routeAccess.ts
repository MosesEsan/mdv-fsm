export function isPublicRoute(segments: string[]) {
  return segments.length === 0 || segments[0] === 'index';
}
