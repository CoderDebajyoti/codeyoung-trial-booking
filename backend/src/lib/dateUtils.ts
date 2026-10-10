import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { parseISO, isValid, isBefore, isAfter, subHours, addHours } from 'date-fns';

export const CLASS_DURATION_MINUTES = 30;

/**
 * Known legacy and alias IANA time zone mappings to standardized canonical identifiers.
 */
export const CANONICAL_TIMEZONE_MAP: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'US/Eastern': 'America/New_York',
  'US/Central': 'America/Chicago',
  'US/Mountain': 'America/Denver',
  'US/Pacific': 'America/Los_Angeles',
  'Europe/Belfast': 'Europe/London',
  'GB': 'Europe/London',
  'GB-Eire': 'Europe/London',
  'Eire': 'Europe/Dublin',
  'UTC': 'UTC',
  'GMT': 'UTC',
};

/**
 * Standardizes a time-zone identifier to its canonical IANA equivalent.
 * e.g., "Asia/Calcutta" -> "Asia/Kolkata"
 */
export function normalizeTimeZone(tz: string): string {
  if (!tz || typeof tz !== 'string') return 'UTC';
  const trimmed = tz.trim();
  return CANONICAL_TIMEZONE_MAP[trimmed] || trimmed;
}

/**
 * Validates whether a string is a valid IANA time zone identifier (including legacy aliases like Asia/Calcutta).
 */
export function isValidTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  const canonical = normalizeTimeZone(tz);
  try {
    Intl.DateTimeFormat(undefined, { timeZone: canonical });
    return true;
  } catch {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Calculates the exact UTC offset formatted as "UTC±HH:MM" (e.g., "UTC+05:30", "UTC-04:00", "UTC+00:00").
 * Uses dynamic IANA rules and date-fns-tz offset formatting for the specified instant.
 */
export function getFormattedUtcOffset(timeZone: string, date: Date = new Date()): string {
  const canonical = normalizeTimeZone(timeZone);
  try {
    const offsetStr = formatInTimeZone(date, canonical, 'XXX');
    if (offsetStr === 'Z' || offsetStr === '+00:00' || offsetStr === '-00:00') {
      return 'UTC+00:00';
    }
    return `UTC${offsetStr}`;
  } catch {
    return 'UTC+00:00';
  }
}

/**
 * Returns a human-friendly city/country location label for display (e.g., "Kolkata, India").
 */
export function getFriendlyLocationName(timeZone: string): string {
  const canonical = normalizeTimeZone(timeZone);

  const FRIENDLY_NAMES: Record<string, string> = {
    'Asia/Kolkata': 'Kolkata, India',
    'America/New_York': 'New York, United States',
    'America/Chicago': 'Chicago, United States',
    'America/Denver': 'Denver, United States',
    'America/Los_Angeles': 'Los Angeles, United States',
    'America/Toronto': 'Toronto, Canada',
    'America/Vancouver': 'Vancouver, Canada',
    'Europe/London': 'London, United Kingdom',
    'Europe/Paris': 'Paris, France',
    'Europe/Berlin': 'Berlin, Germany',
    'Europe/Dublin': 'Dublin, Ireland',
    'Europe/Amsterdam': 'Amsterdam, Netherlands',
    'Europe/Madrid': 'Madrid, Spain',
    'Europe/Rome': 'Rome, Italy',
    'Asia/Dubai': 'Dubai, United Arab Emirates',
    'Asia/Singapore': 'Singapore',
    'Asia/Tokyo': 'Tokyo, Japan',
    'Asia/Hong_Kong': 'Hong Kong',
    'Asia/Kathmandu': 'Kathmandu, Nepal',
    'Asia/Dhaka': 'Dhaka, Bangladesh',
    'Australia/Sydney': 'Sydney, Australia',
    'Australia/Melbourne': 'Melbourne, Australia',
    'Australia/Perth': 'Perth, Australia',
    'Pacific/Auckland': 'Auckland, New Zealand',
    'UTC': 'Coordinated Universal Time',
  };

  if (FRIENDLY_NAMES[canonical]) {
    return FRIENDLY_NAMES[canonical]!;
  }

  // Fallback for any arbitrary valid IANA zone (e.g., "America/Phoenix" -> "Phoenix")
  const parts = canonical.split('/');
  if (parts.length >= 2) {
    const city = parts[parts.length - 1]!.replace(/_/g, ' ');
    const region = parts[0]!.replace(/_/g, ' ');
    return `${city} (${region})`;
  }

  return canonical;
}

export interface TimeZoneDetails {
  rawTimeZone: string;
  canonicalTimeZone: string;
  friendlyName: string;
  utcOffset: string;
  displayLabel: string;
}

/**
 * Returns complete standardized time zone metadata for UI displays.
 */
export function getTimeZoneDetails(timeZone: string, date: Date = new Date()): TimeZoneDetails {
  const canonical = normalizeTimeZone(timeZone);
  const friendlyName = getFriendlyLocationName(canonical);
  const utcOffset = getFormattedUtcOffset(canonical, date);
  const displayLabel = `${canonical} · ${utcOffset}`;

  return {
    rawTimeZone: timeZone,
    canonicalTimeZone: canonical,
    friendlyName,
    utcOffset,
    displayLabel,
  };
}

/**
 * Retrieves the standard localized time zone abbreviation (e.g., EST, EDT, GMT, BST, IST).
 */
export function getTimeZoneAbbreviation(date: Date, timeZone: string): string {
  const canonical = normalizeTimeZone(timeZone);
  try {
    const offsetStr = formatInTimeZone(date, canonical, 'XXX');

    if (canonical === 'Asia/Kolkata') {
      return 'IST';
    }

    if (canonical === 'America/New_York') {
      return offsetStr === '-04:00' ? 'EDT' : 'EST';
    }

    if (canonical === 'America/Chicago') {
      return offsetStr === '-05:00' ? 'CDT' : 'CST';
    }

    if (canonical === 'America/Los_Angeles') {
      return offsetStr === '-07:00' ? 'PDT' : 'PST';
    }

    if (canonical === 'Europe/London') {
      return offsetStr === '+01:00' ? 'BST' : 'GMT';
    }

    if (canonical === 'UTC') {
      return 'UTC';
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: canonical,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart?.value || offsetStr;
  } catch {
    return canonical;
  }
}

/**
 * Converts a UTC Date into an ISO string in UTC.
 */
export function toUtcIso(date: Date): string {
  return date.toISOString();
}

/**
 * Formats a UTC Date into a human-readable string in the specified target time zone with time zone abbreviation.
 */
export function formatLocalTime(
  date: Date,
  timeZone: string,
  pattern: string = 'yyyy-MM-dd HH:mm:ss (zzz)'
): string {
  const canonical = normalizeTimeZone(timeZone);
  const abbr = getTimeZoneAbbreviation(date, canonical);
  if (pattern.includes('(zzz)')) {
    const basePattern = pattern.replace('(zzz)', '').trim();
    const formattedBase = formatInTimeZone(date, canonical, basePattern);
    return `${formattedBase} (${abbr})`;
  }
  return formatInTimeZone(date, canonical, pattern);
}

/**
 * Given a UTC Date instant and an IANA time zone, gets the local date string "YYYY-MM-DD".
 */
export function getLocalDateString(date: Date, timeZone: string): string {
  const canonical = normalizeTimeZone(timeZone);
  return formatInTimeZone(date, canonical, 'yyyy-MM-dd');
}

/**
 * Calculates the UTC Date boundaries [startOfDayUtc, endOfDayUtc] corresponding to
 * 00:00:00.000 through 23:59:59.999 in the given time zone for a specific "YYYY-MM-DD" local date.
 */
export function getLocalDayUtcRange(
  localDateStr: string,
  timeZone: string
): { startUtc: Date; endUtc: Date } {
  const canonical = normalizeTimeZone(timeZone);
  const [yearStr, monthStr, dayStr] = localDateStr.split('-');
  if (!yearStr || !monthStr || !dayStr) {
    throw new Error(`Invalid local date format: ${localDateStr}. Expected YYYY-MM-DD`);
  }

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  const startLocalZoned = new Date(year, month, day, 0, 0, 0, 0);
  const endLocalZoned = new Date(year, month, day, 23, 59, 59, 999);

  const startUtc = fromZonedTime(startLocalZoned, canonical);
  const endUtc = fromZonedTime(endLocalZoned, canonical);

  return { startUtc, endUtc };
}

/**
 * Converts a parent's requested start time to an absolute UTC Date.
 * Handles both ISO 8601 UTC strings and local "YYYY-MM-DD HH:mm" strings with strict DST gap/overlap checks.
 */
export function parseRequestedStart(startInput: string, timeZone?: string): Date {
  if (!startInput || typeof startInput !== 'string') {
    throw new Error('Start time is required');
  }

  const canonicalTz = timeZone ? normalizeTimeZone(timeZone) : undefined;

  // Case A: User provided a local time string like "2026-10-10 14:00" with a timeZone
  if (canonicalTz && isValidTimeZone(canonicalTz) && !startInput.includes('T') && startInput.includes(' ')) {
    const [datePart, timePart] = startInput.trim().split(' ');
    if (datePart && timePart) {
      const dateParts = datePart.split('-').map(Number);
      const timeParts = timePart.split(':').map(Number);
      const year = dateParts[0];
      const month = dateParts[1];
      const day = dateParts[2];
      const hours = timeParts[0];
      const minutes = timeParts[1];

      if (
        year !== undefined &&
        month !== undefined &&
        day !== undefined &&
        hours !== undefined &&
        minutes !== undefined
      ) {
        const localDateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);
        const candidateUtc = fromZonedTime(localDateObj, canonicalTz);

        // Verify that candidateUtc formats back to the EXACT local time requested
        const formattedBack = formatInTimeZone(candidateUtc, canonicalTz, 'yyyy-MM-dd HH:mm');
        const expectedStr = `${datePart} ${timePart.padStart(5, '0')}`;

        if (formattedBack !== expectedStr) {
          throw new Error(
            `Requested local time "${startInput}" is nonexistent in time zone "${canonicalTz}" due to a Daylight Saving Time spring-forward transition.`
          );
        }

        // Check for ambiguous time (fall-back overlap)
        const earlierUtc = subHours(candidateUtc, 1);
        const laterUtc = addHours(candidateUtc, 1);
        const earlierFormatted = formatInTimeZone(earlierUtc, canonicalTz, 'yyyy-MM-dd HH:mm');
        const laterFormatted = formatInTimeZone(laterUtc, canonicalTz, 'yyyy-MM-dd HH:mm');

        if (earlierFormatted === expectedStr || laterFormatted === expectedStr) {
          throw new Error(
            `Requested local time "${startInput}" is ambiguous in time zone "${canonicalTz}" due to a Daylight Saving Time fall-back transition. Please specify an unambiguous ISO 8601 UTC timestamp.`
          );
        }

        return candidateUtc;
      }
    }
  }

  // Case B: ISO 8601 string (e.g. "2026-10-10T14:00:00.000Z" or with offset)
  const parsed = parseISO(startInput);
  if (!isValid(parsed)) {
    throw new Error(`Invalid ISO date format: ${startInput}`);
  }
  return parsed;
}

/**
 * Parses workDays into a normalized number array regardless of whether stored as string or array.
 */
export function parseWorkDays(workDays: number[] | string | undefined | null): number[] {
  if (Array.isArray(workDays)) {
    return workDays;
  }
  if (typeof workDays === 'string') {
    return workDays
      .split(',')
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !isNaN(d) && d >= 1 && d <= 7);
  }
  return [1, 2, 3, 4, 5];
}

/**
 * Checks if a requested interval [startUtc, endUtc] falls within a mentor's local working hours and working days.
 */
export function isWithinMentorWorkingHours(
  startUtc: Date,
  endUtc: Date,
  mentor: {
    timeZone: string;
    workDays: number[] | string;
    workStartHour: number;
    workEndHour: number;
  }
): boolean {
  const canonicalTz = normalizeTimeZone(mentor.timeZone);
  const startZoned = toZonedTime(startUtc, canonicalTz);
  const endZoned = toZonedTime(endUtc, canonicalTz);

  // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  const jsDayStart = startZoned.getDay();
  const mentorDayStart = jsDayStart === 0 ? 7 : jsDayStart;

  const jsDayEnd = endZoned.getDay();
  const mentorDayEnd = jsDayEnd === 0 ? 7 : jsDayEnd;

  const activeWorkDays = parseWorkDays(mentor.workDays);

  // Must be on a configured work day
  if (!activeWorkDays.includes(mentorDayStart)) {
    return false;
  }


  // Cross-midnight shifts are currently disallowed per policy
  if (mentorDayStart !== mentorDayEnd) {
    return false;
  }

  const startHour = startZoned.getHours() + startZoned.getMinutes() / 60;
  const endHour = endZoned.getHours() + endZoned.getMinutes() / 60;

  if (startHour < mentor.workStartHour || endHour > mentor.workEndHour) {
    return false;
  }

  return true;
}

/**
 * Determines whether two time intervals overlap.
 * [startA, endA) and [startB, endB) overlap if startA < endB and endA > startB.
 */
export function doIntervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return isBefore(startA, endB) && isAfter(endA, startB);
}
