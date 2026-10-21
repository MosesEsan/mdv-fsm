import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTeam, inviteMember, teamKeys, updateMember } from './api';

export const useTeam = (enabled: boolean) => useQuery({ queryKey: teamKeys.all, queryFn: fetchTeam, enabled });

export function useTeamMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: teamKeys.all });
  return {
    invite: useMutation({ mutationFn: inviteMember, onSuccess: refresh }),
    update: useMutation({ mutationFn: updateMember, onSuccess: refresh }),
  };
}
