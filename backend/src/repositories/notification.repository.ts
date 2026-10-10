import { PrismaClient, Prisma } from '@prisma/client';
import { Notification, NotificationType, NotificationStatus } from '../types/models.js';
import { prisma as defaultPrisma, isDbConnected, markDbConnected, markDbDisconnected, DatabaseConnectionError } from '../lib/prisma.js';
import { inMemoryStore } from '../lib/inMemoryStore.js';
import { isFallbackAllowed } from '../config/env.js';


export interface CreateNotificationData {
  bookingId: string;
  type: NotificationType;
  recipient: string;
  recipientRole: string; // 'parent' | 'mentor'
  subject: string;
  content: string;
  htmlContent?: string | null;
  scheduledFor?: Date;
}

export interface UpdateNotificationData {
  status?: NotificationStatus;
  sentAt?: Date | null;
  attemptCount?: number;
  lastError?: string | null;
  scheduledFor?: Date;
}

export class NotificationRepository {
  constructor(private db: PrismaClient = defaultPrisma) {}

  async create(data: CreateNotificationData, txDb?: Prisma.TransactionClient): Promise<Notification> {
    const client = txDb || this.db;
    if (!isDbConnected() && client === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.createNotification(data);
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected. Cannot save notification.');
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
          status: NotificationStatus.PENDING,
        },
        update: {
          subject: data.subject,
          content: data.content,
          htmlContent: data.htmlContent || null,
          scheduledFor: data.scheduledFor || new Date(),
        },
      });
      markDbConnected();
      return notif;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.createNotification(data);
      }
      throw new DatabaseConnectionError('Failed to save notification to PostgreSQL database.');
    }
  }

  async findPendingDue(now: Date = new Date(), limit: number = 20): Promise<Notification[]> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.getPendingNotifications(now).slice(0, limit);
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }
    try {
      const pending = await this.db.notification.findMany({
        where: {
          status: NotificationStatus.PENDING,
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
      markDbConnected();
      return pending;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.getPendingNotifications(now).slice(0, limit);
      }
      throw new DatabaseConnectionError('Failed to fetch pending notifications from PostgreSQL database.');
    }
  }

  async update(id: string, data: UpdateNotificationData): Promise<Notification | null> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.updateNotification(id, data);
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }
    try {
      const updated = await this.db.notification.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
      markDbConnected();
      return updated;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.updateNotification(id, data);
      }
      throw new DatabaseConnectionError('Failed to update notification in PostgreSQL database.');
    }
  }

  async findByBookingId(bookingId: string): Promise<Notification[]> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.notifications.filter((n) => n.bookingId === bookingId);
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }
    try {
      const notifications = await this.db.notification.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'asc' },
      });
      markDbConnected();
      return notifications;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.notifications.filter((n) => n.bookingId === bookingId);
      }
      throw new DatabaseConnectionError('Failed to fetch notifications by booking ID from PostgreSQL database.');
    }
  }

  async findRecent(limit: number = 50): Promise<Notification[]> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        return [...inMemoryStore.notifications]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }
    try {
      const notifications = await this.db.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      markDbConnected();
      return notifications;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return [...inMemoryStore.notifications]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);
      }
      throw new DatabaseConnectionError('Failed to fetch recent notifications from PostgreSQL database.');
    }
  }

  async cancelPendingForBooking(bookingId: string): Promise<void> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        inMemoryStore.notifications
          .filter((n) => n.bookingId === bookingId && n.status === NotificationStatus.PENDING)
          .forEach((n) => {
            n.status = NotificationStatus.FAILED;
            n.lastError = 'Cancelled: Booking was cancelled or rescheduled';
          });
        return;
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }
    try {
      await this.db.notification.updateMany({
        where: {
          bookingId,
          status: NotificationStatus.PENDING,
        },
        data: {
          status: NotificationStatus.FAILED,
          lastError: 'Cancelled: Booking was cancelled or rescheduled',
        },
      });
      markDbConnected();
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        inMemoryStore.notifications
          .filter((n) => n.bookingId === bookingId && n.status === NotificationStatus.PENDING)
          .forEach((n) => {
            n.status = NotificationStatus.FAILED;
            n.lastError = 'Cancelled: Booking was cancelled or rescheduled';
          });
        return;
      }
      throw new DatabaseConnectionError('Failed to cancel notifications in PostgreSQL database.');
    }
  }
}

export const notificationRepository = new NotificationRepository();

