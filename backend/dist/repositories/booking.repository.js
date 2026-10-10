"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRepository = exports.BookingRepository = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = require("../lib/prisma.js");
const inMemoryStore_js_1 = require("../lib/inMemoryStore.js");
const dateUtils_js_1 = require("../lib/dateUtils.js");
class BookingRepository {
    db;
    constructor(db = prisma_js_1.prisma) {
        this.db = db;
    }
    async findById(id) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.bookings.find((b) => b.id === id) || null;
        }
        try {
            return await this.db.booking.findUnique({
                where: { id },
                include: {
                    mentor: true,
                    parent: true,
                },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.bookings.find((b) => b.id === id) || null;
        }
    }
    async findByIdempotencyKey(key, txDb) {
        const client = txDb || this.db;
        if (!(0, prisma_js_1.isDbConnected)() && client === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.bookings.find((b) => b.idempotencyKey === key) || null;
        }
        try {
            return await client.booking.findUnique({
                where: { idempotencyKey: key },
                include: {
                    mentor: true,
                    parent: true,
                },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.bookings.find((b) => b.idempotencyKey === key) || null;
        }
    }
    /**
     * Find confirmed bookings for a mentor that overlap with [startUtc, endUtc).
     * Overlap condition: startAt < endUtc AND endAt > startUtc
     */
    async findOverlappingConfirmedBookings(mentorId, startUtc, endUtc, txDb) {
        const client = txDb || this.db;
        if (!(0, prisma_js_1.isDbConnected)() && client === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.bookings.filter((b) => b.mentorId === mentorId &&
                b.status === client_1.BookingStatus.CONFIRMED &&
                (0, dateUtils_js_1.doIntervalsOverlap)(b.startAt, b.endAt, startUtc, endUtc));
        }
        try {
            return await client.booking.findMany({
                where: {
                    mentorId,
                    status: client_1.BookingStatus.CONFIRMED,
                    startAt: { lt: endUtc },
                    endAt: { gt: startUtc },
                },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.bookings.filter((b) => b.mentorId === mentorId &&
                b.status === client_1.BookingStatus.CONFIRMED &&
                (0, dateUtils_js_1.doIntervalsOverlap)(b.startAt, b.endAt, startUtc, endUtc));
        }
    }
    /**
     * Counts confirmed classes for a mentor within a specific UTC boundary (typically the mentor's local calendar day).
     */
    async countMentorConfirmedInUtcRange(mentorId, startUtc, endUtc, txDb) {
        const client = txDb || this.db;
        if (!(0, prisma_js_1.isDbConnected)() && client === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.bookings.filter((b) => b.mentorId === mentorId &&
                b.status === client_1.BookingStatus.CONFIRMED &&
                b.startAt >= startUtc &&
                b.startAt <= endUtc).length;
        }
        try {
            return await client.booking.count({
                where: {
                    mentorId,
                    status: client_1.BookingStatus.CONFIRMED,
                    startAt: {
                        gte: startUtc,
                        lte: endUtc,
                    },
                },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.bookings.filter((b) => b.mentorId === mentorId &&
                b.status === client_1.BookingStatus.CONFIRMED &&
                b.startAt >= startUtc &&
                b.startAt <= endUtc).length;
        }
    }
    /**
     * Get all bookings for a mentor in a UTC range (e.g. for daily schedule view)
     */
    async findMentorBookingsInUtcRange(mentorId, startUtc, endUtc) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.bookings
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
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.bookings
                .filter((b) => b.mentorId === mentorId && b.startAt >= startUtc && b.startAt <= endUtc)
                .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
        }
    }
    /**
     * Count confirmed trial bookings for a parent/student identity to enforce trial eligibility limits.
     */
    async countConfirmedTrialsForParentOrStudent(parentEmail, studentName, txDb) {
        const client = txDb || this.db;
        const normalizedEmail = parentEmail.toLowerCase().trim();
        if (!(0, prisma_js_1.isDbConnected)() && client === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.bookings.filter((b) => {
                const emailMatch = b.parent?.email?.toLowerCase().trim() === normalizedEmail;
                const statusMatch = b.status === client_1.BookingStatus.CONFIRMED;
                if (!emailMatch || !statusMatch)
                    return false;
                if (studentName && b.studentName) {
                    return b.studentName.toLowerCase().trim() === studentName.toLowerCase().trim();
                }
                return true;
            }).length;
        }
        try {
            return await client.booking.count({
                where: {
                    parent: {
                        email: {
                            equals: normalizedEmail,
                            mode: 'insensitive',
                        },
                    },
                    status: client_1.BookingStatus.CONFIRMED,
                },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.bookings.filter((b) => {
                const emailMatch = b.parent?.email?.toLowerCase().trim() === normalizedEmail;
                const statusMatch = b.status === client_1.BookingStatus.CONFIRMED;
                return emailMatch && statusMatch;
            }).length;
        }
    }
    async create(data, txDb) {
        const client = txDb || this.db;
        if (!(0, prisma_js_1.isDbConnected)() && client === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.createBooking(data);
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
                    status: client_1.BookingStatus.CONFIRMED,
                },
                include: {
                    mentor: true,
                    parent: true,
                },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.createBooking(data);
        }
    }
}
exports.BookingRepository = BookingRepository;
exports.bookingRepository = new BookingRepository();
