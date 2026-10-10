import { Router } from 'express';
import { createBooking, getBookingById, getTrialEligibility, getAdminBookings } from '../controllers/booking.controller.js';
import { bookingRateLimiter } from '../middleware/rateLimiter.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Protected admin bookings query (search, filter, sort, paginate)
router.get('/', authenticate, requireRole(['ADMIN']), getAdminBookings);

// Public booking creation with rate limiting and bot/OTP validation
router.get('/eligibility', getTrialEligibility);
router.post('/', bookingRateLimiter, createBooking);
router.get('/:id', getBookingById);

export default router;

