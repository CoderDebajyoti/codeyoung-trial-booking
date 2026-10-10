"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('4000').transform((val) => parseInt(val, 10)),
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:5173'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    // Support EMAIL_PROVIDER as primary, fallback to EMAIL_ADAPTER
    EMAIL_PROVIDER: zod_1.z.enum(['mock', 'smtp', 'resend', 'mailpit', 'test']).default('mock'),
    EMAIL_ADAPTER: zod_1.z.enum(['mock', 'smtp', 'resend', 'mailpit', 'test']).optional(),
    EMAIL_FROM: zod_1.z.string().default('no-reply@codeyoung.com').transform((val) => val.trim()),
    EMAIL_OVERRIDE_RECIPIENT: zod_1.z.string().optional().default('').transform((val) => val.trim()),
    RESEND_API_KEY: zod_1.z.string().optional().default('').transform((val) => val.trim()),
    SMTP_HOST: zod_1.z.string().optional().default('localhost').transform((val) => val.trim()),
    SMTP_PORT: zod_1.z.string().optional().default('587').transform((val) => parseInt(val, 10)),
    SMTP_SECURE: zod_1.z.string().optional().default('false').transform((val) => val === 'true' || val === '1'),
    SMTP_USER: zod_1.z.string().optional().default('').transform((val) => val.trim()),
    SMTP_PASS: zod_1.z.string().optional().default('').transform((val) => val.trim()),
    DEMO_CLASS_BASE_URL: zod_1.z.string().url().default('https://meet.codeyoung.com/trial'),
    REMINDER_INTERVAL_SECONDS: zod_1.z.string().optional().default('10').transform((val) => parseInt(val, 10)),
    NOTIFICATION_WORKER_ENABLED: zod_1.z.string().optional().default('true').transform((val) => val !== 'false' && val !== '0'),
    // Authentication & Session Security
    JWT_SECRET: zod_1.z.string().default('codeyoung-super-secure-jwt-secret-key-2026').transform((val) => val.trim()),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h').transform((val) => val.trim()),
    // Bot & Abuse Protection (Cloudflare Turnstile CAPTCHA)
    CAPTCHA_ENABLED: zod_1.z.string().optional().default('false').transform((val) => val === 'true' || val === '1'),
    TURNSTILE_SECRET_KEY: zod_1.z.string().optional().default('').transform((val) => val.trim()),
    // Parent Email OTP Verification
    OTP_ENABLED: zod_1.z.string().optional().default('true').transform((val) => val !== 'false' && val !== '0'),
    OTP_EXPIRY_MINUTES: zod_1.z.string().optional().default('5').transform((val) => parseInt(val, 10)),
    OTP_MAX_ATTEMPTS: zod_1.z.string().optional().default('3').transform((val) => parseInt(val, 10)),
    OTP_RESEND_COOLDOWN_SECONDS: zod_1.z.string().optional().default('60').transform((val) => parseInt(val, 10)),
    // Trial Booking Eligibility Policies
    MAX_TRIALS_PER_STUDENT: zod_1.z.string().optional().default('1').transform((val) => parseInt(val, 10)),
    // Rate Limiting
    RATE_LIMIT_ENABLED: zod_1.z.string().optional().default('true').transform((val) => val !== 'false' && val !== '0'),
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
exports.env = parseEnv();
