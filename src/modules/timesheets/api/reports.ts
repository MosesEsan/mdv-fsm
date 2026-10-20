// Timesheets reports and export: module-specific queries. File storage, export history and
// function calls come from core.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IsoDate } from '@/core/dates';
import { fileExportsKey, type FileExport } from '@/core/files/exports';
import { callFunction } from '@/core/functions';
import { getSupabase, unwrap } from '@/core/supabase';
import { tsKeys } from './hooks';

export type ReportGroup = 'worker' | 'job' | 'week';
export type ReportRow = { group_key: string; label: string; sort_key: string; entry_count: number; total_minutes: number; rounded_minutes: number };
export type ExportFormat = 'csv' | 'pdf';
export type TimesheetsExportMeta = { week_count?: number; entry_count?: number; total_minutes?: number };
export type ExportResult =
  | { empty: true; message: string }
  | { empty?: false; export: FileExport; path: string; fileName: string };

export async function fetchHoursReport(from: IsoDate, to: IsoDate, group: ReportGroup, onlySignedOff: boolean): Promise<ReportRow[]> {
  return unwrap(
    await getSupabase().rpc('ts_hours_report', { p_from: from, p_to: to, p_group: group, p_only_signed_off: onlySignedOff }),
  ) as ReportRow[];
}

export const runExport = (args: { from: IsoDate; to: IsoDate; format: ExportFormat; includeExported: boolean }) =>
  callFunction<ExportResult>('ts-export', args, 'The export didn’t work. Please try again.');

export const useHoursReport = (from: IsoDate, to: IsoDate, group: ReportGroup, onlySignedOff: boolean, enabled: boolean) =>
  useQuery({
    queryKey: [...tsKeys.all, 'report', from, to, group, onlySignedOff] as const,
    queryFn: () => fetchHoursReport(from, to, group, onlySignedOff),
    enabled,
  });

export function useRunExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: runExport,
    // Weeks change status (exported) and a new file appears in the history.
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: tsKeys.all });
      await qc.invalidateQueries({ queryKey: fileExportsKey('timesheets') });
    },
  });
}
