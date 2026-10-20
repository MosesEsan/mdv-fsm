import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { getSupabase } from '@/core/supabase';
import { claimsFromAccessToken, isLockedTenantMismatch, platformAdminFromAccessToken, type AuthClaims } from './claims';

type AuthValue = {
  session: Session | null;
  claims: AuthClaims | null;
  /** Platform team (from the token; platform functions re-check in the database). */
  isPlatformAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthValue>({
  session: null, claims: null, isPlatformAdmin: false, isLoading: true, authError: null,
  signIn: async () => {}, setPassword: async () => {}, signOut: async () => {},
});

export function useSession() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const accessToken = session?.access_token;
  const claims = useMemo(() => claimsFromAccessToken(accessToken), [accessToken]);
  const isPlatformAdmin = useMemo(() => platformAdminFromAccessToken(accessToken), [accessToken]);

  // White-label builds are locked to one business.
  useEffect(() => {
    const locked = Constants.expoConfig?.extra?.lockedTenantId;
    if (session && isLockedTenantMismatch(locked, claims)) {
      setAuthError((current) => current ?? 'This account belongs to a different business.');
      void getSupabase().auth.signOut();
    } else if (!session) setAuthError((current) => current === null ? current : null);
  }, [session, claims]);

  const value = useMemo<AuthValue>(() => ({
    session,
    claims,
    isPlatformAdmin,
    isLoading,
    authError,
    signIn: async (email, password) => {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw new Error('That email and password don’t match. Check them and try again.');
    },
    setPassword: async (password) => {
      const { error } = await getSupabase().auth.updateUser({ password });
      if (error) throw new Error('The password could not be saved. The link may have expired; ask for a new invite.');
      await getSupabase().auth.refreshSession(); // pick up tenant_id / app_role in the token
    },
    signOut: async () => {
      await getSupabase().auth.signOut();
    },
  }), [session, claims, isPlatformAdmin, isLoading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
