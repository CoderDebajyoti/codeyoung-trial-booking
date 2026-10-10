"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorService = exports.MentorService = void 0;
const mentor_repository_js_1 = require("../repositories/mentor.repository.js");
const booking_repository_js_1 = require("../repositories/booking.repository.js");
const dateUtils_js_1 = require("../lib/dateUtils.js");
class MentorService {
    async getActiveMentors() {
        return mentor_repository_js_1.mentorRepository.findAllActive();
    }
    async getMentorSchedule(mentorId, localDateStr) {
        const mentor = await mentor_repository_js_1.mentorRepository.findById(mentorId);
        if (!mentor) {
            throw new Error(`Mentor not found with ID: ${mentorId}`);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(localDateStr)) {
            throw new Error(`Invalid date format: ${localDateStr}. Expected YYYY-MM-DD.`);
        }
        const { startUtc, endUtc } = (0, dateUtils_js_1.getLocalDayUtcRange)(localDateStr, mentor.timeZone);
        const bookings = await booking_repository_js_1.bookingRepository.findMentorBookingsInUtcRange(mentorId, startUtc, endUtc);
        const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
        const maxDailyClasses = 2;
        const availableCapacity = Math.max(0, maxDailyClasses - confirmedCount);
        return {
            mentor: {
                id: mentor.id,
                name: mentor.name,
                email: mentor.email,
                timeZone: mentor.timeZone,
                workDays: (0, dateUtils_js_1.parseWorkDays)(mentor.workDays),
                workStartHour: mentor.workStartHour,
                workEndHour: mentor.workEndHour,
            },
            queryDate: localDateStr,
            mentorLocalDateRange: {
                startUtc: startUtc.toISOString(),
                endUtc: endUtc.toISOString(),
            },
            capacity: {
                maxDailyClasses,
                confirmedClassesCount: confirmedCount,
                availableCapacity,
                isFullyBooked: confirmedCount >= maxDailyClasses,
            },
            bookings: bookings.map((b) => ({
                id: b.id,
                startAtUtc: b.startAt.toISOString(),
                endAtUtc: b.endAt.toISOString(),
                mentorLocalStartTime: (0, dateUtils_js_1.formatLocalTime)(b.startAt, mentor.timeZone, 'HH:mm'),
                mentorLocalEndTime: (0, dateUtils_js_1.formatLocalTime)(b.endAt, mentor.timeZone, 'HH:mm'),
                status: b.status,
                parentName: b.parent.name,
                parentEmail: b.parent.email,
                parentTimeZone: b.parentTimeZone,
                demoClassUrl: b.demoClassUrl,
            })),
        };
    }
}
exports.MentorService = MentorService;
exports.mentorService = new MentorService();
