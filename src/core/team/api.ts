// Team data: owner-only RPCs, and the team-invite Edge Function for new logins.
import * as Linking from 'expo-linking';
import { callFunction } from '@/core/functions';
import { getSupabase } from '@/core/supabase';
import type { Member, TeamRole } from './rules';

export const teamKeys = { all: ['team'] as const };

export async function fetchTeam(): Promise<Member[]> {
  const { data, error } = await getSupabase().rpc('team_members');
  if (error) throw new Error(error.message);
  return (data ?? []) as Member[];
}

/** Sends the invite email. Its link opens this app's set-password screen (must be on Supabase's redirect list). */
export function inviteMember(v: { fullName: string; email: string; role: TeamRole }) {
  return callFunction('team-invite', { ...v, redirectTo: Linking.createURL('/set-password') }, 'The invite could not be sent. Please try again.');
}

export async function updateMember(v: { id: string; fullName: string; role: string; active: boolean }): Promise<void> {
  const { error } = await getSupabase().rpc('team_update_member', { p_user: v.id, p_full_name: v.fullName, p_role: v.role, p_active: v.active });
  if (error) throw new Error(error.message);
}
