import { render, screen } from '@testing-library/react';
import AddToListButton from '../../shopping/AddToListButton';

jest.mock('next-auth/react', () => ({ useSession: () => ({ status: 'unauthenticated', data: null }) }));

describe('AddToListButton', () => {
  it('is disabled when user is not authenticated', () => {
    render(<AddToListButton ingredients={[]} recipeTitle="Test" />);
    const btn = screen.getByRole('button', { name: /add to list/i });
    expect(btn).toBeDisabled();
  });
});

