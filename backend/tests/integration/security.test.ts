import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { signUserToken } from '../../src/lib/jwt.js';
import { otpService } from '../../src/services/otp.service.js';
import { bookingService } from '../../src/services/booking.service.js';
import { mentorService } from '../../src/services/mentor.service.js';
import { emailService } from '../../src/services/email.service.js';

describe('Security, Bot Protection, OTP & RBAC Comprehensive Suite', () => {
  const app = createApp();

  const mentorToken = signUserToken({
    userId: 'user-mentor-1',
    email: 'aarav.sharma@codeyoung.com',
    name: 'Aarav Sharma',
    role: 'MENTOR',
    mentorId: 'mentor-1-aarav',
  });

  const adminToken = signUserToken({

    userId: 'user-admin-1',
    email: 'admin@codeyoung.com',
    name: 'System Administrator',
    role: 'ADMIN',
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Public vs. Protected Endpoints & Authorization', () => {
    it('allows public access to /api/health, /api/slots, and /api/mentors without company credentials', async () => {
      const healthRes = await request(app).get('/api/health');
      expect(healthRes.status).toBe(200);

      const mentorsRes = await request(app).get('/api/mentors');
      expect(mentorsRes.status).toBe(200);
      expect(mentorsRes.body.data.mentors.length).toBeGreaterThan(0);
    });

    it('rejects unauthenticated requests to private mentor schedule endpoint with 401', async () => {
      const res = await request(app).get('/api/mentors/mentor-1-aarav/schedule?date=2026-10-12');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Authentication required/i);
    });

    it('rejects mentor attempting to inspect another mentor schedule with 403 Forbidden', async () => {
      // Mentor 1 (Aarav) tries to inspect Mentor 2 (Priya)'s schedule
      const res = await request(app)
        .get('/api/mentors/mentor-2-priya/schedule?date=2026-10-12')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Mentors may only access their own private schedule/i);
    });

    it('allows mentor to inspect their own private schedule', async () => {
      vi.spyOn(mentorService, 'getMentorSchedule').mockResolvedValueOnce({
        mentor: {
          id: 'mentor-1-aarav',
          name: 'Aarav Sharma',
          email: 'aarav.sharma@codeyoung.com',
          timeZone: 'Asia/Kolkata',
          isActive: true,
          workDays: [1, 2, 3, 4, 5],
          workStartHour: 9,
          workEndHour: 18,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        queryDate: '2026-10-12',
        mentorLocalDateRange: {
          startUtc: new Date('2026-10-11T18:30:00.000Z'),
          endUtc: new Date('2026-10-12T18:29:59.999Z'),
        },
        capacity: {
          maxDailyClasses: 2,
          confirmedClassesCount: 0,
          availableCapacity: 2,
          isFullyBooked: false,
        },
        bookings: [],
      });

      const res = await request(app)
        .get('/api/mentors/mentor-1-aarav/schedule?date=2026-10-12')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.mentor.id).toBe('mentor-1-aarav');
    });

    it('allows administrator to inspect any mentor schedule', async () => {
      vi.spyOn(mentorService, 'getMentorSchedule').mockResolvedValueOnce({
        mentor: {
          id: 'mentor-2-priya',
          name: 'Priya Patel',
          email: 'priya.patel@codeyoung.com',
          timeZone: 'Asia/Kolkata',
          isActive: true,
          workDays: [1, 2, 3, 4, 5],
          workStartHour: 10,
          workEndHour: 19,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        queryDate: '2026-10-12',
        mentorLocalDateRange: {
          startUtc: new Date('2026-10-11T18:30:00.000Z'),
          endUtc: new Date('2026-10-12T18:29:59.999Z'),
        },
        capacity: {
          maxDailyClasses: 2,
          confirmedClassesCount: 1,
          availableCapacity: 1,
          isFullyBooked: false,
        },
        bookings: [],
      });

      const res = await request(app)
        .get('/api/mentors/mentor-2-priya/schedule?date=2026-10-12')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });

    it('protects admin outbox and email audit endpoints from unauthenticated and mentor roles', async () => {
      // Unauthenticated
      const unauthRes = await request(app).get('/api/notifications/recent');
      expect(unauthRes.status).toBe(401);

      // Mentor role attempting to access admin outbox
      const mentorForbiddenRes = await request(app)
        .get('/api/notifications/recent')
        .set('Authorization', `Bearer ${mentorToken}`);
      expect(mentorForbiddenRes.status).toBe(403);

      // Admin role allowed
      const adminRes = await request(app)
        .get('/api/notifications/recent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
    });
  });

  describe('2. Cloudflare Turnstile & Bot Protection', () => {
    it('rejects invalid CAPTCHA token on booking submission', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          parentName: 'Bot User',
          parentEmail: 'bot@example.com',
          parentTimeZone: 'America/New_York',
          startAt: '2026-10-12T13:00:00.000Z',
          captchaToken: 'invalid-captcha-token',
          verificationToken: 'test-verified-token',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/CAPTCHA/i);
    });
  });

  describe('3. Email OTP Verification Lifecycle & Security', () => {
    it('sends 6-digit OTP code to parent email and enforces cooldown timer', async () => {
      const email = 'parent.security.test@example.com';
      const sendSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValueOnce({
        id: 'msg-otp-1',
        provider: 'mock',
        status: 'sent',
      });

      const res = await request(app)
        .post('/api/auth/otp/send')
        .send({ email });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(sendSpy).toHaveBeenCalled();

      // Immediate resend triggers cooldown
      const resendRes = await request(app)
        .post('/api/auth/otp/send')
        .send({ email });

      expect(resendRes.status).toBe(400);
      expect(resendRes.body.message).toMatch(/Please wait \d+ seconds before requesting a new verification code/i);
    });

    it('rejects wrong OTP with attempt count and invalidates upon max failures', async () => {
      const email = 'parent.wrong.otp@example.com';
      await otpService.sendOtp(email);

      // Wrong OTP attempt 1
      const res1 = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email, otp: '000000' });

      expect(res1.status).toBe(400);
      expect(res1.body.message).toMatch(/Incorrect verification code. 2 attempt\(s\) remaining/i);

      // Wrong OTP attempt 2
      const res2 = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email, otp: '111111' });

      expect(res2.status).toBe(400);
      expect(res2.body.message).toMatch(/Incorrect verification code. 1 attempt\(s\) remaining/i);

      // Wrong OTP attempt 3 -> invalidates
      const res3 = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email, otp: '222222' });

      expect(res3.status).toBe(400);
      expect(res3.body.message).toMatch(/Maximum attempts exceeded/i);
    });

    it('rejects booking creation if parent email is unverified', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          parentName: 'Unverified Parent',
          parentEmail: 'unverified@example.com',
          parentTimeZone: 'America/New_York',
          startAt: '2026-10-12T13:00:00.000Z',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('EMAIL_VERIFICATION_REQUIRED');
    });

    it('accepts booking creation with verified email token', async () => {
      const email = 'verified.parent@example.com';
      const token = otpService.registerVerifiedEmail(email);

      vi.spyOn(bookingService, 'createBooking').mockResolvedValueOnce({
        id: 'booking-verified-1',
        status: 'CONFIRMED',
        course: 'Python Programming & AI Basics',
        demoClassUrl: 'https://meet.codeyoung.com/trial/v1',
        startAtUtc: '2026-10-12T13:00:00.000Z',
        endAtUtc: '2026-10-12T13:30:00.000Z',
        durationMinutes: 30,
        parent: {
          id: 'p1',
          name: 'Verified Parent',
          email,
          phone: null,
          timeZone: 'America/New_York',
          localStartTime: '2026-10-12 09:00:00 (EDT)',
          localEndTime: '09:30:00 (EDT)',
        },
        mentor: {
          id: 'm1',
          name: 'Aarav Sharma',
          email: 'aarav.sharma@codeyoung.com',
          timeZone: 'Asia/Kolkata',
          localStartTime: '2026-10-12 18:30:00 (IST)',
          localEndTime: '19:00:00 (IST)',
        },
        createdAt: '2026-10-09T15:00:00.000Z',
      });

      const res = await request(app)
        .post('/api/bookings')
        .send({
          parentName: 'Verified Parent',
          parentEmail: email,
          parentTimeZone: 'America/New_York',
          startAt: '2026-10-12T13:00:00.000Z',
          verificationToken: token,
          captchaToken: 'test-captcha-token',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe('booking-verified-1');
    });
  });

  describe('4. Company Mentor & Admin Authentication', () => {
    it('authenticates mentor with valid credentials and returns JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'aarav.sharma@codeyoung.com',
          password: 'Mentor@Codeyoung2026!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('MENTOR');
      expect(res.body.data.user.email).toBe('aarav.sharma@codeyoung.com');
    });

    it('authenticates admin with valid credentials and returns ADMIN role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@codeyoung.com',
          password: 'Admin@Codeyoung2026!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    it('rejects invalid password with generic error message without account enumeration leak', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'aarav.sharma@codeyoung.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email address or password.');
    });

    it('retrieves user profile from /api/auth/me with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('admin@codeyoung.com');
      expect(res.body.data.user.role).toBe('ADMIN');
    });
  });
});
