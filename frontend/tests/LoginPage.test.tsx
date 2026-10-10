import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage, SUBJECTS, FEATURES } from '../src/components/LoginPage';

describe('LoginPage Component Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the original educational promotional panel with headline, supporting text, 6 subjects, and 4 features', () => {
    const handleLoginSuccess = vi.fn();
    const handleNavigateToBooking = vi.fn();

    render(
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToBooking={handleNavigateToBooking}
      />
    );

    // Headline & supporting copy
    expect(screen.getByText('Big ideas start with curious minds.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Discover interactive classes designed to help children explore, build skills, and grow with confidence.'
      )
    ).toBeInTheDocument();

    // Verify all 6 exact subjects are rendered
    const expectedSubjects = ['Coding', 'Math', 'Science', 'English', 'Robotics', 'Finance'];
    expectedSubjects.forEach((subject) => {
      expect(screen.getByText(subject)).toBeInTheDocument();
    });

    // Verify all 4 feature cards are rendered
    const expectedFeatures = [
      'Interactive learning',
      'Personal mentor guidance',
      'Creative problem-solving',
      'Learning through projects',
    ];
    expectedFeatures.forEach((feature) => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  it('renders compact authentication panel with Parent Login selected by default', () => {
    const handleLoginSuccess = vi.fn();
    const handleNavigateToBooking = vi.fn();

    render(
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToBooking={handleNavigateToBooking}
      />
    );

    expect(screen.getByText('Parent Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText(/Parent Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign In to Parent Account/i })
    ).toBeInTheDocument();
  });

  it('toggles password visibility when clicking eye button', () => {
    const handleLoginSuccess = vi.fn();
    const handleNavigateToBooking = vi.fn();

    render(
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToBooking={handleNavigateToBooking}
      />
    );

    const passwordInput = screen.getByLabelText(/^Password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /Show password/i });
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /Hide password/i });
    fireEvent.click(hideBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('switches between Parent Login and Mentor Login tabs', () => {
    const handleLoginSuccess = vi.fn();
    const handleNavigateToBooking = vi.fn();

    render(
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToBooking={handleNavigateToBooking}
      />
    );

    // Switch to Mentor Login
    const mentorTab = screen.getByRole('button', { name: /^Mentor Login$/i });
    fireEvent.click(mentorTab);

    expect(screen.getByText('Mentor Portal Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign In to Mentor Portal/i })
    ).toBeInTheDocument();

    // Switch back to Parent Login via footer link
    const switchBackLink = screen.getByRole('button', {
      name: /Switch to Parent Login/i,
    });
    fireEvent.click(switchBackLink);

    expect(screen.getByText('Parent Sign In')).toBeInTheDocument();
  });

  it('triggers onNavigateToBooking when clicking Book Free Trial Class', () => {
    const handleLoginSuccess = vi.fn();
    const handleNavigateToBooking = vi.fn();

    render(
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToBooking={handleNavigateToBooking}
      />
    );

    const ctaBtn = screen.getByRole('button', { name: /Book a Free 1:1 Trial Class/i });
    fireEvent.click(ctaBtn);

    expect(handleNavigateToBooking).toHaveBeenCalled();
  });

  it('handles parent login submission and calls onLoginSuccess', async () => {
    const handleLoginSuccess = vi.fn();
    const handleNavigateToBooking = vi.fn();

    render(
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToBooking={handleNavigateToBooking}
      />
    );

    fireEvent.change(screen.getByLabelText(/Parent Email Address/i), {
      target: { value: 'parent.test@example.com' },
    });

    const submitBtn = screen.getByRole('button', {
      name: /Sign In to Parent Account/i,
    });
    fireEvent.click(submitBtn);

    expect(handleLoginSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'parent.test@example.com',
      }),
      'parent'
    );
  });
});
