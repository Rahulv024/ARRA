import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubstituteBox from '../SubstituteBox';

describe('SubstituteBox', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn();
  });

  it('disables Suggest when input is empty', () => {
    render(<SubstituteBox recipe={{ ingredients: [] }} />);
    const btn = screen.getByRole('button', { name: /suggest/i });
    expect(btn).toBeDisabled();
  });

  it('shows suggestions from API', async () => {
    // mock API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: [ { for: 'milk', alt: 'oat milk', note: '1:1' } ] }),
    });

    render(<SubstituteBox recipe={{ ingredients: [] }} />);
    const input = screen.getByPlaceholderText(/e.g., coconut cream/i);
    fireEvent.change(input, { target: { value: 'milk' } });
    const btn = screen.getByRole('button', { name: /suggest/i });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/oat milk/i)).toBeInTheDocument();
    });
  });
});

