import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { createCustomer, customerKeys, fetchCustomer, fetchCustomerJobs, listCustomers, searchCustomers, updateCustomer } from './api';
import type { customerValues } from './rules';

type Values = ReturnType<typeof customerValues>;

export const useCustomerSearch = (term: string) =>
  useQuery({ queryKey: customerKeys.search(term.trim()), queryFn: () => searchCustomers(term), staleTime: 30_000 });
export const useCustomer = (id: string | null | undefined) =>
  useQuery({ queryKey: customerKeys.one(id ?? '-'), queryFn: () => fetchCustomer(id as string), enabled: Boolean(id) });

export const useCustomerList = (term: string) =>
  useQuery({ queryKey: [...customerKeys.all, 'list', term.trim()], queryFn: () => listCustomers(term), staleTime: 30_000, placeholderData: (prev) => prev });
export const useCustomerJobs = (id: string) =>
  useQuery({ queryKey: [...customerKeys.all, 'jobs', id], queryFn: () => fetchCustomerJobs(id) });

export function useCustomerMutations() {
  const qc = useQueryClient();
  const tenantId = useAuthClaims()?.tenantId as string;
  const refresh = () => qc.invalidateQueries({ queryKey: customerKeys.all });
  return {
    create: useMutation({ mutationFn: (v: Values) => createCustomer(tenantId, v), onSuccess: refresh }),
    update: useMutation({ mutationFn: (v: { id: string; values: Values }) => updateCustomer(v.id, v.values), onSuccess: refresh }),
  };
}
