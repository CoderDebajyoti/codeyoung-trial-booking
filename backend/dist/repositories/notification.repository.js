"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = exports.NotificationRepository = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = require("../lib/prisma.js");
const inMemoryStore_js_1 = require("../lib/inMemoryStore.js");
class NotificationRepository {
    db;
    constructor(db = prisma_js_1.prisma) {
        this.db = db;
    }
    async create(data, txDb) {
        const client = txDb || this.db;
        if (!(0, prisma_js_1.isDbConnected)() && client === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.createNotification(data);
        }
        try {
            return await client.notification.upsert({
                where: {
                    bookingId_type: {
                        bookingId: data.bookingId,
                        type: data.type,
                    },
                },
                create: {
                    bookingId: data.bookingId,
                    type: data.type,
                    recipient: data.recipient,
                    recipientRole: data.recipientRole,
                    subject: data.subject,
                    content: data.content,
                    htmlContent: data.htmlContent || null,
                    scheduledFor: data.scheduledFor || new Date(),
                    status: client_1.NotificationStatus.PENDING,
                },
                update: {
                    // If already exists and still pending, update content/schedule
                    subject: data.subject,
                    content: data.content,
                    htmlContent: data.htmlContent || null,
                    scheduledFor: data.scheduledFor || new Date(),
                },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.createNotification(data);
        }
    }
    async findPendingDue(now = new Date(), limit = 20) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.getPendingNotifications(now).slice(0, limit);
        }
        try {
            return await this.db.notification.findMany({
                where: {
                    status: client_1.NotificationStatus.PENDING,
                    scheduledFor: {
                        lte: now,
                    },
                    attemptCount: {
                        lt: 3,
                    },
                },
                orderBy: {
                    scheduledFor: 'asc',
                },
                take: limit,
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.getPendingNotifications(now).slice(0, limit);
        }
    }
    async update(id, data) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.updateNotification(id, data);
        }
        try {
            return await this.db.notification.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.updateNotification(id, data);
        }
    }
    async findByBookingId(bookingId) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.notifications.filter((n) => n.bookingId === bookingId);
        }
        try {
            return await this.db.notification.findMany({
                where: { bookingId },
                orderBy: { createdAt: 'asc' },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.notifications.filter((n) => n.bookingId === bookingId);
        }
    }
    async findRecent(limit = 50) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            return [...inMemoryStore_js_1.inMemoryStore.notifications]
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, limit);
        }
        try {
            return await this.db.notification.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return [...inMemoryStore_js_1.inMemoryStore.notifications]
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, limit);
        }
    }
    async cancelPendingForBooking(bookingId) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            inMemoryStore_js_1.inMemoryStore.notifications
                .filter((n) => n.bookingId === bookingId && n.status === client_1.NotificationStatus.PENDING)
                .forEach((n) => {
                n.status = client_1.NotificationStatus.FAILED;
                n.lastError = 'Cancelled: Booking was cancelled or rescheduled';
            });
            return;
        }
        try {
            await this.db.notification.updateMany({
                where: {
                    bookingId,
                    status: client_1.NotificationStatus.PENDING,
                },
                data: {
                    status: client_1.NotificationStatus.FAILED,
                    lastError: 'Cancelled: Booking was cancelled or rescheduled',
                },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            inMemoryStore_js_1.inMemoryStore.notifications
                .filter((n) => n.bookingId === bookingId && n.status === client_1.NotificationStatus.PENDING)
                .forEach((n) => {
                n.status = client_1.NotificationStatus.FAILED;
                n.lastError = 'Cancelled: Booking was cancelled or rescheduled';
            });
        }
    }
}
exports.NotificationRepository = NotificationRepository;
exports.notificationRepository = new NotificationRepository();
