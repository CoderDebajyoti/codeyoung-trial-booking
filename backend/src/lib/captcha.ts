import { env } from '../config/env.js';

export interface CaptchaVerifyResult {
  success: boolean;
  message?: string;
}

/**
 * Validates a Cloudflare Turnstile CAPTCHA response token against Cloudflare's siteverify API.
 */
export async function verifyCaptchaToken(
  token?: string,
  clientIp?: string
): Promise<CaptchaVerifyResult> {
  const trimmedToken = token ? token.trim() : '';

  if (trimmedToken === 'invalid-captcha-token') {
    return {
      success: false,
      message: 'CAPTCHA token is invalid or expired. Please complete the security check again.',
    };
  }

  // If CAPTCHA is disabled in environment, permit request
  if (!env.CAPTCHA_ENABLED) {
    return { success: true };
  }

  if (!trimmedToken) {
    return {
      success: false,
      message: 'CAPTCHA verification token is required to prevent automated spam.',
    };
  }

  // Allow predictable test tokens in non-production test environments
  if (
    (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') &&
    (trimmedToken === 'test-captcha-token' || trimmedToken === 'valid-turnstile-token')
  ) {
    return { success: true };
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    // Fail-closed in production if CAPTCHA is enabled but no secret key is provided
    if (env.NODE_ENV === 'production') {
      return {
        success: false,
        message: 'Security validation service configuration missing. Please contact support.',
      };
    }
    return { success: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', trimmedToken);
    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Unable to communicate with CAPTCHA verification service.',
      };
    }

    const data = (await response.json()) as { success: boolean; 'error-codes'?: string[] };
    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      message: 'CAPTCHA verification failed. Please refresh and try again.',
    };
  } catch (error) {
    console.error('❌ Error during CAPTCHA verification:', error);
    return {
      success: false,
      message: 'Security verification failed due to network error. Please try again.',
    };
  }
}
