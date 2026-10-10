"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = exports.NotificationRepository = void 0;
const models_js_1 = require("../types/models.js");
const prisma_js_1 = require("../lib/prisma.js");
const inMemoryStore_js_1 = require("../lib/inMemoryStore.js");
const env_js_1 = require("../config/env.js");
class NotificationRepository {
    db;
    constructor(db = prisma_js_1.prisma) {
        this.db = db;
    }
    async create(data, txDb) {
        const client = txDb || this.db;
        if (!(0, prisma_js_1.isDbConnected)() && client === prisma_js_1.prisma) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.createNotification(data);
            }
            throw new prisma_js_1.DatabaseConnectionError('Persistent database storage is disconnected. Cannot save notification.');
        }
        try {
            const notif = await client.notification.upsert({
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
                    status: models_js_1.NotificationStatus.PENDING,
                },
                update: {
                    subject: data.subject,
                    content: data.content,
                    htmlContent: data.htmlContent || null,
                    scheduledFor: data.scheduledFor || new Date(),
                },
            });
            (0, prisma_js_1.markDbConnected)();
            return notif;
        }
        catch (error) {
            (0, prisma_js_1.markDbDisconnected)(error);
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.createNotification(data);
            }
            throw new prisma_js_1.DatabaseConnectionError('Failed to save notification to PostgreSQL database.');
        }
    }
    async findPendingDue(now = new Date(), limit = 20) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.getPendingNotifications(now).slice(0, limit);
            }
            throw new prisma_js_1.DatabaseConnectionError('Persistent database storage is disconnected.');
        }
        try {
            const pending = await this.db.notification.findMany({
                where: {
                    status: models_js_1.NotificationStatus.PENDING,
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
            (0, prisma_js_1.markDbConnected)();
            return pending;
        }
        catch (error) {
            (0, prisma_js_1.markDbDisconnected)(error);
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.getPendingNotifications(now).slice(0, limit);
            }
            throw new prisma_js_1.DatabaseConnectionError('Failed to fetch pending notifications from PostgreSQL database.');
        }
    }
    async update(id, data) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.updateNotification(id, data);
            }
            throw new prisma_js_1.DatabaseConnectionError('Persistent database storage is disconnected.');
        }
        try {
            const updated = await this.db.notification.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
            (0, prisma_js_1.markDbConnected)();
            return updated;
        }
        catch (error) {
            (0, prisma_js_1.markDbDisconnected)(error);
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.updateNotification(id, data);
            }
            throw new prisma_js_1.DatabaseConnectionError('Failed to update notification in PostgreSQL database.');
        }
    }
    async findByBookingId(bookingId) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.notifications.filter((n) => n.bookingId === bookingId);
            }
            throw new prisma_js_1.DatabaseConnectionError('Persistent database storage is disconnected.');
        }
        try {
            const notifications = await this.db.notification.findMany({
                where: { bookingId },
                orderBy: { createdAt: 'asc' },
            });
            (0, prisma_js_1.markDbConnected)();
            return notifications;
        }
        catch (error) {
            (0, prisma_js_1.markDbDisconnected)(error);
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.notifications.filter((n) => n.bookingId === bookingId);
            }
            throw new prisma_js_1.DatabaseConnectionError('Failed to fetch notifications by booking ID from PostgreSQL database.');
        }
    }
    async findRecent(limit = 50) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                return [...inMemoryStore_js_1.inMemoryStore.notifications]
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .slice(0, limit);
            }
            throw new prisma_js_1.DatabaseConnectionError('Persistent database storage is disconnected.');
        }
        try {
            const notifications = await this.db.notification.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
            (0, prisma_js_1.markDbConnected)();
            return notifications;
        }
        catch (error) {
            (0, prisma_js_1.markDbDisconnected)(error);
            if ((0, env_js_1.isFallbackAllowed)()) {
                return [...inMemoryStore_js_1.inMemoryStore.notifications]
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .slice(0, limit);
            }
            throw new prisma_js_1.DatabaseConnectionError('Failed to fetch recent notifications from PostgreSQL database.');
        }
    }
    async cancelPendingForBooking(bookingId) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                inMemoryStore_js_1.inMemoryStore.notifications
                    .filter((n) => n.bookingId === bookingId && n.status === models_js_1.NotificationStatus.PENDING)
                    .forEach((n) => {
                    n.status = models_js_1.NotificationStatus.FAILED;
                    n.lastError = 'Cancelled: Booking was cancelled or rescheduled';
                });
                return;
            }
            throw new prisma_js_1.DatabaseConnectionError('Persistent database storage is disconnected.');
        }
        try {
            await this.db.notification.updateMany({
                where: {
                    bookingId,
                    status: models_js_1.NotificationStatus.PENDING,
                },
                data: {
                    status: models_js_1.NotificationStatus.FAILED,
                    lastError: 'Cancelled: Booking was cancelled or rescheduled',
                },
            });
            (0, prisma_js_1.markDbConnected)();
        }
        catch (error) {
            (0, prisma_js_1.markDbDisconnected)(error);
            if ((0, env_js_1.isFallbackAllowed)()) {
                inMemoryStore_js_1.inMemoryStore.notifications
                    .filter((n) => n.bookingId === bookingId && n.status === models_js_1.NotificationStatus.PENDING)
                    .forEach((n) => {
                    n.status = models_js_1.NotificationStatus.FAILED;
                    n.lastError = 'Cancelled: Booking was cancelled or rescheduled';
                });
                return;
            }
            throw new prisma_js_1.DatabaseConnectionError('Failed to cancel notifications in PostgreSQL database.');
        }
    }
}
exports.NotificationRepository = NotificationRepository;
exports.notificationRepository = new NotificationRepository();
