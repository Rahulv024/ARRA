/* @jest-environment jsdom */
import {
  trendingRecipes,
  recipeDetails,
  recipePriceBreakdown,
  similarRecipesDetailed,
} from '@/server/spoonacular';

describe('spoonacular helpers (additional)', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn();
    (process as any).env.SPOONACULAR_API_KEY = 'test-key';
  });

  it('trendingRecipes returns results with popularity sort', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ id: 1, title: 'Trend' }] }),
    });
    const out = await trendingRecipes({ number: 2, cuisine: 'italian' });
    expect(out[0].title).toBe('Trend');
    const url: string = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('sort=popularity');
  });

  it('recipeDetails returns upstream JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, title: 'Detail' }) });
    const out = await recipeDetails(2);
    expect(out.title).toBe('Detail');
  });

  it('recipePriceBreakdown returns upstream JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ totalCost: 123 }) });
    const out = await recipePriceBreakdown(2);
    expect(out.totalCost).toBe(123);
  });

  it('similarRecipesDetailed hydrates details', async () => {
    // similar list
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ id: 10, title: 'A' }, { id: 11, title: 'B' }]) })
      // details #1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 10, title: 'A*', image: '/a.jpg' }) })
      // details #2
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 11, title: 'B*', image: '/b.jpg' }) });
    const out = await similarRecipesDetailed(1, 2);
    expect(out).toHaveLength(2);
    expect(out[0].image).toBe('/a.jpg');
  });
});

