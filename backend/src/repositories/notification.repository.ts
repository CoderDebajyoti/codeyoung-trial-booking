import { PrismaClient, Notification, NotificationType, NotificationStatus, Prisma } from '@prisma/client';
import { prisma as defaultPrisma, isDbConnected, markDbDisconnected } from '../lib/prisma.js';
import { inMemoryStore } from '../lib/inMemoryStore.js';

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
      return inMemoryStore.createNotification(data);
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
          status: NotificationStatus.PENDING,
        },
        update: {
          // If already exists and still pending, update content/schedule
          subject: data.subject,
          content: data.content,
          htmlContent: data.htmlContent || null,
          scheduledFor: data.scheduledFor || new Date(),
        },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.createNotification(data);
    }
  }

  async findPendingDue(now: Date = new Date(), limit: number = 20): Promise<Notification[]> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      return inMemoryStore.getPendingNotifications(now).slice(0, limit);
    }
    try {
      return await this.db.notification.findMany({
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
    } catch {
      markDbDisconnected();
      return inMemoryStore.getPendingNotifications(now).slice(0, limit);
    }
  }

  async update(id: string, data: UpdateNotificationData): Promise<Notification | null> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      return inMemoryStore.updateNotification(id, data);
    }
    try {
      return await this.db.notification.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.updateNotification(id, data);
    }
  }

  async findByBookingId(bookingId: string): Promise<Notification[]> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      return inMemoryStore.notifications.filter((n) => n.bookingId === bookingId);
    }
    try {
      return await this.db.notification.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'asc' },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.notifications.filter((n) => n.bookingId === bookingId);
    }
  }

  async findRecent(limit: number = 50): Promise<Notification[]> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      return [...inMemoryStore.notifications]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }
    try {
      return await this.db.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch {
      markDbDisconnected();
      return [...inMemoryStore.notifications]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }
  }

  async cancelPendingForBooking(bookingId: string): Promise<void> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      inMemoryStore.notifications
        .filter((n) => n.bookingId === bookingId && n.status === NotificationStatus.PENDING)
        .forEach((n) => {
          n.status = NotificationStatus.FAILED;
          n.lastError = 'Cancelled: Booking was cancelled or rescheduled';
        });
      return;
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
    } catch {
      markDbDisconnected();
      inMemoryStore.notifications
        .filter((n) => n.bookingId === bookingId && n.status === NotificationStatus.PENDING)
        .forEach((n) => {
          n.status = NotificationStatus.FAILED;
          n.lastError = 'Cancelled: Booking was cancelled or rescheduled';
        });
    }
  }
}

export const notificationRepository = new NotificationRepository();
