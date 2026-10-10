import { Mentor, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { mentorRepository } from '../repositories/mentor.repository.js';
import { parentRepository } from '../repositories/parent.repository.js';
import { bookingRepository, BookingWithRelations } from '../repositories/booking.repository.js';
import { notificationService } from './notification.service.js';
import { env } from '../config/env.js';
import {
  CLASS_DURATION_MINUTES,
  isValidTimeZone,
  normalizeTimeZone,
  parseRequestedStart,
  getLocalDateString,
  getLocalDayUtcRange,
  isWithinMentorWorkingHours,
  formatLocalTime,
} from '../lib/dateUtils.js';
import { addMinutes, addDays } from 'date-fns';

export interface CreateBookingInput {
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  course?: string;
  parentTimeZone: string;
  startAt: string; // ISO string or "YYYY-MM-DD HH:mm"
  idempotencyKey?: string;
}

export interface SlotAvailability {
  startUtc: string;
  endUtc: string;
  parentLocalDate: string;
  parentLocalTime: string;
  parentTimeZone: string;
  availableMentorsCount: number;
}

export interface FormattedBookingResponse {
  id: string;
  status: string;
  course: string;
  demoClassUrl: string;
  startAtUtc: string;
  endAtUtc: string;
  durationMinutes: number;
  parent: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    timeZone: string;
    localStartTime: string;
    localEndTime: string;
  };
  mentor: {
    id: string;
    name: string;
    email: string;
    timeZone: string;
    localStartTime: string;
    localEndTime: string;
  };
  createdAt: string;
}

export class SlotUnavailableError extends Error {
  public alternativeSlots: SlotAvailability[];

  constructor(message: string, alternativeSlots: SlotAvailability[] = []) {
    super(message);
    this.name = 'SlotUnavailableError';
    this.alternativeSlots = alternativeSlots;
  }
}

export class TrialEligibilityError extends Error {
  constructor(
    message: string = 'This student has already used their trial class. Please contact our team to explore available courses.'
  ) {
    super(message);
    this.name = 'TrialEligibilityError';
  }
}

class AsyncLock {
  private queue: Promise<void> = Promise.resolve();

  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const current = this.queue;
    this.queue = current.then(() => wait);
    await current;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

const bookingLock = new AsyncLock();

export class BookingService {
  /**
   * Find available start slots for a parent's requested local date and time zone.
   */
  async getAvailableSlots(parentLocalDateStr: string, parentTimeZone: string): Promise<SlotAvailability[]> {
    if (!isValidTimeZone(parentTimeZone)) {
      throw new Error(`Invalid IANA time zone: ${parentTimeZone}`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(parentLocalDateStr)) {
      throw new Error(`Invalid date format: ${parentLocalDateStr}. Expected YYYY-MM-DD.`);
    }

    const canonicalParentTz = normalizeTimeZone(parentTimeZone);
    const mentors = await mentorRepository.findAllActive();
    const { startUtc, endUtc } = getLocalDayUtcRange(parentLocalDateStr, canonicalParentTz);

    const availableSlots: SlotAvailability[] = [];

    // Evaluate 30-minute interval slots from startUtc to endUtc
    let currentSlotStart = new Date(startUtc);
    while (currentSlotStart < endUtc) {
      const currentSlotEnd = addMinutes(currentSlotStart, CLASS_DURATION_MINUTES);

      // Check how many mentors can take this slot
      let eligibleMentorsCount = 0;

      for (const mentor of mentors) {
        if (isWithinMentorWorkingHours(currentSlotStart, currentSlotEnd, mentor)) {
          // Check overlap
          const overlaps = await bookingRepository.findOverlappingConfirmedBookings(
            mentor.id,
            currentSlotStart,
            currentSlotEnd
          );

          if (overlaps.length === 0) {
            // Check daily limit for mentor's local date
            const mentorLocalDate = getLocalDateString(currentSlotStart, mentor.timeZone);
            const { startUtc: mentorDayStart, endUtc: mentorDayEnd } = getLocalDayUtcRange(
              mentorLocalDate,
              mentor.timeZone
            );

            const dailyCount = await bookingRepository.countMentorConfirmedInUtcRange(
              mentor.id,
              mentorDayStart,
              mentorDayEnd
            );

            if (dailyCount < 2) {
              eligibleMentorsCount++;
            }
          }
        }
      }

      if (eligibleMentorsCount > 0) {
        availableSlots.push({
          startUtc: currentSlotStart.toISOString(),
          endUtc: currentSlotEnd.toISOString(),
          parentLocalDate: parentLocalDateStr,
          parentLocalTime: formatLocalTime(currentSlotStart, canonicalParentTz, 'HH:mm'),
          parentTimeZone: canonicalParentTz,
          availableMentorsCount: eligibleMentorsCount,
        });
      }

      currentSlotStart = addMinutes(currentSlotStart, 30);
    }

    return availableSlots;
  }

  /**
   * Find alternative slots (e.g. in the next 3 days) when a requested slot is unavailable.
   */
  async findAlternativeSlots(parentLocalDateStr: string, parentTimeZone: string, limit: number = 4): Promise<SlotAvailability[]> {
    const alternatives: SlotAvailability[] = [];
    const dateObj = new Date(parentLocalDateStr);

    for (let offset = 0; offset <= 2; offset++) {
      const checkDate = getLocalDateString(addDays(dateObj, offset), parentTimeZone);
      const slots = await this.getAvailableSlots(checkDate, parentTimeZone);
      for (const slot of slots) {
        alternatives.push(slot);
        if (alternatives.length >= limit) return alternatives;
      }
    }

    return alternatives;
  }

  /**
   * Concurrency-safe atomic booking creation with fair mentor assignment and 2-classes daily capacity rule.
   */
  async createBooking(input: CreateBookingInput): Promise<FormattedBookingResponse> {
    return await bookingLock.acquire(async () => {
      if (!isValidTimeZone(input.parentTimeZone)) {
        throw new Error(`Invalid IANA parent time zone: ${input.parentTimeZone}`);
      }

      const canonicalParentTz = normalizeTimeZone(input.parentTimeZone);
      const startUtc = parseRequestedStart(input.startAt, canonicalParentTz);
      const endUtc = addMinutes(startUtc, CLASS_DURATION_MINUTES);

      // 1. Idempotency Check: if idempotency key was previously processed, return existing booking
      if (input.idempotencyKey) {
        const existing = await bookingRepository.findByIdempotencyKey(input.idempotencyKey);
        if (existing) {
          return this.formatBookingResponse(existing);
        }
      }

      // 2. Pre-check Trial Eligibility (1 confirmed trial per student/parent by default)
      const priorTrials = await bookingRepository.countConfirmedTrialsForParentOrStudent(
        input.parentEmail,
        (input as any).studentName
      );
      if (priorTrials >= env.MAX_TRIALS_PER_STUDENT) {
        throw new TrialEligibilityError(
          'This student has already used their trial class. Please contact our team to explore available courses.'
        );
      }

    // 3. Identify candidate mentors who are generally working during this slot
    const allMentors = await mentorRepository.findAllActive();
    const candidateMentors = allMentors.filter((m) =>
      isWithinMentorWorkingHours(startUtc, endUtc, m)
    );

    if (candidateMentors.length === 0) {
      const parentDate = getLocalDateString(startUtc, canonicalParentTz);
      const alternatives = await this.findAlternativeSlots(parentDate, canonicalParentTz);
      throw new SlotUnavailableError(
        'No mentors are scheduled to work at the requested time.',
        alternatives
      );
    }

    // 4. Execute in transaction (or in-memory transactional logic if DB is offline)
    const candidateIds = candidateMentors.map((m) => m.id);

    const executeAssignmentLogic = async (
      tx?: Prisma.TransactionClient
    ): Promise<BookingWithRelations | null> => {
      // In-transaction idempotency verification
      if (input.idempotencyKey) {
        const existingTx = await bookingRepository.findByIdempotencyKey(input.idempotencyKey, tx);
        if (existingTx) {
          return existingTx;
        }
      }

      // In-transaction trial eligibility check to prevent concurrent duplicate trial bookings
      const inTxTrials = await bookingRepository.countConfirmedTrialsForParentOrStudent(
        input.parentEmail,
        (input as any).studentName,
        tx
      );
      if (inTxTrials >= env.MAX_TRIALS_PER_STUDENT) {
        throw new TrialEligibilityError(
          'This student has already used their trial class. Please contact our team to explore available courses.'
        );
      }

      // Explicitly lock candidate mentor records in deterministic ID order
      if (tx) {
        await mentorRepository.lockMentorsByIds(tx, candidateIds);
      }

      // Evaluate eligibility and current daily load inside the transaction
      const mentorLoads: Array<{ mentor: Mentor; dailyCount: number }> = [];

      for (const mentor of candidateMentors) {
        // Double-check overlapping bookings inside transaction
        const overlaps = await bookingRepository.findOverlappingConfirmedBookings(
          mentor.id,
          startUtc,
          endUtc,
          tx
        );

        if (overlaps.length > 0) {
          continue; // Mentor has a conflicting booking
        }

        // Calculate mentor's local calendar day window
        const mentorLocalDate = getLocalDateString(startUtc, mentor.timeZone);
        const { startUtc: mentorDayStart, endUtc: mentorDayEnd } = getLocalDayUtcRange(
          mentorLocalDate,
          mentor.timeZone
        );

        const dailyCount = await bookingRepository.countMentorConfirmedInUtcRange(
          mentor.id,
          mentorDayStart,
          mentorDayEnd,
          tx
        );

        if (dailyCount < 2) {
          mentorLoads.push({ mentor, dailyCount });
        }
      }

      if (mentorLoads.length === 0) {
        return null; // All candidates are busy or at capacity
      }

      // Fair Assignment Algorithm:
      // Sort primarily by fewest classes assigned on that mentor-local day (ascending),
      // tie-break deterministically by mentor ID (ascending).
      mentorLoads.sort((a, b) => {
        if (a.dailyCount !== b.dailyCount) {
          return a.dailyCount - b.dailyCount;
        }
        return a.mentor.id.localeCompare(b.mentor.id);
      });

      const selectedMentor = mentorLoads[0]!.mentor;

      // Find or create parent
      const parent = await parentRepository.findOrCreate(
        {
          name: input.parentName,
          email: input.parentEmail,
          phone: input.parentPhone,
          timeZone: canonicalParentTz,
        },
        tx
      );

      // Generate configurable demo class meeting URL
      const baseUrl = env.DEMO_CLASS_BASE_URL.replace(/\/+$/, '');
      const demoClassUrl = `${baseUrl}/${Math.random().toString(36).substring(2, 9)}`;

      // Create confirmed booking
      const newBooking = await bookingRepository.create(
        {
          parentId: parent.id,
          mentorId: selectedMentor.id,
          course: input.course || 'Coding & STEM Trial',
          startAt: startUtc,
          endAt: endUtc,
          parentTimeZone: canonicalParentTz,
          mentorTimeZone: normalizeTimeZone(selectedMentor.timeZone),
          demoClassUrl,
          idempotencyKey: input.idempotencyKey || null,
        },
        tx
      );

      return newBooking;
    };

    let bookingResult: BookingWithRelations | null = null;
    try {
      bookingResult = await prisma.$transaction(async (tx) => {
        return executeAssignmentLogic(tx);
      });
    } catch {
      // Fallback for in-memory execution when database is offline
      bookingResult = await executeAssignmentLogic();
    }

    if (!bookingResult) {
      const parentDate = getLocalDateString(startUtc, input.parentTimeZone);
      const alternatives = await this.findAlternativeSlots(parentDate, input.parentTimeZone);
      throw new SlotUnavailableError(
        'All eligible mentors are fully booked or at maximum daily capacity for this time slot.',
        alternatives
      );
    }

    // Queue durable notifications (immediate confirmations + 30-min reminders)
    await notificationService.queueBookingNotifications(bookingResult);

    // Trigger immediate asynchronous outbox dispatch
    notificationService.processOutbox().catch((err) => {
      console.error('Failed in initial outbox dispatch:', err);
    });

    return this.formatBookingResponse(bookingResult);
    });
  }

  async getBookingById(id: string): Promise<FormattedBookingResponse> {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new Error(`Booking not found with ID: ${id}`);
    }
    return this.formatBookingResponse(booking);
  }

  private formatBookingResponse(booking: BookingWithRelations): FormattedBookingResponse {
    return {
      id: booking.id,
      status: booking.status,
      course: booking.course || 'Coding & STEM Trial',
      demoClassUrl: booking.demoClassUrl,
      startAtUtc: booking.startAt.toISOString(),
      endAtUtc: booking.endAt.toISOString(),
      durationMinutes: CLASS_DURATION_MINUTES,
      parent: {
        id: booking.parent.id,
        name: booking.parent.name,
        email: booking.parent.email,
        phone: booking.parent.phone,
        timeZone: booking.parentTimeZone,
        localStartTime: formatLocalTime(booking.startAt, booking.parentTimeZone, 'yyyy-MM-dd HH:mm:ss (zzz)'),
        localEndTime: formatLocalTime(booking.endAt, booking.parentTimeZone, 'HH:mm:ss (zzz)'),
      },
      mentor: {
        id: booking.mentor.id,
        name: booking.mentor.name,
        email: booking.mentor.email,
        timeZone: booking.mentorTimeZone,
        localStartTime: formatLocalTime(booking.startAt, booking.mentorTimeZone, 'yyyy-MM-dd HH:mm:ss (zzz)'),
        localEndTime: formatLocalTime(booking.endAt, booking.mentorTimeZone, 'HH:mm:ss (zzz)'),
      },
      createdAt: booking.createdAt.toISOString(),
    };
  }

  async checkTrialEligibility(
    parentEmail: string,
    studentName?: string
  ): Promise<{ eligible: boolean; remainingTrials: number; maxAllowed: number; message?: string }> {
    const confirmedCount = await bookingRepository.countConfirmedTrialsForParentOrStudent(
      parentEmail,
      studentName
    );
    const maxAllowed = env.MAX_TRIALS_PER_STUDENT;
    const eligible = confirmedCount < maxAllowed;
    return {
      eligible,
      remainingTrials: Math.max(0, maxAllowed - confirmedCount),
      maxAllowed,
      message: eligible
        ? undefined
        : 'This student has already used their trial class. Please contact our team to explore available courses.',
    };
  }
}

export const bookingService = new BookingService();
