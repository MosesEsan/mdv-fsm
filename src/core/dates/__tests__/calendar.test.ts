import { describe, expect, it } from 'vitest';
import { addDays, formatMinutes, localDate, minutesBetween, shiftInstants, weekDays, weekStartFor } from '../index';

describe('week dates', () => {
  it('week start for Monday and Sunday weeks', () => {
    expect(weekStartFor('2026-10-15', 'monday')).toBe('2026-10-12'); // Thu → Mon
    expect(weekStartFor('2026-10-12', 'monday')).toBe('2026-10-12'); // Mon → itself
    expect(weekStartFor('2026-10-18', 'monday')).toBe('2026-10-12'); // Sun → previous Mon
    expect(weekStartFor('2026-10-15', 'sunday')).toBe('2026-10-11');
    expect(weekStartFor('2026-10-18', 'sunday')).toBe('2026-10-18');
  });
  it('7 days and month rollover', () => {
    expect(weekDays('2026-10-26')).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('local date uses the tenant time zone', () => {
    expect(localDate(new Date('2026-10-12T23:30:00Z'), 'Europe/Dublin')).toBe('2026-10-13'); // 00:30 IST
    expect(localDate(new Date('2026-12-12T23:30:00Z'), 'Europe/Dublin')).toBe('2026-12-12'); // 23:30 GMT
  });
});

describe('time helpers', () => {
  it('overnight shift ends the next day', () => {
    const { startedAt, endedAt } = shiftInstants('2026-10-12', '22:00', '06:00', 'Europe/Dublin');
    expect(minutesBetween(startedAt, endedAt)).toBe(480);
  });
  it('Dublin summer time vs winter time', () => {
    expect(shiftInstants('2026-07-01', '08:00', '09:00', 'Europe/Dublin').startedAt.toISOString()).toBe('2026-07-01T07:00:00.000Z');
    expect(shiftInstants('2026-12-01', '08:00', '09:00', 'Europe/Dublin').startedAt.toISOString()).toBe('2026-12-01T08:00:00.000Z');
  });
  it('night shift across the clocks going back is 9h, not 8h', () => {
    const { startedAt, endedAt } = shiftInstants('2026-10-24', '22:00', '06:00', 'Europe/Dublin');
    expect(minutesBetween(startedAt, endedAt)).toBe(540);
  });
  it('formatMinutes', () => {
    expect(formatMinutes(510)).toBe('8h 30m');
    expect(formatMinutes(480)).toBe('8h');
    expect(formatMinutes(45)).toBe('45m');
  });
});
