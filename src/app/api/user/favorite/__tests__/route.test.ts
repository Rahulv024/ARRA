// Mock auth route module to avoid executing NextAuth in tests
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }), { virtual: true });

// Simulate unauthenticated session for these tests
jest.mock('next-auth', () => ({ getServerSession: async () => null }));

// Provide a no-op db to avoid touching real database
jest.mock('@/server/db', () => ({ db: {} }));

let GET: any;
let POST: any;

beforeAll(async () => {
  const mod = await import('@/app/api/user/favorite/route');
  GET = mod.GET;
  POST = mod.POST;
});

function makeUrl(path: string) {
  return new URL(path, 'http://localhost').toString();
}

describe.skip('/api/user/favorite (skipped in unit; covered via E2E)', () => {
  it('GET with recipeId returns false when logged out', async () => {
    const res = await GET(new Request(makeUrl('/api/user/favorite?recipeId=1')));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.favorited).toBe(false);
  });

  it('POST requires auth', async () => {
    const res = await POST(new Request(makeUrl('/api/user/favorite'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: '1' }),
    }));
    expect(res.status).toBe(401);
  });
});
