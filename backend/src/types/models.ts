import {
  Mentor as PrismaMentor,
  Parent as PrismaParent,
  Booking as PrismaBooking,
  Notification as PrismaNotification,
  Course as PrismaCourse,
  Package as PrismaPackage,
} from '@prisma/client';

export const BookingStatus = {
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const NotificationType = {
  BOOKING_CONFIRMATION_PARENT: 'BOOKING_CONFIRMATION_PARENT',
  BOOKING_NOTIFICATION_MENTOR: 'BOOKING_NOTIFICATION_MENTOR',
  CLASS_REMINDER_PARENT: 'CLASS_REMINDER_PARENT',
  CLASS_REMINDER_MENTOR: 'CLASS_REMINDER_MENTOR',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  FAILED: 'FAILED',
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export interface Mentor extends Omit<PrismaMentor, 'workDays'> {
  workDays: number[] | string;
}

export type Parent = PrismaParent;
export type Booking = PrismaBooking;
export type Notification = PrismaNotification;
export type Course = PrismaCourse;
export type Package = PrismaPackage;

export type CourseWithPackages = Course & { packages: Package[] };
