import crypto from 'crypto';
import { env } from '../config/env.js';
import { emailService } from './email.service.js';
import { signEmailVerificationToken } from '../lib/jwt.js';

interface StoredOtpRecord {
  email: string;
  hashedOtp: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  verified: boolean;
}

export class OtpService {
  private store: Map<string, StoredOtpRecord> = new Map();

  private hashOtp(email: string, otp: string, salt: string): string {
    return crypto
      .createHash('sha256')
      .update(`${email.toLowerCase()}:${otp}:${salt}`)
      .digest('hex');
  }

  /**
   * Generates and dispatches a 6-digit email OTP.
   */
  async sendOtp(rawEmail: string): Promise<{ success: boolean; message: string; cooldownSeconds: number }> {
    const email = rawEmail.trim().toLowerCase();
    const now = Date.now();
    const existing = this.store.get(email);

    // 1. Enforce resend cooldown
    if (existing && now - existing.lastSentAt < env.OTP_RESEND_COOLDOWN_SECONDS * 1000) {
      const remainingSeconds = Math.ceil(
        (env.OTP_RESEND_COOLDOWN_SECONDS * 1000 - (now - existing.lastSentAt)) / 1000
      );
      throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new verification code.`);
    }

    // 2. Generate cryptographically secure 6-digit code
    const otp = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedOtp = this.hashOtp(email, otp, salt);
    const expiresAt = now + env.OTP_EXPIRY_MINUTES * 60 * 1000;

    // 3. Store hashed OTP
    this.store.set(email, {
      email,
      hashedOtp,
      salt,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      verified: false,
    });

    // 4. Send email with branded template
    const subject = `Your Codeyoung Trial Verification Code: ${otp}`;
    const textContent = `Hello,\n\nYour Codeyoung trial class verification code is: ${otp}\n\nThis code will expire in ${env.OTP_EXPIRY_MINUTES} minutes. If you did not request this code, please ignore this email.\n\nWarm regards,\nCodeyoung Team`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FFF8E8; border: 1px solid #F7E4B6; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #713B18; margin: 0; font-size: 22px;">Codeyoung Trial Verification</h2>
          <p style="color: #843B13; font-size: 13px; margin-top: 4px;">Confirm your email address to book your 1:1 Live Trial Class</p>
        </div>
        <div style="background: #FFFFFF; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #F7E4B6;">
          <p style="font-size: 13px; color: #713B18; margin-bottom: 12px;">Your 6-digit verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #F28C28; padding: 12px; background: #FFF0D2; border-radius: 8px; display: inline-block;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #843B13; margin-top: 14px;">⏱️ Valid for <strong>${env.OTP_EXPIRY_MINUTES} minutes</strong>. Never share this code with anyone.</p>
        </div>
      </div>
    `;

    try {
      await emailService.sendEmail({
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });
    } catch (err) {
      console.error(`❌ Failed to deliver OTP email to ${email}:`, err);
      // In test mode, allow verification even if external SMTP is offline
      if (env.NODE_ENV !== 'test') {
        throw new Error('Failed to deliver verification email. Please check your email address or try again.');
      }
    }

    return {
      success: true,
      message: `Verification code sent to ${email}.`,
      cooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
    };
  }

  /**
   * Verifies the 6-digit OTP code against the stored hash.
   */
  async verifyOtp(rawEmail: string, candidateOtp: string): Promise<{ success: boolean; verificationToken: string }> {
    const email = rawEmail.trim().toLowerCase();
    const cleanOtp = candidateOtp.trim();
    const record = this.store.get(email);
    const now = Date.now();

    if (!record) {
      throw new Error('No active verification code found for this email. Please request a new code.');
    }

    // 1. Check expiration
    if (now > record.expiresAt) {
      this.store.delete(email);
      throw new Error('Verification code has expired. Please request a new code.');
    }

    // 2. Check attempt limits
    if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
      this.store.delete(email);
      throw new Error('Too many failed attempts. For your security, please request a new verification code.');
    }

    // 3. Compute hash and compare with timing-safe check
    const candidateHash = this.hashOtp(email, cleanOtp, record.salt);
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    const storedBuf = Buffer.from(record.hashedOtp, 'hex');

    const isMatch =
      candidateBuf.length === storedBuf.length && crypto.timingSafeEqual(candidateBuf, storedBuf);

    if (!isMatch) {
      record.attempts += 1;
      const remaining = env.OTP_MAX_ATTEMPTS - record.attempts;
      if (remaining <= 0) {
        this.store.delete(email);
        throw new Error('Incorrect code. Maximum attempts exceeded. Please request a new code.');
      }
      throw new Error(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
    }

    // 4. Mark verified and generate signed token
    record.verified = true;
    // Invalidate code to prevent replay attacks
    this.store.delete(email);

    const verificationToken = signEmailVerificationToken(email);

    return {
      success: true,
      verificationToken,
    };
  }

  /**
   * Directly registers an email as verified (used for testing or pre-verified parents).
   */
  registerVerifiedEmail(rawEmail: string): string {
    const email = rawEmail.trim().toLowerCase();
    return signEmailVerificationToken(email);
  }
}

export const otpService = new OtpService();
