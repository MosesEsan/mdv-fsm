import type { NavItem } from './registry';

/** The tab whose first screen is showing, if any (exact match: deeper screens like a job page have no tab bar). */
export function activeTab(tabs: NavItem[], pathname: string): NavItem | undefined {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return tabs.find((t) => t.path === clean);
}

