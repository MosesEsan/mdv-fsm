import { describe, expect, it } from 'vitest';
import { canDecideWeek, canEditWeek, canSubmitWeek } from '../services/weekRules';

describe('week rules', () => {
  const worker = { isManager: false, isOwner: false, isSupervisor: false };
  const supervisor = { isManager: false, isOwner: false, isSupervisor: true };
  const manager = { isManager: true, isOwner: false, isSupervisor: false };

  it('who can edit', () => {
    expect(canEditWeek(undefined, worker)).toBe(true);
    expect(canEditWeek('rejected', worker)).toBe(true);
    expect(canEditWeek('submitted', worker)).toBe(false);
    expect(canEditWeek('submitted', manager)).toBe(true);
    expect(canEditWeek('approved', manager)).toBe(false);
  });
  it('who can submit', () => {
    expect(canSubmitWeek('draft', true, true)).toBe(true);
    expect(canSubmitWeek('draft', true, false)).toBe(false);
    expect(canSubmitWeek('draft', false, true)).toBe(false);
  });
  it('who can sign off', () => {
    expect(canDecideWeek('submitted', { approval: 'manager' }, supervisor, false, true)).toBe(false);
    expect(canDecideWeek('submitted', { approval: 'supervisor' }, supervisor, false, true)).toBe(true);
    expect(canDecideWeek('submitted', { approval: 'supervisor' }, supervisor, false, false)).toBe(false);
    expect(canDecideWeek('submitted', { approval: 'manager' }, manager, true, false)).toBe(false); // own week
    expect(canDecideWeek('draft', { approval: 'manager' }, manager, false, false)).toBe(false);
  });
});
