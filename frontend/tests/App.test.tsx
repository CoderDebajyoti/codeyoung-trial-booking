import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';

describe('Frontend App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ status: 'ok' }),
      })
    );
  });

  it('renders application title and system status', async () => {
    render(<App />);
    expect(screen.getByText(/Book Your 1:1 Live Trial Class/i)).toBeInTheDocument();
    expect(screen.getByText(/System Initialization Status/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Connected \(Healthy\)/i)).toBeInTheDocument();
    });
  });
});

