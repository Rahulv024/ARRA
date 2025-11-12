/* @jest-environment jsdom */

describe('/api/recommendations GET (fallback)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns merged results using fallback search when no provider key', async () => {
    // Ensure provider key is empty to trigger fallback
    process.env.RECS_PROVIDER = 'openai';
    delete process.env.RECS_API_KEY;
    jest.doMock('@/server/spoonacular', () => ({
      searchRecipes: jest.fn(async () => [{ id: 101, title: 'Rec' }]),
    }));
    const mod = await import('@/app/api/recommendations/route');
    const res = await mod.GET(new Request('http://localhost/api/recommendations?q=quick%20pasta'));
    expect(res.status).toBe(200);
  });
});
