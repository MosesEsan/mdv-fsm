import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { customerKeys } from '@/core/customers';
import { createEnquiry, enquiryKeys, fetchEnquiries, fetchEnquiry, setEnquiryOutcome, setViewingTime, updateJob } from './enquiryApi';
import { flooringKeys } from './api';

export const useEnquiries = (scope: 'open' | 'all') => useQuery({ queryKey: enquiryKeys.list(scope), queryFn: () => fetchEnquiries(scope) });
export const useEnquiry = (jobId: string) => useQuery({ queryKey: enquiryKeys.one(jobId), queryFn: () => fetchEnquiry(jobId) });

export function useEnquiryMutations(jobId?: string) {
  const qc = useQueryClient();
  const tenantId = useAuthClaims()?.tenantId as string;
  const refresh = () => {
    qc.invalidateQueries({ queryKey: flooringKeys.all });
    qc.invalidateQueries({ queryKey: customerKeys.all });
  };
  return {
    create: useMutation({ mutationFn: createEnquiry, onSuccess: refresh }),
    outcome: useMutation({ mutationFn: (v: { lost: boolean; reason: string | null }) => setEnquiryOutcome(jobId as string, v.lost, v.reason), onSuccess: refresh }),
    viewingTime: useMutation({ mutationFn: (at: Date | null) => setViewingTime(tenantId, jobId as string, at), onSuccess: refresh }),
    job: useMutation({ mutationFn: (v: { summary: string; site_address: string | null }) => updateJob(jobId as string, v), onSuccess: refresh }),
  };
}
