import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { mentorRepository } from '../../src/repositories/mentor.repository.js';
import { bookingRepository, CreateBookingData, BookingWithRelations } from '../../src/repositories/booking.repository.js';
import { parentRepository } from '../../src/repositories/parent.repository.js';
import { prisma } from '../../src/lib/prisma.js';
import { Mentor, Parent, BookingStatus } from '../../src/types/models.js';
import { Prisma } from '@prisma/client';

describe('Concurrency & Race-Condition Protection Tests', () => {
  const app = createApp();

  const singleMentor: Mentor = {
    id: 'mentor-only-1',
    name: 'Solo Mentor',
    email: 'solo@codeyoung.com',
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
    name: 'Parent User',
    email: 'parent@example.com',
    timeZone: 'Asia/Kolkata',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prevents concurrent overbooking when multiple parents attempt to reserve the same slot simultaneously', async () => {
    vi.spyOn(mentorRepository, 'findAllActive').mockResolvedValue([singleMentor]);
    vi.spyOn(mentorRepository, 'lockMentorsByIds').mockResolvedValue([singleMentor]);
    vi.spyOn(parentRepository, 'findOrCreate').mockResolvedValue(mockParent);

    // Mock database state tracking
    const existingBookings: BookingWithRelations[] = [];

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      const mockTx = {
        $queryRawUnsafe: vi.fn(),
      } as unknown as Prisma.TransactionClient;
      return callback(mockTx);
    });

    vi.spyOn(bookingRepository, 'findOverlappingConfirmedBookings').mockImplementation(async () => {
      return existingBookings.filter((b) => b.status === BookingStatus.CONFIRMED);
    });

    vi.spyOn(bookingRepository, 'countMentorConfirmedInUtcRange').mockImplementation(async () => {
      return existingBookings.filter((b) => b.status === BookingStatus.CONFIRMED).length;
    });

    vi.spyOn(bookingRepository, 'create').mockImplementation(async (data: CreateBookingData) => {
      const newBooking: BookingWithRelations = {
        id: `booking-${existingBookings.length + 1}`,
        parentId: data.parentId,
        mentorId: data.mentorId,
        course: data.course || 'Coding & STEM Trial',
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
        mentor: singleMentor,
      };
      existingBookings.push(newBooking);
      return newBooking;
    });

    // 1st request should succeed
    const req1 = await request(app).post('/api/bookings').send({
      parentName: 'Parent One',
      parentEmail: 'p1@example.com',
      parentTimeZone: 'Asia/Kolkata',
      startAt: '2026-10-12T04:30:00.000Z',
      idempotencyKey: 'idem-concurrent-1',
      verificationToken: 'test-verified-token',
    });

    expect(req1.status).toBe(201);
    expect(req1.body.status).toBe('success');

    // 2nd request for the SAME slot should fail with 409 Conflict because mentor is now busy
    const req2 = await request(app).post('/api/bookings').send({
      parentName: 'Parent Two',
      parentEmail: 'p2@example.com',
      parentTimeZone: 'Asia/Kolkata',
      startAt: '2026-10-12T04:30:00.000Z',
      idempotencyKey: 'idem-concurrent-2',
      verificationToken: 'test-verified-token',
    });

    expect(req2.status).toBe(409);
    expect(req2.body.code).toBe('SLOT_UNAVAILABLE');
    expect(req2.body.message).toContain('fully booked');
  });
});
