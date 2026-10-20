// Export history (core table file_exports), shared by every module.
import { useQuery } from '@tanstack/react-query';
import { getSupabase, unwrap } from '@/core/supabase';
import type { IsoDate } from '@/core/dates';

export type FileExport = {
  id: string;
  module: string;
  title: string;
  format: 'csv' | 'pdf';
  period_from: IsoDate | null;
  period_to: IsoDate | null;
  storage_path: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export const fileExportsKey = (module: string) => ['file-exports', module] as const;

export async function fetchFileExports(module: string, limit = 20): Promise<FileExport[]> {
  return unwrap(
    await getSupabase().from('file_exports').select('*').eq('module', module).order('created_at', { ascending: false }).limit(limit),
  ) as FileExport[];
}

/** Owners/managers only (RLS). */
export const useFileExports = (module: string, enabled: boolean) =>
  useQuery({ queryKey: fileExportsKey(module), queryFn: () => fetchFileExports(module), enabled });
