// platform-invite (core, platform team only): creates a login, emails an invite, adds the person to a business.
// The caller must be a platform admin (checked in the database with the caller's token).
// Creating the login needs the service role; adding them to the business is a checked, audited RPC.
// Where the invite link lands: INVITE_REDIRECT_URL (optional secret, e.g. https://app.example.com/set-password)
// or else the admin page's own /set-password. Either must be in Auth > URL configuration > redirect URLs.
import { clientsFor } from '../_shared/clients.ts';
import { json, preflight, readJson } from '../_shared/http.ts';
import { validateInvite } from './invite.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const clients = clientsFor(req);
  if (!clients) return json(401, { error: 'Please sign in again.' });
  const request = validateInvite(await readJson(req));
  if ('error' in request) return json(400, request);
  const { asUser, admin } = clients;

  const who = await asUser.rpc('platform_whoami');
  if (who.error || who.data !== true) return json(403, { error: 'Only the platform team can do this' });
  const tenant = await asUser.rpc('platform_get_tenant', { p_tenant: request.tenantId });
  if (tenant.error) return json(404, { error: 'Business not found' });

  const invited = await admin.auth.admin.inviteUserByEmail(request.email, {
    redirectTo: Deno.env.get('INVITE_REDIRECT_URL') || request.redirectTo,
    data: { full_name: request.fullName },
  });
  if (invited.error || !invited.data.user) {
    const taken = /already/i.test(invited.error?.message ?? '');
    return json(taken ? 409 : 400, { error: taken ? 'This email already has a login.' : 'The invite could not be sent. Please try again.' });
  }

  const added = await asUser.rpc('platform_add_member', {
    p_tenant: request.tenantId, p_user: invited.data.user.id, p_full_name: request.fullName, p_role: request.role,
  });
  if (added.error) {
    await admin.auth.admin.deleteUser(invited.data.user.id); // don't leave a login with no business
    return json(400, { error: added.error.message });
  }
  return json(200, { userId: invited.data.user.id, email: request.email });
});
