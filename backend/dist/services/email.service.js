"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.SmtpEmailService = exports.ResendEmailService = exports.MockEmailService = void 0;
exports.createEmailService = createEmailService;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_js_1 = require("../config/env.js");
/**
 * Mock Email Service for unit and integration testing without network calls
 */
class MockEmailService {
    sentEmails = [];
    getSentEmails() {
        return [...this.sentEmails];
    }
    clearSentEmails() {
        this.sentEmails = [];
    }
    async verifyConfiguration() {
        return { valid: true, message: 'Mock Email Adapter is active (in-memory mode).' };
    }
    async sendEmail(message) {
        const payload = {
            ...message,
            from: message.from || env_js_1.env.EMAIL_FROM,
            sentAt: new Date(),
        };
        this.sentEmails.push(payload);
        if (env_js_1.env.NODE_ENV !== 'test') {
            console.log(`✉️ [Mock Email] Dispatched to: ${message.to} | Subject: "${message.subject}"`);
        }
        return {
            success: true,
            messageId: `mock-msg-${Math.random().toString(36).substring(2, 9)}`,
            status: 'ACCEPTED',
            provider: 'mock',
        };
    }
}
exports.MockEmailService = MockEmailService;
/**
 * Resend API Email Service (Transactional REST API)
 */
class ResendEmailService {
    mockFallback = new MockEmailService();
    apiKey;
    fromAddress;
    constructor(apiKey, fromAddress) {
        this.apiKey = apiKey !== undefined ? apiKey : (env_js_1.env.RESEND_API_KEY || '');
        this.fromAddress = fromAddress || env_js_1.env.EMAIL_FROM;
    }
    getSentEmails() {
        return this.mockFallback.getSentEmails();
    }
    clearSentEmails() {
        this.mockFallback.clearSentEmails();
    }
    async verifyConfiguration() {
        if (!this.apiKey) {
            return {
                valid: false,
                message: 'RESEND_API_KEY is not configured. Get an API key from https://resend.com/api-keys.',
            };
        }
        return { valid: true, message: 'Resend API credentials configured.' };
    }
    async sendEmail(message) {
        if (!this.apiKey) {
            const errorMsg = 'RESEND_API_KEY is missing. Real email delivery via Resend cannot proceed.';
            console.error(`❌ [Resend Email Error]: ${errorMsg}`);
            return {
                success: false,
                status: 'FAILED',
                error: errorMsg,
                provider: 'resend',
            };
        }
        // In sandbox testing mode (onboarding@resend.dev), redirect mentor/test emails to EMAIL_OVERRIDE_RECIPIENT if configured
        let targetRecipient = message.to;
        let targetSubject = message.subject;
        if (env_js_1.env.EMAIL_OVERRIDE_RECIPIENT && targetRecipient.toLowerCase() !== env_js_1.env.EMAIL_OVERRIDE_RECIPIENT.toLowerCase()) {
            targetSubject = `[For ${message.to}] ${message.subject}`;
            targetRecipient = env_js_1.env.EMAIL_OVERRIDE_RECIPIENT;
        }
        try {
            console.log(`📤 [Resend Dispatch] To: ${targetRecipient} (original: ${message.to}) | Subject: "${message.subject}"`);
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: message.from || this.fromAddress,
                    to: [targetRecipient],
                    subject: targetSubject,
                    text: message.text,
                    html: message.html,
                }),
            });
            const data = (await response.json());
            if (!response.ok) {
                const errorDetail = data.message || response.statusText || 'Unknown Resend API error';
                console.error(`❌ [Resend API Error ${response.status}] To: ${targetRecipient} | Error: ${errorDetail}`);
                return {
                    success: false,
                    status: 'FAILED',
                    error: `Resend API error (${response.status}): ${errorDetail}`,
                    provider: 'resend',
                };
            }
            console.log(`✅ [Resend Accepted] Message ID: ${data.id} | To: ${targetRecipient}`);
            await this.mockFallback.sendEmail({
                ...message,
                to: targetRecipient,
                subject: targetSubject,
            });
            return {
                success: true,
                messageId: data.id,
                status: 'ACCEPTED',
                provider: 'resend',
            };
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Network error connecting to Resend API';
            console.error(`❌ [Resend Exception] To: ${targetRecipient} | Exception: ${errorMsg}`);
            return {
                success: false,
                status: 'FAILED',
                error: errorMsg,
                provider: 'resend',
            };
        }
    }
}
exports.ResendEmailService = ResendEmailService;
/**
 * SMTP Email Service (Gmail App Passwords, SendGrid, Mailgun, AWS SES, Mailpit)
 */
class SmtpEmailService {
    mockFallback = new MockEmailService();
    transporter;
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: env_js_1.env.SMTP_HOST || 'localhost',
            port: env_js_1.env.SMTP_PORT || 587,
            secure: env_js_1.env.SMTP_SECURE || false,
            auth: env_js_1.env.SMTP_USER && env_js_1.env.SMTP_PASS
                ? {
                    user: env_js_1.env.SMTP_USER,
                    pass: env_js_1.env.SMTP_PASS,
                }
                : undefined,
            tls: {
                rejectUnauthorized: env_js_1.env.NODE_ENV === 'production',
            },
        });
    }
    getSentEmails() {
        return this.mockFallback.getSentEmails();
    }
    clearSentEmails() {
        this.mockFallback.clearSentEmails();
    }
    async verifyConfiguration() {
        try {
            await this.transporter.verify();
            return { valid: true, message: `SMTP connection established successfully to ${env_js_1.env.SMTP_HOST}:${env_js_1.env.SMTP_PORT}` };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                valid: false,
                message: `SMTP connection check failed: ${msg}`,
            };
        }
    }
    async sendEmail(message) {
        try {
            const info = await this.transporter.sendMail({
                from: message.from || env_js_1.env.EMAIL_FROM,
                to: message.to,
                subject: message.subject,
                text: message.text,
                html: message.html,
            });
            await this.mockFallback.sendEmail(message);
            return {
                success: true,
                messageId: info.messageId,
                status: 'ACCEPTED',
                provider: 'smtp',
            };
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown SMTP error';
            console.error(`❌ [SMTP Email Error]: Failed to send to ${message.to}:`, errorMsg);
            return {
                success: false,
                status: 'FAILED',
                error: `SMTP Error: ${errorMsg}`,
                provider: 'smtp',
            };
        }
    }
}
exports.SmtpEmailService = SmtpEmailService;
/**
 * Factory to create Email Service based on environment configuration
 */
function createEmailService() {
    if (env_js_1.env.NODE_ENV === 'test') {
        return new MockEmailService();
    }
    const provider = env_js_1.env.EMAIL_PROVIDER || 'mock';
    switch (provider) {
        case 'resend':
            return new ResendEmailService();
        case 'smtp':
        case 'mailpit':
            return new SmtpEmailService();
        case 'test':
        case 'mock':
        default:
            return new MockEmailService();
    }
}
exports.emailService = createEmailService();
