import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { mentorService } from '../../src/services/mentor.service.js';
import { bookingService } from '../../src/services/booking.service.js';

describe('API Endpoints Integration', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('returns 200 OK and health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /api/mentors', () => {
    it('returns list of active mentors', async () => {
      vi.spyOn(mentorService, 'getActiveMentors').mockResolvedValue([
        {
          id: 'mentor-1',
          name: 'Sarah Johnson',
          email: 'sarah@codeyoung.com',
          timeZone: 'America/New_York',
          isActive: true,
          workDays: [1, 2, 3, 4, 5],
          workStartHour: 9,
          workEndHour: 17,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await request(app).get('/api/mentors');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.mentors).toHaveLength(1);
      expect(res.body.data.mentors[0].name).toBe('Sarah Johnson');
    });
  });

  describe('GET /api/slots', () => {
    it('validates date and timezone query params', async () => {
      const res = await request(app).get('/api/slots?date=invalid-date&timeZone=Invalid/Tz');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('returns available slots for valid date and timezone', async () => {
      vi.spyOn(bookingService, 'getAvailableSlots').mockResolvedValue([
        {
          startUtc: '2026-10-12T13:00:00.000Z',
          endUtc: '2026-10-12T13:30:00.000Z',
          parentLocalDate: '2026-10-12',
          parentLocalTime: '09:00',
          parentTimeZone: 'America/New_York',
          availableMentorsCount: 2,
        },
      ]);

      const res = await request(app).get('/api/slots?date=2026-10-12&timeZone=America/New_York');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.slots).toHaveLength(1);
      expect(res.body.data.slots[0].parentLocalTime).toBe('09:00');
    });
  });

  describe('POST /api/bookings', () => {
    it('creates booking successfully with valid inputs', async () => {
      vi.spyOn(bookingService, 'createBooking').mockResolvedValue({
        id: 'booking-123',
        status: 'CONFIRMED',
        demoClassUrl: 'https://meet.codeyoung.com/trial/sample1',
        startAtUtc: '2026-10-12T13:00:00.000Z',
        endAtUtc: '2026-10-12T13:30:00.000Z',
        durationMinutes: 30,
        parent: {
          id: 'parent-1',
          name: 'Jane Smith',
          email: 'jane@example.com',
          timeZone: 'America/New_York',
          localStartTime: '2026-10-12 09:00:00 (EDT)',
          localEndTime: '09:30:00 (EDT)',
        },
        mentor: {
          id: 'mentor-1',
          name: 'Sarah Johnson',
          email: 'sarah@codeyoung.com',
          timeZone: 'America/New_York',
          localStartTime: '2026-10-12 09:00:00 (EDT)',
          localEndTime: '09:30:00 (EDT)',
        },
        createdAt: '2026-10-09T15:00:00.000Z',
      });

      const res = await request(app)
        .post('/api/bookings')
        .send({
          parentName: 'Jane Smith',
          parentEmail: 'jane@example.com',
          parentTimeZone: 'America/New_York',
          startAt: '2026-10-12T13:00:00.000Z',
          idempotencyKey: 'idem-test-1',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe('booking-123');
      expect(res.body.data.demoClassUrl).toBe('https://meet.codeyoung.com/trial/sample1');
    });

    it('returns 400 when invalid input is submitted', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          parentName: 'J',
          parentEmail: 'not-an-email',
          parentTimeZone: 'Invalid/Zone',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/mentors/:id/schedule', () => {
    it('returns mentor schedule with capacity limits', async () => {
      vi.spyOn(mentorService, 'getMentorSchedule').mockResolvedValue({
        mentor: {
          id: 'mentor-1',
          name: 'Sarah Johnson',
          email: 'sarah@codeyoung.com',
          timeZone: 'America/New_York',
          isActive: true,
          workDays: [1, 2, 3, 4, 5],
          workStartHour: 9,
          workEndHour: 17,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        queryDate: '2026-10-12',
        mentorLocalDateRange: {
          startUtc: new Date('2026-10-12T04:00:00.000Z'),
          endUtc: new Date('2026-10-13T03:59:59.999Z'),
        },
        capacity: {
          maxDailyClasses: 2,
          confirmedClassesCount: 1,
          availableCapacity: 1,
          isFullyBooked: false,
        },
        bookings: [],
      });

      const res = await request(app).get('/api/mentors/mentor-1/schedule?date=2026-10-12');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.mentor.id).toBe('mentor-1');
      expect(res.body.data.capacity.maxDailyClasses).toBe(2);
    });

    it('returns 400 if date query parameter is missing', async () => {
      const res = await request(app).get('/api/mentors/mentor-1/schedule');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });
  });
});

