"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrialEligibility = exports.getBookingById = exports.createBooking = void 0;
const zod_1 = require("zod");
const booking_service_js_1 = require("../services/booking.service.js");
const dateUtils_js_1 = require("../lib/dateUtils.js");
const captcha_js_1 = require("../lib/captcha.js");
const jwt_js_1 = require("../lib/jwt.js");
const phoneUtils_js_1 = require("../lib/phoneUtils.js");
const env_js_1 = require("../config/env.js");
const createBookingSchema = zod_1.z.object({
    parentName: zod_1.z.string().min(2, 'Parent name must be at least 2 characters'),
    parentEmail: zod_1.z.string().email('Invalid email address'),
    parentPhone: zod_1.z.string().optional(),
    countryDialCode: zod_1.z.string().optional(),
    studentName: zod_1.z.string().optional(),
    course: zod_1.z.string().optional(),
    parentTimeZone: zod_1.z.string().refine(dateUtils_js_1.isValidTimeZone, {
        message: 'Invalid IANA time-zone identifier',
    }),
    startAt: zod_1.z.string().min(1, 'Requested start time is required'),
    idempotencyKey: zod_1.z.string().optional(),
    captchaToken: zod_1.z.string().optional(),
    verificationToken: zod_1.z.string().optional(),
});
const createBooking = async (req, res, next) => {
    try {
        const validated = createBookingSchema.parse(req.body);
        // 1. Validate & Normalize Phone Number if provided
        let normalizedPhone = undefined;
        if (validated.parentPhone && validated.parentPhone.trim().length > 0) {
            const phoneValidation = (0, phoneUtils_js_1.validateAndNormalizePhone)(validated.parentPhone, validated.countryDialCode || '+91');
            if (!phoneValidation.isValid) {
                res.status(400).json({
                    status: 'fail',
                    message: phoneValidation.error || 'Invalid phone number for the selected country.',
                });
                return;
            }
            normalizedPhone = phoneValidation.e164;
        }
        // 2. CAPTCHA verification (Bot protection)
        const captcha = await (0, captcha_js_1.verifyCaptchaToken)(validated.captchaToken, req.ip);
        if (!captcha.success) {
            res.status(400).json({
                status: 'fail',
                message: captcha.message || 'Security CAPTCHA verification failed.',
            });
            return;
        }
        // 3. Parent Email OTP Verification check
        if (env_js_1.env.OTP_ENABLED) {
            const isTestToken = (env_js_1.env.NODE_ENV === 'test' || env_js_1.env.NODE_ENV === 'development') &&
                validated.verificationToken === 'test-verified-token';
            const isValidToken = validated.verificationToken &&
                (isTestToken || (0, jwt_js_1.verifyEmailVerificationToken)(validated.verificationToken, validated.parentEmail));
            if (!isValidToken) {
                res.status(403).json({
                    status: 'fail',
                    message: 'Email address must be verified with a one-time passcode (OTP) before booking.',
                    code: 'EMAIL_VERIFICATION_REQUIRED',
                });
                return;
            }
        }
        const booking = await booking_service_js_1.bookingService.createBooking({
            ...validated,
            parentPhone: normalizedPhone || validated.parentPhone,
        });
        res.status(201).json({
            status: 'success',
            data: booking,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                status: 'fail',
                message: error.errors[0]?.message || 'Invalid booking submission data.',
            });
            return;
        }
        if (error instanceof booking_service_js_1.TrialEligibilityError) {
            res.status(403).json({
                status: 'fail',
                message: error.message,
                code: 'TRIAL_ALREADY_USED',
            });
            return;
        }
        if (error instanceof booking_service_js_1.SlotUnavailableError) {
            res.status(409).json({
                status: 'fail',
                message: error.message,
                code: 'SLOT_UNAVAILABLE',
                alternativeSlots: error.alternativeSlots,
            });
            return;
        }
        next(error);
    }
};
exports.createBooking = createBooking;
const getBookingById = async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        if (!bookingId) {
            res.status(400).json({ status: 'fail', message: 'Booking ID is required' });
            return;
        }
        const booking = await booking_service_js_1.bookingService.getBookingById(bookingId);
        res.status(200).json({
            status: 'success',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBookingById = getBookingById;
const getTrialEligibility = async (req, res, next) => {
    try {
        const email = req.query.email;
        const studentName = req.query.studentName;
        if (!email || !email.includes('@')) {
            res.status(400).json({
                status: 'fail',
                message: 'A valid email parameter is required to check trial eligibility.',
            });
            return;
        }
        const eligibility = await booking_service_js_1.bookingService.checkTrialEligibility(email, studentName);
        res.status(200).json({
            status: 'success',
            data: eligibility,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrialEligibility = getTrialEligibility;
