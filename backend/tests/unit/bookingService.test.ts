import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingService, SlotUnavailableError } from '../../src/services/booking.service.js';
import { mentorRepository } from '../../src/repositories/mentor.repository.js';
import { parentRepository } from '../../src/repositories/parent.repository.js';
import { bookingRepository, BookingWithRelations, CreateBookingData } from '../../src/repositories/booking.repository.js';
import { prisma } from '../../src/lib/prisma.js';
import { Mentor, Parent, BookingStatus, Prisma } from '@prisma/client';

describe('BookingService Business Rules', () => {
  let bookingService: BookingService;

  const mockMentors: Mentor[] = [
    {
      id: 'mentor-1-kolkata',
      name: 'Aarav Sharma',
      email: 'aarav@codeyoung.com',
      timeZone: 'Asia/Kolkata',
      isActive: true,
      workDays: [1, 2, 3, 4, 5],
      workStartHour: 9,
      workEndHour: 17,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'mentor-2-kolkata',
      name: 'Priya Patel',
      email: 'priya@codeyoung.com',
      timeZone: 'Asia/Kolkata',
      isActive: true,
      workDays: [1, 2, 3, 4, 5],
      workStartHour: 9,
      workEndHour: 17,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockParent: Parent = {
    id: 'parent-1',
    name: 'John Doe',
    email: 'john@example.com',
    timeZone: 'Asia/Kolkata',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    bookingService = new BookingService();
    vi.restoreAllMocks();
  });

  it('rejects booking with invalid IANA parent timezone', async () => {
    await expect(
      bookingService.createBooking({
        parentName: 'John Doe',
        parentEmail: 'john@example.com',
        parentTimeZone: 'Invalid/Zone',
        startAt: '2026-10-12T10:00:00.000Z',
      })
    ).rejects.toThrow(/Invalid IANA parent time zone/);
  });

  it('assigns eligible mentor fairly: prefers mentor with fewest classes on mentor-local day', async () => {
    vi.spyOn(mentorRepository, 'findAllActive').mockResolvedValue(mockMentors);
    vi.spyOn(mentorRepository, 'lockMentorsByIds').mockResolvedValue(mockMentors);
    vi.spyOn(parentRepository, 'findOrCreate').mockResolvedValue(mockParent);

    // Mock transaction execution
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      const mockTx = {
        $queryRawUnsafe: vi.fn(),
      } as unknown as Prisma.TransactionClient;
      return callback(mockTx);
    });

    // Mock no overlapping bookings for either mentor
    vi.spyOn(bookingRepository, 'findOverlappingConfirmedBookings').mockResolvedValue([]);

    // Mock mentor-1 already having 1 class, mentor-2 having 0 classes
    vi.spyOn(bookingRepository, 'countMentorConfirmedInUtcRange').mockImplementation(async (mentorId) => {
      if (mentorId === 'mentor-1-kolkata') return 1;
      return 0; // mentor-2 has 0 classes
    });

    let createdWithMentorId = '';
    vi.spyOn(bookingRepository, 'create').mockImplementation(async (data: CreateBookingData) => {
      createdWithMentorId = data.mentorId;
      const mentor = mockMentors.find((m) => m.id === data.mentorId)!;
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
        mentor,
      };
      return booking;
    });

    // 2026-10-12 is Monday. 05:00 UTC = 10:30 IST (within 9-17 IST)
    const result = await bookingService.createBooking({
      parentName: 'John Doe',
      parentEmail: 'john@example.com',
      parentTimeZone: 'Asia/Kolkata',
      startAt: '2026-10-12T05:00:00.000Z',
    });

    expect(createdWithMentorId).toBe('mentor-2-kolkata'); // Fairly picked mentor-2 (0 classes vs 1)
    expect(result.mentor.id).toBe('mentor-2-kolkata');
    expect(result.durationMinutes).toBe(30);
  });

  it('rejects booking and offers alternatives when all mentors have reached their 2-class daily limit', async () => {
    vi.spyOn(mentorRepository, 'findAllActive').mockResolvedValue(mockMentors);
    vi.spyOn(mentorRepository, 'lockMentorsByIds').mockResolvedValue(mockMentors);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      const mockTx = {
        $queryRawUnsafe: vi.fn(),
      } as unknown as Prisma.TransactionClient;
      return callback(mockTx);
    });

    vi.spyOn(bookingRepository, 'findOverlappingConfirmedBookings').mockResolvedValue([]);

    // Both mentors have 2 classes already (at daily max capacity)
    vi.spyOn(bookingRepository, 'countMentorConfirmedInUtcRange').mockResolvedValue(2);

    await expect(
      bookingService.createBooking({
        parentName: 'John Doe',
        parentEmail: 'john@example.com',
        parentTimeZone: 'Asia/Kolkata',
        startAt: '2026-10-12T05:00:00.000Z',
      })
    ).rejects.toThrow(SlotUnavailableError);
  });

  it('returns existing booking when matching idempotencyKey is submitted', async () => {
    const existingBooking: BookingWithRelations = {
      id: 'existing-booking-id',
      parentId: 'parent-1',
      mentorId: 'mentor-1-kolkata',
      startAt: new Date('2026-10-12T05:00:00.000Z'),
      endAt: new Date('2026-10-12T05:30:00.000Z'),
      parentTimeZone: 'Asia/Kolkata',
      mentorTimeZone: 'Asia/Kolkata',
      status: BookingStatus.CONFIRMED,
      demoClassUrl: 'https://meet.codeyoung.com/trial/test1234',
      idempotencyKey: 'idem-key-12345',
      createdAt: new Date(),
      updatedAt: new Date(),
      parent: mockParent,
      mentor: mockMentors[0]!,
    };

    vi.spyOn(bookingRepository, 'findByIdempotencyKey').mockResolvedValue(existingBooking);

    const result = await bookingService.createBooking({
      parentName: 'John Doe',
      parentEmail: 'john@example.com',
      parentTimeZone: 'Asia/Kolkata',
      startAt: '2026-10-12T05:00:00.000Z',
      idempotencyKey: 'idem-key-12345',
    });

    expect(result.id).toBe('existing-booking-id');
    expect(result.demoClassUrl).toBe('https://meet.codeyoung.com/trial/test1234');
  });
});
