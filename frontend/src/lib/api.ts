export interface SlotItem {
  startUtc: string;
  endUtc: string;
  parentLocalDate: string;
  parentLocalTime: string;
  parentTimeZone: string;
  availableMentorsCount: number;
}

export interface SlotsResponse {
  status: 'success';
  data: {
    queryDate: string;
    timeZone: string;
    totalAvailableSlots: number;
    slots: SlotItem[];
  };
}

export interface CreateBookingRequest {
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  course?: string;
  parentTimeZone: string;
  startAt: string; // UTC ISO string
  idempotencyKey?: string;
}

export interface BookingResponseData {
  id: string;
  status: string;
  course: string;
  demoClassUrl: string;
  startAtUtc: string;
  endAtUtc: string;
  durationMinutes: number;
  parent: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    timeZone: string;
    localStartTime: string;
    localEndTime: string;
  };
  mentor: {
    id: string;
    name: string;
    email: string;
    timeZone: string;
    localStartTime: string;
    localEndTime: string;
  };
  createdAt: string;
}

export interface CreateBookingSuccessResponse {
  status: 'success';
  data: BookingResponseData;
}

export interface CreateBookingErrorResponse {
  status: 'fail' | 'error';
  message: string;
  code?: string;
  alternativeSlots?: SlotItem[];
}

export interface MentorItem {
  id: string;
  name: string;
  email: string;
  timeZone: string;
  workDays: number[];
  workStartHour: number;
  workEndHour: number;
}

export interface MentorsResponse {
  status: 'success';
  data: {
    totalMentors: number;
    mentors: MentorItem[];
  };
}

export interface MentorScheduleResponse {
  status: 'success';
  data: {
    mentor: MentorItem;
    queryDate: string;
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
  };
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async getHealth(): Promise<{ status: string; uptime: number }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getMentors(): Promise<MentorItem[]> {
    const res = await fetch(`${API_BASE}/mentors`);
    if (!res.ok) throw new Error('Failed to fetch mentors');
    const json: MentorsResponse = await res.json();
    return json.data.mentors;
  },

  async getAvailableSlots(date: string, timeZone: string): Promise<SlotItem[]> {
    const params = new URLSearchParams({ date, timeZone });
    const res = await fetch(`${API_BASE}/slots?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch available slots');
    }
    const json: SlotsResponse = await res.json();
    return json.data.slots;
  },

  async createBooking(data: CreateBookingRequest): Promise<BookingResponseData> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.message || 'Failed to create booking') as Error & {
        code?: string;
        alternativeSlots?: SlotItem[];
      };
      err.code = json.code;
      err.alternativeSlots = json.alternativeSlots;
      throw err;
    }

    return json.data;
  },

  async getMentorSchedule(mentorId: string, date: string): Promise<MentorScheduleResponse['data']> {
    const res = await fetch(`${API_BASE}/mentors/${mentorId}/schedule?date=${date}`);
    if (!res.ok) throw new Error('Failed to fetch mentor schedule');
    const json: MentorScheduleResponse = await res.json();
    return json.data;
  },
};
