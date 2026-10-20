import { describe, expect, it } from 'vitest';
import { enquiryProblems, groupByStage, sourceLabel, stageLabel, type EnquiryForm } from '../enquiryRules';

const form = (p: Partial<EnquiryForm> = {}): EnquiryForm => ({
  customerId: 'c1', newCustomer: null, summary: 'Oak floor', siteAddress: '', source: 'phone', details: '', viewingDate: '', viewingTime: '', ...p,
});

describe('enquiries', () => {
  it('checks the new-enquiry form in plain English', () => {
    expect(enquiryProblems(form())).toEqual([]);
    expect(enquiryProblems(form({ customerId: null }))).toEqual(['Pick a customer or add a new one']);
    expect(enquiryProblems(form({ customerId: null, newCustomer: { name: 'Mary', phone: '', email: '', address: '', notes: '' } })))
      .toEqual(['Add a phone number or an email so you can get back to them']);
    expect(enquiryProblems(form({ summary: ' ', viewingTime: '10:00' }))).toEqual(['Say what they are looking for', 'Add the viewing date too']);
    expect(enquiryProblems(form({ viewingDate: '4/11/2026' }))[0]).toContain('2026-11-04');
  });
  it('groups by stage in pipeline order and labels things', () => {
    const g = groupByStage([{ stage: 'booked' }, { stage: 'new' }, { stage: 'new' }]);
    expect(g.map((x) => [x.stage, x.items.length])).toEqual([['new', 2], ['booked', 1]]);
    expect(stageLabel('measured')).toBe('Measured – ready to quote');
    expect(sourceLabel('walk_in')).toBe('Walk-in');
  });
});
