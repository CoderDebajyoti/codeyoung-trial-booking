import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingService } from '../services/booking.service.js';
import { isValidTimeZone } from '../lib/dateUtils.js';

const getSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  timeZone: z.string().refine(isValidTimeZone, {
    message: 'Invalid IANA time-zone identifier (e.g., America/New_York, Europe/London, Asia/Kolkata)',
  }),
});

export const getAvailableSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = getSlotsQuerySchema.parse(req.query);
    const slots = await bookingService.getAvailableSlots(validated.date, validated.timeZone);

    res.status(200).json({
      status: 'success',
      data: {
        queryDate: validated.date,
        timeZone: validated.timeZone,
        totalAvailableSlots: slots.length,
        slots,
      },
    });
  } catch (error) {
    next(error);
  }
};
