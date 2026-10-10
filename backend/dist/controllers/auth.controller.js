"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const zod_1 = require("zod");
const auth_service_js_1 = require("../services/auth.service.js");
const otp_service_js_1 = require("../services/otp.service.js");
const captcha_js_1 = require("../lib/captcha.js");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
    captchaToken: zod_1.z.string().optional(),
});
const sendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    captchaToken: zod_1.z.string().optional(),
});
const verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    otp: zod_1.z.string().regex(/^\d{6}$/, 'Verification code must be a 6-digit number'),
});
exports.authController = {
    async login(req, res, _next) {
        try {
            const validated = loginSchema.parse(req.body);
            // 1. Validate CAPTCHA if required
            if (validated.captchaToken) {
                const captcha = await (0, captcha_js_1.verifyCaptchaToken)(validated.captchaToken, req.ip);
                if (!captcha.success) {
                    res.status(400).json({ status: 'fail', message: captcha.message });
                    return;
                }
            }
            // 2. Perform authentication
            const result = await auth_service_js_1.authService.login(validated.email, validated.password);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                res.status(400).json({ status: 'fail', message: err.errors[0]?.message || 'Invalid input' });
                return;
            }
            const message = err instanceof Error ? err.message : 'Authentication failed';
            res.status(401).json({ status: 'fail', message });
        }
    },
    async getMe(req, res) {
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
    async logout(_req, res) {
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully.',
        });
    },
    async sendOtp(req, res, _next) {
        try {
            const validated = sendOtpSchema.parse(req.body);
            // Validate CAPTCHA if enabled
            if (validated.captchaToken) {
                const captcha = await (0, captcha_js_1.verifyCaptchaToken)(validated.captchaToken, req.ip);
                if (!captcha.success) {
                    res.status(400).json({ status: 'fail', message: captcha.message });
                    return;
                }
            }
            const result = await otp_service_js_1.otpService.sendOtp(validated.email);
            res.status(200).json({
                status: 'success',
                message: result.message,
                data: {
                    cooldownSeconds: result.cooldownSeconds,
                },
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                res.status(400).json({ status: 'fail', message: err.errors[0]?.message || 'Invalid email address' });
                return;
            }
            const message = err instanceof Error ? err.message : 'Failed to send verification code';
            res.status(400).json({ status: 'fail', message });
        }
    },
    async verifyOtp(req, res, _next) {
        try {
            const validated = verifyOtpSchema.parse(req.body);
            const result = await otp_service_js_1.otpService.verifyOtp(validated.email, validated.otp);
            res.status(200).json({
                status: 'success',
                message: 'Email successfully verified.',
                data: {
                    verificationToken: result.verificationToken,
                },
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                res.status(400).json({ status: 'fail', message: err.errors[0]?.message || 'Invalid input' });
                return;
            }
            const message = err instanceof Error ? err.message : 'Verification failed';
            res.status(400).json({ status: 'fail', message });
        }
    },
};
