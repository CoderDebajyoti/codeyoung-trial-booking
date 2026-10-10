import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { NotificationType } from '../../src/types/models.js';
import { createApp } from '../../src/app.js';

import { mentorRepository } from '../../src/repositories/mentor.repository.js';
import { parentRepository } from '../../src/repositories/parent.repository.js';
import { bookingRepository } from '../../src/repositories/booking.repository.js';
import { notificationRepository } from '../../src/repositories/notification.repository.js';
import { markDbDisconnected, markDbConnected, DatabaseConnectionError } from '../../src/lib/prisma.js';

describe('Database Failure & Persistence Policy Tests', () => {
  const originalEnv = process.env.ALLOW_IN_MEMORY_FALLBACK;

  beforeEach(() => {
    markDbDisconnected();
  });

  afterEach(() => {
    process.env.ALLOW_IN_MEMORY_FALLBACK = originalEnv;
    markDbConnected();
  });

  describe('When ALLOW_IN_MEMORY_FALLBACK is explicitly disabled (false)', () => {
    beforeEach(() => {
      process.env.ALLOW_IN_MEMORY_FALLBACK = 'false';
      markDbDisconnected();
    });

    it('health check endpoint returns 503 unhealthy with database error information', async () => {
      const app = createApp();
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('unhealthy');
      expect(res.body.database.status).toBe('disconnected');
      expect(res.body.database.persistent).toBe(false);
      expect(res.body.database.error).toBeDefined();
      // Ensure no raw passwords or connection strings are leaked
      expect(JSON.stringify(res.body)).not.toContain('password');
      expect(JSON.stringify(res.body)).not.toContain('postgres:');
    });

    it('mentorRepository throws DatabaseConnectionError instead of returning memory data', async () => {
      await expect(mentorRepository.findAllActive()).rejects.toThrow(DatabaseConnectionError);
      await expect(mentorRepository.findById('mentor-1-aarav')).rejects.toThrow(DatabaseConnectionError);
    });

    it('parentRepository throws DatabaseConnectionError instead of saving to memory', async () => {
      await expect(
        parentRepository.findOrCreate({
          name: 'Test Parent',
          email: 'test@example.com',
          timeZone: 'Asia/Kolkata',
        })
      ).rejects.toThrow(DatabaseConnectionError);
    });

    it('bookingRepository throws DatabaseConnectionError instead of saving to memory', async () => {
      await expect(
        bookingRepository.create({
          parentId: 'p1',
          mentorId: 'm1',
          course: 'Coding',
          startAt: new Date(),
          endAt: new Date(Date.now() + 1800000),
          parentTimeZone: 'Asia/Kolkata',
          mentorTimeZone: 'Asia/Kolkata',
          demoClassUrl: 'https://meet.codeyoung.com/trial/test',
        })
      ).rejects.toThrow(DatabaseConnectionError);
    });

    it('notificationRepository throws DatabaseConnectionError instead of saving to memory', async () => {
      await expect(
        notificationRepository.create({
          bookingId: 'b1',
          type: NotificationType.BOOKING_CONFIRMATION_PARENT,
          recipient: 'parent@example.com',
          recipientRole: 'parent',
          subject: 'Confirmation',
          content: 'Test content',
        })
      ).rejects.toThrow(DatabaseConnectionError);
    });


    it('API returns structured 503 response when database operations fail', async () => {
      const app = createApp();
      const res = await request(app).get('/api/mentors');

      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body).toHaveProperty('code', 'DATABASE_UNAVAILABLE');
      expect(res.body.message).toContain('Persistent database storage is currently unavailable');
    });
  });

  describe('When ALLOW_IN_MEMORY_FALLBACK is explicitly enabled (true)', () => {
    beforeEach(() => {
      process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';
      markDbDisconnected();
    });

    it('health check endpoint returns 200 degraded with clear warning', async () => {
      const app = createApp();
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('degraded');
      expect(res.body.database.status).toBe('disconnected');
      expect(res.body.database.provider).toBe('in-memory-fallback');
      expect(res.body.database.warning).toContain('Data will NOT persist');
    });

    it('mentorRepository safely returns seed mentors in fallback mode', async () => {
      const mentors = await mentorRepository.findAllActive();
      expect(mentors.length).toBeGreaterThan(0);
    });
  });
});
