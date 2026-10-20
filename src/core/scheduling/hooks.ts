import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { isManagerRole } from '@/core/auth/claims';
import { addDays, today, weekDays } from '@/core/dates';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { getSupabase } from '@/core/supabase';
import {
  cancelBooking, createJob, fetchBookings, fetchJobSheet, fetchJobs, fetchPeople, saveBooking, scheduleKeys,
} from './api';
import { rangeForDays } from './rules';

export function useScheduleContext() {
  const claims = useAuthClaims();
  const { timezone } = useTenantSettings();
  return { tz: timezone ?? 'Europe/Dublin', userId: claims?.userId, tenantId: claims?.tenantId, canEdit: isManagerRole(claims?.role) };
}

/** Bookings for a run of local days. */
export function useBookings(days: string[]) {
  const { tz } = useScheduleContext();
  const { from, to } = useMemo(() => rangeForDays(days, tz), [days, tz]);
  return useQuery({ queryKey: scheduleKeys.range(from, to), queryFn: () => fetchBookings(from, to) });
}

/** The next two weeks for the signed-in person (RLS already limits staff to their own bookings). */
export function useMyUpcoming() {
  const { tz, userId } = useScheduleContext();
  const days = useMemo(() => weekDays(today(tz)).concat(weekDays(addDays(today(tz), 7))), [tz]);
  const q = useBookings(days);
  return { ...q, data: q.data?.filter((b) => b.status === 'scheduled' && (!userId || b.userIds.includes(userId))) };
}

export const usePeople = () => useQuery({ queryKey: scheduleKeys.people, queryFn: fetchPeople, staleTime: 5 * 60_000 });
export const useJobOptions = (enabled = true) => useQuery({ queryKey: scheduleKeys.jobs, queryFn: fetchJobs, enabled });
export const useJobSheet = (bookingId: string) =>
  useQuery({ queryKey: scheduleKeys.sheet(bookingId), queryFn: () => fetchJobSheet(bookingId) });

export function useScheduleMutations() {
  const qc = useQueryClient();
  const { tenantId } = useScheduleContext();
  const refresh = () => qc.invalidateQueries({ queryKey: scheduleKeys.all });
  return {
    save: useMutation({ mutationFn: saveBooking, onSuccess: refresh }),
    cancel: useMutation({ mutationFn: cancelBooking, onSuccess: refresh }),
    createJob: useMutation({
      mutationFn: (v: { summary: string; siteAddress: string }) => createJob(tenantId as string, v.summary, v.siteAddress),
      onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.jobs }),
    }),
  };
}

/** Mount once on schedule screens: any change to bookings refreshes every open view on every device. */
export function useScheduleLive(): void {
  const qc = useQueryClient();
  const { tenantId } = useScheduleContext();
  useEffect(() => {
    if (!tenantId) return;
    const supabase = getSupabase();
    const refresh = () => qc.invalidateQueries({ queryKey: scheduleKeys.all });
    const channel = supabase
      .channel(`schedule:${tenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `tenant_id=eq.${tenantId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_assignees', filter: `tenant_id=eq.${tenantId}` }, refresh)
      .subscribe();
    const app = AppState.addEventListener('change', (s) => { if (s === 'active') refresh(); });
    return () => { app.remove(); supabase.removeChannel(channel); };
  }, [tenantId, qc]);
}
