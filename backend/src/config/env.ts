import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Support EMAIL_PROVIDER as primary, fallback to EMAIL_ADAPTER
  EMAIL_PROVIDER: z.enum(['mock', 'smtp', 'resend', 'mailpit', 'test']).default('mock'),
  EMAIL_ADAPTER: z.enum(['mock', 'smtp', 'resend', 'mailpit', 'test']).optional(),
  EMAIL_FROM: z.string().default('no-reply@codeyoung.com').transform((val) => val.trim()),
  EMAIL_OVERRIDE_RECIPIENT: z.string().optional().default('').transform((val) => val.trim()),
  RESEND_API_KEY: z.string().optional().default('').transform((val) => val.trim()),
  SMTP_HOST: z.string().optional().default('localhost').transform((val) => val.trim()),
  SMTP_PORT: z.string().optional().default('587').transform((val) => parseInt(val, 10)),
  SMTP_SECURE: z.string().optional().default('false').transform((val) => val === 'true' || val === '1'),
  SMTP_USER: z.string().optional().default('').transform((val) => val.trim()),
  SMTP_PASS: z.string().optional().default('').transform((val) => val.trim()),
  DEMO_CLASS_BASE_URL: z.string().url().default('https://meet.codeyoung.com/trial'),
  REMINDER_INTERVAL_SECONDS: z.string().optional().default('10').transform((val) => parseInt(val, 10)),
  NOTIFICATION_WORKER_ENABLED: z.string().optional().default('true').transform((val) => val !== 'false' && val !== '0'),

  // Authentication & Session Security
  JWT_SECRET: z.string().default('codeyoung-super-secure-jwt-secret-key-2026').transform((val) => val.trim()),
  JWT_EXPIRES_IN: z.string().default('24h').transform((val) => val.trim()),

  // Bot & Abuse Protection (Cloudflare Turnstile CAPTCHA)
  CAPTCHA_ENABLED: z.string().optional().default('false').transform((val) => val === 'true' || val === '1'),
  TURNSTILE_SECRET_KEY: z.string().optional().default('').transform((val) => val.trim()),

  // Parent Email OTP Verification
  OTP_ENABLED: z.string().optional().default('true').transform((val) => val !== 'false' && val !== '0'),
  OTP_EXPIRY_MINUTES: z.string().optional().default('5').transform((val) => parseInt(val, 10)),
  OTP_MAX_ATTEMPTS: z.string().optional().default('3').transform((val) => parseInt(val, 10)),
  OTP_RESEND_COOLDOWN_SECONDS: z.string().optional().default('60').transform((val) => parseInt(val, 10)),

  // Trial Booking Eligibility Policies
  MAX_TRIALS_PER_STUDENT: z.string().optional().default('1').transform((val) => parseInt(val, 10)),

  // Rate Limiting
  RATE_LIMIT_ENABLED: z.string().optional().default('true').transform((val) => val !== 'false' && val !== '0'),

  // Storage & Fallback Policy (Default: false to enforce persistent PostgreSQL storage)
  ALLOW_IN_MEMORY_FALLBACK: z.string().optional().default('false').transform((val) => val === 'true' || val === '1'),
});

const parseEnv = () => {
  // Map EMAIL_ADAPTER to EMAIL_PROVIDER if EMAIL_ADAPTER is passed
  const rawEnv = { ...process.env };
  if (rawEnv.EMAIL_ADAPTER && !rawEnv.EMAIL_PROVIDER) {
    rawEnv.EMAIL_PROVIDER = rawEnv.EMAIL_ADAPTER;
  }
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw new Error('Invalid environment variables');
  }
  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;

export function isFallbackAllowed(): boolean {
  if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' || process.env.ALLOW_IN_MEMORY_FALLBACK === '1') {
    return true;
  }
  if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'false' || process.env.ALLOW_IN_MEMORY_FALLBACK === '0') {
    return false;
  }
  // In test environment, allow in-memory fallback unless explicitly disabled
  return env.NODE_ENV === 'test';
}

