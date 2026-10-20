import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { createCustomer, customerKeys, fetchCustomer, searchCustomers, updateCustomer } from './api';
import type { customerValues } from './rules';

type Values = ReturnType<typeof customerValues>;

export const useCustomerSearch = (term: string) =>
  useQuery({ queryKey: customerKeys.search(term.trim()), queryFn: () => searchCustomers(term), staleTime: 30_000 });
export const useCustomer = (id: string | null | undefined) =>
  useQuery({ queryKey: customerKeys.one(id ?? '-'), queryFn: () => fetchCustomer(id as string), enabled: Boolean(id) });

export function useCustomerMutations() {
  const qc = useQueryClient();
  const tenantId = useAuthClaims()?.tenantId as string;
  const refresh = () => qc.invalidateQueries({ queryKey: customerKeys.all });
  return {
    create: useMutation({ mutationFn: (v: Values) => createCustomer(tenantId, v), onSuccess: refresh }),
    update: useMutation({ mutationFn: (v: { id: string; values: Values }) => updateCustomer(v.id, v.values), onSuccess: refresh }),
  };
}
