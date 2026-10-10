"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRateLimiter = exports.otpVerifyRateLimiter = exports.otpSendRateLimiter = exports.loginRateLimiter = exports.globalRateLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
const env_js_1 = require("../config/env.js");
function createRateLimiter(options) {
    const store = new Map();
    return (req, res, next) => {
        if (!env_js_1.env.RATE_LIMIT_ENABLED) {
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
exports.globalRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 120,
    message: 'Too many requests. Please slow down.',
});
/**
 * 2. Login rate limiter (5 failed attempts / 15 minutes per IP/email)
 */
exports.loginRateLimiter = createRateLimiter({
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
exports.otpSendRateLimiter = createRateLimiter({
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
exports.otpVerifyRateLimiter = createRateLimiter({
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
exports.bookingRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Maximum trial class booking limit reached for this hour. Please try again later.',
    keyGenerator: (req) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        return `booking:${ip}`;
    },
});
