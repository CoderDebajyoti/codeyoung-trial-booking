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
    EMAIL_ADAPTER: zod_1.z.enum(['mock', 'smtp', 'mailpit']).default('mock'),
    SMTP_HOST: zod_1.z.string().optional().default('localhost'),
    SMTP_PORT: zod_1.z.string().optional().default('1025').transform((val) => parseInt(val, 10)),
    SMTP_USER: zod_1.z.string().optional().default(''),
    SMTP_PASS: zod_1.z.string().optional().default(''),
    EMAIL_FROM: zod_1.z.string().email().default('no-reply@codeyoung.com'),
});
const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
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
