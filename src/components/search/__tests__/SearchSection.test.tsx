import { render, screen } from '@testing-library/react';
import SearchSection from '../SearchSection';

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { results: [] }, isFetching: false, refetch: jest.fn() }),
}));

describe('SearchSection UI', () => {
  it('shows helper text before searching', () => {
    render(<SearchSection />);
    expect(screen.getByText(/Start by searching for something tasty/i)).toBeInTheDocument();
  });
});

