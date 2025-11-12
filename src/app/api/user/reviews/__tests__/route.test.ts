// Mock next-auth to avoid pulling heavy ESM deps in unit tests
jest.mock('next-auth', () => ({ getServerSession: async () => null }));

let GET: any;

beforeAll(async () => {
  const mod = await import('@/app/api/user/reviews/route');
  GET = mod.GET;
});

describe.skip('/api/user/reviews GET (skipped in unit; covered via E2E)', () => {
  it('returns 400 when recipeId is missing', async () => {
    const res = await GET(new Request('http://localhost/api/user/reviews'));
    expect(res.status).toBe(400);
    const j = JSON.parse(await res.text());
    expect(j.error).toBeDefined();
  });
});
