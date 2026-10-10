import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingService, SlotUnavailableError, TrialEligibilityError } from '../services/booking.service.js';
import { isValidTimeZone } from '../lib/dateUtils.js';
import { verifyCaptchaToken } from '../lib/captcha.js';
import { verifyEmailVerificationToken } from '../lib/jwt.js';
import { validateAndNormalizePhone } from '../lib/phoneUtils.js';
import { env } from '../config/env.js';

const createBookingSchema = z.object({
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  parentEmail: z.string().email('Invalid email address'),
  parentPhone: z.string().optional(),
  countryDialCode: z.string().optional(),
  studentName: z.string().optional(),
  course: z.string().optional(),
  parentTimeZone: z.string().refine(isValidTimeZone, {
    message: 'Invalid IANA time-zone identifier',
  }),
  startAt: z.string().min(1, 'Requested start time is required'),
  idempotencyKey: z.string().optional(),
  captchaToken: z.string().optional(),
  verificationToken: z.string().optional(),
});

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createBookingSchema.parse(req.body);

    // 1. Validate & Normalize Phone Number if provided
    let normalizedPhone: string | undefined = undefined;
    if (validated.parentPhone && validated.parentPhone.trim().length > 0) {
      const phoneValidation = validateAndNormalizePhone(
        validated.parentPhone,
        validated.countryDialCode || '+91'
      );
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
    const captcha = await verifyCaptchaToken(validated.captchaToken, req.ip);
    if (!captcha.success) {
      res.status(400).json({
        status: 'fail',
        message: captcha.message || 'Security CAPTCHA verification failed.',
      });
      return;
    }

    // 3. Parent Email OTP Verification check
    if (env.OTP_ENABLED) {
      const isTestToken =
        (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') &&
        validated.verificationToken === 'test-verified-token';

      const isValidToken =
        validated.verificationToken &&
        (isTestToken || verifyEmailVerificationToken(validated.verificationToken, validated.parentEmail));

      if (!isValidToken) {
        res.status(403).json({
          status: 'fail',
          message: 'Email address must be verified with a one-time passcode (OTP) before booking.',
          code: 'EMAIL_VERIFICATION_REQUIRED',
        });
        return;
      }
    }

    const booking = await bookingService.createBooking({
      ...validated,
      parentPhone: normalizedPhone || validated.parentPhone,
    });

    res.status(201).json({
      status: 'success',
      data: booking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Invalid booking submission data.',
      });
      return;
    }

    if (error instanceof TrialEligibilityError) {
      res.status(403).json({
        status: 'fail',
        message: error.message,
        code: 'TRIAL_ALREADY_USED',
      });
      return;
    }

    if (error instanceof SlotUnavailableError) {
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

export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bookingId = req.params.id;
    if (!bookingId) {
      res.status(400).json({ status: 'fail', message: 'Booking ID is required' });
      return;
    }

    const booking = await bookingService.getBookingById(bookingId);
    res.status(200).json({
      status: 'success',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrialEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = req.query.email as string;
    const studentName = req.query.studentName as string | undefined;

    if (!email || !email.includes('@')) {
      res.status(400).json({
        status: 'fail',
        message: 'A valid email parameter is required to check trial eligibility.',
      });
      return;
    }

    const eligibility = await bookingService.checkTrialEligibility(email, studentName);
    res.status(200).json({
      status: 'success',
      data: eligibility,
    });
  } catch (error) {
    next(error);
  }
};
