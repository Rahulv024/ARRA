import { render, screen, fireEvent } from '@testing-library/react';
import ReviewsSection from '../ReviewsSection';

describe('ReviewsSection', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ reviews: [], avg: 0, count: 0, myReview: null }) });
  });

  it('shows average and empty state', async () => {
    render(<ReviewsSection recipeId="rid-1" />);
    expect(await screen.findByText(/Average:/i)).toBeInTheDocument();
    expect(await screen.findByText(/No reviews yet/i)).toBeInTheDocument();
  });

  it('alerts when posting without rating', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ReviewsSection recipeId="rid-1" />);
    const post = await screen.findByRole('button', { name: /post/i });
    fireEvent.click(post);
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
