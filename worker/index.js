import { DurableObject } from 'cloudflare:workers';

const EVENTS = new Set(['visit', 'download', 'image', 'share', 'convert']);
const LIMIT_PER_MINUTE = 30;

export class Stats extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS counts (name TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0)');
    this.recent = new Map();
  }

  allowed(key) {
    const now = Date.now();
    const hits = (this.recent.get(key) || []).filter((t) => now - t < 60_000);
    if (hits.length >= LIMIT_PER_MINUTE) return false;
    hits.push(now);
    this.recent.set(key, hits);
    if (this.recent.size > 5000) this.recent.clear();
    return true;
  }

  async hit(event, client) {
    if (!EVENTS.has(event) || !this.allowed(client)) return false;
    this.sql.exec('INSERT INTO counts (name, n) VALUES (?, 1) ON CONFLICT(name) DO UPDATE SET n = n + 1', event);
    return true;
  }

  async totals() {
    const out = { visit: 0, download: 0, image: 0, share: 0, convert: 0 };
    for (const row of this.sql.exec('SELECT name, n FROM counts')) out[row.name] = row.n;
    return out;
  }
}

const json = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff', ...(init.headers || {}) },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const stats = env.STATS.get(env.STATS.idFromName('global'));

    if (url.pathname === '/api/hit') {
      if (request.method !== 'POST') return json({ error: 'method' }, { status: 405 });
      const event = (await request.text()).slice(0, 16).trim();
      const client = request.headers.get('CF-Connecting-IP') || 'unknown';
      const counted = await stats.hit(event, client);
      return json({ ok: counted }, { status: counted ? 200 : 202, headers: { 'Cache-Control': 'no-store' } });
    }

    if (url.pathname === '/api/stats') {
      if (request.method !== 'GET') return json({ error: 'method' }, { status: 405 });
      return json(await stats.totals(), { headers: { 'Cache-Control': 'public, max-age=60' } });
    }

    return env.ASSETS.fetch(request);
  },
};
