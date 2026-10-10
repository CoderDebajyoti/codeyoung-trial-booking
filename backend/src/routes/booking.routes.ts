import { Router } from 'express';
import { createBooking, getBookingById, getTrialEligibility } from '../controllers/booking.controller.js';
import { bookingRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public booking creation with rate limiting and bot/OTP validation
router.get('/eligibility', getTrialEligibility);
router.post('/', bookingRateLimiter, createBooking);
router.get('/:id', getBookingById);

export default router;
