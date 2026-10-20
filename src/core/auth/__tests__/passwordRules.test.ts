import { describe, expect, it } from 'vitest';
import { firstNameOf, passwordProblem } from '../passwordRules';

describe('passwordProblem', () => {
  it('needs 8 characters', () => {
    expect(passwordProblem('short', 'short')).toBe('Use at least 8 letters or numbers.');
  });
  it('needs both to match', () => {
    expect(passwordProblem('longenough', 'longenouhg')).toBe('The two passwords don’t match.');
  });
  it('accepts a good password', () => {
    expect(passwordProblem('longenough', 'longenough')).toBeNull();
  });
});

describe('firstNameOf', () => {
  it('takes the first word', () => {
    expect(firstNameOf('  Pat Byrne ')).toBe('Pat');
  });
  it('copes with nothing', () => {
    expect(firstNameOf(undefined)).toBeNull();
    expect(firstNameOf('')).toBeNull();
  });
});
