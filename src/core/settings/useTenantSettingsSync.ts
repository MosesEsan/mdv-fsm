// Mount ONCE near the app root (inside QueryClientProvider).
// Pushes settings changes to field devices: Realtime on the tenant row, plus a refetch
// whenever the app comes back to the foreground (covers dropped sockets and sleep).
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/core/supabase';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { tenantSettingsKey, toTenantSettingsData } from './api';

export function useTenantSettingsSync(): void {
  const queryClient = useQueryClient();
  const tenantId = useAuthClaims()?.tenantId;

  useEffect(() => {
    if (!tenantId) return;
    const key = tenantSettingsKey(tenantId);
    const supabase = getSupabase();

    const channel = supabase
      .channel(`tenant-settings:${tenantId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tenants', filter: `id=eq.${tenantId}` },
        (payload) => {
          const row = payload.new as Parameters<typeof toTenantSettingsData>[0];
          if (row?.id) queryClient.setQueryData(key, toTenantSettingsData(row));
          else queryClient.invalidateQueries({ queryKey: key });
        },
      )
      .subscribe();

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') queryClient.invalidateQueries({ queryKey: key });
    });

    return () => {
      appState.remove();
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient]);
}
