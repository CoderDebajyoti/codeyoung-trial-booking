import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';

describe('Codeyoung Trial Booking Frontend Comprehensive Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: {
                  user: {
                    id: 'mentor-1',
                    name: 'Sarah Johnson',
                    email: 'sarah@codeyoung.com',
                    role: 'MENTOR',
                    mentorId: 'mentor-1',
                  },
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
                    id: 'mentor-1',
                    name: 'Sarah Johnson',
                    email: 'sarah@codeyoung.com',
                    role: 'MENTOR',
                    mentorId: 'mentor-1',
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
                    {
                      id: 'mentor-2',
                      name: 'David Wilson',
                      email: 'david@codeyoung.com',
                      timeZone: 'Europe/London',
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

  it('renders Parent Details form (Screen A) and validates required name and invalid email format', async () => {
    render(<App />);

    expect(screen.getByText(/Book Your Free 1:1 Trial Class/i)).toBeInTheDocument();
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

  it('displays standardized timezone details (Friendly Location, Canonical ID, UTC offset) in Navbar', async () => {
    render(<App />);

    // Select Asia/Kolkata timezone in form
    const tzSelect = screen.getByLabelText(/Your Time Zone/i);
    fireEvent.change(tzSelect, { target: { value: 'Asia/Kolkata' } });

    // Navbar badge should display Kolkata, India and Asia/Kolkata · UTC+05:30
    expect(await screen.findByText('Kolkata, India')).toBeInTheDocument();
    expect(screen.getByText('Asia/Kolkata')).toBeInTheDocument();
    expect(screen.getByText('UTC+05:30')).toBeInTheDocument();
  });

  it('navigates to Screen B, loads slots, allows booking, and displays Screen C Confirmation with standardized timezone info', async () => {
    render(<App />);

    // Fill valid form with Asia/Kolkata timezone
    fireEvent.change(screen.getByLabelText(/Parent Full Name/i), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByLabelText(/Student Full Name/i), { target: { value: 'Leo Smith' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1 555 987 6543' } });
    fireEvent.change(screen.getByLabelText(/Your Time Zone/i), { target: { value: 'Asia/Kolkata' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Verify and Select Time/i });
    fireEvent.click(submitBtn);

    // Screen B
    expect(await screen.findByText(/Select Class Date & Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Booking for/i)).toHaveTextContent('John Smith');

    // SlotPicker and Navbar timezone badge shows friendly name
    expect(screen.getAllByText('Kolkata, India').length).toBeGreaterThanOrEqual(1);

    // Wait for slots to load
    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('09:30')).toBeInTheDocument();
    });

    // Select the first slot
    const slotButton = screen.getByText('09:00');
    fireEvent.click(slotButton);

    // Click confirm booking
    const bookBtn = screen.getByRole('button', { name: /Confirm 1:1 Trial Booking/i });
    fireEvent.click(bookBtn);

    // Confirmation Screen (Screen C)
    expect(await screen.findByText(/Booking Confirmed!/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sarah Johnson/i).length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue(/meet.codeyoung.com\/trial\/sample999/i)).toBeInTheDocument();

    // Verify side-by-side time conversion shows UTC offset and friendly name
    expect(screen.getAllByText('UTC+05:30').length).toBeGreaterThanOrEqual(1);
  });

  it('handles slot API failure and retries fetching', async () => {
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/slots')) {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              ok: false,
              json: () => Promise.resolve({ message: 'Database connection busy. Please retry.' }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: {
                  queryDate: '2026-10-12',
                  timeZone: 'America/New_York',
                  totalAvailableSlots: 1,
                  slots: [
                    {
                      startUtc: '2026-10-12T13:00:00.000Z',
                      endUtc: '2026-10-12T13:30:00.000Z',
                      parentLocalDate: '2026-10-12',
                      parentLocalTime: '09:00',
                      parentTimeZone: 'America/New_York',
                      availableMentorsCount: 1,
                    },
                  ],
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

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Parent Full Name/i), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByLabelText(/Student Full Name/i), { target: { value: 'Leo Smith' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1 555 987 6543' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify and Select Time/i }));

    // Should display error
    expect(await screen.findByText(/Database connection busy/i)).toBeInTheDocument();

    // Click retry
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    // Should succeed and display slots
    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });
  });

  it('handles HTTP 409 conflict and renders alternative slots', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/slots')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: {
                  queryDate: '2026-10-12',
                  timeZone: 'America/New_York',
                  totalAvailableSlots: 1,
                  slots: [
                    {
                      startUtc: '2026-10-12T13:00:00.000Z',
                      endUtc: '2026-10-12T13:30:00.000Z',
                      parentLocalDate: '2026-10-12',
                      parentLocalTime: '09:00',
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
            ok: false,
            status: 409,
            json: () =>
              Promise.resolve({
                status: 'fail',
                message: 'No mentors are available for this slot due to concurrent reservation.',
                alternativeSlots: [
                  {
                    startUtc: '2026-10-12T14:00:00.000Z',
                    endUtc: '2026-10-12T14:30:00.000Z',
                    parentLocalDate: '2026-10-12',
                    parentLocalTime: '10:00',
                    parentTimeZone: 'America/New_York',
                    availableMentorsCount: 1,
                  },
                ],
              }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok' }),
        });
      })
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Parent Full Name/i), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByLabelText(/Student Full Name/i), { target: { value: 'Leo Smith' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1 555 987 6543' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify and Select Time/i }));

    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('09:00'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm 1:1 Trial Booking/i }));

    expect(await screen.findByText(/No mentors are available for this slot/i)).toBeInTheDocument();
    expect(screen.getByText(/Suggested Alternative Slots:/i)).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('switches to Mentor Capacity Inspector view and displays mentor schedule & capacity limits after login', async () => {
    render(<App />);

    const mentorTab = screen.getByRole('button', { name: /Mentor Portal|Portal/i });
    fireEvent.click(mentorTab);

    // Login modal should open for unauthenticated access
    expect(await screen.findByText(/Mentor & Admin Access/i)).toBeInTheDocument();

    // Click Sign In to Portal
    const signInBtn = screen.getByRole('button', { name: /Sign In to (Mentor )?Portal/i });
    fireEvent.click(signInBtn);

    // Now authorized mentor schedule view opens
    expect(await screen.findByText(/Daily Capacity & Bookings/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Capacity Limit/i)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 2 Classes Used/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice Parent/i)).toBeInTheDocument();
  });

  it('allows parent to request and verify email OTP on Screen A', async () => {
    render(<App />);

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
});
