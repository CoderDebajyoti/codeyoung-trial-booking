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
  EMAIL_FROM: z.string().default('no-reply@codeyoung.com'),
  RESEND_API_KEY: z.string().optional().default(''),
  SMTP_HOST: z.string().optional().default('localhost'),
  SMTP_PORT: z.string().optional().default('587').transform((val) => parseInt(val, 10)),
  SMTP_SECURE: z.string().optional().default('false').transform((val) => val === 'true' || val === '1'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  DEMO_CLASS_BASE_URL: z.string().url().default('https://meet.codeyoung.com/trial'),
  REMINDER_INTERVAL_SECONDS: z.string().optional().default('10').transform((val) => parseInt(val, 10)),
  NOTIFICATION_WORKER_ENABLED: z.string().optional().default('true').transform((val) => val !== 'false' && val !== '0'),
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
