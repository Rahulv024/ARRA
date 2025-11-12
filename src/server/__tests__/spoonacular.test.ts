import { searchRecipes } from '@/server/spoonacular';

describe('spoonacular.searchRecipes', () => {
  beforeEach(() => {
    // @ts-ignore - let tests stub fetch
    global.fetch = jest.fn();
  });

  it('calls complexSearch and returns results', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ id: 1, title: 'Mocked' }] }),
    });

    const out = await searchRecipes({ query: 'pasta' });
    expect(out).toEqual([{ id: 1, title: 'Mocked' }]);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toMatch(/complexSearch/);
  });
});

