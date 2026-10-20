// ts-export (Timesheets module): CSV or PDF of signed-off timesheets for whole weeks in a period.
// Stores the file in the core 'exports' bucket, marks the weeks exported, records it in core
// file_exports, and returns the path (the app makes its own download link).
// Trust model: rows are read and the export recorded with the CALLER's token (the database decides
// who may export and which tenant's data they get); only the upload uses the service role.
import { clientsFor } from '../_shared/clients.ts';
import { contentTypes, filePath } from '../_shared/files.ts';
import { json, preflight, readJson } from '../_shared/http.ts';
import { buildTablePdf } from '../_shared/pdf/table.ts';
import { removeFile, storeFile } from '../_shared/storage.ts';
import { buildEntriesCsv, exportFileName, summarise, summaryTable, validateExportRequest, type ExportRow } from './rows.ts';

const MODULE = 'timesheets';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const clients = clientsFor(req);
  if (!clients) return json(401, { error: 'Please sign in again.' });
  const request = validateExportRequest(await readJson(req));
  if ('error' in request) return json(400, request);
  const { asUser, admin } = clients;

  // 1. Rows the caller may export (raises unless owner/manager with the module on).
  const rowsResult = await asUser.rpc('ts_export_rows', { p_from: request.from, p_to: request.to, p_include_exported: request.includeExported });
  if (rowsResult.error) return json(rowsResult.error.code === '42501' ? 403 : 400, { error: rowsResult.error.message });
  const rows = (rowsResult.data ?? []) as ExportRow[];
  if (rows.length === 0) return json(200, { empty: true, message: 'There are no signed-off weeks starting in this period.' });
  const tenantId = rows[0].tenant_id;

  // 2. Build the file.
  let bytes: Uint8Array;
  if (request.format === 'csv') {
    bytes = new TextEncoder().encode(buildEntriesCsv(rows));
  } else {
    const { data: tenant } = await asUser.from('tenants').select('name, timezone, settings').eq('id', tenantId).single();
    const step = Number((tenant?.settings as { timesheets?: { roundingMinutes?: number } } | null)?.timesheets?.roundingMinutes ?? 15);
    bytes = await buildTablePdf(summaryTable(summarise(rows), {
      businessName: tenant?.name ?? 'Your business',
      from: request.from,
      to: request.to,
      generatedAt: new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short', timeZone: tenant?.timezone ?? 'Europe/Dublin' }).format(new Date()),
      roundingNote: step > 0 ? `each entry rounded to the nearest ${step} minutes` : 'exact times, no rounding',
    }));
  }

  // 3. Store it, then record it (marks weeks exported). Undo the upload if recording fails.
  const path = filePath(tenantId, MODULE, 'exports', `${request.from}_to_${request.to}_${crypto.randomUUID()}.${request.format}`);
  if (!(await storeFile(admin, path, bytes, contentTypes[request.format]))) {
    return json(500, { error: 'The file could not be saved. Please try again.' });
  }
  const record = await asUser.rpc('ts_record_export', {
    p_week_ids: [...new Set(rows.map((r) => r.week_id))], p_from: request.from, p_to: request.to, p_format: request.format, p_storage_path: path,
  });
  if (record.error) {
    await removeFile(admin, path);
    return json(record.error.code === '40001' ? 409 : 400, { error: record.error.message });
  }

  return json(200, { export: record.data, path, fileName: exportFileName(request.from, request.to, request.format) });
});
