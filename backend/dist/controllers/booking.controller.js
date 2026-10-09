"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingById = exports.createBooking = void 0;
const zod_1 = require("zod");
const booking_service_js_1 = require("../services/booking.service.js");
const dateUtils_js_1 = require("../lib/dateUtils.js");
const createBookingSchema = zod_1.z.object({
    parentName: zod_1.z.string().min(2, 'Parent name must be at least 2 characters'),
    parentEmail: zod_1.z.string().email('Invalid email address'),
    parentPhone: zod_1.z.string().optional(),
    course: zod_1.z.string().optional(),
    parentTimeZone: zod_1.z.string().refine(dateUtils_js_1.isValidTimeZone, {
        message: 'Invalid IANA time-zone identifier',
    }),
    startAt: zod_1.z.string().min(1, 'Requested start time is required'),
    idempotencyKey: zod_1.z.string().optional(),
});
const createBooking = async (req, res, next) => {
    try {
        const validated = createBookingSchema.parse(req.body);
        const booking = await booking_service_js_1.bookingService.createBooking(validated);
        res.status(201).json({
            status: 'success',
            data: booking,
        });
    }
    catch (error) {
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
