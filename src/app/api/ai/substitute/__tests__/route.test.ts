import { POST } from '@/app/api/ai/substitute/route';

function makeReq(body: any) {
  return new Request('http://localhost/api/ai/substitute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe.skip('/api/ai/substitute POST (skipped in unit; covered via E2E)', () => {
  it('400 when missing is empty', async () => {
    const res = await POST(makeReq({ missing: '' } as any));
    expect(res.status).toBe(400);
  });

  it('falls back to deterministic suggestions (no keys configured)', async () => {
    const res = await POST(makeReq({ missing: 'milk', ingredients: [] }));
    expect(res.status).toBe(200);
    const body = JSON.parse(await res.text());
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body.suggestions.length).toBe(3);
    expect(body.source).toBeDefined();
  });
});
