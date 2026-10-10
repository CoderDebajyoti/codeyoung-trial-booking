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
  verificationToken?: string;
  captchaToken?: string;
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

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'MENTOR' | 'ADMIN';
  mentorId?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const AUTH_TOKEN_KEY = 'codeyoung_auth_token';

export const tokenStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string) {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {}
  },
  clearToken() {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {}
  },
};

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

  async checkTrialEligibility(email: string, studentName?: string): Promise<{ eligible: boolean; remainingTrials: number; maxAllowed: number; message?: string }> {
    const params = new URLSearchParams({ email });
    if (studentName) params.append('studentName', studentName);
    const res = await fetch(`${API_BASE}/bookings/eligibility?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to check trial eligibility');
    }
    const json = await res.json();
    return json.data;
  },

  async getMentorSchedule(mentorId: string, date: string): Promise<MentorScheduleResponse['data']> {
    const headers: Record<string, string> = {};
    const token = tokenStorage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/mentors/${mentorId}/schedule?date=${date}`, {
      headers,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch mentor schedule');
    }
    return json.data;
  },

  // -------------------------------------------------------------
  // Authentication & OTP API Methods
  // -------------------------------------------------------------

  async sendOtp(email: string, captchaToken?: string): Promise<{ success: boolean; message: string; cooldownSeconds: number }> {
    const res = await fetch(`${API_BASE}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, captchaToken }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to send verification code');
    }
    return {
      success: true,
      message: json.message,
      cooldownSeconds: json.data?.cooldownSeconds || 60,
    };
  },

  async verifyOtp(email: string, otp: string): Promise<{ verificationToken: string }> {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Invalid verification code');
    }
    return {
      verificationToken: json.data.verificationToken,
    };
  },

  async login(email: string, password: string, captchaToken?: string): Promise<{ user: AuthUser; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, captchaToken }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Authentication failed');
    }

    tokenStorage.setToken(json.data.token);
    return json.data;
  },

  async getMe(): Promise<AuthUser | null> {
    const token = tokenStorage.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        tokenStorage.clearToken();
        return null;
      }

      const json = await res.json();
      return json.data.user;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    tokenStorage.clearToken();
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch {}
  },
};
