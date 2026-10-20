// If Stage 0 already has a session hook, make this read from it instead.
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import type { AuthClaims } from './claims';

export function useAuthClaims(): AuthClaims | null {
  return useContext(AuthContext).claims as AuthClaims | null;
}
