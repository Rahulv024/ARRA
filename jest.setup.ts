import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Minimal safe defaults for server code that asserts presence of keys
process.env.SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || 'test-key';

// Optional: mock next-auth in unit tests; adjust per test when needed
jest.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated', data: null }),
}));

// Polyfill Next.js Response.json used by NextResponse.json in route handlers
// In JSDOM, the static Response.json may be missing.
if (!(Response as any).json) {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      ...(init || {}),
    });
}
