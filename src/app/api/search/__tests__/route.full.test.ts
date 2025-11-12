/* @jest-environment jsdom */

function makeReq(url: string) {
  return new Request(url);
}

describe('/api/search GET (full)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('400 when q is missing', async () => {
    const mod = await import('@/app/api/search/route');
    const res = await mod.GET(makeReq('http://localhost/api/search'));
    expect(res.status).toBe(400);
  });

  it('200 valid query uses searchRecipes', async () => {
    jest.doMock('@/server/spoonacular', () => ({
      searchRecipes: jest.fn(async () => [{ id: 1, title: 'OK' }]),
    }));
    const mod = await import('@/app/api/search/route');
    const res = await mod.GET(makeReq('http://localhost/api/search?q=pasta&diet=vegan&cuisine=italian&maxTime=15'));
    expect(res.status).toBe(200);
  });

  it('falls back to DB when upstream fails', async () => {
    jest.doMock('@/server/spoonacular', () => ({ searchRecipes: jest.fn(async () => { throw new Error('fail'); }) }));
    jest.doMock('@/server/db', () => ({
      db: {
        recipe: {
          findMany: jest.fn(async () => [{ id: 'local-1', title: 'Local' }]),
        },
        searchLog: { create: jest.fn(async () => {}) },
      },
    }));
    const mod = await import('@/app/api/search/route');
    const res = await mod.GET(makeReq('http://localhost/api/search?q=pasta'));
    expect(res.status).toBe(200);
  });
});
