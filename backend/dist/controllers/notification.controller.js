"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_repository_js_1 = require("../repositories/notification.repository.js");
const notification_service_js_1 = require("../services/notification.service.js");
const email_service_js_1 = require("../services/email.service.js");
class NotificationController {
    async getRecentNotifications(req, res) {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const notifications = await notification_repository_js_1.notificationRepository.findRecent(limit);
        const sentEmails = email_service_js_1.emailService.getSentEmails();
        res.status(200).json({
            status: 'success',
            data: {
                totalOutbox: notifications.length,
                inMemoryDispatchedCount: sentEmails.length,
                notifications: notifications.map((n) => ({
                    id: n.id,
                    bookingId: n.bookingId,
                    type: n.type,
                    recipient: n.recipient,
                    recipientRole: n.recipientRole,
                    subject: n.subject,
                    status: n.status,
                    scheduledFor: n.scheduledFor,
                    sentAt: n.sentAt,
                    attemptCount: n.attemptCount,
                    lastError: n.lastError,
                    createdAt: n.createdAt,
                })),
            },
        });
    }
    async getNotificationsByBooking(req, res) {
        const { bookingId } = req.params;
        if (!bookingId) {
            res.status(400).json({ status: 'error', message: 'bookingId is required' });
            return;
        }
        const notifications = await notification_repository_js_1.notificationRepository.findByBookingId(bookingId);
        res.status(200).json({
            status: 'success',
            data: {
                bookingId,
                total: notifications.length,
                notifications,
            },
        });
    }
    async processOutboxNow(_req, res) {
        const result = await notification_service_js_1.notificationService.processOutbox();
        res.status(200).json({
            status: 'success',
            message: 'Outbox processed',
            data: result,
        });
    }
    async verifyEmailConfig(_req, res) {
        const check = await email_service_js_1.emailService.verifyConfiguration();
        res.status(200).json({
            status: 'success',
            data: check,
        });
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
