/* @jest-environment jsdom */

function makeReq(body: any) {
  return new Request('http://localhost/api/ai/substitute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/ai/substitute POST (providers)', () => {
  const envBackup = { ...process.env } as any;
  beforeEach(() => {
    jest.resetModules();
    // @ts-ignore
    global.fetch = jest.fn();
  });
  afterEach(() => {
    process.env = { ...envBackup } as any;
  });

  it('400 when missing empty', async () => {
    const { POST } = await import('@/app/api/ai/substitute/route');
    const res = await POST(makeReq({ missing: '' }));
    expect(res.status).toBe(400);
  });

  it('uses Gemini provider and parses JSON text', async () => {
    process.env.SUBS_PROVIDER = 'gemini';
    process.env.SUBS_API_KEY = 'g-key';
    process.env.SUBS_MODEL = 'gemini-1.5-flash';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: JSON.stringify({ suggestions: [{ for: 'milk', alt: 'oat milk', note: '1:1' }, { for: 'milk', alt: 'almond milk', note: '1:1' }, { for: 'milk', alt: 'evaporated milk', note: 'dilute' }] }) }] } },
        ],
      }),
    });

    const { POST } = await import('@/app/api/ai/substitute/route');
    const res = await POST(makeReq({ missing: 'milk', ingredients: [] }));
    expect(res.status).toBe(200);
  });

  it('rate-limited returns deterministic fallback', async () => {
    process.env.SUBS_PROVIDER = 'gemini';
    process.env.SUBS_API_KEY = 'g-key';
    process.env.SUBS_MODEL = 'gemini-1.5-flash';
    (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 429, ok: false });
    const { POST } = await import('@/app/api/ai/substitute/route');
    const res = await POST(makeReq({ missing: 'butter', ingredients: [] }));
    expect(res.status).toBe(200);
  });
});
