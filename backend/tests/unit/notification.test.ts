import { describe, it, expect, beforeEach } from 'vitest';
import { addMinutes, addHours } from 'date-fns';
import { MockEmailService, ResendEmailService } from '../../src/services/email.service.js';
import { NotificationService } from '../../src/services/notification.service.js';
import { notificationRepository } from '../../src/repositories/notification.repository.js';
import { inMemoryStore } from '../../src/lib/inMemoryStore.js';
import { BookingStatus, NotificationType, NotificationStatus } from '@prisma/client';

describe('Notification & Real Email System Unit Tests', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    inMemoryStore.notifications = [];
    notificationService = new NotificationService();
  });

  describe('1. Real Provider Configuration Validation', () => {
    it('validates missing Resend API key with clear descriptive failure', async () => {
      const resendService = new ResendEmailService('', 'no-reply@test.com');
      const verify = await resendService.verifyConfiguration();
      expect(verify.valid).toBe(false);
      expect(verify.message).toContain('RESEND_API_KEY is not configured');

      const sendRes = await resendService.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Test',
      });
      expect(sendRes.success).toBe(false);
      expect(sendRes.status).toBe('FAILED');
      expect(sendRes.error).toContain('RESEND_API_KEY is missing');
    });

    it('validates mock adapter successfully', async () => {
      const mockService = new MockEmailService();
      const verify = await mockService.verifyConfiguration();
      expect(verify.valid).toBe(true);
      expect(verify.message).toContain('Mock Email Adapter is active');
    });
  });

  describe('2. Notification Outbox Generation & Recipient Time Zones', () => {
    it('creates parent and mentor notifications in respective local time zones and queues 30-min reminders', async () => {
      const parent = inMemoryStore.findOrCreateParent({
        name: 'Sarah Connor',
        email: 'sarah@skynet.com',
        timeZone: 'America/New_York',
      });

      const mentor = inMemoryStore.getMentorById('mentor-1-aarav')!;

      // Future booking 2 hours from now
      const startAt = addHours(new Date(), 2);
      const endAt = addMinutes(startAt, 30);

      const booking = inMemoryStore.createBooking({
        parentId: parent.id,
        mentorId: mentor.id,
        course: 'Robotics & Python 101',
        startAt,
        endAt,
        parentTimeZone: 'America/New_York',
        mentorTimeZone: 'Asia/Kolkata',
        demoClassUrl: 'https://meet.codeyoung.com/trial/robotics-demo',
      });

      await notificationService.queueBookingNotifications(booking);

      const queued = await notificationRepository.findByBookingId(booking.id);
      expect(queued.length).toBe(4);

      // Confirmations
      const parentConf = queued.find((n) => n.type === NotificationType.BOOKING_CONFIRMATION_PARENT);
      const mentorConf = queued.find((n) => n.type === NotificationType.BOOKING_NOTIFICATION_MENTOR);
      expect(parentConf).toBeDefined();
      expect(parentConf?.recipient).toBe('sarah@skynet.com');
      expect(parentConf?.content).toContain('Robotics & Python 101');
      expect(parentConf?.content).toContain('America/New_York');
      expect(parentConf?.content).toContain('https://meet.codeyoung.com/trial/robotics-demo');

      expect(mentorConf).toBeDefined();
      expect(mentorConf?.recipient).toBe(mentor.email);
      expect(mentorConf?.content).toContain('Asia/Kolkata');

      // Reminders
      const parentReminder = queued.find((n) => n.type === NotificationType.CLASS_REMINDER_PARENT);
      const mentorReminder = queued.find((n) => n.type === NotificationType.CLASS_REMINDER_MENTOR);
      expect(parentReminder).toBeDefined();
      expect(mentorReminder).toBeDefined();

      // Scheduled 30 minutes before class start
      const expectedReminderTime = addMinutes(startAt, -30);
      expect(parentReminder?.scheduledFor.getTime()).toBeCloseTo(expectedReminderTime.getTime(), -3);
    });

    it('does not schedule past reminders for bookings created less than 30 minutes before start', async () => {
      const parent = inMemoryStore.findOrCreateParent({
        name: 'John Doe',
        email: 'john@example.com',
        timeZone: 'Europe/London',
      });

      const mentor = inMemoryStore.getMentorById('mentor-4-emily')!;

      // Booking starts in 15 minutes
      const startAt = addMinutes(new Date(), 15);
      const endAt = addMinutes(startAt, 30);

      const booking = inMemoryStore.createBooking({
        parentId: parent.id,
        mentorId: mentor.id,
        course: 'Game Design with Scratch',
        startAt,
        endAt,
        parentTimeZone: 'Europe/London',
        mentorTimeZone: 'Europe/London',
        demoClassUrl: 'https://meet.codeyoung.com/trial/scratch-demo',
      });

      await notificationService.queueBookingNotifications(booking);

      const queued = await notificationRepository.findByBookingId(booking.id);
      // Only 2 confirmation emails queued, NO past reminders
      expect(queued.length).toBe(2);
      expect(queued.some((n) => n.type === NotificationType.CLASS_REMINDER_PARENT)).toBe(false);
    });
  });

  describe('3. Outbox Deduplication & Cancellation', () => {
    it('prevents duplicate notifications for the same booking and type', async () => {
      const parent = inMemoryStore.findOrCreateParent({
        name: 'Duplicate Test Parent',
        email: 'dup@example.com',
        timeZone: 'Asia/Kolkata',
      });

      const mentor = inMemoryStore.getMentorById('mentor-2-priya')!;
      const startAt = addHours(new Date(), 3);
      const booking = inMemoryStore.createBooking({
        parentId: parent.id,
        mentorId: mentor.id,
        course: 'Web Development Basics',
        startAt,
        endAt: addMinutes(startAt, 30),
        parentTimeZone: 'Asia/Kolkata',
        mentorTimeZone: 'Asia/Kolkata',
        demoClassUrl: 'https://meet.codeyoung.com/trial/web-demo',
      });

      // 1st Queue
      await notificationService.queueBookingNotifications(booking);
      expect(inMemoryStore.notifications.length).toBe(4);

      // 2nd Queue attempt (idempotent duplicate)
      await notificationService.queueBookingNotifications(booking);
      expect(inMemoryStore.notifications.length).toBe(4);
    });

    it('cancels pending reminder notifications when booking is cancelled', async () => {
      const parent = inMemoryStore.findOrCreateParent({
        name: 'Cancel Test Parent',
        email: 'cancel@example.com',
        timeZone: 'Asia/Kolkata',
      });

      const mentor = inMemoryStore.getMentorById('mentor-3-rohan')!;
      const startAt = addHours(new Date(), 3);
      const booking = inMemoryStore.createBooking({
        parentId: parent.id,
        mentorId: mentor.id,
        course: 'AI Basics',
        startAt,
        endAt: addMinutes(startAt, 30),
        parentTimeZone: 'Asia/Kolkata',
        mentorTimeZone: 'Asia/Kolkata',
        demoClassUrl: 'https://meet.codeyoung.com/trial/ai-demo',
      });

      await notificationService.queueBookingNotifications(booking);
      booking.status = BookingStatus.CANCELLED;

      await notificationService.handleBookingCancelled(booking.id);

      const records = await notificationRepository.findByBookingId(booking.id);
      expect(records.every((r) => r.status === NotificationStatus.FAILED)).toBe(true);
      expect(records[0]?.lastError).toContain('Cancelled: Booking was cancelled');
    });
  });

  describe('4. Outbox Worker Processing & Retry Backoff', () => {
    it('processes due pending notifications and transitions status to ACCEPTED', async () => {
      const parent = inMemoryStore.findOrCreateParent({
        name: 'Outbox Test',
        email: 'outbox@example.com',
        timeZone: 'Asia/Kolkata',
      });

      const mentor = inMemoryStore.getMentorById('mentor-1-aarav')!;
      const startAt = addHours(new Date(), 1);
      const booking = inMemoryStore.createBooking({
        parentId: parent.id,
        mentorId: mentor.id,
        course: 'Python STEM',
        startAt,
        endAt: addMinutes(startAt, 30),
        parentTimeZone: 'Asia/Kolkata',
        mentorTimeZone: 'Asia/Kolkata',
        demoClassUrl: 'https://meet.codeyoung.com/trial/py-demo',
      });

      await notificationService.queueBookingNotifications(booking);

      // Process confirmations (scheduled for now)
      const res = await notificationService.processOutbox(new Date());
      expect(res.processed).toBe(2);
      expect(res.succeeded).toBe(2);

      const records = await notificationRepository.findByBookingId(booking.id);
      const confirmations = records.filter((r) => r.type.startsWith('BOOKING_'));
      expect(confirmations.every((c) => c.status === NotificationStatus.ACCEPTED)).toBe(true);
      expect(confirmations.every((c) => c.sentAt !== null)).toBe(true);

      // Reminders remain pending until due
      const reminders = records.filter((r) => r.type.startsWith('CLASS_REMINDER_'));
      expect(reminders.every((r) => r.status === NotificationStatus.PENDING)).toBe(true);
    });

    it('processes reminders when simulated time advances to 30 minutes before class', async () => {
      const parent = inMemoryStore.findOrCreateParent({
        name: 'Advance Time Test',
        email: 'adv@example.com',
        timeZone: 'Asia/Kolkata',
      });

      const mentor = inMemoryStore.getMentorById('mentor-1-aarav')!;
      const startAt = addHours(new Date(), 2);
      const booking = inMemoryStore.createBooking({
        parentId: parent.id,
        mentorId: mentor.id,
        course: 'Python STEM',
        startAt,
        endAt: addMinutes(startAt, 30),
        parentTimeZone: 'Asia/Kolkata',
        mentorTimeZone: 'Asia/Kolkata',
        demoClassUrl: 'https://meet.codeyoung.com/trial/py-demo',
      });

      await notificationService.queueBookingNotifications(booking);

      // Advance time to startAt - 25 minutes (after reminder due instant)
      const simulatedNow = addMinutes(startAt, -25);
      const res = await notificationService.processOutbox(simulatedNow);

      expect(res.processed).toBe(4); // 2 confirmations + 2 reminders
      expect(res.succeeded).toBe(4);

      const records = await notificationRepository.findByBookingId(booking.id);
      expect(records.every((r) => r.status === NotificationStatus.ACCEPTED)).toBe(true);
    });
  });
});
