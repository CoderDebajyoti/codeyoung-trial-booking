"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSlots = void 0;
const zod_1 = require("zod");
const booking_service_js_1 = require("../services/booking.service.js");
const dateUtils_js_1 = require("../lib/dateUtils.js");
const getSlotsQuerySchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
    timeZone: zod_1.z.string().refine(dateUtils_js_1.isValidTimeZone, {
        message: 'Invalid IANA time-zone identifier (e.g., America/New_York, Europe/London, Asia/Kolkata)',
    }),
});
const getAvailableSlots = async (req, res, next) => {
    try {
        const validated = getSlotsQuerySchema.parse(req.query);
        const slots = await booking_service_js_1.bookingService.getAvailableSlots(validated.date, validated.timeZone);
        res.status(200).json({
            status: 'success',
            data: {
                queryDate: validated.date,
                timeZone: validated.timeZone,
                totalAvailableSlots: slots.length,
                slots,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAvailableSlots = getAvailableSlots;
