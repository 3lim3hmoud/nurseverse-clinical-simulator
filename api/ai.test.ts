import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './ai';

function call(body: any, headers: any = {}, method = 'POST') {
  return new Promise<{ status: number; json: any; headers: Record<string,string> }>((resolve) => {
    const h: Record<string,string> = {}; let status = 200;
    const res: any = { status(c: number) { status = c; return res; }, setHeader(k: string, v: string) { h[k] = v; }, json(b: any) { resolve({ status, json: b, headers: h }); }, end() { resolve({ status, json: null, headers: h }); } };
    handler({ method, body, headers: { 'x-forwarded-for': String(Math.random()), ...headers } } as any, res);
  });
}
const gemini = (text: string) => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) });
const claude = (text: string) => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text }] }) });

describe('api/ai', () => {
  beforeEach(() => { delete process.env.GEMINI_API_KEY; delete process.env.ANTHROPIC_API_KEY; delete process.env.ALLOWED_ORIGINS; vi.restoreAllMocks(); });

  it('no key -> 500', async () => {
    const r = await call({ kind: 'patient', question: 'hi' });
    expect(r.status).toBe(500);
  });
  it('gemini patient', async () => {
    process.env.GEMINI_API_KEY = 'k';
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(gemini('أنا تعبان') as any);
    const r = await call({ kind: 'patient', lang: 'ar', question: 'حاسس بإيه؟', facts: ['a'], state: 's', history: [{ from: 'nurse', text: 'x' }, { from: 'patient', text: 'y' }] });
    expect(r.status).toBe(200); expect(r.json.text).toBe('أنا تعبان');
    const [url, init] = f.mock.calls[0] as any;
    expect(url).toContain('gemini-2.5-flash-lite:generateContent');
    expect(init.headers['x-goog-api-key']).toBe('k');
  });
  it('claude all kinds', async () => {
    process.env.ANTHROPIC_API_KEY = 'k';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(claude('ok') as any);
    expect((await call({ kind: 'doctor', report: { situation: 's', background: [], assessment: 'a', recommendation: 'r' } })).json.text).toBe('ok');
    expect((await call({ kind: 'doctor-chat', question: 'q', decision: { kind: 'advice', draft: 'd' } })).json.text).toBe('ok');
    expect((await call({ kind: 'coach', question: 'q', facts: { procedure: 'p', next: { n: 1, en: 'a', ar: 'b' }, missing: ['x'] } })).json.text).toBe('ok');
  });
  it('debrief ok + bad json', async () => {
    process.env.GEMINI_API_KEY = 'k';
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockResolvedValueOnce(gemini('```json\n{"strengths":["a"],"improvements":["b"],"nextStep":"c"}\n```') as any);
    const r = await call({ kind: 'debrief', items: [], events: [], score: 80 });
    expect(r.status).toBe(200); expect(r.json.nextStep).toBe('c');
    f.mockResolvedValueOnce(gemini('{not valid json}') as any);
    const r2 = await call({ kind: 'debrief', items: [], events: [], score: 80 });
    expect(r2.status).toBe(502);
  });
  it('provider 429 passthrough, empty, unknown kind, CORS', async () => {
    process.env.GEMINI_API_KEY = 'k'; process.env.ALLOWED_ORIGINS = 'https://3lim3hmoud.github.io';
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockResolvedValueOnce({ ok: false, status: 429 } as any);
    expect((await call({ kind: 'patient', question: 'q' })).status).toBe(429);
    f.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [] } }] }) } as any);
    expect((await call({ kind: 'patient', question: 'q' })).status).toBe(502);
    expect((await call({ kind: 'nope' })).status).toBe(400);
    const o = await call({}, { origin: 'https://3lim3hmoud.github.io' }, 'OPTIONS');
    expect(o.status).toBe(204); expect(o.headers['Access-Control-Allow-Origin']).toBe('https://3lim3hmoud.github.io');
    const bad = await call({ kind: 'patient', question: 'q' }, { origin: 'https://evil.com' });
    expect(bad.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});
