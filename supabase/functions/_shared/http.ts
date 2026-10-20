// HTTP helpers for Edge Functions: CORS and JSON replies with plain-English errors.
export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export const preflight = () => new Response('ok', { headers: cors });

export async function readJson(req: Request): Promise<unknown | undefined> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}
