/* @jest-environment jsdom */

// Avoid importing real NextAuth handler
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }), { virtual: true });

describe.skip('/api/user/shoppinglist CRUD (skipped: NextAuth ESM import)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('GET requires auth (401)', async () => {
    jest.doMock('next-auth', () => ({ getServerSession: async () => null }));
    const mod = await import('@/app/api/user/shoppinglist/route');
    const res = await mod.GET(new Request('http://localhost/api/user/shoppinglist'));
    expect(res.status).toBe(401);
  });

  it('POST create list + items when authenticated', async () => {
    jest.doMock('next-auth', () => ({ getServerSession: async () => ({ user: { id: 'u1' } }) }));
    jest.doMock('@/server/db', () => ({
      db: {
        shoppingList: { create: jest.fn(async () => ({ id: 'l1', name: 'List', userId: 'u1' })) },
        shoppingItem: { createMany: jest.fn(async () => ({})) },
      },
    }));
    const mod = await import('@/app/api/user/shoppinglist/route');
    const res = await mod.POST(new Request('http://localhost/api/user/shoppinglist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listName: 'List', items: [{ name: 'Tomato', amount: 1, unit: 'pc' }] }) }));
    const body = JSON.parse(await res.text());
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.listId).toBe('l1');
  });
});
