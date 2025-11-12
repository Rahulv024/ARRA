import { render, screen, fireEvent } from '@testing-library/react';
import FavoriteButton from '../FavoriteButton';

jest.mock('next-auth/react', () => ({ useSession: () => ({ status: 'unauthenticated', data: null }) }));

describe('FavoriteButton', () => {
  it('alerts when clicked unauthenticated', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(<FavoriteButton item={{ id: 1, title: 'Pasta' }} />);
    const btn = screen.getByRole('button', { name: /favorite/i });
    fireEvent.click(btn);
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

