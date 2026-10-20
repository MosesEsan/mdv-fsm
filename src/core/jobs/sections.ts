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
