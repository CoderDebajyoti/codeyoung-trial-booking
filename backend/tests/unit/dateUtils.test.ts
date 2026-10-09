import { describe, it, expect } from 'vitest';
import {
  isValidTimeZone,
  normalizeTimeZone,
  getFormattedUtcOffset,
  getFriendlyLocationName,
  getTimeZoneDetails,
  getLocalDayUtcRange,
  getLocalDateString,
  formatLocalTime,
  parseRequestedStart,
  isWithinMentorWorkingHours,
  doIntervalsOverlap,
} from '../../src/lib/dateUtils.js';

describe('Date & Timezone Utilities with Normalization & Offsets', () => {
  describe('Time-Zone Normalization & Validation', () => {
    it('normalizes legacy and alias time zones to canonical IANA equivalents', () => {
      expect(normalizeTimeZone('Asia/Calcutta')).toBe('Asia/Kolkata');
      expect(normalizeTimeZone('US/Eastern')).toBe('America/New_York');
      expect(normalizeTimeZone('US/Pacific')).toBe('America/Los_Angeles');
      expect(normalizeTimeZone('GB')).toBe('Europe/London');
      expect(normalizeTimeZone('Asia/Kolkata')).toBe('Asia/Kolkata');
      expect(normalizeTimeZone('Europe/London')).toBe('Europe/London');
      expect(normalizeTimeZone('America/New_York')).toBe('America/New_York');
    });

    it('validates standard and legacy IANA time zone identifiers correctly', () => {
      expect(isValidTimeZone('America/New_York')).toBe(true);
      expect(isValidTimeZone('Europe/London')).toBe(true);
      expect(isValidTimeZone('Asia/Kolkata')).toBe(true);
      expect(isValidTimeZone('Asia/Calcutta')).toBe(true);
      expect(isValidTimeZone('US/Eastern')).toBe(true);
      expect(isValidTimeZone('Invalid/Timezone')).toBe(false);
      expect(isValidTimeZone('')).toBe(false);
    });

    it('produces identical absolute UTC instant conversions for Asia/Calcutta and Asia/Kolkata', () => {
      const instant1 = parseRequestedStart('2026-10-12 10:00', 'Asia/Calcutta');
      const instant2 = parseRequestedStart('2026-10-12 10:00', 'Asia/Kolkata');
      expect(instant1.toISOString()).toBe(instant2.toISOString());
      expect(instant1.toISOString()).toBe('2026-10-12T04:30:00.000Z');

      const formattedCalcutta = formatLocalTime(instant1, 'Asia/Calcutta', 'yyyy-MM-dd HH:mm');
      const formattedKolkata = formatLocalTime(instant1, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm');
      expect(formattedCalcutta).toBe(formattedKolkata);
      expect(formattedCalcutta).toBe('2026-10-12 10:00');
    });
  });

  describe('Dynamic UTC Offset Calculations (UTC±HH:MM)', () => {
    it('calculates India Standard Time offset as UTC+05:30 constantly', () => {
      const winter = new Date('2026-01-15T10:00:00.000Z');
      const summer = new Date('2026-07-15T10:00:00.000Z');
      expect(getFormattedUtcOffset('Asia/Kolkata', winter)).toBe('UTC+05:30');
      expect(getFormattedUtcOffset('Asia/Kolkata', summer)).toBe('UTC+05:30');
      expect(getFormattedUtcOffset('Asia/Calcutta', winter)).toBe('UTC+05:30');
    });

    it('calculates New York seasonal offsets (UTC-05:00 in Winter vs UTC-04:00 in Summer)', () => {
      const winter = new Date('2026-01-15T15:00:00.000Z'); // EST
      const summer = new Date('2026-07-15T15:00:00.000Z'); // EDT
      expect(getFormattedUtcOffset('America/New_York', winter)).toBe('UTC-05:00');
      expect(getFormattedUtcOffset('America/New_York', summer)).toBe('UTC-04:00');
      expect(getFormattedUtcOffset('US/Eastern', winter)).toBe('UTC-05:00');
    });

    it('calculates London seasonal offsets (UTC+00:00 in Winter vs UTC+01:00 in Summer)', () => {
      const winter = new Date('2026-01-15T12:00:00.000Z'); // GMT
      const summer = new Date('2026-07-15T12:00:00.000Z'); // BST
      expect(getFormattedUtcOffset('Europe/London', winter)).toBe('UTC+00:00');
      expect(getFormattedUtcOffset('Europe/London', summer)).toBe('UTC+01:00');
    });

    it('accurately calculates half-hour and quarter-hour offsets', () => {
      const date = new Date('2026-10-12T12:00:00.000Z');
      expect(getFormattedUtcOffset('Asia/Kathmandu', date)).toBe('UTC+05:45');
      expect(getFormattedUtcOffset('Australia/Eucla', date)).toBe('UTC+08:45');
    });

    it('formats UTC timezone offset as UTC+00:00', () => {
      expect(getFormattedUtcOffset('UTC')).toBe('UTC+00:00');
    });
  });

  describe('Friendly Location Names & TimeZoneDetails', () => {
    it('returns friendly city and country names for standard zones', () => {
      expect(getFriendlyLocationName('Asia/Kolkata')).toBe('Kolkata, India');
      expect(getFriendlyLocationName('Asia/Calcutta')).toBe('Kolkata, India');
      expect(getFriendlyLocationName('America/New_York')).toBe('New York, United States');
      expect(getFriendlyLocationName('Europe/London')).toBe('London, United Kingdom');
      expect(getFriendlyLocationName('Asia/Tokyo')).toBe('Tokyo, Japan');
    });

    it('generates a clean fallback label for arbitrary valid IANA timezones', () => {
      expect(getFriendlyLocationName('America/Phoenix')).toBe('Phoenix (America)');
      expect(getFriendlyLocationName('Africa/Nairobi')).toBe('Nairobi (Africa)');
    });

    it('constructs complete standardized time zone details', () => {
      const summerNy = new Date('2026-07-15T12:00:00.000Z');
      const details = getTimeZoneDetails('Asia/Calcutta', summerNy);
      expect(details.rawTimeZone).toBe('Asia/Calcutta');
      expect(details.canonicalTimeZone).toBe('Asia/Kolkata');
      expect(details.friendlyName).toBe('Kolkata, India');
      expect(details.utcOffset).toBe('UTC+05:30');
      expect(details.displayLabel).toBe('Asia/Kolkata · UTC+05:30');
    });
  });

  describe('Daily Boundaries & Working Hours', () => {
    it('calculates the exact UTC window for a mentor-local calendar day in Asia/Kolkata (+05:30)', () => {
      const { startUtc, endUtc } = getLocalDayUtcRange('2026-10-10', 'Asia/Kolkata');
      // Asia/Kolkata 2026-10-10 00:00:00 -> 2026-10-09 18:30:00 UTC
      expect(startUtc.toISOString()).toBe('2026-10-09T18:30:00.000Z');
      // Asia/Kolkata 2026-10-10 23:59:59.999 -> 2026-10-10 18:29:59.999 UTC
      expect(endUtc.toISOString()).toBe('2026-10-10T18:29:59.999Z');
    });

    it('calculates local date string properly from UTC instant', () => {
      const utcInstant = new Date('2026-10-09T19:00:00.000Z');
      // In UTC, it's 2026-10-09
      expect(getLocalDateString(utcInstant, 'UTC')).toBe('2026-10-09');
      // In Asia/Kolkata (+5:30), 19:00 UTC is 00:30 on 2026-10-10
      expect(getLocalDateString(utcInstant, 'Asia/Kolkata')).toBe('2026-10-10');
      // In America/New_York (-4:00 EDT), 19:00 UTC is 15:00 on 2026-10-09
      expect(getLocalDateString(utcInstant, 'America/New_York')).toBe('2026-10-09');
    });

    it('checks mentor working hours accurately', () => {
      const mentor = {
        timeZone: 'America/New_York', // EDT is UTC-4 in October
        workDays: [1, 2, 3, 4, 5], // Mon-Fri
        workStartHour: 9,
        workEndHour: 17,
      };

      // 2026-10-12 is a Monday. 14:00 UTC is 10:00 EDT (within 9-17)
      const validStart = new Date('2026-10-12T14:00:00.000Z');
      const validEnd = new Date('2026-10-12T14:30:00.000Z');
      expect(isWithinMentorWorkingHours(validStart, validEnd, mentor)).toBe(true);

      // 2026-10-12 at 08:00 EDT (12:00 UTC) is before 9am
      const earlyStart = new Date('2026-10-12T12:00:00.000Z');
      const earlyEnd = new Date('2026-10-12T12:30:00.000Z');
      expect(isWithinMentorWorkingHours(earlyStart, earlyEnd, mentor)).toBe(false);

      // 2026-10-11 is Sunday (not in workDays [1..5])
      const sundayStart = new Date('2026-10-11T14:00:00.000Z');
      const sundayEnd = new Date('2026-10-11T14:30:00.000Z');
      expect(isWithinMentorWorkingHours(sundayStart, sundayEnd, mentor)).toBe(false);
    });

    it('correctly detects overlapping intervals', () => {
      const startA = new Date('2026-10-10T10:00:00Z');
      const endA = new Date('2026-10-10T10:30:00Z');

      // Identical
      expect(doIntervalsOverlap(startA, endA, startA, endA)).toBe(true);

      // Overlapping
      const startB = new Date('2026-10-10T10:15:00Z');
      const endB = new Date('2026-10-10T10:45:00Z');
      expect(doIntervalsOverlap(startA, endA, startB, endB)).toBe(true);

      // Adjacent / Consecutive (should not overlap)
      const startC = new Date('2026-10-10T10:30:00Z');
      const endC = new Date('2026-10-10T11:00:00Z');
      expect(doIntervalsOverlap(startA, endA, startC, endC)).toBe(false);

      // Completely disjoint
      const startD = new Date('2026-10-10T12:00:00Z');
      const endD = new Date('2026-10-10T12:30:00Z');
      expect(doIntervalsOverlap(startA, endA, startD, endD)).toBe(false);
    });
  });
});
