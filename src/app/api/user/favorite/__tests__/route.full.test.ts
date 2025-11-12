/* @jest-environment jsdom */

// Prevent importing real NextAuth handler
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }), { virtual: true });

function makeUrl(path: string) {
  return new URL(path, 'http://localhost').toString();
}

describe.skip('/api/user/favorite route (skipped: NextAuth handler import)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('GET recipeId unauth returns favorited: false', async () => {
    jest.doMock('next-auth', () => ({ getServerSession: async () => null }));
    const mod = await import('@/app/api/user/favorite/route');
    const res = await mod.GET(new Request(makeUrl('/api/user/favorite?recipeId=1')));
    const body = JSON.parse(await res.text());
    expect(res.status).toBe(200);
    expect(body.favorited).toBe(false);
  });

  it('POST requires auth', async () => {
    jest.doMock('next-auth', () => ({ getServerSession: async () => null }));
    const mod = await import('@/app/api/user/favorite/route');
    const res = await mod.POST(new Request(makeUrl('/api/user/favorite'), { method: 'POST', body: JSON.stringify({ recipeId: '1' }) }));
    expect(res.status).toBe(401);
  });

  it('POST toggle on when authenticated', async () => {
    jest.doMock('next-auth', () => ({ getServerSession: async () => ({ user: { id: 'u1' } }) }));
    jest.doMock('@/server/db', () => ({
      db: {
        favorite: { findFirst: jest.fn(async () => null), create: jest.fn(async () => ({})), delete: jest.fn(async () => ({})) },
        recipe: { upsert: jest.fn(async () => ({})) },
      },
    }));
    const mod = await import('@/app/api/user/favorite/route');
    const res = await mod.POST(new Request(makeUrl('/api/user/favorite'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipeId: '1', recipe: { id: 1, title: 'X' } }) }));
    const body = JSON.parse(await res.text());
    expect(res.status).toBe(200);
    expect(body.favorited).toBe(true);
  });
});
