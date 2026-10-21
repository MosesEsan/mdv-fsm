// ts-export (Timesheets module): CSV or PDF of signed-off timesheets for whole weeks in a period,
// or (report = 'customer_month') one customer's visits for a month.
// Stores the file in the core 'exports' bucket, marks the weeks exported, records it in core
// file_exports, and returns the path (the app makes its own download link).
// Trust model: rows are read and the export recorded with the CALLER's token (the database decides
// who may export and which tenant's data they get); only the upload uses the service role.
import { clientsFor } from '../_shared/clients.ts';
import { contentTypes, filePath } from '../_shared/files.ts';
import { json, preflight, readJson } from '../_shared/http.ts';
import { buildTablePdf } from '../_shared/pdf/table.ts';
import { removeFile, storeFile } from '../_shared/storage.ts';
import { buildCustomerCsv, customerReportFileName, customerReportTable, validateCustomerReportRequest, type VisitRow } from './customerReport.ts';
import { buildEntriesCsv, exportFileName, summarise, summaryTable, validateExportRequest, type ExportRow } from './rows.ts';

const MODULE = 'timesheets';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const clients = clientsFor(req);
  if (!clients) return json(401, { error: 'Please sign in again.' });
  const body = await readJson(req);
  if ((body as { report?: unknown } | null)?.report === 'customer_month') return customerMonth(clients, body);
  const request = validateExportRequest(body);
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

// Customer × month report. Rows and the record use the caller's token; owner, managers and accounts (viewer) may export.
async function customerMonth(clients: NonNullable<ReturnType<typeof clientsFor>>, body: unknown): Promise<Response> {
  const request = validateCustomerReportRequest(body);
  if ('error' in request) return json(400, request);
  const { asUser, admin } = clients;

  const [rowsResult, customerResult] = await Promise.all([
    asUser.rpc('ts_customer_month_report', { p_customer: request.customerId, p_month: `${request.month}-01` }),
    asUser.from('customers').select('name, tenant_id').eq('id', request.customerId).single(),
  ]);
  if (rowsResult.error) return json(400, { error: rowsResult.error.message });
  if (customerResult.error || !customerResult.data) return json(404, { error: 'That customer wasn’t found.' });
  const rows = (rowsResult.data ?? []) as VisitRow[];
  if (rows.length === 0) return json(200, { empty: true, message: 'No visits for this customer in that month.' });
  const { name: customerName, tenant_id: tenantId } = customerResult.data;

  let bytes: Uint8Array;
  if (request.format === 'csv') {
    bytes = new TextEncoder().encode(buildCustomerCsv(rows));
  } else {
    const { data: tenant } = await asUser.from('tenants').select('name, timezone, branding').eq('id', tenantId).single();
    bytes = await buildTablePdf(customerReportTable(rows, {
      businessName: (tenant?.branding as { pdfName?: string } | null)?.pdfName ?? tenant?.name ?? 'Your business',
      customerName,
      month: request.month,
      generatedAt: new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short', timeZone: tenant?.timezone ?? 'Europe/Dublin' }).format(new Date()),
    }));
  }

  const path = filePath(tenantId, MODULE, 'exports', `customer_${request.month}_${crypto.randomUUID()}.${request.format}`);
  if (!(await storeFile(admin, path, bytes, contentTypes[request.format]))) {
    return json(500, { error: 'The file could not be saved. Please try again.' });
  }
  const record = await asUser.rpc('ts_record_customer_report', {
    p_customer: request.customerId, p_month: `${request.month}-01`, p_format: request.format, p_storage_path: path,
  });
  if (record.error) {
    await removeFile(admin, path);
    return json(record.error.code === '42501' ? 403 : 400, { error: record.error.message });
  }
  return json(200, { export: record.data, path, fileName: customerReportFileName(customerName, request.month, request.format) });
}
