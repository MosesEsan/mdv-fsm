import { useState } from 'react';
import { usePeriodSelection } from '@/core/dates/usePeriodSelection';
import { openStoredFile } from '@/core/files/storage';
import { useFileExports } from '@/core/files/exports';
import { useHoursReport as useReportQuery, useRunExport, type ExportFormat, type ReportGroup } from '../api/reports';
import type { ReadyTimesheetsContext } from './useTimesheetsContext';

/** Hours report + export for owners and managers. The screen only renders this. */
export function useHoursReportScreen(ctx: ReadyTimesheetsContext) {
  const selection = usePeriodSelection(ctx.timezone, ctx.settings.weekStartsOn);
  const { period, problem } = selection;
  const [group, setGroup] = useState<ReportGroup>('worker');
  const [onlySignedOff, setOnlySignedOff] = useState(false);
  const [includeExported, setIncludeExported] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const report = useReportQuery(period.from, period.to, group, onlySignedOff, !problem);
  const rows = report.data ?? [];
  const exports = useFileExports('timesheets', ctx.actor.isManager);
  const run = useRunExport();

  const open = async (path: string, fileName?: string) => {
    setOpenError(null);
    try {
      await openStoredFile(path, fileName);
    } catch (e) {
      setOpenError(e instanceof Error ? e.message : String(e));
    }
  };

  const exportAs = (format: ExportFormat) => {
    setNotice(null);
    run.mutate(
      { from: period.from, to: period.to, format, includeExported },
      {
        onSuccess: (result) => {
          if (result.empty) {
            setNotice(result.message);
            return;
          }
          const weeks = Number(result.export.meta.week_count ?? 0);
          setNotice(`Exported ${weeks} week${weeks === 1 ? '' : 's'}.`);
          void open(result.path, result.fileName);
        },
      },
    );
  };

  return {
    selection, period, problem,
    group, setGroup, onlySignedOff, setOnlySignedOff,
    rows,
    totalMinutes: rows.reduce((s, r) => s + r.total_minutes, 0),
    roundedMinutes: rows.reduce((s, r) => s + r.rounded_minutes, 0),
    roundingStep: ctx.settings.roundingMinutes,
    isLoading: report.isLoading,
    error: report.error,
    canExport: ctx.actor.isManager,
    includeExported, setIncludeExported,
    exportAs,
    exporting: run.isPending,
    exportError: run.error,
    notice,
    pastExports: exports.data ?? [],
    openExport: (path: string) => open(path),
    openError,
  };
}
