import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { isOwnerRole } from '@/core/auth/claims';
import { copyQuote, deleteDraft, fetchJobQuotes, fetchPrices, fetchProfile, fetchQuote, quoteKeys, savePrice, saveProfile, saveQuote, setQuoteStatus, type QuoteProfile } from './quoteApi';
import type { PriceItem } from './quoteRules';
import { flooringKeys } from './api';

/** Quotes and prices are for the owner only; other roles never even ask the server. */
export const useIsOwner = () => isOwnerRole(useAuthClaims()?.role);

export const useJobQuotes = (jobId: string) => {
  const owner = useIsOwner();
  return useQuery({ queryKey: quoteKeys.forJob(jobId), queryFn: () => fetchJobQuotes(jobId), enabled: owner });
};
export const useQuote = (id: string | null) =>
  useQuery({ queryKey: quoteKeys.one(id ?? 'new'), queryFn: () => fetchQuote(id as string), enabled: Boolean(id) });
export const usePrices = () => useQuery({ queryKey: quoteKeys.prices, queryFn: fetchPrices, enabled: useIsOwner() });
export const useQuoteProfile = () => useQuery({ queryKey: quoteKeys.profile, queryFn: fetchProfile, enabled: useIsOwner() });

export function useQuoteMutations() {
  const qc = useQueryClient();
  const tenantId = useAuthClaims()?.tenantId as string;
  const refresh = () => qc.invalidateQueries({ queryKey: flooringKeys.all });
  return {
    save: useMutation({ mutationFn: saveQuote, onSuccess: refresh }),
    copy: useMutation({ mutationFn: copyQuote, onSuccess: refresh }),
    status: useMutation({ mutationFn: (v: { id: string; status: 'draft' | 'sent' | 'accepted' | 'declined'; pdfFileId?: string }) => setQuoteStatus(v.id, v.status, v.pdfFileId), onSuccess: refresh }),
    remove: useMutation({ mutationFn: deleteDraft, onSuccess: refresh }),
    savePrice: useMutation({ mutationFn: (p: Omit<PriceItem, 'id' | 'sort_order'> & { id?: string }) => savePrice(tenantId, p), onSuccess: refresh }),
    saveProfile: useMutation({ mutationFn: (p: QuoteProfile) => saveProfile(tenantId, p), onSuccess: refresh }),
  };
}
