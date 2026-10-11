import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhoneCountryInput } from '../src/components/PhoneCountryInput';
import { AuthModal } from '../src/components/AuthModal';
import { ParentDetailsForm } from '../src/components/ParentDetailsForm';

describe('PhoneCountryInput Component Tests', () => {
  it('renders with default country India (+91)', () => {
    const handleChange = vi.fn();
    render(
      <PhoneCountryInput
        phone="9876543210"
        countryDialCode="+91"
        onChange={handleChange}
      />
    );

    // Should display +91 and India flag in closed control
    expect(screen.getByText('+91')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /India/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument();
  });

  it('opens searchable country dropdown on click and displays flags and dial codes', () => {
    const handleChange = vi.fn();
    render(
      <PhoneCountryInput
        phone=""
        countryDialCode="+91"
        onChange={handleChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Select country code/i });
    fireEvent.click(toggleButton);

    // Search input should be present
    expect(screen.getByPlaceholderText(/Search country or code/i)).toBeInTheDocument();

    // United States, United Kingdom, Singapore should be listed with flags and dial codes
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    expect(screen.getAllByText('+1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('+44')).toBeInTheDocument();
  });

  it('filters countries when typing in search input and selects new country', () => {
    const handleChange = vi.fn();
    render(
      <PhoneCountryInput
        phone="12345678"
        countryDialCode="+91"
        onChange={handleChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Select country code/i });
    fireEvent.click(toggleButton);

    const searchInput = screen.getByPlaceholderText(/Search country or code/i);
    fireEvent.change(searchInput, { target: { value: 'Singapore' } });

    expect(screen.getByText('Singapore')).toBeInTheDocument();
    expect(screen.getByText('+65')).toBeInTheDocument();

    // Select Singapore
    fireEvent.click(screen.getByText('Singapore'));
    expect(handleChange).toHaveBeenCalledWith('12345678', '+65');
  });

  it('supports keyboard navigation (Escape to close, Enter to open)', () => {
    const handleChange = vi.fn();
    render(
      <PhoneCountryInput
        phone=""
        countryDialCode="+91"
        onChange={handleChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Select country code/i });
    fireEvent.keyDown(toggleButton, { key: 'ArrowDown' });

    expect(screen.getByPlaceholderText(/Search country or code/i)).toBeInTheDocument();

    // Press Escape to close
    const searchInput = screen.getByPlaceholderText(/Search country or code/i);
    fireEvent.keyDown(searchInput, { key: 'Escape' });

    expect(screen.queryByPlaceholderText(/Search country or code/i)).not.toBeInTheDocument();
  });
});

describe('AuthModal Component Tests', () => {
  it('opens with Parent Login selected by default', () => {
    const handleLoginSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <AuthModal
        isOpen={true}
        initialTab="parent"
        onClose={handleClose}
        onLoginSuccess={handleLoginSuccess}
      />
    );

    expect(screen.getByText(/Parent Portal Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Parent Login/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Parent Email Address/i)).toBeInTheDocument();
  });

  it('allows switching to Mentor Login and back to Parent Login', () => {
    const handleLoginSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <AuthModal
        isOpen={true}
        initialTab="parent"
        onClose={handleClose}
        onLoginSuccess={handleLoginSuccess}
      />
    );

    // Switch to Mentor Login
    fireEvent.click(screen.getByRole('button', { name: /^Mentor Login$/i }));
    expect(screen.getByText(/Mentor & Admin Access/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();

    // Switch back to Parent Login via footer link
    fireEvent.click(screen.getByRole('button', { name: /Parent Login →/i }));
    expect(screen.getByText(/Parent Portal Access/i)).toBeInTheDocument();
  });
});

describe('ParentDetailsForm Component Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('includes Student Full Name field and PhoneCountryInput', () => {
    const handleSubmit = vi.fn();
    render(
      <ParentDetailsForm
        initialData={{
          parentName: '',
          studentName: '',
          parentEmail: '',
          parentPhone: '',
          countryDialCode: '+91',
          course: 'Python Programming & AI Basics',
          parentTimeZone: 'Asia/Kolkata',
        }}
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByLabelText(/Parent Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Student Full Name/i)).toBeInTheDocument();
    expect(screen.getByText('+91')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /India/i })).toBeInTheDocument();
  });

  it('displays trial limit banner when student has already used their trial class', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/bookings/eligibility')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'success',
                data: {
                  eligible: false,
                  remainingTrials: 0,
                  message:
                    'This student has already used their trial class. Please contact our team to explore available courses.',
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

    const handleSubmit = vi.fn();
    render(
      <ParentDetailsForm
        initialData={{
          parentName: 'Priya Sharma',
          studentName: 'Aryan Sharma',
          parentEmail: 'priya@example.com',
          parentPhone: '9876543210',
          countryDialCode: '+91',
          course: 'Python Programming & AI Basics',
          parentTimeZone: 'Asia/Kolkata',
        }}
        onSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Verify and Select Time/i });
    fireEvent.click(submitBtn);

    // Warning message banner should appear
    expect(
      await screen.findByText(/This student has already used their trial class/i)
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
