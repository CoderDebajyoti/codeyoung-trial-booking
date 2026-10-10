"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_js_1 = require("../controllers/booking.controller.js");
const rateLimiter_js_1 = require("../middleware/rateLimiter.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Protected admin bookings query (search, filter, sort, paginate)
router.get('/', auth_js_1.authenticate, (0, auth_js_1.requireRole)(['ADMIN']), booking_controller_js_1.getAdminBookings);
// Public booking creation with rate limiting and bot/OTP validation
router.get('/eligibility', booking_controller_js_1.getTrialEligibility);
router.post('/', rateLimiter_js_1.bookingRateLimiter, booking_controller_js_1.createBooking);
router.get('/:id', booking_controller_js_1.getBookingById);
exports.default = router;
