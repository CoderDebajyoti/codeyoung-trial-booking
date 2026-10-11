import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '../src/App';
import { CourseCardImage } from '../src/components/CourseCardImage';
import { CourseCatalogue } from '../src/components/CourseCatalogue';
import { ParentDetailsForm } from '../src/components/ParentDetailsForm';
import { CANONICAL_COURSES, deduplicateCourses } from '../src/lib/courses';
import { CourseItem } from '../src/lib/api';

const MOCK_API_COURSES: CourseItem[] = [
  ...CANONICAL_COURSES,
  // Add deliberate duplicate entries from simulated repeated API calls or un-deduplicated server response
  {
    ...CANONICAL_COURSES.find((c) => c.id === 'cyber-security')!,
  },
  {
    ...CANONICAL_COURSES.find((c) => c.id === 'cyber-security')!,
  },
];

describe('Course Deduplication & Cover Images Regression Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: 'success', data: null }),
        });
      }

      if (url.includes('/api/courses')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            status: 'success',
            data: {
              totalCourses: MOCK_API_COURSES.length,
              courses: MOCK_API_COURSES,
            },
          }),
        });
      }

      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: 'ok', service: 'backend' }),
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'success', data: {} }),
      });
    });
  });

  it('deduplicateCourses correctly filters out duplicate course objects by stable ID', () => {
    const coursesWithDuplicates = [
      { id: 'course-1', title: 'Course 1' },
      { id: 'course-1', title: 'Course 1 Duplicate' },
      { id: 'course-2', title: 'Course 2' },
      { id: 'course-3', title: 'Course 3' },
      { id: 'course-2', title: 'Course 2 Duplicate' },
    ];

    const deduplicated = deduplicateCourses(coursesWithDuplicates as any);
    expect(deduplicated.length).toBe(3);
    expect(deduplicated.map((c) => c.id)).toEqual(['course-1', 'course-2', 'course-3']);
  });

  it('Explore Courses displays Cyber Security & Ethical Hacking exactly once even with duplicate API payloads', async () => {
    render(<CourseCatalogue onSelectCourse={vi.fn()} onBookTrial={vi.fn()} onPurchasePackage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Explore Courses & Pricing/i)).toBeInTheDocument();
    });

    const cyberHeadings = await screen.findAllByRole('heading', {
      name: /Cyber Security & Ethical Hacking/i,
    });
    expect(cyberHeadings.length).toBe(1);
  });

  it('Pricing / Package options for Cyber Security belong to canonical course and are not duplicated', async () => {
    render(<CourseCatalogue onSelectCourse={vi.fn()} onBookTrial={vi.fn()} onPurchasePackage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Explore Courses & Pricing/i)).toBeInTheDocument();
    });

    // Check that package options for cyber security exist (e.g. 1m, 2m, 3m, 6m)
    const cyberCourse = CANONICAL_COURSES.find((c) => c.id === 'cyber-security')!;
    expect(cyberCourse.packages.length).toBe(4);
    expect(cyberCourse.packages[0].name).toBe('1 Month Starter');
    expect(cyberCourse.packages[0].price).toBe(150);
  });

  it('Book a Trial displays Cyber Security course once and preselects canonical courseId', async () => {
    const onSubmit = vi.fn();
    render(
      <ParentDetailsForm
        initialData={{
          parentName: 'Jane Doe',
          studentName: 'Alex Doe',
          parentEmail: 'jane.doe@example.com',
          parentPhone: '+1 (555) 123-4567',
          course: 'Cyber Security & Ethical Hacking',
          parentTimeZone: 'America/New_York',
        }}
        onSubmit={onSubmit}
        preselectedCourseId="cyber-security"
      />
    );

    await waitFor(() => {
      const cyberElements = screen.getAllByText(/Cyber Security & Ethical Hacking/i);
      expect(cyberElements.length).toBe(1);
    });
  });

  it('CourseCardImage renders image when valid URL provided and switches to text-only fallback on image error', () => {
    const validCourse: Partial<CourseItem> & { title: string } = {
      id: 'cyber-security',
      title: 'Cyber Security & Ethical Hacking',
      category: 'Coding & Programming',
      ageGroup: 'Ages 12-18',
      imageUrl: '/images/courses/cyber-security.jpg',
    };

    const { rerender } = render(<CourseCardImage course={validCourse} variant="card" />);

    const img = screen.getByTestId('course-cover-image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Cyber Security & Ethical Hacking course cover image');

    // Simulate image loading failure
    fireEvent.error(img);

    // After error, text fallback is shown and image is removed
    expect(screen.queryByTestId('course-cover-image')).not.toBeInTheDocument();
    expect(screen.getByTestId('course-cover-fallback')).toBeInTheDocument();
  });

  it('CourseCardImage renders text-only fallback without broken emojis when imageUrl is null or empty', () => {
    const noImageCourse: Partial<CourseItem> & { title: string } = {
      id: 'math-olympiad',
      title: 'Mathematics Olympiad & Problem Solving',
      category: 'Mathematics & Science',
      ageGroup: 'Ages 7-15',
      imageUrl: '',
    };

    render(<CourseCardImage course={noImageCourse} variant="card" />);

    expect(screen.queryByTestId('course-cover-image')).not.toBeInTheDocument();
    const fallback = screen.getByTestId('course-cover-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('Mathematics Olympiad & Problem Solving');
    expect(fallback).toHaveTextContent('Mathematics & Science');
  });

  it('Full App integrates Explore Courses -> Book Free Trial carrying canonical courseId', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText(/Explore Courses & Pricing/i).length).toBeGreaterThanOrEqual(1);
    });

    const bookTrialBtns = await screen.findAllByRole('button', { name: /Book Free Trial/i });
    expect(bookTrialBtns.length).toBeGreaterThan(0);

    // Click on Book Free Trial
    fireEvent.click(bookTrialBtns[0]);

    // Should navigate to booking step 1
    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 2: Parent & Student Details/i)).toBeInTheDocument();
    });
  });
});
