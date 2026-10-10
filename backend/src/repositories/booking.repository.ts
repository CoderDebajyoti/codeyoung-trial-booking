import { PrismaClient, Prisma } from '@prisma/client';
import { Booking, BookingStatus, Mentor, Parent, Course } from '../types/models.js';
import { prisma as defaultPrisma, isDbConnected, markDbConnected, markDbDisconnected, DatabaseConnectionError } from '../lib/prisma.js';
import { inMemoryStore } from '../lib/inMemoryStore.js';
import { doIntervalsOverlap } from '../lib/dateUtils.js';
import { isFallbackAllowed } from '../config/env.js';

export interface CreateBookingData {
  parentId: string;
  mentorId: string;
  courseId?: string | null;
  course?: string;
  studentName?: string | null;
  startAt: Date;
  endAt: Date;
  parentTimeZone: string;
  mentorTimeZone: string;
  demoClassUrl: string;
  idempotencyKey?: string | null;
}

export type BookingWithRelations = Booking & {
  mentor: Mentor;
  parent: Parent;
  courseRef?: Course | null;
};

export interface AdminBookingFilters {
  search?: string;
  status?: string;
  mentorId?: string;
  courseId?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'startAt' | 'createdAt' | 'parentName' | 'studentName' | 'course' | 'mentor' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}


export class BookingRepository {
  constructor(private db: PrismaClient = defaultPrisma) {}

  async findById(id: string): Promise<BookingWithRelations | null> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings.find((b) => b.id === id) || null;
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected. Cannot retrieve booking.');
    }
    try {
      const booking = await this.db.booking.findUnique({
        where: { id },
        include: {
          mentor: true,
          parent: true,
        },
      });
      markDbConnected();
      return booking;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings.find((b) => b.id === id) || null;
      }
      throw new DatabaseConnectionError('Failed to fetch booking from PostgreSQL database.');
    }
  }

  async findByIdempotencyKey(
    key: string,
    txDb?: Prisma.TransactionClient
  ): Promise<BookingWithRelations | null> {
    const client = txDb || this.db;
    if (!isDbConnected() && client === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings.find((b) => b.idempotencyKey === key) || null;
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }
    try {
      const booking = await client.booking.findUnique({
        where: { idempotencyKey: key },
        include: {
          mentor: true,
          parent: true,
        },
      });
      markDbConnected();
      return booking;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings.find((b) => b.idempotencyKey === key) || null;
      }
      throw new DatabaseConnectionError('Failed to verify idempotency key in PostgreSQL database.');
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
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings.filter(
          (b) =>
            b.mentorId === mentorId &&
            b.status === BookingStatus.CONFIRMED &&
            doIntervalsOverlap(b.startAt, b.endAt, startUtc, endUtc)
        );
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }
    try {
      const bookings = await client.booking.findMany({
        where: {
          mentorId,
          status: BookingStatus.CONFIRMED,
          startAt: { lt: endUtc },
          endAt: { gt: startUtc },
        },
      });
      markDbConnected();
      return bookings;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings.filter(
          (b) =>
            b.mentorId === mentorId &&
            b.status === BookingStatus.CONFIRMED &&
            doIntervalsOverlap(b.startAt, b.endAt, startUtc, endUtc)
        );
      }
      throw new DatabaseConnectionError('Failed to query overlapping bookings from PostgreSQL database.');
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
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings.filter(
          (b) =>
            b.mentorId === mentorId &&
            b.status === BookingStatus.CONFIRMED &&
            b.startAt >= startUtc &&
            b.startAt <= endUtc
        ).length;
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }
    try {
      const count = await client.booking.count({
        where: {
          mentorId,
          status: BookingStatus.CONFIRMED,
          startAt: {
            gte: startUtc,
            lte: endUtc,
          },
        },
      });
      markDbConnected();
      return count;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings.filter(
          (b) =>
            b.mentorId === mentorId &&
            b.status === BookingStatus.CONFIRMED &&
            b.startAt >= startUtc &&
            b.startAt <= endUtc
        ).length;
      }
      throw new DatabaseConnectionError('Failed to count mentor bookings in PostgreSQL database.');
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
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings
          .filter((b) => b.mentorId === mentorId && b.startAt >= startUtc && b.startAt <= endUtc)
          .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected. Cannot retrieve mentor schedule.');
    }
    try {
      const bookings = await this.db.booking.findMany({
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
      markDbConnected();
      return bookings;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings
          .filter((b) => b.mentorId === mentorId && b.startAt >= startUtc && b.startAt <= endUtc)
          .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
      }
      throw new DatabaseConnectionError('Failed to fetch mentor schedule from PostgreSQL database.');
    }
  }

  /**
   * Count confirmed trial bookings for a parent/student identity to enforce trial eligibility limits.
   */
  async countConfirmedTrialsForParentOrStudent(
    parentEmail: string,
    studentName?: string,
    txDb?: Prisma.TransactionClient
  ): Promise<number> {
    const client = txDb || this.db;
    const normalizedEmail = parentEmail.toLowerCase().trim();

    if (!isDbConnected() && client === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings.filter((b) => {
          const emailMatch = b.parent?.email?.toLowerCase().trim() === normalizedEmail;
          const statusMatch = b.status === BookingStatus.CONFIRMED;
          if (!emailMatch || !statusMatch) return false;
          const withStudent = b as { studentName?: string };
          if (studentName && withStudent.studentName) {
            return withStudent.studentName.toLowerCase().trim() === studentName.toLowerCase().trim();
          }
          return true;
        }).length;


      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }

    try {
      const count = await client.booking.count({
        where: {
          parent: {
            email: {
              equals: normalizedEmail,
            },
          },
          status: BookingStatus.CONFIRMED,
        },
      });
      markDbConnected();
      return count;
    } catch (error) {

      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.bookings.filter((b) => {
          const emailMatch = b.parent?.email?.toLowerCase().trim() === normalizedEmail;
          const statusMatch = b.status === BookingStatus.CONFIRMED;
          return emailMatch && statusMatch;
        }).length;
      }
      throw new DatabaseConnectionError('Failed to verify trial eligibility in PostgreSQL database.');
    }
  }

  async create(
    data: CreateBookingData,
    txDb?: Prisma.TransactionClient
  ): Promise<BookingWithRelations> {
    const client = txDb || this.db;
    if (!isDbConnected() && client === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.createBooking(data);
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected. Cannot create booking.');
    }
    try {
      const booking = await client.booking.create({
        data: {
          parentId: data.parentId,
          mentorId: data.mentorId,
          courseId: data.courseId || null,
          course: data.course || 'Coding & STEM Trial',
          studentName: data.studentName || null,
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
          courseRef: true,
        },
      });
      markDbConnected();
      return booking;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.createBooking(data);
      }
      throw new DatabaseConnectionError('Failed to save booking to PostgreSQL database.');
    }
  }

  async findAllAdmin(filters: AdminBookingFilters = {}): Promise<{ total: number; bookings: BookingWithRelations[] }> {
    const {
      search,
      status,
      mentorId,
      courseId,
      startDate,
      endDate,
      sortBy = 'startAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        let list = [...inMemoryStore.bookings];

        // Search filter
        if (search && search.trim().length > 0) {
          const q = search.toLowerCase().trim();
          list = list.filter((b) => {
            return (
              b.id.toLowerCase().includes(q) ||
              (b.parent?.name && b.parent.name.toLowerCase().includes(q)) ||
              (b.parent?.email && b.parent.email.toLowerCase().includes(q)) ||
              (b.studentName && b.studentName.toLowerCase().includes(q)) ||
              (b.course && b.course.toLowerCase().includes(q)) ||
              (b.mentor?.name && b.mentor.name.toLowerCase().includes(q))
            );
          });
        }

        // Status filter
        if (status && status !== 'ALL') {
          list = list.filter((b) => b.status === status);
        }

        // Mentor filter
        if (mentorId && mentorId !== 'ALL') {
          list = list.filter((b) => b.mentorId === mentorId);
        }

        // Course filter
        if (courseId && courseId !== 'ALL') {
          list = list.filter((b) => b.courseId === courseId || b.course === courseId);
        }

        // Date range
        if (startDate) {
          list = list.filter((b) => b.startAt >= startDate);
        }
        if (endDate) {
          list = list.filter((b) => b.startAt <= endDate);
        }

        // Sort
        list.sort((a, b) => {
          let valA: any = a.startAt.getTime();
          let valB: any = b.startAt.getTime();

          if (sortBy === 'createdAt') {
            valA = a.createdAt.getTime();
            valB = b.createdAt.getTime();
          } else if (sortBy === 'parentName') {
            valA = a.parent?.name || '';
            valB = b.parent?.name || '';
          } else if (sortBy === 'studentName') {
            valA = a.studentName || '';
            valB = b.studentName || '';
          } else if (sortBy === 'course') {
            valA = a.course || '';
            valB = b.course || '';
          } else if (sortBy === 'mentor') {
            valA = a.mentor?.name || '';
            valB = b.mentor?.name || '';
          } else if (sortBy === 'status') {
            valA = a.status || '';
            valB = b.status || '';
          }

          if (typeof valA === 'string') {
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        });

        const total = list.length;
        const skip = (page - 1) * limit;
        const paginated = list.slice(skip, skip + limit);
        return { total, bookings: paginated };
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }

    try {
      const where: Prisma.BookingWhereInput = {};

      if (status && status !== 'ALL') {
        where.status = status;
      }

      if (mentorId && mentorId !== 'ALL') {
        where.mentorId = mentorId;
      }

      if (courseId && courseId !== 'ALL') {
        where.OR = [
          { courseId: courseId },
          { course: { contains: courseId } },
        ];
      }

      if (startDate || endDate) {
        where.startAt = {};
        if (startDate) where.startAt.gte = startDate;
        if (endDate) where.startAt.lte = endDate;
      }

      if (search && search.trim().length > 0) {
        const q = search.trim();
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          {
            OR: [
              { id: { contains: q } },
              { studentName: { contains: q } },
              { course: { contains: q } },
              { parent: { name: { contains: q } } },
              { parent: { email: { contains: q } } },
              { mentor: { name: { contains: q } } },
            ],
          },
        ];
      }

      let orderBy: Prisma.BookingOrderByWithRelationInput = { startAt: sortOrder };
      if (sortBy === 'createdAt') orderBy = { createdAt: sortOrder };
      else if (sortBy === 'parentName') orderBy = { parent: { name: sortOrder } };
      else if (sortBy === 'mentor') orderBy = { mentor: { name: sortOrder } };
      else if (sortBy === 'course') orderBy = { course: sortOrder };
      else if (sortBy === 'status') orderBy = { status: sortOrder };
      else if (sortBy === 'studentName') orderBy = { studentName: sortOrder };

      const total = await this.db.booking.count({ where });
      const skip = (page - 1) * limit;
      const bookings = await this.db.booking.findMany({
        where,
        include: {
          mentor: true,
          parent: true,
          courseRef: true,
        },
        orderBy,
        skip,
        take: limit,
      });

      markDbConnected();
      return { total, bookings };
    } catch (error) {
      markDbDisconnected(error);
      throw new DatabaseConnectionError('Failed to fetch admin bookings from database.');
    }
  }
}

export const bookingRepository = new BookingRepository();

