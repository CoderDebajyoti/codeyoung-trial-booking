import { Mentor, Parent, Booking, BookingStatus, Notification, NotificationType, NotificationStatus } from '@prisma/client';

export interface InMemoryBooking extends Booking {
  mentor: Mentor;
  parent: Parent;
}

const DEFAULT_MENTORS: Mentor[] = [
  {
    id: 'mentor-1-aarav',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@codeyoung.com',
    timeZone: 'Asia/Kolkata',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat for flexible weekend trial classes
    workStartHour: 9,
    workEndHour: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-2-priya',
    name: 'Priya Patel',
    email: 'priya.patel@codeyoung.com',
    timeZone: 'Asia/Kolkata',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 10,
    workEndHour: 19,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-3-rohan',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@codeyoung.com',
    timeZone: 'Asia/Kolkata',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 11,
    workEndHour: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-4-emily',
    name: 'Emily Watson',
    email: 'emily.watson@codeyoung.com',
    timeZone: 'Europe/London',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 9,
    workEndHour: 17,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-5-oliver',
    name: 'Oliver Smith',
    email: 'oliver.smith@codeyoung.com',
    timeZone: 'Europe/London',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 10,
    workEndHour: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-6-james',
    name: 'James Wilson',
    email: 'james.wilson@codeyoung.com',
    timeZone: 'Europe/London',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 8,
    workEndHour: 16,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-7-sarah',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@codeyoung.com',
    timeZone: 'America/New_York',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 9,
    workEndHour: 17,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-8-michael',
    name: 'Michael Brown',
    email: 'michael.brown@codeyoung.com',
    timeZone: 'America/New_York',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 10,
    workEndHour: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-9-david',
    name: 'David Miller',
    email: 'david.miller@codeyoung.com',
    timeZone: 'America/Chicago',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 9,
    workEndHour: 17,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-10-jessica',
    name: 'Jessica Davis',
    email: 'jessica.davis@codeyoung.com',
    timeZone: 'America/Los_Angeles',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 9,
    workEndHour: 17,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

class InMemoryStore {
  public mentors: Mentor[] = [...DEFAULT_MENTORS];
  public parents: Parent[] = [];
  public bookings: InMemoryBooking[] = [];
  public notifications: Notification[] = [];

  getMentors(): Mentor[] {
    return this.mentors.filter((m) => m.isActive);
  }

  getMentorById(id: string): Mentor | null {
    return this.mentors.find((m) => m.id === id) || null;
  }

  findOrCreateParent(data: { name: string; email: string; phone?: string; timeZone: string }): Parent {
    let parent = this.parents.find((p) => p.email === data.email);
    if (!parent) {
      parent = {
        id: `parent-${Math.random().toString(36).substring(2, 9)}`,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        timeZone: data.timeZone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.parents.push(parent);
    } else {
      parent.name = data.name;
      parent.timeZone = data.timeZone;
      if (data.phone) parent.phone = data.phone;
    }
    return parent;
  }

  createBooking(data: {
    parentId: string;
    mentorId: string;
    course?: string;
    startAt: Date;
    endAt: Date;
    parentTimeZone: string;
    mentorTimeZone: string;
    demoClassUrl: string;
    idempotencyKey?: string | null;
  }): InMemoryBooking {
    const mentor = this.getMentorById(data.mentorId);
    const parent = this.parents.find((p) => p.id === data.parentId);
    if (!mentor || !parent) {
      throw new Error('Mentor or parent not found for in-memory booking creation');
    }

    const newBooking: InMemoryBooking = {
      id: `booking-${Math.random().toString(36).substring(2, 9)}`,
      parentId: data.parentId,
      mentorId: data.mentorId,
      course: data.course || 'Coding & STEM Trial',
      startAt: data.startAt,
      endAt: data.endAt,
      parentTimeZone: data.parentTimeZone,
      mentorTimeZone: data.mentorTimeZone,
      status: BookingStatus.CONFIRMED,
      demoClassUrl: data.demoClassUrl,
      idempotencyKey: data.idempotencyKey || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      mentor,
      parent,
    };

    this.bookings.push(newBooking);
    return newBooking;
  }

  createNotification(data: {
    bookingId: string;
    type: NotificationType;
    recipient: string;
    recipientRole: string;
    subject: string;
    content: string;
    htmlContent?: string | null;
    scheduledFor?: Date;
  }): Notification {
    const existing = this.notifications.find(
      (n) => n.bookingId === data.bookingId && n.type === data.type
    );
    if (existing) {
      return existing;
    }

    const notif: Notification = {
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      bookingId: data.bookingId,
      type: data.type,
      recipient: data.recipient,
      recipientRole: data.recipientRole,
      subject: data.subject,
      content: data.content,
      htmlContent: data.htmlContent || null,
      status: NotificationStatus.PENDING,
      scheduledFor: data.scheduledFor || new Date(),
      sentAt: null,
      attemptCount: 0,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notifications.push(notif);
    return notif;
  }

  getPendingNotifications(now: Date = new Date()): Notification[] {
    return this.notifications.filter(
      (n) => n.status === NotificationStatus.PENDING && n.scheduledFor <= now && n.attemptCount < 3
    );
  }

  updateNotification(
    id: string,
    data: {
      status?: NotificationStatus;
      sentAt?: Date | null;
      attemptCount?: number;
      lastError?: string | null;
      scheduledFor?: Date;
    }
  ): Notification | null {
    const notif = this.notifications.find((n) => n.id === id);
    if (!notif) return null;

    if (data.status !== undefined) notif.status = data.status;
    if (data.sentAt !== undefined) notif.sentAt = data.sentAt;
    if (data.attemptCount !== undefined) notif.attemptCount = data.attemptCount;
    if (data.lastError !== undefined) notif.lastError = data.lastError;
    if (data.scheduledFor !== undefined) notif.scheduledFor = data.scheduledFor;
    notif.updatedAt = new Date();

    return notif;
  }
}

export const inMemoryStore = new InMemoryStore();
