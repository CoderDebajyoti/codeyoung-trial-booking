import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';

const MOCK_COURSES = [
  {
    id: 'course-1',
    title: 'Scratch & Game Development',
    category: 'Coding & Programming',
    description: 'Learn computational thinking and create 2D games with Scratch.',
    learningOutcomes: ['Animation basics', 'Game loops & events', 'Creative logic'],
    ageGroup: 'Ages 6-10',
    classLevel: 'Beginner',
    totalClasses: 24,
    classDuration: 60,
    currency: 'USD',
    basePrice: 499,
    isActive: true,
    icon: '🎮',
    packages: [
      { id: 'pkg-1', courseId: 'course-1', duration: '1 month', classesCount: 8, price: 199, currency: 'USD', isPopular: false, isActive: true },
      { id: 'pkg-2', courseId: 'course-1', duration: '2 months', classesCount: 16, price: 379, currency: 'USD', isPopular: false, isActive: true },
      { id: 'pkg-3', courseId: 'course-1', duration: '3 months', classesCount: 24, price: 499, currency: 'USD', isPopular: true, isActive: true },
      { id: 'pkg-4', courseId: 'course-1', duration: '6 months', classesCount: 48, price: 899, currency: 'USD', isPopular: false, isActive: true },
    ],
  },
  {
    id: 'course-2',
    title: 'Python Programming & AI Basics',
    category: 'AI & Robotics',
    description: 'Master core Python syntax and train simple machine learning models.',
    learningOutcomes: ['Data structures', 'OOP fundamentals', 'Machine learning concepts'],
    ageGroup: 'Ages 10-15',
    classLevel: 'Intermediate',
    totalClasses: 36,
    classDuration: 60,
    currency: 'USD',
    basePrice: 699,
    isActive: true,
    icon: '🐍',
    packages: [
      { id: 'pkg-5', courseId: 'course-2', duration: '1 month', classesCount: 8, price: 249, currency: 'USD', isPopular: false, isActive: true },
      { id: 'pkg-6', courseId: 'course-2', duration: '3 months', classesCount: 24, price: 699, currency: 'USD', isPopular: true, isActive: true },
    ],
  },
];

const MOCK_ADMIN_BOOKINGS = {
  bookings: [
    {
      id: 'bk-aarav-1',
      studentName: 'Aarav Sharma',
      course: 'Python Programming & AI Basics',
      startAtUtc: '2026-10-14T14:00:00.000Z',
      endAtUtc: '2026-10-14T14:30:00.000Z',
      status: 'CONFIRMED',
      createdAt: '2026-10-10T10:00:00.000Z',
      parent: {
        id: 'parent-aarav',
        name: 'Aarav Parent',
        email: 'aarav.parent@example.com',
        phone: '+1 555 444 3333',
        timeZone: 'America/New_York',
      },
      mentor: {
        id: 'mentor-1',
        name: 'Sarah Johnson',
        email: 'sarah@codeyoung.com',
        timeZone: 'America/New_York',
      },
      courseRef: {
        id: 'course-2',
        title: 'Python Programming & AI Basics',
        category: 'AI & Robotics',
      },
    },
  ],
  total: 1,
  page: 1,
  limit: 15,
  totalPages: 1,
};

describe('Codeyoung Trial Booking Frontend Comprehensive Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/courses')) {
          if (url.includes('/api/courses/course-1') || url.includes('/api/courses/course-2')) {
            const courseId = url.includes('course-1') ? 'course-1' : 'course-2';
            const course = MOCK_COURSES.find((c) => c.id === courseId);
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ status: 'success', data: course }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: 'success', data: MOCK_COURSES }),
          });
        }

        if (url.includes('/api/bookings/admin') || (url.includes('/api/bookings') && options?.method === 'GET')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: 'success', data: MOCK_ADMIN_BOOKINGS }),
          });
        }

        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: {
                  user: null,
                },
              }),
          });
        }

        if (url.includes('/api/auth/login')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: {
                  token: 'mock-jwt-token',
                  user: {
                    id: 'admin-1',
                    name: 'Admin User',
                    email: 'admin@codeyoung.com',
                    role: 'ADMIN',
                  },
                },
              }),
          });
        }

        if (url.includes('/api/auth/otp/send')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                message: 'Verification code sent',
                data: { cooldownSeconds: 60 },
              }),
          });
        }

        if (url.includes('/api/auth/otp/verify')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: { verificationToken: 'test-verified-token' },
              }),
          });
        }

        if (url.includes('/api/mentors/') && url.includes('/schedule')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: {
                  mentor: {
                    id: 'mentor-1',
                    name: 'Sarah Johnson',
                    email: 'sarah@codeyoung.com',
                    timeZone: 'America/New_York',
                    workDays: [1, 2, 3, 4, 5],
                    workStartHour: 9,
                    workEndHour: 17,
                  },
                  queryDate: '2026-10-12',
                  mentorLocalDateRange: {
                    startUtc: '2026-10-12T04:00:00.000Z',
                    endUtc: '2026-10-13T04:00:00.000Z',
                  },
                  capacity: {
                    maxDailyClasses: 2,
                    confirmedClassesCount: 1,
                    availableCapacity: 1,
                    isFullyBooked: false,
                  },
                  bookings: [
                    {
                      id: 'bk-existing-1',
                      startAtUtc: '2026-10-12T14:00:00.000Z',
                      endAtUtc: '2026-10-12T14:30:00.000Z',
                      mentorLocalStartTime: '2026-10-12 10:00:00 (EDT)',
                      mentorLocalEndTime: '10:30:00 (EDT)',
                      status: 'CONFIRMED',
                      parentName: 'Alice Parent',
                      parentEmail: 'alice@example.com',
                      parentTimeZone: 'America/New_York',
                      demoClassUrl: 'https://meet.codeyoung.com/trial/sample999',
                    },
                  ],
                },
              }),
          });
        }

        if (url.includes('/api/mentors')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: {
                  totalMentors: 2,
                  mentors: [
                    {
                      id: 'mentor-1',
                      name: 'Sarah Johnson',
                      email: 'sarah@codeyoung.com',
                      timeZone: 'America/New_York',
                      workDays: [1, 2, 3, 4, 5],
                      workStartHour: 9,
                      workEndHour: 17,
                    },
                  ],
                },
              }),
          });
        }

        if (url.includes('/api/slots')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: {
                  queryDate: '2026-10-12',
                  timeZone: 'America/New_York',
                  totalAvailableSlots: 2,
                  slots: [
                    {
                      startUtc: '2026-10-12T13:00:00.000Z',
                      endUtc: '2026-10-12T13:30:00.000Z',
                      parentLocalDate: '2026-10-12',
                      parentLocalTime: '09:00',
                      parentTimeZone: 'America/New_York',
                      availableMentorsCount: 2,
                    },
                    {
                      startUtc: '2026-10-12T13:30:00.000Z',
                      endUtc: '2026-10-12T14:00:00.000Z',
                      parentLocalDate: '2026-10-12',
                      parentLocalTime: '09:30',
                      parentTimeZone: 'America/New_York',
                      availableMentorsCount: 1,
                    },
                  ],
                },
              }),
          });
        }

        if (url.includes('/api/bookings') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: {
                  id: 'booking-test-123',
                  status: 'CONFIRMED',
                  course: 'Python Programming & AI Basics',
                  demoClassUrl: 'https://meet.codeyoung.com/trial/sample999',
                  startAtUtc: '2026-10-12T13:00:00.000Z',
                  endAtUtc: '2026-10-12T13:30:00.000Z',
                  durationMinutes: 30,
                  parent: {
                    id: 'p-1',
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    phone: '+1 555 123 4567',
                    timeZone: 'Asia/Kolkata',
                    localStartTime: '2026-10-12 18:30:00 (IST)',
                    localEndTime: '19:00:00 (IST)',
                  },
                  mentor: {
                    id: 'm-1',
                    name: 'Sarah Johnson',
                    email: 'sarah@codeyoung.com',
                    timeZone: 'America/New_York',
                    localStartTime: '2026-10-12 09:00:00 (EDT)',
                    localEndTime: '09:30:00 (EDT)',
                  },
                  createdAt: '2026-10-09T15:00:00.000Z',
                },
              }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok' }),
        });
      })
    );
  });

  it('renders public navigation with merged Explore Courses & Pricing and Book Free Trial links', async () => {
    render(<App />);

    expect(await screen.findByText(/Give Your Child the Ultimate STEM Advantage/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Explore Courses & Pricing/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /Book Free Trial/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Sign In|Login/i })).toBeInTheDocument();
  });

  it('renders merged Explore Courses & Pricing catalogue with interactive package cards', async () => {
    render(<App />);

    const headers = await screen.findAllByText(/Explore Courses & Pricing/i);
    expect(headers.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Scratch & Game Development')).toBeInTheDocument();
    expect(screen.getByText('Python Programming & AI Basics')).toBeInTheDocument();
    expect(screen.getAllByText(/1 month/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/3 months/i).length).toBeGreaterThanOrEqual(1);
  });

  it('navigates from Course Catalogue to Course Details with interactive packages and price per class', async () => {
    render(<App />);

    const detailsBtns = await screen.findAllByRole('button', { name: /Curriculum/i });
    fireEvent.click(detailsBtns[0]);

    // Course Details page
    expect(await screen.findByText(/Choose Course Package/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1 month/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/3 months/i).length).toBeGreaterThanOrEqual(1);

    // Verify "Book Free 1:1 Trial" CTA
    expect(screen.getByRole('button', { name: /Book Free 1:1 Trial/i })).toBeInTheDocument();
    // Verify "Purchase Package" CTA
    expect(screen.getByRole('button', { name: /Purchase Package/i })).toBeInTheDocument();
  });

  it('opens CheckoutModal when clicking Choose package from catalogue card', async () => {
    render(<App />);

    const chooseBtns = await screen.findAllByRole('button', { name: /Choose/i });
    fireEvent.click(chooseBtns[0]);

    // Checkout modal should open
    expect(await screen.findByText(/Review Course Package/i)).toBeInTheDocument();
    expect(screen.getByText(/Checkout-Ready Flow/i)).toBeInTheDocument();
  });

  it('preselects course when clicking Book Free Trial from course card into booking form', async () => {
    render(<App />);

    const bookTrialBtns = await screen.findAllByRole('button', { name: /Book Free Trial/i });
    // Click the card's Book Free Trial CTA
    fireEvent.click(bookTrialBtns[bookTrialBtns.length - 1]);

    // Should navigate to trial booking form with Step 1
    expect(await screen.findByText(/Book Your Free 1:1 Trial Class/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Parent Full Name/i)).toBeInTheDocument();
  });

  it('renders Parent Details form and validates required fields', async () => {
    render(<App />);

    const bookTab = screen.getByRole('button', { name: /Book Free Trial/i });
    fireEvent.click(bookTab);

    expect(await screen.findByText(/Book Your Free 1:1 Trial Class/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Parent Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();

    // Click submit without entering required name
    const submitBtn = screen.getByRole('button', { name: /Verify and Select Time/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please enter parent full name/i)).toBeInTheDocument();

    // Fill invalid email
    fireEvent.change(screen.getByLabelText(/Parent Full Name/i), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1 555 123 4567' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'invalid-email-address' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify and Select Time/i }));

    expect(await screen.findByText(/Please enter a valid email address/i)).toBeInTheDocument();
  });

  it('navigates to Slot Selection and completes booking with confirmation', async () => {
    render(<App />);

    const bookTab = screen.getByRole('button', { name: /Book Free Trial/i });
    fireEvent.click(bookTab);

    fireEvent.change(screen.getByLabelText(/Parent Full Name/i), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByLabelText(/Student Full Name/i), { target: { value: 'Leo Smith' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1 555 987 6543' } });
    fireEvent.change(screen.getByLabelText(/Your Time Zone/i), { target: { value: 'Asia/Kolkata' } });

    const submitBtn = screen.getByRole('button', { name: /Verify and Select Time/i });
    fireEvent.click(submitBtn);

    // Screen B
    expect(await screen.findByText(/Select Class Date & Time/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('09:00'));
    const bookBtn = screen.getByRole('button', { name: /Confirm 1:1 Trial Booking/i });
    fireEvent.click(bookBtn);

    // Confirmation Screen (Screen C)
    expect(await screen.findByText(/Booking Confirmed!/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sarah Johnson/i).length).toBeGreaterThan(0);
  });

  it('allows parent to request and verify email OTP on booking form', async () => {
    render(<App />);

    const bookTab = screen.getByRole('button', { name: /Book Free Trial/i });
    fireEvent.click(bookTab);

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'parent.test@example.com' } });
    
    // Click send OTP code
    const sendOtpBtn = screen.getByRole('button', { name: /Send 6-Digit Verification Code/i });
    fireEvent.click(sendOtpBtn);

    expect(await screen.findByPlaceholderText('123456')).toBeInTheDocument();

    // Enter 6-digit OTP code and verify
    fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify Code/i }));

    expect(await screen.findByText(/Verified/i)).toBeInTheDocument();
  });

  it('toggles mobile drawer menu cleanly when hamburger icon is clicked', async () => {
    render(<App />);

    const hamburgerBtn = screen.getByLabelText(/Toggle Navigation Menu/i);
    expect(hamburgerBtn).toBeInTheDocument();

    // Open mobile menu
    fireEvent.click(hamburgerBtn);

    const mobileExploreBtns = screen.getAllByText(/Explore Courses & Pricing/i);
    expect(mobileExploreBtns.length).toBeGreaterThanOrEqual(1);

    // Close mobile menu by clicking hamburger again
    fireEvent.click(hamburgerBtn);
  });
});
