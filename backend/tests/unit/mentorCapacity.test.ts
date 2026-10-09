import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingService } from '../../src/services/booking.service.js';
import { mentorRepository } from '../../src/repositories/mentor.repository.js';
import { parentRepository } from '../../src/repositories/parent.repository.js';
import { bookingRepository, BookingWithRelations, CreateBookingData } from '../../src/repositories/booking.repository.js';
import { prisma } from '../../src/lib/prisma.js';
import { Mentor, Parent, BookingStatus, Prisma } from '@prisma/client';

describe('Mentor Local Daily Capacity Rules (2 Classes/Day)', () => {
  let bookingService: BookingService;

  const mentorInIndia: Mentor = {
    id: 'mentor-india-1',
    name: 'Aarav Sharma',
    email: 'aarav@codeyoung.com',
    timeZone: 'Asia/Kolkata',
    isActive: true,
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 9,
    workEndHour: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockParent: Parent = {
    id: 'parent-1',
    name: 'Parent in NY',
    email: 'ny.parent@example.com',
    timeZone: 'America/New_York',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    bookingService = new BookingService();
    vi.restoreAllMocks();
  });

  it('allows 1st and 2nd booking on a mentor local calendar day, but rejects 3rd booking on same mentor local day', async () => {
    vi.spyOn(mentorRepository, 'findAllActive').mockResolvedValue([mentorInIndia]);
    vi.spyOn(mentorRepository, 'lockMentorsByIds').mockResolvedValue([mentorInIndia]);
    vi.spyOn(parentRepository, 'findOrCreate').mockResolvedValue(mockParent);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      const mockTx = {
        $queryRawUnsafe: vi.fn(),
      } as unknown as Prisma.TransactionClient;
      return callback(mockTx);
    });

    vi.spyOn(bookingRepository, 'findOverlappingConfirmedBookings').mockResolvedValue([]);

    // 1st booking: 0 existing bookings
    vi.spyOn(bookingRepository, 'countMentorConfirmedInUtcRange').mockResolvedValue(0);
    vi.spyOn(bookingRepository, 'create').mockImplementation(async (data: CreateBookingData) => {
      const booking: BookingWithRelations = {
        id: 'booking-1',
        parentId: data.parentId,
        mentorId: data.mentorId,
        startAt: data.startAt,
        endAt: data.endAt,
        parentTimeZone: data.parentTimeZone,
        mentorTimeZone: data.mentorTimeZone,
        status: BookingStatus.CONFIRMED,
        demoClassUrl: data.demoClassUrl,
        idempotencyKey: data.idempotencyKey ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: mockParent,
        mentor: mentorInIndia,
      };
      return booking;
    });

    const booking1 = await bookingService.createBooking({
      parentName: 'Parent 1',
      parentEmail: 'p1@example.com',
      parentTimeZone: 'Asia/Kolkata',
      startAt: '2026-10-12T04:30:00.000Z', // 10:00 IST
    });
    expect(booking1.id).toBe('booking-1');

    // 2nd booking: 1 existing booking
    vi.spyOn(bookingRepository, 'countMentorConfirmedInUtcRange').mockResolvedValue(1);
    const booking2 = await bookingService.createBooking({
      parentName: 'Parent 2',
      parentEmail: 'p2@example.com',
      parentTimeZone: 'Asia/Kolkata',
      startAt: '2026-10-12T06:00:00.000Z', // 11:30 IST
    });
    expect(booking2.id).toBe('booking-1');

    // 3rd booking: 2 existing bookings (at capacity!)
    vi.spyOn(bookingRepository, 'countMentorConfirmedInUtcRange').mockResolvedValue(2);
    await expect(
      bookingService.createBooking({
        parentName: 'Parent 3',
        parentEmail: 'p3@example.com',
        parentTimeZone: 'Asia/Kolkata',
        startAt: '2026-10-12T08:00:00.000Z', // 13:30 IST
      })
    ).rejects.toThrow(/fully booked or at maximum daily capacity/);
  });

  it('correctly calculates mentor-local calendar day when UTC and mentor local day differ', async () => {
    vi.spyOn(mentorRepository, 'findAllActive').mockResolvedValue([mentorInIndia]);
    vi.spyOn(mentorRepository, 'lockMentorsByIds').mockResolvedValue([mentorInIndia]);
    vi.spyOn(parentRepository, 'findOrCreate').mockResolvedValue(mockParent);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      const mockTx = {
        $queryRawUnsafe: vi.fn(),
      } as unknown as Prisma.TransactionClient;
      return callback(mockTx);
    });

    vi.spyOn(bookingRepository, 'findOverlappingConfirmedBookings').mockResolvedValue([]);

    let queriedRange: { start: Date; end: Date } | null = null;
    vi.spyOn(bookingRepository, 'countMentorConfirmedInUtcRange').mockImplementation(
      async (_mentorId, startUtc, endUtc) => {
        queriedRange = { start: startUtc, end: endUtc };
        return 0;
      }
    );

    vi.spyOn(bookingRepository, 'create').mockResolvedValue({
      id: 'b-boundary',
      parentId: 'parent-1',
      mentorId: mentorInIndia.id,
      startAt: new Date('2026-10-12T03:30:00.000Z'),
      endAt: new Date('2026-10-12T04:00:00.000Z'),
      parentTimeZone: 'America/New_York',
      mentorTimeZone: 'Asia/Kolkata',
      status: BookingStatus.CONFIRMED,
      demoClassUrl: 'https://meet.codeyoung.com/trial/demo',
      idempotencyKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      parent: mockParent,
      mentor: mentorInIndia,
    });

    // 2026-10-12 03:30 UTC is 09:00 IST on 2026-10-12
    await bookingService.createBooking({
      parentName: 'NY Parent',
      parentEmail: 'ny.parent@example.com',
      parentTimeZone: 'America/New_York',
      startAt: '2026-10-12T03:30:00.000Z',
    });

    expect(queriedRange).not.toBeNull();
    // Mentor local day for 2026-10-12 in Asia/Kolkata starts at 2026-10-11T18:30:00.000Z UTC
    expect(queriedRange!.start.toISOString()).toBe('2026-10-11T18:30:00.000Z');
    expect(queriedRange!.end.toISOString()).toBe('2026-10-12T18:29:59.999Z');
  });
});
