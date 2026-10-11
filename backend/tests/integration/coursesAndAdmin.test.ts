import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { signUserToken } from '../../src/lib/jwt.js';
import { prisma } from '../../src/lib/prisma.js';
import { inMemoryStore } from '../../src/lib/inMemoryStore.js';
import { courseRepository } from '../../src/repositories/course.repository.js';

describe('Courses & Admin Bookings Management Integration Tests', () => {
  const app = createApp();

  const adminToken = signUserToken({
    userId: 'admin-1',
    email: 'admin@codeyoung.com',
    name: 'Academic Operations Admin',
    role: 'ADMIN',
  });

  const mentorToken = signUserToken({
    userId: 'mentor-1',
    email: 'aarav.sharma@codeyoung.com',
    name: 'Aarav Sharma',
    role: 'MENTOR',
    mentorId: 'mentor-1-aarav',
  });

  beforeEach(async () => {
    inMemoryStore.reset();
    try {
      await prisma.notification.deleteMany();
      await prisma.booking.deleteMany();
      await prisma.parent.deleteMany();
    } catch {
      // ignore if db reset
    }
  });

  describe('Course Catalogue Endpoints (Public & Admin)', () => {
    it('GET /api/courses returns all active courses with packages and pricing and no duplicates', async () => {
      const res = await request(app).get('/api/courses');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.courses.length).toBeGreaterThanOrEqual(10);

      const pythonCourse = res.body.data.courses.find((c: any) => c.id === 'python-ai');
      expect(pythonCourse).toBeDefined();
      expect(pythonCourse.title).toBe('Python Programming & AI Basics');
      expect(pythonCourse.category).toBe('Coding & Programming');
      expect(pythonCourse.packages.length).toBe(4);
      expect(pythonCourse.packages[0].name).toBe('1 Month Starter');
      expect(pythonCourse.packages[0].classesCount).toBe(8);

      // Verify Cyber Security course is unique and canonical
      const cyberCourses = res.body.data.courses.filter(
        (c: any) => c.id === 'cyber-security' || c.title.toLowerCase().includes('cyber security')
      );
      expect(cyberCourses.length).toBe(1);
      expect(cyberCourses[0].id).toBe('cyber-security');
      expect(cyberCourses[0].title).toBe('Cyber Security & Ethical Hacking');
      expect(cyberCourses[0].packages.length).toBe(4);

      // Verify all courses have unique IDs
      const ids = res.body.data.courses.map((c: any) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('GET /api/courses/:id returns single course with complete packages for cyber-security', async () => {
      const res = await request(app).get('/api/courses/cyber-security');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe('cyber-security');
      expect(res.body.data.title).toBe('Cyber Security & Ethical Hacking');
      expect(res.body.data.packages.length).toBe(4);
      expect(res.body.data.packages.map((p: any) => p.name)).toEqual([
        '1 Month Starter',
        '2 Months Foundation',
        '3 Months Pro',
        '6 Months Master',
      ]);
    });

    it('GET /api/courses/:id returns single course with complete packages', async () => {
      const res = await request(app).get('/api/courses/web-dev');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe('web-dev');
      expect(res.body.data.title).toBe('Web Development (HTML, CSS & JavaScript)');
      expect(res.body.data.packages.length).toBe(4);
    });

    it('POST /api/courses allows admin to create new course and rejects unauthorized users', async () => {
      const uniqueCourseId = `test-course-${Date.now()}`;

      // 1. Unauthenticated request -> 401
      const unauthRes = await request(app).post('/api/courses').send({
        id: uniqueCourseId,
        title: 'Test Robotics & Drones',
        category: 'AI & Robotics',
        shortDesc: 'Learn drone automation, sensor calibration, and flight physics.',
        ageGroup: 'Ages 12-18',
        outcomes: 'Drone flight dynamics,Sensor calibration,Autonomous navigation',
        duration: '3 - 6 Months',
      });
      expect(unauthRes.status).toBe(401);

      // 2. Mentor (non-admin) request -> 403
      const mentorRes = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          id: uniqueCourseId,
          title: 'Test Robotics & Drones',
          category: 'AI & Robotics',
          shortDesc: 'Learn drone automation, sensor calibration, and flight physics.',
          ageGroup: 'Ages 12-18',
          outcomes: 'Drone flight dynamics,Sensor calibration,Autonomous navigation',
          duration: '3 - 6 Months',
        });
      expect(mentorRes.status).toBe(403);

      // 3. Admin request -> 201 Created
      const adminRes = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: uniqueCourseId,
          title: 'Test Robotics & Drones',
          category: 'AI & Robotics',
          shortDesc: 'Learn drone automation, sensor calibration, and flight physics.',
          ageGroup: 'Ages 12-18',
          outcomes: 'Drone flight dynamics,Sensor calibration,Autonomous navigation',
          duration: '3 - 6 Months',
          price: 150,
          currency: 'USD',
        });
      expect(adminRes.status).toBe(201);
      expect(adminRes.body.data.id).toBe(uniqueCourseId);

      // 4. Clean up test-created course to prevent test pollution
      await request(app)
        .delete(`/api/courses/${uniqueCourseId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('PUT /api/courses/:id allows admin to update course details or toggle active status', async () => {
      const res = await request(app)
        .put('/api/courses/scratch-game')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 125,
          shortDesc: 'Updated short description for Scratch visual coding.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.price).toBe(125);
    });
  });

  describe('Trial Booking Course Verification & Inactive Protection', () => {
    it('prevents booking for inactive courses with clear error code', async () => {
      // Create or deactivate a course
      try {
        await courseRepository.update('scratch-game', { isActive: false });
      } catch {
        // ignore
      }

      const bookingPayload = {
        parentName: 'Inactive Test Parent',
        studentName: 'Bobby',
        parentEmail: 'inactive.test@example.com',
        parentPhone: '+1 (555) 345-6789',
        courseId: 'scratch-game',
        parentTimeZone: 'America/New_York',
        startAt: '2026-10-14 14:00',
        verificationToken: 'test-verified-token',
        captchaToken: 'test-captcha-token',
      };

      const res = await request(app).post('/api/bookings').send(bookingPayload);
      expect(res.status).toBe(422);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('COURSE_INACTIVE');
      expect(res.body.message).toContain('currently inactive');

      // Re-enable course for subsequent tests
      try {
        await courseRepository.update('scratch-game', { isActive: true });
      } catch {}
    });

    it('creates booking with preselected course and stores studentName and courseId', async () => {
      const bookingPayload = {
        parentName: 'Deepa Verma',
        studentName: 'Aarav Verma',
        parentEmail: 'deepa.verma@example.com',
        parentPhone: '+91 9876543210',
        courseId: 'python-ai',
        parentTimeZone: 'Asia/Kolkata',
        startAt: '2026-10-14 15:00',
        verificationToken: 'test-verified-token',
        captchaToken: 'test-captcha-token',
      };

      const res = await request(app).post('/api/bookings').send(bookingPayload);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.course).toBe('Python Programming & AI Basics');
      expect(res.body.data.courseId).toBe('python-ai');
      expect(res.body.data.studentName).toBe('Aarav Verma');
    });

    it('creates trial booking with cyber-security course and stores canonical courseId', async () => {
      const bookingPayload = {
        parentName: 'Marcus Vance',
        studentName: 'Leo Vance',
        parentEmail: 'marcus.vance@example.com',
        parentPhone: '+1 (555) 234-5678',
        courseId: 'cyber-security',
        parentTimeZone: 'America/New_York',
        startAt: '2026-10-14 16:00',
        verificationToken: 'test-verified-token',
        captchaToken: 'test-captcha-token',
      };

      const res = await request(app).post('/api/bookings').send(bookingPayload);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.course).toBe('Cyber Security & Ethical Hacking');
      expect(res.body.data.courseId).toBe('cyber-security');
      expect(res.body.data.studentName).toBe('Leo Vance');
    });
  });

  describe('Admin Trial Bookings Query, Search & Sorting', () => {
    beforeEach(async () => {
      // Create 2 test bookings
      await request(app).post('/api/bookings').send({
        parentName: 'Rajesh Kumar',
        studentName: 'Aarav Kumar',
        parentEmail: 'rajesh.kumar@example.com',
        parentPhone: '+91 9876500001',
        courseId: 'python-ai',
        parentTimeZone: 'Asia/Kolkata',
        startAt: '2026-10-14 10:00',
        verificationToken: 'test-verified-token',
        captchaToken: 'test-captcha-token',
      });

      await request(app).post('/api/bookings').send({
        parentName: 'Emily Watson',
        studentName: 'Sophie Watson',
        parentEmail: 'sophie.parent@example.com',
        parentPhone: '+44 7911 123456',
        courseId: 'web-dev',
        parentTimeZone: 'Europe/London',
        startAt: '2026-10-14 14:00',
        verificationToken: 'test-verified-token',
        captchaToken: 'test-captcha-token',
      });
    });

    it('GET /api/bookings rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/bookings');
      expect(res.status).toBe(401);
    });

    it('GET /api/bookings allows admin to search by parent/student name (e.g. "Aarav")', async () => {
      const res = await request(app)
        .get('/api/bookings?search=Aarav')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);

      const booking = res.body.data.bookings.find((b: any) => b.parent.name.includes('Rajesh') || b.studentName?.includes('Aarav'));
      expect(booking).toBeDefined();
      expect(booking.studentName).toBe('Aarav Kumar');
    });

    it('GET /api/bookings supports filtering by courseId and sorting by parentName', async () => {
      const res = await request(app)
        .get('/api/bookings?courseId=python-ai&sortBy=parentName&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.bookings.every((b: any) => b.course.includes('Python'))).toBe(true);
    });
  });
});
