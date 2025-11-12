import { render, screen } from '@testing-library/react';
import RecipeGrid from '../RecipeGrid';

describe('RecipeGrid', () => {
  it('renders recipe titles', () => {
    render(<RecipeGrid results={[{ id: 1, title: 'Pasta' }]} />);
    expect(screen.getByText('Pasta')).toBeInTheDocument();
  });
});

