import { Mentor } from '../types/models.js';
import { mentorRepository } from '../repositories/mentor.repository.js';
import { bookingRepository } from '../repositories/booking.repository.js';
import { getLocalDayUtcRange, formatLocalTime, parseWorkDays } from '../lib/dateUtils.js';


export interface MentorScheduleResponse {
  mentor: {
    id: string;
    name: string;
    email: string;
    timeZone: string;
    workDays: number[];
    workStartHour: number;
    workEndHour: number;
  };
  queryDate: string; // YYYY-MM-DD in mentor's timezone
  mentorLocalDateRange: {
    startUtc: string;
    endUtc: string;
  };
  capacity: {
    maxDailyClasses: number;
    confirmedClassesCount: number;
    availableCapacity: number;
    isFullyBooked: boolean;
  };
  bookings: Array<{
    id: string;
    startAtUtc: string;
    endAtUtc: string;
    mentorLocalStartTime: string;
    mentorLocalEndTime: string;
    status: string;
    parentName: string;
    parentEmail: string;
    parentTimeZone: string;
    demoClassUrl: string;
  }>;
}

export class MentorService {
  async getActiveMentors(): Promise<Mentor[]> {
    return mentorRepository.findAllActive();
  }

  async getMentorSchedule(mentorId: string, localDateStr: string): Promise<MentorScheduleResponse> {
    const mentor = await mentorRepository.findById(mentorId);
    if (!mentor) {
      throw new Error(`Mentor not found with ID: ${mentorId}`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(localDateStr)) {
      throw new Error(`Invalid date format: ${localDateStr}. Expected YYYY-MM-DD.`);
    }

    const { startUtc, endUtc } = getLocalDayUtcRange(localDateStr, mentor.timeZone);

    const bookings = await bookingRepository.findMentorBookingsInUtcRange(mentorId, startUtc, endUtc);

    const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const maxDailyClasses = 2;
    const availableCapacity = Math.max(0, maxDailyClasses - confirmedCount);

    return {
      mentor: {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        timeZone: mentor.timeZone,
        workDays: parseWorkDays(mentor.workDays),
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
        mentorLocalStartTime: formatLocalTime(b.startAt, mentor.timeZone, 'HH:mm'),
        mentorLocalEndTime: formatLocalTime(b.endAt, mentor.timeZone, 'HH:mm'),
        status: b.status,
        parentName: b.parent.name,
        parentEmail: b.parent.email,
        parentTimeZone: b.parentTimeZone,
        demoClassUrl: b.demoClassUrl,
      })),
    };
  }
}

export const mentorService = new MentorService();
