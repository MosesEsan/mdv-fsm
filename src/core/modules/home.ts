// Home screen extras that features register, like menu entries: getting-started steps and cards.
// Home renders from these lists and never names a feature.
import type { ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AppRole } from '@/core/auth/claims';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { getSupabase } from '@/core/supabase';

export type GettingStartedStep = {
  id: string;
  feature: string;
  title: string;
  description: string;
  /** Where the step's row goes, e.g. '/schedule'. */
  path: string;
  roles: 'all' | readonly AppRole[];
  order?: number;
  /** True once the step is done, undefined while loading. Called for every registered step on every render. */
  useDone: () => boolean | undefined;
};

export type HomeCard = {
  id: string;
  feature: string;
  roles: 'all' | readonly AppRole[];
  order?: number;
  Component: ComponentType;
};

const steps = new Map<string, GettingStartedStep>();
const cards = new Map<string, HomeCard>();

export function registerGettingStarted(step: GettingStartedStep): void {
  if (!steps.has(step.id)) steps.set(step.id, step);
}
export function registerHomeCard(card: HomeCard): void {
  if (!cards.has(card.id)) cards.set(card.id, card);
}

const allowed = (roles: 'all' | readonly AppRole[], role: AppRole | undefined) => !!role && (roles === 'all' || roles.includes(role));
const byOrder = (a: { order?: number }, b: { order?: number }) => (a.order ?? 100) - (b.order ?? 100);

/** Every registered step, in a fixed order (their hooks are called in this order every render). */
export const allGettingStarted = (): GettingStartedStep[] => [...steps.values()].sort(byOrder);

/** Steps still to do for this person. Pure, so it's unit-tested. Empty while anything is loading. */
export function stepsToShow(
  list: GettingStartedStep[], done: (boolean | undefined)[], role: AppRole | undefined, isFeatureEnabled: (f: string) => boolean,
): GettingStartedStep[] {
  const relevant = list.map((s, i) => ({ s, d: done[i] })).filter(({ s }) => isFeatureEnabled(s.feature) && allowed(s.roles, role));
  if (relevant.some(({ d }) => d === undefined)) return [];
  return relevant.filter(({ d }) => !d).map(({ s }) => s);
}

export function homeCardsFor(role: AppRole | undefined, isFeatureEnabled: (f: string) => boolean): HomeCard[] {
  return [...cards.values()].filter((c) => isFeatureEnabled(c.feature) && allowed(c.roles, role)).sort(byOrder);
}

/** For getting-started steps: does this table have any rows yet? Only asks when the feature is on. */
export function useHasRows(table: string, feature: string): boolean | undefined {
  const { isFeatureEnabled } = useTenantSettings();
  const on = isFeatureEnabled(feature);
  const q = useQuery({
    queryKey: ['home', 'has-rows', table],
    enabled: on,
    staleTime: 60_000,
    queryFn: async () => {
      const { count, error } = await getSupabase().from(table).select('id', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      return (count ?? 0) > 0;
    },
  });
  if (!on) return true;
  return q.isError ? true : q.data;
}

/** For tile counts: how many rows match. Undefined while loading or when the feature is off. */
export function useRowCount(key: string, feature: string, count: () => Promise<number>): number | undefined {
  const { isFeatureEnabled } = useTenantSettings();
  const on = isFeatureEnabled(feature);
  const q = useQuery({ queryKey: ['home', 'count', key], enabled: on, staleTime: 60_000, queryFn: count });
  return on ? q.data : undefined;
}
