import { NotificationType, NotificationStatus, BookingStatus } from '@prisma/client';
import { addMinutes } from 'date-fns';
import { notificationRepository, CreateNotificationData } from '../repositories/notification.repository.js';
import { bookingRepository, BookingWithRelations } from '../repositories/booking.repository.js';
import { emailService } from './email.service.js';
import { formatLocalTime } from '../lib/dateUtils.js';
import { env } from '../config/env.js';

export interface ProcessOutboxResult {
  processed: number;
  succeeded: number;
  failed: number;
  retried: number;
}

export class NotificationService {
  private workerTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  /**
   * Enqueue booking confirmations (scheduled immediately) and 30-minute reminders (scheduled startAt - 30 min)
   */
  async queueBookingNotifications(booking: BookingWithRelations): Promise<void> {
    const parentTz = booking.parentTimeZone;
    const mentorTz = booking.mentorTimeZone;
    const course = booking.course || 'Coding & STEM Trial';

    const parentLocalStart = formatLocalTime(booking.startAt, parentTz, 'yyyy-MM-dd HH:mm (zzz)');
    const parentLocalEnd = formatLocalTime(booking.endAt, parentTz, 'HH:mm (zzz)');

    const mentorLocalStart = formatLocalTime(booking.startAt, mentorTz, 'yyyy-MM-dd HH:mm (zzz)');
    const mentorLocalEnd = formatLocalTime(booking.endAt, mentorTz, 'HH:mm (zzz)');

    const now = new Date();

    // 1. Parent Confirmation Notification
    const parentConfirmation: CreateNotificationData = {
      bookingId: booking.id,
      type: NotificationType.BOOKING_CONFIRMATION_PARENT,
      recipient: booking.parent.email,
      recipientRole: 'parent',
      subject: `Codeyoung Booking Confirmed: 1:1 Trial Class (${course})`,
      content: [
        `Dear ${booking.parent.name},`,
        '',
        `Your 1:1 live trial class for "${course}" has been confirmed!`,
        '',
        `📅 Date & Time (Your Local Time): ${parentLocalStart} - ${parentLocalEnd}`,
        `🌍 Time Zone: ${parentTz}`,
        `👨‍🏫 Assigned Mentor: ${booking.mentor.name}`,
        `🔗 Live Class Meeting Link: ${booking.demoClassUrl}`,
        `🔖 Booking Reference: ${booking.id}`,
        '',
        'Please join 5 minutes before the scheduled time.',
        '',
        'Warm regards,',
        'Codeyoung Team',
      ].join('\n'),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-top: 0;">🎉 Your 1:1 Live Trial Class is Confirmed!</h2>
          <p>Dear <strong>${booking.parent.name}</strong>,</p>
          <p>Your trial class for <strong>${course}</strong> is scheduled with Mentor <strong>${booking.mentor.name}</strong>.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 6px 0;"><strong>📅 Date & Time (Your Local Time):</strong> ${parentLocalStart} - ${parentLocalEnd}</p>
            <p style="margin: 6px 0;"><strong>🌍 Your Time Zone:</strong> ${parentTz}</p>
            <p style="margin: 6px 0;"><strong>👨‍🏫 Mentor:</strong> ${booking.mentor.name}</p>
            <p style="margin: 6px 0;"><strong>🔖 Booking Reference:</strong> ${booking.id}</p>
            <p style="margin: 12px 0 6px 0;"><strong>🔗 Class Link:</strong> <a href="${booking.demoClassUrl}" style="color: #2563eb; font-weight: bold; text-decoration: underline;">Join Live Demo Class</a></p>
          </div>
          <p style="color: #64748b; font-size: 14px;">A reminder email will also be sent 30 minutes before your class begins.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="margin-bottom: 0;">Warm regards,<br><strong>Codeyoung Academic Operations</strong></p>
        </div>
      `,
      scheduledFor: now,
    };

    // 2. Mentor Assignment Notification
    const mentorNotification: CreateNotificationData = {
      bookingId: booking.id,
      type: NotificationType.BOOKING_NOTIFICATION_MENTOR,
      recipient: booking.mentor.email,
      recipientRole: 'mentor',
      subject: `New 1:1 Trial Class Assigned: ${course} with ${booking.parent.name}`,
      content: [
        `Dear ${booking.mentor.name},`,
        '',
        `A new 1:1 trial class has been assigned to you for "${course}".`,
        '',
        `📅 Date & Time (Your Local Time): ${mentorLocalStart} - ${mentorLocalEnd}`,
        `🌍 Time Zone: ${mentorTz}`,
        `👤 Student / Parent: ${booking.parent.name} (${booking.parent.email})`,
        `🔗 Live Class Meeting Link: ${booking.demoClassUrl}`,
        `🔖 Booking Reference: ${booking.id}`,
        '',
        'Warm regards,',
        'Codeyoung Academic Operations',
      ].join('\n'),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">📚 New 1:1 Trial Class Assigned</h2>
          <p>Dear <strong>${booking.mentor.name}</strong>,</p>
          <p>You have a new trial class session scheduled for <strong>${course}</strong>.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 6px 0;"><strong>📅 Date & Time (Your Local Time):</strong> ${mentorLocalStart} - ${mentorLocalEnd}</p>
            <p style="margin: 6px 0;"><strong>🌍 Your Time Zone:</strong> ${mentorTz}</p>
            <p style="margin: 6px 0;"><strong>👤 Parent:</strong> ${booking.parent.name} (${booking.parent.email})</p>
            <p style="margin: 6px 0;"><strong>🔖 Booking Reference:</strong> ${booking.id}</p>
            <p style="margin: 12px 0 6px 0;"><strong>🔗 Class Link:</strong> <a href="${booking.demoClassUrl}" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">Enter Live Meeting Room</a></p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="margin-bottom: 0;">Warm regards,<br><strong>Codeyoung Academic Operations</strong></p>
        </div>
      `,
      scheduledFor: now,
    };

    await notificationRepository.create(parentConfirmation);
    await notificationRepository.create(mentorNotification);

    // 3. Durable 30-Minute Reminders
    const reminderScheduledTime = addMinutes(booking.startAt, -30);

    // Only schedule reminder if the reminder time is in the future
    if (reminderScheduledTime > now) {
      const parentReminder: CreateNotificationData = {
        bookingId: booking.id,
        type: NotificationType.CLASS_REMINDER_PARENT,
        recipient: booking.parent.email,
        recipientRole: 'parent',
        subject: `Reminder: Your Codeyoung Trial Class Starts in 30 Minutes!`,
        content: [
          `Dear ${booking.parent.name},`,
          '',
          `This is a friendly reminder that your 1:1 trial class for "${course}" starts in 30 minutes!`,
          '',
          `📅 Start Time (Your Local Time): ${parentLocalStart}`,
          `👨‍🏫 Mentor: ${booking.mentor.name}`,
          `🔗 Join Link: ${booking.demoClassUrl}`,
          `🔖 Booking Reference: ${booking.id}`,
          '',
          'Please be ready 5 minutes early.',
          '',
          'Warm regards,',
          'Codeyoung Team',
        ].join('\n'),
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #ea580c; margin-top: 0;">⏰ Starting in 30 Minutes!</h2>
            <p>Dear <strong>${booking.parent.name}</strong>,</p>
            <p>Your 1:1 trial class for <strong>${course}</strong> will begin in 30 minutes.</p>
            <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>📅 Start Time (Your Local Time):</strong> ${parentLocalStart}</p>
              <p style="margin: 6px 0;"><strong>👨‍🏫 Mentor:</strong> ${booking.mentor.name}</p>
              <p style="margin: 12px 0 6px 0;"><strong>🔗 Join Class:</strong> <a href="${booking.demoClassUrl}" style="color: #ea580c; font-weight: bold; text-decoration: underline;">Click Here to Join Meeting</a></p>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="margin-bottom: 0;">Warm regards,<br><strong>Codeyoung Team</strong></p>
          </div>
        `,
        scheduledFor: reminderScheduledTime,
      };

      const mentorReminder: CreateNotificationData = {
        bookingId: booking.id,
        type: NotificationType.CLASS_REMINDER_MENTOR,
        recipient: booking.mentor.email,
        recipientRole: 'mentor',
        subject: `Reminder: Upcoming Trial Class with ${booking.parent.name} in 30 Minutes`,
        content: [
          `Dear ${booking.mentor.name},`,
          '',
          `Reminder: You have an upcoming trial class for "${course}" with ${booking.parent.name} in 30 minutes.`,
          '',
          `📅 Start Time (Your Local Time): ${mentorLocalStart}`,
          `👤 Student / Parent: ${booking.parent.name}`,
          `🔗 Meeting Room: ${booking.demoClassUrl}`,
          '',
          'Warm regards,',
          'Codeyoung Academic Operations',
        ].join('\n'),
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #ea580c; margin-top: 0;">⏰ Class in 30 Minutes</h2>
            <p>Dear <strong>${booking.mentor.name}</strong>,</p>
            <p>Your session with <strong>${booking.parent.name}</strong> for <strong>${course}</strong> begins in 30 minutes.</p>
            <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>📅 Start Time (Your Local Time):</strong> ${mentorLocalStart}</p>
              <p style="margin: 6px 0;"><strong>👤 Student / Parent:</strong> ${booking.parent.name}</p>
              <p style="margin: 12px 0 6px 0;"><strong>🔗 Classroom:</strong> <a href="${booking.demoClassUrl}" style="color: #ea580c; font-weight: bold; text-decoration: underline;">Launch Meeting Room</a></p>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="margin-bottom: 0;">Warm regards,<br><strong>Codeyoung Academic Operations</strong></p>
          </div>
        `,
        scheduledFor: reminderScheduledTime,
      };

      await notificationRepository.create(parentReminder);
      await notificationRepository.create(mentorReminder);
    }
  }

  /**
   * Process pending outbox notifications that are due for delivery
   */
  async processOutbox(now: Date = new Date()): Promise<ProcessOutboxResult> {
    if (this.isProcessing) {
      return { processed: 0, succeeded: 0, failed: 0, retried: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let retried = 0;

    try {
      const pendingNotifications = await notificationRepository.findPendingDue(now, 25);

      for (const notif of pendingNotifications) {
        processed++;

        // 1. Re-verify parent booking status
        const booking = await bookingRepository.findById(notif.bookingId);
        if (!booking || booking.status === BookingStatus.CANCELLED) {
          await notificationRepository.update(notif.id, {
            status: NotificationStatus.FAILED,
            lastError: 'Skipped: Booking was cancelled or deleted',
          });
          failed++;
          continue;
        }

        // 2. Dispatch real email via configured provider
        console.log(`[Notification Outbox] Starting dispatch -> BookingID: ${notif.bookingId} | Type: ${notif.type} | Role: ${notif.recipientRole} | Recipient: ${notif.recipient}`);

        const sendResult = await emailService.sendEmail({
          to: notif.recipient,
          subject: notif.subject,
          text: notif.content,
          html: notif.htmlContent || undefined,
        });

        if (sendResult.success && sendResult.status === 'ACCEPTED') {
          console.log(`[Notification Outbox] Success -> BookingID: ${notif.bookingId} | Role: ${notif.recipientRole} | MsgId: ${sendResult.messageId || 'N/A'}`);
          await notificationRepository.update(notif.id, {
            status: NotificationStatus.ACCEPTED,
            sentAt: new Date(),
            lastError: null,
          });
          succeeded++;
        } else {
          console.warn(`[Notification Outbox] Failed attempt -> BookingID: ${notif.bookingId} | Role: ${notif.recipientRole} | Error: ${sendResult.error}`);
          const nextAttempt = notif.attemptCount + 1;
          const isFinalFailure = nextAttempt >= 3;

          if (isFinalFailure) {
            await notificationRepository.update(notif.id, {
              status: NotificationStatus.FAILED,
              attemptCount: nextAttempt,
              lastError: sendResult.error || 'Max delivery attempts exceeded',
            });
            failed++;
          } else {
            // Exponential backoff for retry: next attempt in nextAttempt * 2 minutes
            const retryScheduled = addMinutes(new Date(), nextAttempt * 2);
            await notificationRepository.update(notif.id, {
              status: NotificationStatus.PENDING,
              attemptCount: nextAttempt,
              lastError: sendResult.error || 'Provider rejected email dispatch',
              scheduledFor: retryScheduled,
            });
            retried++;
          }
        }
      }
    } catch (err: unknown) {
      console.error('❌ [Outbox Worker Error]:', err);
    } finally {
      this.isProcessing = false;
    }

    return { processed, succeeded, failed, retried };
  }

  /**
   * Start periodic background worker polling the outbox
   */
  startWorker(intervalSeconds?: number): void {
    if (!env.NOTIFICATION_WORKER_ENABLED) {
      console.log('ℹ️ Notification background worker disabled by configuration.');
      return;
    }

    if (this.workerTimer) return;

    const intervalMs = (intervalSeconds || env.REMINDER_INTERVAL_SECONDS || 10) * 1000;
    console.log(`⏱️ Notification & 30-min Reminder Outbox Worker started (polling every ${intervalMs / 1000}s)`);

    // Initial tick
    this.processOutbox().catch((err) => console.error('Error in outbox tick:', err));

    this.workerTimer = setInterval(() => {
      this.processOutbox().catch((err) => console.error('Error in outbox tick:', err));
    }, intervalMs);
  }

  /**
   * Stop the background worker
   */
  stopWorker(): void {
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
      this.workerTimer = null;
      console.log('🛑 Notification worker stopped.');
    }
  }

  /**
   * Cancel pending reminders if a booking is cancelled
   */
  async handleBookingCancelled(bookingId: string): Promise<void> {
    await notificationRepository.cancelPendingForBooking(bookingId);
  }
}

export const notificationService = new NotificationService();
