import { GET } from '@/app/api/search/route';

function makeReq(url: string) {
  return new Request(url);
}

jest.mock('@/server/spoonacular', () => ({
  searchRecipes: jest.fn(async () => [{ id: 1, title: 'Mocked Result' }]),
}));

describe.skip('/api/search GET (skipped in unit; covered via E2E)', () => {
  it('returns 400 when query is invalid', async () => {
    const res = await GET(makeReq('http://localhost/api/search'));
    expect(res.status).toBe(400);
    const body = JSON.parse(await res.text());
    expect(body.error).toBeDefined();
  });

  it('calls searchRecipes and returns results', async () => {
    const res = await GET(makeReq('http://localhost/api/search?q=pasta'));
    expect(res.status).toBe(200);
    const body = JSON.parse(await res.text());
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results[0].title).toBe('Mocked Result');
  });
});
