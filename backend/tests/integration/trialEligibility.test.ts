import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { inMemoryStore } from '../../src/lib/inMemoryStore.js';
import { prisma } from '../../src/lib/prisma.js';
import { validateAndNormalizePhone } from '../../src/lib/phoneUtils.js';


describe('Trial Booking Eligibility & Phone Normalization Integration Tests', () => {
  const app = createApp();

  beforeEach(async () => {
    inMemoryStore.reset();
    try {
      await prisma.notification.deleteMany();
      await prisma.booking.deleteMany();
      await prisma.parent.deleteMany();
    } catch {
      // ignore
    }
  });

  describe('Single Trial Class Policy Enforcement', () => {
    it('allows the first trial booking for a student/parent', async () => {
      const payload = {
        parentName: 'Priya Sharma',
        studentName: 'Aryan Sharma',
        parentEmail: 'priya.sharma@example.com',
        parentPhone: '9876543210',
        countryDialCode: '+91',
        course: 'Python Programming & AI Basics',
        parentTimeZone: 'Asia/Kolkata',
        startAt: '2026-10-15 14:00',
        captchaToken: 'test-valid-captcha-token',
        verificationToken: 'test-verified-token',
      };

      const res = await request(app).post('/api/bookings').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.parent.email).toBe('priya.sharma@example.com');
      expect(res.body.data.parent.phone).toBe('+919876543210');
    });

    it('rejects a second trial booking for the same student/parent with exact message', async () => {
      const payload = {
        parentName: 'Priya Sharma',
        studentName: 'Aryan Sharma',
        parentEmail: 'priya.sharma@example.com',
        parentPhone: '9876543210',
        countryDialCode: '+91',
        course: 'Python Programming & AI Basics',
        parentTimeZone: 'Asia/Kolkata',
        startAt: '2026-10-15 14:00',
        captchaToken: 'test-valid-captcha-token',
        verificationToken: 'test-verified-token',
      };

      // 1st booking succeeds
      const firstRes = await request(app).post('/api/bookings').send(payload);
      expect(firstRes.status).toBe(201);

      // 2nd booking attempt for same student/parent
      const secondRes = await request(app).post('/api/bookings').send({
        ...payload,
        startAt: '2026-10-15 15:00',
      });

      expect(secondRes.status).toBe(403);
      expect(secondRes.body.status).toBe('fail');
      expect(secondRes.body.code).toBe('TRIAL_ALREADY_USED');
      expect(secondRes.body.message).toBe(
        'This student has already used their trial class. Please contact our team to explore available courses.'
      );
    });

    it('checks trial eligibility via GET /api/bookings/eligibility endpoint', async () => {
      // Prior to booking -> eligible
      const preRes = await request(app)
        .get('/api/bookings/eligibility')
        .query({ email: 'newparent@example.com', studentName: 'Rohan' });

      expect(preRes.status).toBe(200);
      expect(preRes.body.data.eligible).toBe(true);
      expect(preRes.body.data.remainingTrials).toBe(1);

      // Create confirmed trial booking
      await request(app).post('/api/bookings').send({
        parentName: 'New Parent',
        studentName: 'Rohan',
        parentEmail: 'newparent@example.com',
        parentPhone: '9876543210',
        countryDialCode: '+91',
        course: 'Python Programming & AI Basics',
        parentTimeZone: 'Asia/Kolkata',
        startAt: '2026-10-15 14:00',
        captchaToken: 'test-valid-captcha-token',
        verificationToken: 'test-verified-token',
      });

      // Post booking -> ineligible
      const postRes = await request(app)
        .get('/api/bookings/eligibility')
        .query({ email: 'newparent@example.com', studentName: 'Rohan' });

      expect(postRes.status).toBe(200);
      expect(postRes.body.data.eligible).toBe(false);
      expect(postRes.body.data.remainingTrials).toBe(0);
      expect(postRes.body.data.message).toBe(
        'This student has already used their trial class. Please contact our team to explore available courses.'
      );
    });

    it('prevents concurrent duplicate trial bookings for the same parent/student', async () => {
      const payload1 = {
        parentName: 'Anita Gupta',
        studentName: 'Vihaan Gupta',
        parentEmail: 'anita.gupta@example.com',
        parentPhone: '9876543210',
        countryDialCode: '+91',
        course: 'Web Development',
        parentTimeZone: 'Asia/Kolkata',
        startAt: '2026-10-15 14:00',
        captchaToken: 'test-valid-captcha-token',
        verificationToken: 'test-verified-token',
      };

      const payload2 = {
        ...payload1,
        startAt: '2026-10-15 14:30',
      };

      // Execute concurrent booking requests
      const [res1, res2] = await Promise.all([
        request(app).post('/api/bookings').send(payload1),
        request(app).post('/api/bookings').send(payload2),
      ]);

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(403);

      const rejected = res1.status === 403 ? res1 : res2;
      expect(rejected.body.code).toBe('TRIAL_ALREADY_USED');
    });

    it('does not consume eligibility for canceled or non-created bookings', async () => {
      // 1. Invalid time zone booking fails
      const failedRes = await request(app).post('/api/bookings').send({
        parentName: 'Test Parent',
        studentName: 'Test Student',
        parentEmail: 'retryparent@example.com',
        parentPhone: '9876543210',
        course: 'Web Development',
        parentTimeZone: 'Invalid/Zone',
        startAt: '2026-10-15 14:00',
        captchaToken: 'test-valid-captcha-token',
        verificationToken: 'test-verified-token',
      });
      expect(failedRes.status).toBe(400);

      // Check eligibility -> still 1 remaining trial
      const checkRes = await request(app)
        .get('/api/bookings/eligibility')
        .query({ email: 'retryparent@example.com' });

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.eligible).toBe(true);
      expect(checkRes.body.data.remainingTrials).toBe(1);
    });
  });

  describe('Phone Input Normalization & Validation', () => {
    it('normalizes 10-digit Indian numbers with +91 dialing code to E.164', () => {
      const result = validateAndNormalizePhone('9876543210', '+91');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+919876543210');
      expect(result.countryCode).toBe('+91');
    });

    it('normalizes international numbers (US +1) to E.164', () => {
      const result = validateAndNormalizePhone('4155552671', '+1');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+14155552671');
    });

    it('rejects phone numbers with too few digits', () => {
      const result = validateAndNormalizePhone('123', '+91');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects phone numbers exceeding 15 international digits', () => {
      const result = validateAndNormalizePhone('1234567890123456', '+91');
      expect(result.isValid).toBe(false);
    });
  });
});
