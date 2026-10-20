// Pure enquiry rules (unit-tested): labels, stages and the new-enquiry form check.
import { customerProblems, type CustomerInput } from '@/core/customers/rules';
import { isValidTime } from '@/core/dates';

export const SOURCES = [
  ['phone', 'Phone call'], ['email', 'Email'], ['website', 'Website'], ['walk_in', 'Walk-in'],
  ['referral', 'Referral'], ['social', 'Social media'], ['other', 'Other'],
] as const;
export type Source = (typeof SOURCES)[number][0];
export const sourceLabel = (s: string) => SOURCES.find(([k]) => k === s)?.[1] ?? s;

/** Where an enquiry has got to (worked out by the database view). Order = order on the list. */
export const STAGES = [
  ['new', 'New – arrange a viewing'],
  ['viewing_booked', 'Viewing booked'],
  ['measured', 'Measured – ready to quote'],
  ['quoted', 'Quoted – waiting to hear back'],
  ['booked', 'Work booked'],
  ['lost', 'Not going ahead'],
] as const;
export type Stage = (typeof STAGES)[number][0];
export const stageLabel = (s: string) => STAGES.find(([k]) => k === s)?.[1] ?? s;

export function groupByStage<T extends { stage: string }>(items: T[]): { stage: Stage; label: string; items: T[] }[] {
  return STAGES.map(([stage, label]) => ({ stage, label, items: items.filter((i) => i.stage === stage) })).filter((g) => g.items.length > 0);
}

export type EnquiryForm = {
  customerId: string | null; newCustomer: CustomerInput | null;
  summary: string; siteAddress: string; source: Source; details: string;
  viewingDate: string; viewingTime: string;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function enquiryProblems(f: EnquiryForm): string[] {
  const out: string[] = [];
  if (!f.customerId && !f.newCustomer) out.push('Pick a customer or add a new one');
  if (f.newCustomer) out.push(...customerProblems(f.newCustomer));
  if (!f.summary.trim()) out.push('Say what they are looking for');
  if (f.viewingDate && !DATE.test(f.viewingDate)) out.push('Enter the viewing date like 2026-11-04');
  if (f.viewingTime && !isValidTime(f.viewingTime)) out.push('Enter the viewing time like 10:00');
  if (f.viewingTime && !f.viewingDate) out.push('Add the viewing date too');
  return out;
}
