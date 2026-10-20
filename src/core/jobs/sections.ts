// Job sheet sections. Core shows the basics (when, where, customer, photos); modules add their own
// sections here (e.g. rooms measured at a viewing) without core knowing about them.
import type { ComponentType } from 'react';

export type JobSectionProps = { jobId: string; bookingId?: string; canEdit: boolean };
export type JobSection = { id: string; feature: string; order?: number; Component: ComponentType<JobSectionProps> };

const sections = new Map<string, JobSection>();

export function registerJobSection(section: JobSection): void {
  if (!sections.has(section.id)) sections.set(section.id, section);
}

export function jobSectionsFor(isFeatureEnabled: (feature: string) => boolean): JobSection[] {
  return [...sections.values()].filter((s) => isFeatureEnabled(s.feature)).sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

// Jobs list add-ons. A module can put a note above the jobs list (e.g. "2 extra work entries to
// add to invoices") and a tag on each job row, without core knowing about it.
export type JobRowTag = { label: string; tone: 'danger' | 'warning' | 'success' | 'neutral' };
export type JobListAddon = {
  id: string;
  feature: string;
  /** Shown above the list. */
  Banner?: ComponentType;
  /** Hook returning tags per job id. Called on every render of the list, so keep it a cached query. */
  useRowTags?: () => Record<string, JobRowTag[]>;
};

const listAddons = new Map<string, JobListAddon>();

export function registerJobListAddon(addon: JobListAddon): void {
  if (!listAddons.has(addon.id)) listAddons.set(addon.id, addon);
}

/** All registered add-ons, in a fixed order (hooks inside them are called in this order every render). */
export function jobListAddons(): JobListAddon[] {
  return [...listAddons.values()];
}

/** A button a module adds at the bottom of a job page, next to "Post update" (e.g. "Log extra work"). */
export type JobAction = {
  id: string;
  feature: string;
  label: string;
  /** Ionicons name. */
  icon?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  /** Where it goes, e.g. (jobId) => `/extra-work/new?jobId=${jobId}`. */
  href: (jobId: string) => string;
};

const actions = new Map<string, JobAction>();

export function registerJobAction(action: JobAction): void {
  if (!actions.has(action.id)) actions.set(action.id, action);
}

export function jobActionsFor(isFeatureEnabled: (feature: string) => boolean): JobAction[] {
  return [...actions.values()].filter((a) => isFeatureEnabled(a.feature));
}
