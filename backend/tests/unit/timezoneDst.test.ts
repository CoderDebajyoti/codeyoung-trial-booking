import { describe, it, expect } from 'vitest';
import {
  formatLocalTime,
  parseRequestedStart,
  getLocalDateString,
  getLocalDayUtcRange,
} from '../../src/lib/dateUtils.js';


describe('Timezone and Daylight Saving Time (DST) Comprehensive Suite', () => {
  describe('Seasonal Winter and Summer Conversions', () => {
    it('handles New York in Winter (EST, UTC-5)', () => {
      // 2026-01-15 15:00 UTC -> 10:00 EST
      const utcInstant = new Date('2026-01-15T15:00:00.000Z');
      const nyTime = formatLocalTime(utcInstant, 'America/New_York', 'yyyy-MM-dd HH:mm (zzz)');
      expect(nyTime).toBe('2026-01-15 10:00 (EST)');
    });

    it('handles New York in Summer (EDT, UTC-4)', () => {
      // 2026-07-15 14:00 UTC -> 10:00 EDT
      const utcInstant = new Date('2026-07-15T14:00:00.000Z');
      const nyTime = formatLocalTime(utcInstant, 'America/New_York', 'yyyy-MM-dd HH:mm (zzz)');
      expect(nyTime).toBe('2026-07-15 10:00 (EDT)');
    });

    it('handles London in Winter (GMT, UTC+0)', () => {
      // 2026-01-15 10:00 UTC -> 10:00 GMT
      const utcInstant = new Date('2026-01-15T10:00:00.000Z');
      const londonTime = formatLocalTime(utcInstant, 'Europe/London', 'yyyy-MM-dd HH:mm (zzz)');
      expect(londonTime).toBe('2026-01-15 10:00 (GMT)');
    });

    it('handles London in Summer (BST, UTC+1)', () => {
      // 2026-07-15 09:00 UTC -> 10:00 BST
      const utcInstant = new Date('2026-07-15T09:00:00.000Z');
      const londonTime = formatLocalTime(utcInstant, 'Europe/London', 'yyyy-MM-dd HH:mm (zzz)');
      expect(londonTime).toBe('2026-07-15 10:00 (BST)');
    });

    it('handles India (IST, UTC+5:30) constantly without seasonal DST shifts', () => {
      const winterInstant = new Date('2026-01-15T10:00:00.000Z');
      const summerInstant = new Date('2026-07-15T10:00:00.000Z');

      expect(formatLocalTime(winterInstant, 'Asia/Kolkata', 'HH:mm (zzz)')).toBe('15:30 (IST)');
      expect(formatLocalTime(summerInstant, 'Asia/Kolkata', 'HH:mm (zzz)')).toBe('15:30 (IST)');
    });
  });

  describe('India vs US / UK Seasonal Time Offsets', () => {
    it('verifies India is 9.5 hours ahead of New York during EDT (Summer)', () => {
      // 12:00 EDT (16:00 UTC) = 21:30 IST on same day
      const summerUtc = new Date('2026-07-15T16:00:00.000Z');
      const nyTime = formatLocalTime(summerUtc, 'America/New_York', 'HH:mm');
      const istTime = formatLocalTime(summerUtc, 'Asia/Kolkata', 'HH:mm');
      expect(nyTime).toBe('12:00');
      expect(istTime).toBe('21:30');
    });

    it('verifies India is 10.5 hours ahead of New York during EST (Winter)', () => {
      // 12:00 EST (17:00 UTC) = 22:30 IST on same day
      const winterUtc = new Date('2026-01-15T17:00:00.000Z');
      const nyTime = formatLocalTime(winterUtc, 'America/New_York', 'HH:mm');
      const istTime = formatLocalTime(winterUtc, 'Asia/Kolkata', 'HH:mm');
      expect(nyTime).toBe('12:00');
      expect(istTime).toBe('22:30');
    });
  });

  describe('DST Transitions and Boundary Checks', () => {
    it('correctly handles US Spring-Forward transition on March 8, 2026', () => {
      // Just before transition: 01:59 EST -> 06:59 UTC
      const before = new Date('2026-03-08T06:59:00.000Z');
      expect(formatLocalTime(before, 'America/New_York', 'HH:mm (zzz)')).toBe('01:59 (EST)');

      // Just after transition: 07:01 UTC -> 03:01 EDT (02:00-02:59 was skipped)
      const after = new Date('2026-03-08T07:01:00.000Z');
      expect(formatLocalTime(after, 'America/New_York', 'HH:mm (zzz)')).toBe('03:01 (EDT)');
    });

    it('rejects nonexistent local time during US Spring-Forward gap (e.g. 2026-03-08 02:30 in New York)', () => {
      expect(() =>
        parseRequestedStart('2026-03-08 02:30', 'America/New_York')
      ).toThrow(/nonexistent in time zone/);
    });

    it('detects ambiguous local time during US Fall-Back transition (e.g. 2026-11-01 01:30 in New York)', () => {
      expect(() =>
        parseRequestedStart('2026-11-01 01:30', 'America/New_York')
      ).toThrow(/ambiguous in time zone/);
    });

    it('correctly accepts explicit unambiguous ISO 8601 UTC timestamps during DST transitions', () => {
      // Unambiguous instant during the first occurrence of 01:30 (EDT)
      const firstOccurUtc = parseRequestedStart('2026-11-01T05:30:00.000Z', 'America/New_York');
      expect(formatLocalTime(firstOccurUtc, 'America/New_York', 'HH:mm (zzz)')).toBe('01:30 (EDT)');

      // Unambiguous instant during the second occurrence of 01:30 (EST)
      const secondOccurUtc = parseRequestedStart('2026-11-01T06:30:00.000Z', 'America/New_York');
      expect(formatLocalTime(secondOccurUtc, 'America/New_York', 'HH:mm (zzz)')).toBe('01:30 (EST)');
    });

    it('rejects nonexistent local time during UK Spring-Forward gap on March 29, 2026 (01:30 GMT skipped)', () => {
      expect(() =>
        parseRequestedStart('2026-03-29 01:30', 'Europe/London')
      ).toThrow(/nonexistent in time zone/);
    });

    it('detects ambiguous local time during UK Fall-Back transition on October 25, 2026 (01:30 repeated)', () => {
      expect(() =>
        parseRequestedStart('2026-10-25 01:30', 'Europe/London')
      ).toThrow(/ambiguous in time zone/);
    });
  });

  describe('Cross-Timezone Calendar Date Difference Scenarios', () => {
    it('handles instant where Parent in New York, Mentor in India, and UTC all see different local dates or times', () => {
      // 2026-10-12 at 23:30 UTC
      const instantUtc = new Date('2026-10-12T23:30:00.000Z');

      // Parent in New York (EDT, UTC-4): 2026-10-12 at 19:30 EDT
      expect(getLocalDateString(instantUtc, 'America/New_York')).toBe('2026-10-12');
      expect(formatLocalTime(instantUtc, 'America/New_York', 'yyyy-MM-dd HH:mm (zzz)')).toBe(
        '2026-10-12 19:30 (EDT)'
      );

      // Mentor in Kolkata (IST, UTC+5:30): 2026-10-13 at 05:00 IST (NEXT DAY!)
      expect(getLocalDateString(instantUtc, 'Asia/Kolkata')).toBe('2026-10-13');
      expect(formatLocalTime(instantUtc, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm (zzz)')).toBe(
        '2026-10-13 05:00 (IST)'
      );
    });

    it('computes mentor local day capacity window accurately without mixing UTC or parent dates', () => {
      const { startUtc, endUtc } = getLocalDayUtcRange('2026-10-13', 'Asia/Kolkata');
      // Starts on 2026-10-12 at 18:30 UTC and ends on 2026-10-13 at 18:29:59.999 UTC
      expect(startUtc.toISOString()).toBe('2026-10-12T18:30:00.000Z');
      expect(endUtc.toISOString()).toBe('2026-10-13T18:29:59.999Z');
    });
  });
});
