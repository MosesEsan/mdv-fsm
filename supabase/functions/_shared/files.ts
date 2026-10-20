// Pure helpers for generated files (no Deno or npm imports, so they're unit-tested with Vitest).

const SEGMENT = /^[a-z0-9][a-z0-9_-]{0,60}$/;

/** {tenantId}/{module}/{folder}/{name}. Segments are restricted so a path can't escape its folder. */
export function filePath(tenantId: string, module: string, folder: string, name: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(tenantId)) throw new Error('Invalid tenant');
  if (!SEGMENT.test(module) || !SEGMENT.test(folder)) throw new Error('Invalid folder');
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,120}$/.test(name) || name.includes('..')) throw new Error('Invalid file name');
  return `${tenantId}/${module}/${folder}/${name}`;
}

export const contentTypes = { csv: 'text/csv; charset=utf-8', pdf: 'application/pdf' } as const;
