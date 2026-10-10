import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { otpService } from '../services/otp.service.js';
import { verifyCaptchaToken } from '../lib/captcha.js';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  captchaToken: z.string().optional(),
});

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  captchaToken: z.string().optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().regex(/^\d{6}$/, 'Verification code must be a 6-digit number'),
});

export const authController = {
  async login(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);

      // 1. Validate CAPTCHA if required
      if (validated.captchaToken) {
        const captcha = await verifyCaptchaToken(validated.captchaToken, req.ip);
        if (!captcha.success) {
          res.status(400).json({ status: 'fail', message: captcha.message });
          return;
        }
      }

      // 2. Perform authentication
      const result = await authService.login(validated.email, validated.password);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'fail', message: err.errors[0]?.message || 'Invalid input' });
        return;
      }
      res.status(401).json({ status: 'fail', message: err?.message || 'Authentication failed' });
    }
  },

  async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ status: 'fail', message: 'Not authenticated' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  },

  async sendOtp(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const validated = sendOtpSchema.parse(req.body);

      // Validate CAPTCHA if enabled
      if (validated.captchaToken) {
        const captcha = await verifyCaptchaToken(validated.captchaToken, req.ip);
        if (!captcha.success) {
          res.status(400).json({ status: 'fail', message: captcha.message });
          return;
        }
      }

      const result = await otpService.sendOtp(validated.email);
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          cooldownSeconds: result.cooldownSeconds,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'fail', message: err.errors[0]?.message || 'Invalid email address' });
        return;
      }
      res.status(400).json({ status: 'fail', message: err?.message || 'Failed to send verification code' });
    }
  },

  async verifyOtp(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const validated = verifyOtpSchema.parse(req.body);
      const result = await otpService.verifyOtp(validated.email, validated.otp);

      res.status(200).json({
        status: 'success',
        message: 'Email successfully verified.',
        data: {
          verificationToken: result.verificationToken,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'fail', message: err.errors[0]?.message || 'Invalid input' });
        return;
      }
      res.status(400).json({ status: 'fail', message: err?.message || 'Verification failed' });
    }
  },
};
