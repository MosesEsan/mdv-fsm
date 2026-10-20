import { describe, expect, it } from 'vitest';
import { customerProblems, customerValues, emptyCustomer, searchFilter } from '../rules';

describe('customers', () => {
  it('needs a name and a way to get back to them', () => {
    expect(customerProblems({ ...emptyCustomer(), name: 'Mary', phone: '087 1' })).toEqual([]);
    expect(customerProblems(emptyCustomer())).toEqual(["Enter the customer's name", 'Add a phone number or an email so you can get back to them']);
    expect(customerProblems({ ...emptyCustomer(), name: 'M', email: 'mary@' })[0]).toContain('email');
  });
  it('tidies values', () => {
    expect(customerValues({ name: ' Mary ', phone: ' ', email: ' Mary@X.ie ', address: '', notes: '' }))
      .toEqual({ name: 'Mary', phone: null, email: 'mary@x.ie', address: null, notes: null });
  });
  it('searches names, emails and phone digits safely', () => {
    expect(searchFilter('m')).toBeNull();
    expect(searchFilter('byrne')).toBe('name.ilike.*byrne*,email.ilike.*byrne*');
    expect(searchFilter('087 12')).toBe('name.ilike.*087 12*,email.ilike.*087 12*,phone.ilike.*0*8*7*1*2*');
    expect(searchFilter('a,b(c)')).toBe('name.ilike.*a b c*,email.ilike.*a b c*');
  });
});
