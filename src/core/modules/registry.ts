// Module registry. Each module registers itself (from its own register.ts) with:
//   - the feature flag that switches it on (tenants.features[feature])
//   - the menu entries it adds, and which roles see them
// The app shell (home screen, menus) renders from this list and never names a module.
import type { AppRole } from '@/core/auth/claims';

export type NavItem = {
  /** Expo Router path, e.g. '/timesheets/approvals'. */
  path: string;
  title: string;
  /** Short plain-English line shown under the title. */
  description?: string;
  /** 'all' or the roles that see this entry. The database still enforces access. */
  roles: 'all' | readonly AppRole[];
  /** Lower comes first. */
  order?: number;
};

export type ModuleDefinition = {
  /** Unique id; by convention also the settings namespace and the storage folder name. */
  id: string;
  /** Key in tenants.features. Usually the same as id. */
  feature: string;
  title: string;
  nav: readonly NavItem[];
};

const modules = new Map<string, ModuleDefinition>();

export function registerModule(def: ModuleDefinition): void {
  if (!/^[a-z][a-z0-9_]{0,40}$/.test(def.id)) throw new Error(`Invalid module id "${def.id}"`);
  if (!modules.has(def.id)) modules.set(def.id, def);
}

export function getModules(): ModuleDefinition[] {
  return [...modules.values()];
}

/** Menu entries for a role, limited to modules switched on for the tenant. Pure, so it's unit-tested. */
export function navFor(
  role: AppRole | undefined,
  isFeatureEnabled: (feature: string) => boolean,
  list: ModuleDefinition[] = getModules(),
): (NavItem & { moduleId: string; moduleTitle: string })[] {
  if (!role) return [];
  return list
    .filter((m) => isFeatureEnabled(m.feature))
    .flatMap((m) =>
      m.nav
        .filter((item) => item.roles === 'all' || item.roles.includes(role))
        .map((item) => ({ ...item, moduleId: m.id, moduleTitle: m.title })),
    )
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.title.localeCompare(b.title));
}

/** Tests only. */
export function _resetModules(): void {
  modules.clear();
}
