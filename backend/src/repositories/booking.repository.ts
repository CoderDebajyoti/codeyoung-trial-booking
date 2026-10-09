import { PrismaClient, Booking, BookingStatus, Prisma, Mentor, Parent } from '@prisma/client';
import { prisma as defaultPrisma, isDbConnected, markDbDisconnected } from '../lib/prisma.js';
import { inMemoryStore } from '../lib/inMemoryStore.js';
import { doIntervalsOverlap } from '../lib/dateUtils.js';

export interface CreateBookingData {
  parentId: string;
  mentorId: string;
  course?: string;
  startAt: Date;
  endAt: Date;
  parentTimeZone: string;
  mentorTimeZone: string;
  demoClassUrl: string;
  idempotencyKey?: string | null;
}

export type BookingWithRelations = Booking & { mentor: Mentor; parent: Parent };

export class BookingRepository {
  constructor(private db: PrismaClient = defaultPrisma) {}

  async findById(id: string): Promise<BookingWithRelations | null> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      return inMemoryStore.bookings.find((b) => b.id === id) || null;
    }
    try {
      return await this.db.booking.findUnique({
        where: { id },
        include: {
          mentor: true,
          parent: true,
        },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.bookings.find((b) => b.id === id) || null;
    }
  }

  async findByIdempotencyKey(
    key: string,
    txDb?: Prisma.TransactionClient
  ): Promise<BookingWithRelations | null> {
    const client = txDb || this.db;
    if (!isDbConnected() && client === defaultPrisma) {
      return inMemoryStore.bookings.find((b) => b.idempotencyKey === key) || null;
    }
    try {
      return await client.booking.findUnique({
        where: { idempotencyKey: key },
        include: {
          mentor: true,
          parent: true,
        },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.bookings.find((b) => b.idempotencyKey === key) || null;
    }
  }

  /**
   * Find confirmed bookings for a mentor that overlap with [startUtc, endUtc).
   * Overlap condition: startAt < endUtc AND endAt > startUtc
   */
  async findOverlappingConfirmedBookings(
    mentorId: string,
    startUtc: Date,
    endUtc: Date,
    txDb?: Prisma.TransactionClient
  ): Promise<Booking[]> {
    const client = txDb || this.db;
    if (!isDbConnected() && client === defaultPrisma) {
      return inMemoryStore.bookings.filter(
        (b) =>
          b.mentorId === mentorId &&
          b.status === BookingStatus.CONFIRMED &&
          doIntervalsOverlap(b.startAt, b.endAt, startUtc, endUtc)
      );
    }
    try {
      return await client.booking.findMany({
        where: {
          mentorId,
          status: BookingStatus.CONFIRMED,
          startAt: { lt: endUtc },
          endAt: { gt: startUtc },
        },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.bookings.filter(
        (b) =>
          b.mentorId === mentorId &&
          b.status === BookingStatus.CONFIRMED &&
          doIntervalsOverlap(b.startAt, b.endAt, startUtc, endUtc)
      );
    }
  }

  /**
   * Counts confirmed classes for a mentor within a specific UTC boundary (typically the mentor's local calendar day).
   */
  async countMentorConfirmedInUtcRange(
    mentorId: string,
    startUtc: Date,
    endUtc: Date,
    txDb?: Prisma.TransactionClient
  ): Promise<number> {
    const client = txDb || this.db;
    if (!isDbConnected() && client === defaultPrisma) {
      return inMemoryStore.bookings.filter(
        (b) =>
          b.mentorId === mentorId &&
          b.status === BookingStatus.CONFIRMED &&
          b.startAt >= startUtc &&
          b.startAt <= endUtc
      ).length;
    }
    try {
      return await client.booking.count({
        where: {
          mentorId,
          status: BookingStatus.CONFIRMED,
          startAt: {
            gte: startUtc,
            lte: endUtc,
          },
        },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.bookings.filter(
        (b) =>
          b.mentorId === mentorId &&
          b.status === BookingStatus.CONFIRMED &&
          b.startAt >= startUtc &&
          b.startAt <= endUtc
      ).length;
    }
  }

  /**
   * Get all bookings for a mentor in a UTC range (e.g. for daily schedule view)
   */
  async findMentorBookingsInUtcRange(
    mentorId: string,
    startUtc: Date,
    endUtc: Date
  ): Promise<(Booking & { parent: Parent })[]> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      return inMemoryStore.bookings
        .filter((b) => b.mentorId === mentorId && b.startAt >= startUtc && b.startAt <= endUtc)
        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    }
    try {
      return await this.db.booking.findMany({
        where: {
          mentorId,
          startAt: {
            gte: startUtc,
            lte: endUtc,
          },
        },
        include: {
          parent: true,
        },
        orderBy: {
          startAt: 'asc',
        },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.bookings
        .filter((b) => b.mentorId === mentorId && b.startAt >= startUtc && b.startAt <= endUtc)
        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    }
  }

  async create(
    data: CreateBookingData,
    txDb?: Prisma.TransactionClient
  ): Promise<BookingWithRelations> {
    const client = txDb || this.db;
    if (!isDbConnected() && client === defaultPrisma) {
      return inMemoryStore.createBooking(data);
    }
    try {
      return await client.booking.create({
        data: {
          parentId: data.parentId,
          mentorId: data.mentorId,
          course: data.course || 'Coding & STEM Trial',
          startAt: data.startAt,
          endAt: data.endAt,
          parentTimeZone: data.parentTimeZone,
          mentorTimeZone: data.mentorTimeZone,
          demoClassUrl: data.demoClassUrl,
          idempotencyKey: data.idempotencyKey,
          status: BookingStatus.CONFIRMED,
        },
        include: {
          mentor: true,
          parent: true,
        },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.createBooking(data);
    }
  }
}

export const bookingRepository = new BookingRepository();
