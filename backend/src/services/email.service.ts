import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export interface EmailMessage {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  status: 'ACCEPTED' | 'FAILED';
  error?: string;
  provider: string;
}

export interface IEmailService {
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;
  verifyConfiguration(): Promise<{ valid: boolean; message: string }>;
  getSentEmails(): Array<EmailMessage & { sentAt: Date }>;
  clearSentEmails(): void;
}

/**
 * Mock Email Service for unit and integration testing without network calls
 */
export class MockEmailService implements IEmailService {
  private sentEmails: Array<EmailMessage & { sentAt: Date }> = [];

  getSentEmails(): Array<EmailMessage & { sentAt: Date }> {
    return [...this.sentEmails];
  }

  clearSentEmails(): void {
    this.sentEmails = [];
  }

  async verifyConfiguration(): Promise<{ valid: boolean; message: string }> {
    return { valid: true, message: 'Mock Email Adapter is active (in-memory mode).' };
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    const payload = {
      ...message,
      from: message.from || env.EMAIL_FROM,
      sentAt: new Date(),
    };
    this.sentEmails.push(payload);

    if (env.NODE_ENV !== 'test') {
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

/**
 * Resend API Email Service (Transactional REST API)
 */
export class ResendEmailService implements IEmailService {
  private mockFallback = new MockEmailService();
  private apiKey: string;
  private fromAddress: string;

  constructor(apiKey?: string, fromAddress?: string) {
    this.apiKey = apiKey !== undefined ? apiKey : (env.RESEND_API_KEY || '');
    this.fromAddress = fromAddress || env.EMAIL_FROM;
  }

  getSentEmails(): Array<EmailMessage & { sentAt: Date }> {
    return this.mockFallback.getSentEmails();
  }

  clearSentEmails(): void {
    this.mockFallback.clearSentEmails();
  }

  async verifyConfiguration(): Promise<{ valid: boolean; message: string }> {
    if (!this.apiKey) {
      return {
        valid: false,
        message: 'RESEND_API_KEY is not configured. Get an API key from https://resend.com/api-keys.',
      };
    }
    return { valid: true, message: 'Resend API credentials configured.' };
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
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

    if (env.EMAIL_OVERRIDE_RECIPIENT && targetRecipient.toLowerCase() !== env.EMAIL_OVERRIDE_RECIPIENT.toLowerCase()) {
      targetSubject = `[For ${message.to}] ${message.subject}`;
      targetRecipient = env.EMAIL_OVERRIDE_RECIPIENT;
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

      const data = (await response.json()) as { id?: string; message?: string; name?: string };

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
    } catch (err: unknown) {
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

/**
 * SMTP Email Service (Gmail App Passwords, SendGrid, Mailgun, AWS SES, Mailpit)
 */
export class SmtpEmailService implements IEmailService {
  private mockFallback = new MockEmailService();
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'localhost',
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_SECURE || false,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
      tls: {
        rejectUnauthorized: env.NODE_ENV === 'production',
      },
    });
  }

  getSentEmails(): Array<EmailMessage & { sentAt: Date }> {
    return this.mockFallback.getSentEmails();
  }

  clearSentEmails(): void {
    this.mockFallback.clearSentEmails();
  }

  async verifyConfiguration(): Promise<{ valid: boolean; message: string }> {
    try {
      await this.transporter.verify();
      return { valid: true, message: `SMTP connection established successfully to ${env.SMTP_HOST}:${env.SMTP_PORT}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        valid: false,
        message: `SMTP connection check failed: ${msg}`,
      };
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const info = await this.transporter.sendMail({
        from: message.from || env.EMAIL_FROM,
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
    } catch (err: unknown) {
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

/**
 * Factory to create Email Service based on environment configuration
 */
export function createEmailService(): IEmailService {
  if (env.NODE_ENV === 'test') {
    return new MockEmailService();
  }

  const provider = env.EMAIL_PROVIDER || 'mock';

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

export const emailService: IEmailService = createEmailService();
