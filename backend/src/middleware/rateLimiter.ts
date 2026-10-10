import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}) {
  const store = new Map<string, RateLimitEntry>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!env.RATE_LIMIT_ENABLED) {
      next();
      return;
    }

    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : req.ip || req.socket.remoteAddress || 'unknown-client';

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      next();
      return;
    }

    if (entry.count >= options.max) {
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        status: 'fail',
        message: options.message,
        retryAfterSeconds,
      });
      return;
    }

    entry.count += 1;
    next();
  };
}

/**
 * 1. Global API rate limiter (120 requests / minute per IP)
 */
export const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests. Please slow down.',
});

/**
 * 2. Login rate limiter (5 failed attempts / 15 minutes per IP/email)
 */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  keyGenerator: (req) => {
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `login:${ip}:${email}`;
  },
});

/**
 * 3. OTP Send rate limiter (3 code requests / 10 minutes per email)
 */
export const otpSendRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: 'Too many OTP verification requests for this email. Please try again later.',
  keyGenerator: (req) => {
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `otp-send:${email || ip}`;
  },
});

/**
 * 4. OTP Verify rate limiter (5 verification attempts / 15 minutes per email)
 */
export const otpVerifyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many invalid verification attempts. Please wait before trying again.',
  keyGenerator: (req) => {
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `otp-verify:${email || ip}`;
  },
});

/**
 * 5. Booking submission rate limiter (10 bookings / hour per IP)
 */
export const bookingRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Maximum trial class booking limit reached for this hour. Please try again later.',
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `booking:${ip}`;
  },
});
