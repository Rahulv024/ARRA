import { render, screen } from '@testing-library/react';
import RecipeCard from '../RecipeCard';

describe('RecipeCard', () => {
  it('renders title and View link', () => {
    render(<RecipeCard item={{ id: 123, title: 'Test Recipe' }} onView={() => {}} />);
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    const view = screen.getByRole('link', { name: /view/i });
    expect(view).toHaveAttribute('href', '/recipe/123');
  });
});

