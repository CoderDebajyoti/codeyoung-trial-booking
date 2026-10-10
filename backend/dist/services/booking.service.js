"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingService = exports.BookingService = exports.TrialEligibilityError = exports.SlotUnavailableError = exports.InactiveCourseError = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const mentor_repository_js_1 = require("../repositories/mentor.repository.js");
const parent_repository_js_1 = require("../repositories/parent.repository.js");
const booking_repository_js_1 = require("../repositories/booking.repository.js");
const course_repository_js_1 = require("../repositories/course.repository.js");
const notification_service_js_1 = require("./notification.service.js");
const env_js_1 = require("../config/env.js");
const dateUtils_js_1 = require("../lib/dateUtils.js");
const date_fns_1 = require("date-fns");
class InactiveCourseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InactiveCourseError';
    }
}
exports.InactiveCourseError = InactiveCourseError;
class SlotUnavailableError extends Error {
    alternativeSlots;
    constructor(message, alternativeSlots = []) {
        super(message);
        this.name = 'SlotUnavailableError';
        this.alternativeSlots = alternativeSlots;
    }
}
exports.SlotUnavailableError = SlotUnavailableError;
class TrialEligibilityError extends Error {
    constructor(message = 'This student has already used their trial class. Please contact our team to explore available courses.') {
        super(message);
        this.name = 'TrialEligibilityError';
    }
}
exports.TrialEligibilityError = TrialEligibilityError;
class AsyncLock {
    queue = Promise.resolve();
    async acquire(fn) {
        let release;
        const wait = new Promise((resolve) => {
            release = resolve;
        });
        const current = this.queue;
        this.queue = current.then(() => wait);
        await current;
        try {
            return await fn();
        }
        finally {
            release();
        }
    }
}
const bookingLock = new AsyncLock();
class BookingService {
    /**
     * Find available start slots for a parent's requested local date and time zone.
     */
    async getAvailableSlots(parentLocalDateStr, parentTimeZone) {
        if (!(0, dateUtils_js_1.isValidTimeZone)(parentTimeZone)) {
            throw new Error(`Invalid IANA time zone: ${parentTimeZone}`);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(parentLocalDateStr)) {
            throw new Error(`Invalid date format: ${parentLocalDateStr}. Expected YYYY-MM-DD.`);
        }
        const canonicalParentTz = (0, dateUtils_js_1.normalizeTimeZone)(parentTimeZone);
        const mentors = await mentor_repository_js_1.mentorRepository.findAllActive();
        const { startUtc, endUtc } = (0, dateUtils_js_1.getLocalDayUtcRange)(parentLocalDateStr, canonicalParentTz);
        const availableSlots = [];
        // Evaluate 30-minute interval slots from startUtc to endUtc
        let currentSlotStart = new Date(startUtc);
        while (currentSlotStart < endUtc) {
            const currentSlotEnd = (0, date_fns_1.addMinutes)(currentSlotStart, dateUtils_js_1.CLASS_DURATION_MINUTES);
            // Check how many mentors can take this slot
            let eligibleMentorsCount = 0;
            for (const mentor of mentors) {
                if ((0, dateUtils_js_1.isWithinMentorWorkingHours)(currentSlotStart, currentSlotEnd, mentor)) {
                    // Check overlap
                    const overlaps = await booking_repository_js_1.bookingRepository.findOverlappingConfirmedBookings(mentor.id, currentSlotStart, currentSlotEnd);
                    if (overlaps.length === 0) {
                        // Check daily limit for mentor's local date
                        const mentorLocalDate = (0, dateUtils_js_1.getLocalDateString)(currentSlotStart, mentor.timeZone);
                        const { startUtc: mentorDayStart, endUtc: mentorDayEnd } = (0, dateUtils_js_1.getLocalDayUtcRange)(mentorLocalDate, mentor.timeZone);
                        const dailyCount = await booking_repository_js_1.bookingRepository.countMentorConfirmedInUtcRange(mentor.id, mentorDayStart, mentorDayEnd);
                        if (dailyCount < 2) {
                            eligibleMentorsCount++;
                        }
                    }
                }
            }
            if (eligibleMentorsCount > 0) {
                availableSlots.push({
                    startUtc: currentSlotStart.toISOString(),
                    endUtc: currentSlotEnd.toISOString(),
                    parentLocalDate: parentLocalDateStr,
                    parentLocalTime: (0, dateUtils_js_1.formatLocalTime)(currentSlotStart, canonicalParentTz, 'HH:mm'),
                    parentTimeZone: canonicalParentTz,
                    availableMentorsCount: eligibleMentorsCount,
                });
            }
            currentSlotStart = (0, date_fns_1.addMinutes)(currentSlotStart, 30);
        }
        return availableSlots;
    }
    /**
     * Find alternative slots (e.g. in the next 3 days) when a requested slot is unavailable.
     */
    async findAlternativeSlots(parentLocalDateStr, parentTimeZone, limit = 4) {
        const alternatives = [];
        const dateObj = new Date(parentLocalDateStr);
        for (let offset = 0; offset <= 2; offset++) {
            const checkDate = (0, dateUtils_js_1.getLocalDateString)((0, date_fns_1.addDays)(dateObj, offset), parentTimeZone);
            const slots = await this.getAvailableSlots(checkDate, parentTimeZone);
            for (const slot of slots) {
                alternatives.push(slot);
                if (alternatives.length >= limit)
                    return alternatives;
            }
        }
        return alternatives;
    }
    /**
     * Concurrency-safe atomic booking creation with fair mentor assignment and 2-classes daily capacity rule.
     */
    async createBooking(input) {
        return await bookingLock.acquire(async () => {
            if (!(0, dateUtils_js_1.isValidTimeZone)(input.parentTimeZone)) {
                throw new Error(`Invalid IANA parent time zone: ${input.parentTimeZone}`);
            }
            const canonicalParentTz = (0, dateUtils_js_1.normalizeTimeZone)(input.parentTimeZone);
            const startUtc = (0, dateUtils_js_1.parseRequestedStart)(input.startAt, canonicalParentTz);
            const endUtc = (0, date_fns_1.addMinutes)(startUtc, dateUtils_js_1.CLASS_DURATION_MINUTES);
            // 1. Idempotency Check: if idempotency key was previously processed, return existing booking
            if (input.idempotencyKey) {
                const existing = await booking_repository_js_1.bookingRepository.findByIdempotencyKey(input.idempotencyKey);
                if (existing) {
                    return this.formatBookingResponse(existing);
                }
            }
            // 2. Pre-check Trial Eligibility (1 confirmed trial per student/parent by default)
            const priorTrials = await booking_repository_js_1.bookingRepository.countConfirmedTrialsForParentOrStudent(input.parentEmail, input.studentName);
            if (priorTrials >= env_js_1.env.MAX_TRIALS_PER_STUDENT) {
                throw new TrialEligibilityError('This student has already used their trial class. Please contact our team to explore available courses.');
            }
            // 3. Course Verification & Inactive Course Protection
            let resolvedCourseTitle = input.course || 'Coding & STEM Trial';
            let resolvedCourseId = input.courseId || null;
            if (input.courseId) {
                const course = await course_repository_js_1.courseRepository.findById(input.courseId);
                if (course) {
                    if (!course.isActive) {
                        throw new InactiveCourseError('The selected course is currently inactive and cannot be booked for trial classes.');
                    }
                    resolvedCourseTitle = course.title;
                    resolvedCourseId = course.id;
                }
            }
            else if (input.course) {
                const allCourses = await course_repository_js_1.courseRepository.findAll(true);
                const matchingCourse = allCourses.find((c) => c.id === input.course || c.title.toLowerCase() === input.course?.toLowerCase());
                if (matchingCourse) {
                    if (!matchingCourse.isActive) {
                        throw new InactiveCourseError('The selected course is currently inactive and cannot be booked for trial classes.');
                    }
                    resolvedCourseTitle = matchingCourse.title;
                    resolvedCourseId = matchingCourse.id;
                }
            }
            // 4. Identify candidate mentors who are generally working during this slot
            const allMentors = await mentor_repository_js_1.mentorRepository.findAllActive();
            const candidateMentors = allMentors.filter((m) => (0, dateUtils_js_1.isWithinMentorWorkingHours)(startUtc, endUtc, m));
            if (candidateMentors.length === 0) {
                const parentDate = (0, dateUtils_js_1.getLocalDateString)(startUtc, canonicalParentTz);
                const alternatives = await this.findAlternativeSlots(parentDate, canonicalParentTz);
                throw new SlotUnavailableError('No mentors are scheduled to work at the requested time.', alternatives);
            }
            // 5. Execute in transaction (or in-memory transactional logic if DB is offline)
            const candidateIds = candidateMentors.map((m) => m.id);
            const executeAssignmentLogic = async (tx) => {
                // In-transaction idempotency verification
                if (input.idempotencyKey) {
                    const existingTx = await booking_repository_js_1.bookingRepository.findByIdempotencyKey(input.idempotencyKey, tx);
                    if (existingTx) {
                        return existingTx;
                    }
                }
                // In-transaction trial eligibility check to prevent concurrent duplicate trial bookings
                const inTxTrials = await booking_repository_js_1.bookingRepository.countConfirmedTrialsForParentOrStudent(input.parentEmail, input.studentName, tx);
                if (inTxTrials >= env_js_1.env.MAX_TRIALS_PER_STUDENT) {
                    throw new TrialEligibilityError('This student has already used their trial class. Please contact our team to explore available courses.');
                }
                // Explicitly lock candidate mentor records in deterministic ID order
                if (tx) {
                    await mentor_repository_js_1.mentorRepository.lockMentorsByIds(tx, candidateIds);
                }
                // Evaluate eligibility and current daily load inside the transaction
                const mentorLoads = [];
                for (const mentor of candidateMentors) {
                    // Double-check overlapping bookings inside transaction
                    const overlaps = await booking_repository_js_1.bookingRepository.findOverlappingConfirmedBookings(mentor.id, startUtc, endUtc, tx);
                    if (overlaps.length > 0) {
                        continue; // Mentor has a conflicting booking
                    }
                    // Calculate mentor's local calendar day window
                    const mentorLocalDate = (0, dateUtils_js_1.getLocalDateString)(startUtc, mentor.timeZone);
                    const { startUtc: mentorDayStart, endUtc: mentorDayEnd } = (0, dateUtils_js_1.getLocalDayUtcRange)(mentorLocalDate, mentor.timeZone);
                    const dailyCount = await booking_repository_js_1.bookingRepository.countMentorConfirmedInUtcRange(mentor.id, mentorDayStart, mentorDayEnd, tx);
                    if (dailyCount < 2) {
                        mentorLoads.push({ mentor, dailyCount });
                    }
                }
                if (mentorLoads.length === 0) {
                    return null; // All candidates are busy or at capacity
                }
                // Fair Assignment Algorithm:
                mentorLoads.sort((a, b) => {
                    if (a.dailyCount !== b.dailyCount) {
                        return a.dailyCount - b.dailyCount;
                    }
                    return a.mentor.id.localeCompare(b.mentor.id);
                });
                const selectedMentor = mentorLoads[0].mentor;
                // Find or create parent
                const parent = await parent_repository_js_1.parentRepository.findOrCreate({
                    name: input.parentName,
                    email: input.parentEmail,
                    phone: input.parentPhone,
                    timeZone: canonicalParentTz,
                }, tx);
                // Generate configurable demo class meeting URL
                const baseUrl = env_js_1.env.DEMO_CLASS_BASE_URL.replace(/\/+$/, '');
                const demoClassUrl = `${baseUrl}/${Math.random().toString(36).substring(2, 9)}`;
                // Create confirmed booking
                const newBooking = await booking_repository_js_1.bookingRepository.create({
                    parentId: parent.id,
                    mentorId: selectedMentor.id,
                    courseId: resolvedCourseId,
                    course: resolvedCourseTitle,
                    studentName: input.studentName || null,
                    startAt: startUtc,
                    endAt: endUtc,
                    parentTimeZone: canonicalParentTz,
                    mentorTimeZone: (0, dateUtils_js_1.normalizeTimeZone)(selectedMentor.timeZone),
                    demoClassUrl,
                    idempotencyKey: input.idempotencyKey || null,
                }, tx);
                return newBooking;
            };
            let bookingResult = null;
            try {
                bookingResult = await prisma_js_1.prisma.$transaction(async (tx) => {
                    return executeAssignmentLogic(tx);
                });
                (0, prisma_js_1.markDbConnected)();
            }
            catch (error) {
                if (error instanceof TrialEligibilityError ||
                    error instanceof SlotUnavailableError ||
                    error instanceof InactiveCourseError) {
                    throw error;
                }
                (0, prisma_js_1.markDbDisconnected)(error);
                if ((0, env_js_1.isFallbackAllowed)()) {
                    console.warn('[WARN] Transaction failed; executing via in-memory store (ALLOW_IN_MEMORY_FALLBACK=true).');
                    bookingResult = await executeAssignmentLogic();
                }
                else {
                    throw new prisma_js_1.DatabaseConnectionError('Failed to record booking in database. Persistent storage is unavailable.');
                }
            }
            if (!bookingResult) {
                const parentDate = (0, dateUtils_js_1.getLocalDateString)(startUtc, input.parentTimeZone);
                const alternatives = await this.findAlternativeSlots(parentDate, input.parentTimeZone);
                throw new SlotUnavailableError('All eligible mentors are fully booked or at maximum daily capacity for this time slot.', alternatives);
            }
            // Queue durable notifications (immediate confirmations + 30-min reminders)
            await notification_service_js_1.notificationService.queueBookingNotifications(bookingResult);
            // Trigger immediate asynchronous outbox dispatch
            notification_service_js_1.notificationService.processOutbox().catch((err) => {
                console.error('Failed in initial outbox dispatch:', err);
            });
            return this.formatBookingResponse(bookingResult);
        });
    }
    async getBookingById(id) {
        const booking = await booking_repository_js_1.bookingRepository.findById(id);
        if (!booking) {
            throw new Error(`Booking not found with ID: ${id}`);
        }
        return this.formatBookingResponse(booking);
    }
    async getAdminBookings(filters) {
        const { total, bookings } = await booking_repository_js_1.bookingRepository.findAllAdmin(filters);
        return {
            total,
            bookings: bookings.map((b) => this.formatBookingResponse(b)),
        };
    }
    formatBookingResponse(booking) {
        return {
            id: booking.id,
            status: booking.status,
            courseId: booking.courseId || null,
            course: booking.course || 'Coding & STEM Trial',
            studentName: booking.studentName || null,
            demoClassUrl: booking.demoClassUrl,
            startAtUtc: booking.startAt.toISOString(),
            endAtUtc: booking.endAt.toISOString(),
            durationMinutes: dateUtils_js_1.CLASS_DURATION_MINUTES,
            parent: {
                id: booking.parent.id,
                name: booking.parent.name,
                email: booking.parent.email,
                phone: booking.parent.phone,
                timeZone: booking.parentTimeZone,
                localStartTime: (0, dateUtils_js_1.formatLocalTime)(booking.startAt, booking.parentTimeZone, 'yyyy-MM-dd HH:mm:ss (zzz)'),
                localEndTime: (0, dateUtils_js_1.formatLocalTime)(booking.endAt, booking.parentTimeZone, 'HH:mm:ss (zzz)'),
            },
            mentor: {
                id: booking.mentor.id,
                name: booking.mentor.name,
                email: booking.mentor.email,
                timeZone: booking.mentorTimeZone,
                localStartTime: (0, dateUtils_js_1.formatLocalTime)(booking.startAt, booking.mentorTimeZone, 'yyyy-MM-dd HH:mm:ss (zzz)'),
                localEndTime: (0, dateUtils_js_1.formatLocalTime)(booking.endAt, booking.mentorTimeZone, 'HH:mm:ss (zzz)'),
            },
            createdAt: booking.createdAt.toISOString(),
        };
    }
    async checkTrialEligibility(parentEmail, studentName) {
        const confirmedCount = await booking_repository_js_1.bookingRepository.countConfirmedTrialsForParentOrStudent(parentEmail, studentName);
        const maxAllowed = env_js_1.env.MAX_TRIALS_PER_STUDENT;
        const eligible = confirmedCount < maxAllowed;
        return {
            eligible,
            remainingTrials: Math.max(0, maxAllowed - confirmedCount),
            maxAllowed,
            message: eligible
                ? undefined
                : 'This student has already used their trial class. Please contact our team to explore available courses.',
        };
    }
}
exports.BookingService = BookingService;
exports.bookingService = new BookingService();
