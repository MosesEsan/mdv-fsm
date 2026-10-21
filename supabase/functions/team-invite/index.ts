// team-invite (core): the business owner invites someone from the app.
// The caller must be an owner (checked in the database with the caller's token, through team_add_member).
// Creating the login needs the service role; adding them to the business is the checked, logged RPC.
import { clientsFor } from '../_shared/clients.ts';
import { json, preflight, readJson } from '../_shared/http.ts';
import { validateTeamInvite } from './invite.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const clients = clientsFor(req);
  if (!clients) return json(401, { error: 'Please sign in again.' });
  const request = validateTeamInvite(await readJson(req));
  if ('error' in request) return json(400, request);
  const { asUser, admin } = clients;

  // Fails unless the caller is an owner: stops anyone else creating logins.
  const allowed = await asUser.rpc('team_members');
  if (allowed.error) return json(403, { error: 'Only the owner can invite people' });

  const invited = await admin.auth.admin.inviteUserByEmail(request.email, {
    redirectTo: request.redirectTo || Deno.env.get('INVITE_REDIRECT_URL') || undefined,
    data: { full_name: request.fullName },
  });
  if (invited.error || !invited.data.user) {
    const taken = /already/i.test(invited.error?.message ?? '');
    return json(taken ? 409 : 400, { error: taken ? 'This email already has a login. Ask us if they need moving to your business.' : 'The invite could not be sent. Please try again.' });
  }

  const added = await asUser.rpc('team_add_member', { p_user: invited.data.user.id, p_full_name: request.fullName, p_role: request.role });
  if (added.error) {
    await admin.auth.admin.deleteUser(invited.data.user.id); // don't leave a login with no business
    return json(400, { error: added.error.message });
  }
  return json(200, { userId: invited.data.user.id, email: request.email });
});
