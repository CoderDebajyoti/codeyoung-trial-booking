/**
 * Validates and normalizes international phone numbers to E.164 format.
 * E.164 standard: +[country code][subscriber number], max 15 digits.
 */
export interface NormalizedPhoneResult {
  isValid: boolean;
  e164?: string;
  countryCode?: string;
  nationalNumber?: string;
  error?: string;
}

export function validateAndNormalizePhone(
  rawPhone?: string,
  countryDialCode: string = '+91'
): NormalizedPhoneResult {
  if (!rawPhone || rawPhone.trim().length === 0) {
    return { isValid: true }; // Phone is optional in some contexts
  }

  let cleaned = rawPhone.trim();

  // If phone already starts with +, parse country code and digits
  let dialCode = countryDialCode.startsWith('+') ? countryDialCode : `+${countryDialCode}`;
  let digitsOnly = cleaned.replace(/\D/g, '');

  if (cleaned.startsWith('+')) {
    // Already includes international dial code
    const totalDigits = cleaned.substring(1).replace(/\D/g, '');
    if (totalDigits.length < 7 || totalDigits.length > 15) {
      return {
        isValid: false,
        error: 'Phone number must contain between 7 and 15 digits according to international standards.',
      };
    }
    return {
      isValid: true,
      e164: `+${totalDigits}`,
    };
  }

  // Combine dialCode digits + national number digits
  const dialDigits = dialCode.replace(/\D/g, '');
  const combinedDigits = `${dialDigits}${digitsOnly}`;

  if (digitsOnly.length < 5 || combinedDigits.length > 15) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number (minimum 5 digits).',
    };
  }

  return {
    isValid: true,
    e164: `+${combinedDigits}`,
    countryCode: dialCode,
    nationalNumber: digitsOnly,
  };
}
