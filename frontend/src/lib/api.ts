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

export interface PackageItem {
  id: string;
  courseId: string;
  name?: string;
  duration?: string;
  durationMonths?: number;
  classesCount: number;
  price: number;
  currency: string;
  discountPct?: number;
  isPopular?: boolean;
  isActive: boolean;
}

export interface CourseItem {
  id: string;
  title: string;
  category: string;
  shortDesc?: string;
  description?: string;
  ageGroup: string;
  classLevel?: string | null;
  outcomes?: string;
  learningOutcomes?: string[];
  duration?: string;
  totalClasses?: number;
  classDuration?: number;
  price?: number;
  basePrice?: number;
  currency?: string;
  icon?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  packages: PackageItem[];
}

export interface CoursesResponse {
  status: 'success';
  data: {
    totalCourses: number;
    courses: CourseItem[];
  };
}

export interface CreateBookingRequest {
  parentName: string;
  studentName?: string;
  parentEmail: string;
  parentPhone?: string;
  courseId?: string;
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
  courseId: string | null;
  course: string;
  studentName: string | null;
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

export interface AdminBookingsQuery {
  search?: string;
  status?: string;
  mentorId?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdminBookingsResponse {
  status: 'success';
  data: {
    total: number;
    bookings: BookingResponseData[];
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'MENTOR' | 'ADMIN' | 'PARENT';
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

  // -------------------------------------------------------------
  // Course Catalogue & Packages API
  // -------------------------------------------------------------
  async getCourses(category?: string, includeInactive = false): Promise<CourseItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All Courses') params.set('category', category);
    if (includeInactive) params.set('includeInactive', 'true');
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/courses${queryStr}`);
    if (!res.ok) throw new Error('Failed to fetch courses');
    const json = await res.json();
    if (Array.isArray(json)) return json;
    if (json.data?.courses && Array.isArray(json.data.courses)) return json.data.courses;
    if (Array.isArray(json.data)) return json.data;
    return [];
  },

  async getCourseById(id: string): Promise<CourseItem> {
    const res = await fetch(`${API_BASE}/courses/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch course: ${id}`);
    }
    const json = await res.json();
    return json.data || json;
  },

  async createCourse(data: Partial<CourseItem>): Promise<CourseItem> {
    const token = tokenStorage.getToken();
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create course');
    return json.data;
  },

  async updateCourse(id: string, data: Partial<CourseItem>): Promise<CourseItem> {
    const token = tokenStorage.getToken();
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update course');
    return json.data;
  },

  async deleteCourse(id: string): Promise<void> {
    const token = tokenStorage.getToken();
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message || 'Failed to delete course');
    }
  },

  async upsertPackage(
    courseIdOrData: string | (Partial<PackageItem> & { courseId: string }),
    maybeData?: Partial<PackageItem>
  ): Promise<PackageItem> {
    const courseId = typeof courseIdOrData === 'string' ? courseIdOrData : courseIdOrData.courseId;
    const payload = typeof courseIdOrData === 'string' ? maybeData : courseIdOrData;
    const token = tokenStorage.getToken();
    const res = await fetch(`${API_BASE}/courses/${courseId}/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to save package');
    return json.data;
  },

  async deletePackage(packageId: string): Promise<void> {
    const token = tokenStorage.getToken();
    const res = await fetch(`${API_BASE}/courses/packages/${packageId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message || 'Failed to delete package');
    }
  },

  // -------------------------------------------------------------
  // Mentors & Slots API
  // -------------------------------------------------------------
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

  async getAdminBookings(filters: AdminBookingsQuery = {}): Promise<{ total: number; bookings: BookingResponseData[] }> {
    const token = tokenStorage.getToken();
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.mentorId) params.append('mentorId', filters.mentorId);
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const res = await fetch(`${API_BASE}/bookings?${params.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const json: AdminBookingsResponse = await res.json();
    if (!res.ok) {
      throw new Error((json as any).message || 'Failed to fetch admin bookings');
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
