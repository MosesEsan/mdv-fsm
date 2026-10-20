import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { isOwnerRole } from '@/core/auth/claims';
import { saveModuleSettings, tenantSettingsKey, type TenantSettingsData } from './api';
import { getSettingsDefinition, type ModuleSettingsMap, type SettingsNamespace } from './registry';
import { parseTenantSettings } from './schema';

type UpdateVars = {
  [N in SettingsNamespace]: { namespace: N; value: ModuleSettingsMap[N] };
}[SettingsNamespace];

/** Owner only. Optimistic: the screen updates at once and rolls back if the server refuses. */
export function useUpdateTenantSettings() {
  const claims = useAuthClaims();
  const queryClient = useQueryClient();
  const key = tenantSettingsKey(claims?.tenantId);
  const canEdit = isOwnerRole(claims?.role);

  const mutation = useMutation({
    mutationFn: async ({ namespace, value }: UpdateVars) => {
      if (!canEdit) throw new Error('Only the owner can change settings');
      const clean = getSettingsDefinition(namespace).schema.parse(value);
      return saveModuleSettings(namespace, clean);
    },
    onMutate: async ({ namespace, value }: UpdateVars) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TenantSettingsData>(key);
      if (previous) {
        queryClient.setQueryData<TenantSettingsData>(key, {
          ...previous,
          settings: { ...previous.settings, [namespace]: value },
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (storedSettings) => {
      queryClient.setQueryData<TenantSettingsData>(key, (current) =>
        current ? { ...current, settings: parseTenantSettings(storedSettings) } : current,
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  /** Merge a partial change into the module's current settings and save the whole namespace. */
  const updateModule = useCallback(
    <N extends SettingsNamespace>(namespace: N, patch: Partial<ModuleSettingsMap[N]>) => {
      const current = queryClient.getQueryData<TenantSettingsData>(key)?.settings?.[namespace];
      mutation.mutate({ namespace, value: { ...current, ...patch } } as UpdateVars);
    },
    [mutation, queryClient, key],
  );

  return { ...mutation, canEdit, updateModule };
}
