import { formatInTimeZone } from 'date-fns-tz';

export interface TimeZoneOption {
  value: string;
  label: string;
  region: string;
}

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
  if (!tz || typeof tz !== 'string') return 'America/New_York';
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

export const POPULAR_TIMEZONES: TimeZoneOption[] = [
  // India & Asia
  { value: 'Asia/Kolkata', label: 'Kolkata, India (Asia/Kolkata)', region: 'Asia' },
  { value: 'Asia/Dubai', label: 'Dubai, UAE (Asia/Dubai)', region: 'Middle East' },
  { value: 'Asia/Singapore', label: 'Singapore (Asia/Singapore)', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Japan (Asia/Tokyo)', region: 'Asia' },
  { value: 'Asia/Kathmandu', label: 'Kathmandu, Nepal (Asia/Kathmandu)', region: 'Asia' },

  // United States & Canada
  { value: 'America/New_York', label: 'New York, United States (America/New_York)', region: 'North America' },
  { value: 'America/Chicago', label: 'Chicago, United States (America/Chicago)', region: 'North America' },
  { value: 'America/Denver', label: 'Denver, United States (America/Denver)', region: 'North America' },
  { value: 'America/Los_Angeles', label: 'Los Angeles, United States (America/Los_Angeles)', region: 'North America' },
  { value: 'America/Toronto', label: 'Toronto, Canada (America/Toronto)', region: 'North America' },

  // United Kingdom & Europe
  { value: 'Europe/London', label: 'London, United Kingdom (Europe/London)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris, France (Europe/Paris)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin, Germany (Europe/Berlin)', region: 'Europe' },
  { value: 'Europe/Dublin', label: 'Dublin, Ireland (Europe/Dublin)', region: 'Europe' },

  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Sydney, Australia (Australia/Sydney)', region: 'Australia' },
  { value: 'Pacific/Auckland', label: 'Auckland, New Zealand (Pacific/Auckland)', region: 'Pacific' },
];

export function getDetectedDeviceTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return normalizeTimeZone(tz) || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}
