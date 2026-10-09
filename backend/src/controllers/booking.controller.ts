import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingService, SlotUnavailableError } from '../services/booking.service.js';
import { isValidTimeZone } from '../lib/dateUtils.js';

const createBookingSchema = z.object({
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  parentEmail: z.string().email('Invalid email address'),
  parentPhone: z.string().optional(),
  course: z.string().optional(),
  parentTimeZone: z.string().refine(isValidTimeZone, {
    message: 'Invalid IANA time-zone identifier',
  }),
  startAt: z.string().min(1, 'Requested start time is required'),
  idempotencyKey: z.string().optional(),
});

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createBookingSchema.parse(req.body);
    const booking = await bookingService.createBooking(validated);

    res.status(201).json({
      status: 'success',
      data: booking,
    });
  } catch (error) {
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
