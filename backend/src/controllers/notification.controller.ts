import { Request, Response } from 'express';
import { notificationRepository } from '../repositories/notification.repository.js';
import { notificationService } from '../services/notification.service.js';
import { emailService } from '../services/email.service.js';

export class NotificationController {
  async getRecentNotifications(req: Request, res: Response): Promise<void> {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const notifications = await notificationRepository.findRecent(limit);
    const sentEmails = emailService.getSentEmails();

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

  async getNotificationsByBooking(req: Request, res: Response): Promise<void> {
    const { bookingId } = req.params;
    if (!bookingId) {
      res.status(400).json({ status: 'error', message: 'bookingId is required' });
      return;
    }

    const notifications = await notificationRepository.findByBookingId(bookingId);
    res.status(200).json({
      status: 'success',
      data: {
        bookingId,
        total: notifications.length,
        notifications,
      },
    });
  }

  async processOutboxNow(_req: Request, res: Response): Promise<void> {
    const result = await notificationService.processOutbox();
    res.status(200).json({
      status: 'success',
      message: 'Outbox processed',
      data: result,
    });
  }

  async verifyEmailConfig(_req: Request, res: Response): Promise<void> {
    const check = await emailService.verifyConfiguration();
    res.status(200).json({
      status: 'success',
      data: check,
    });
  }
}

export const notificationController = new NotificationController();
