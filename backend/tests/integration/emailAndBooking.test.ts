import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { emailService } from '../../src/services/email.service.js';
import { signUserToken } from '../../src/lib/jwt.js';

describe('End-to-End Booking Integration & Email Notifications', () => {
  const app = createApp();

  const adminToken = signUserToken({
    userId: 'admin-1',
    email: 'admin@codeyoung.com',
    name: 'Admin',
    role: 'ADMIN',
  });

  beforeEach(() => {
    emailService.clearSentEmails();
  });

  it('completes booking and dispatches confirmation emails in respective local time zones', async () => {
    const bookingPayload = {
      parentName: 'Alice Walker',
      parentEmail: 'alice.walker@example.com',
      parentPhone: '+1 (555) 234-5678',
      course: 'Python Programming & AI Basics',
      parentTimeZone: 'America/New_York', // UTC-4 in summer/October
      startAt: '2026-10-12T14:00:00.000Z', // 10:00 EDT (America/New_York) -> 19:30 IST (Asia/Kolkata)
      idempotencyKey: 'idem-e2e-email-test-1',
      verificationToken: 'test-verified-token',
    };

    const res = await request(app).post('/api/bookings').send(bookingPayload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.demoClassUrl).toContain('https://meet.codeyoung.com/trial/');
    expect(res.body.data.parent.localStartTime).toBe('2026-10-12 10:00:00 (EDT)');

    // Allow async email dispatch to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    const sentEmails = emailService.getSentEmails();
    expect(sentEmails.length).toBe(2);

    const parentEmail = sentEmails.find((e) => e.to === 'alice.walker@example.com');
    const mentorEmail = sentEmails.find((e) => e.to === res.body.data.mentor.email);

    expect(parentEmail).toBeDefined();
    expect(parentEmail?.to).toBe('alice.walker@example.com');
    expect(parentEmail?.subject).toContain('Python Programming & AI Basics');
    expect(parentEmail?.text).toContain('10:00 (EDT)');
    expect(parentEmail?.text).toContain('America/New_York');
    expect(parentEmail?.text).toContain(res.body.data.demoClassUrl);

    expect(mentorEmail).toBeDefined();
    expect(mentorEmail?.to).toBe(res.body.data.mentor.email);
    expect(mentorEmail?.text).toContain(res.body.data.mentor.timeZone);
    expect(mentorEmail?.text).toContain(res.body.data.demoClassUrl);
  });

  it('does not dispatch duplicate emails on idempotent duplicate submission', async () => {
    const bookingPayload = {
      parentName: 'Bob Builder',
      parentEmail: 'bob@example.com',
      parentTimeZone: 'Europe/London',
      startAt: '2026-10-12T10:00:00.000Z',
      idempotencyKey: 'idem-duplicate-prevent-key',
      verificationToken: 'test-verified-token',
    };

    // 1st call
    const res1 = await request(app).post('/api/bookings').send(bookingPayload);
    expect(res1.status).toBe(201);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(emailService.getSentEmails().length).toBe(2);

    // 2nd idempotent call
    const res2 = await request(app).post('/api/bookings').send(bookingPayload);
    expect(res2.status).toBe(201);
    expect(res2.body.data.id).toBe(res1.body.data.id);

    await new Promise((resolve) => setTimeout(resolve, 50));
    // Count remains 2 (no duplicate emails sent)
    expect(emailService.getSentEmails().length).toBe(2);
  });

  it('provides an email inspection endpoint GET /api/emails/recent', async () => {
    const res = await request(app)
      .get('/api/emails/recent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('totalSent');
    expect(Array.isArray(res.body.data.emails)).toBe(true);
  });

  it('provides notification outbox endpoints GET /api/notifications/recent and /booking/:id', async () => {
    const bookingPayload = {
      parentName: 'Charlie Brown',
      parentEmail: 'charlie@example.com',
      parentTimeZone: 'America/New_York',
      startAt: '2026-10-12T15:00:00.000Z',
      idempotencyKey: 'idem-notif-endpoint-test',
      verificationToken: 'test-verified-token',
    };

    const bookingRes = await request(app).post('/api/bookings').send(bookingPayload);
    expect(bookingRes.status).toBe(201);
    const bookingId = bookingRes.body.data.id;

    // Check notifications by booking ID
    const notifRes = await request(app)
      .get(`/api/notifications/booking/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.status).toBe('success');
    expect(notifRes.body.data.total).toBeGreaterThanOrEqual(2);

    // Check recent outbox logs
    const recentRes = await request(app)
      .get('/api/notifications/recent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(recentRes.status).toBe(200);
    expect(recentRes.body.status).toBe('success');
    expect(recentRes.body.data.totalOutbox).toBeGreaterThanOrEqual(2);

    // Check provider configuration endpoint
    const verifyRes = await request(app)
      .get('/api/notifications/verify-config')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data).toHaveProperty('valid');
  });
});
