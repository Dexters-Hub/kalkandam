import { DurableObject } from 'cloudflare:workers';

const EVENTS = new Set(['visit', 'download', 'image', 'share', 'convert']);
const LIMIT_PER_MINUTE = 30;
const CONTRIB_PER_HOUR = 5;
const KINDS = { designer: 'designer', year: 'year', foundry: 'foundry', licence: 'licence', story: 'story', correction: 'correction', other: 'other' };
const REPO = 'Dexters-Hub/kalkandam';

export class Stats extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS counts (name TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS contribs (client TEXT NOT NULL, t INTEGER NOT NULL)');
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

  async contribAllowed(client) {
    const now = Date.now();
    this.sql.exec('DELETE FROM contribs WHERE t < ?', now - 3_600_000);
    const [{ n }] = [...this.sql.exec('SELECT COUNT(*) AS n FROM contribs WHERE client = ?', client)];
    if (n >= CONTRIB_PER_HOUR) return false;
    this.sql.exec('INSERT INTO contribs (client, t) VALUES (?, ?)', client, now);
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

const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);
// Quote user text so it can't mention people, close issues or render as markup outside the quote.
const quote = (text) => text.replace(/@/g, '@\u200b').replace(/`/g, "'").split('\n').map((l) => `> ${l}`).join('\n');

async function hashClient(ip) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`kalkandam:${ip}`));
  return [...new Uint8Array(digest).slice(0, 12)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyTurnstile(token, ip, secret) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const out = await res.json().catch(() => ({}));
  return out.success === true && (!out.hostname || /(^|\.)kalkandam\.in$|\.workers\.dev$/.test(out.hostname));
}

async function contribute(request, env, stats) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, { status: 405 });
  if (!env.GITHUB_TOKEN || !env.TURNSTILE_SECRET) return json({ ok: false, error: 'not-configured' }, { status: 503 });
  if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) return json({ ok: false, error: 'type' }, { status: 415 });
  const raw = await request.text();
  if (raw.length > 8192) return json({ ok: false, error: 'too-large' }, { status: 413 });
  let data;
  try { data = JSON.parse(raw); } catch { return json({ ok: false, error: 'json' }, { status: 400 }); }
  if (!data || typeof data !== 'object') return json({ ok: false, error: 'json' }, { status: 400 });

  // Bots fill the hidden field; pretend it worked.
  if (clean(data.website, 200)) return json({ ok: true });

  const font = clean(data.font, 80).replace(/\s+/g, ' ');
  const kind = KINDS[data.kind] || 'other';
  const details = clean(data.details, 2000);
  const name = clean(data.name, 80).replace(/\s+/g, ' ');
  let source = clean(data.source, 300);
  if (!font || details.length < 3) return json({ ok: false, error: 'missing' }, { status: 400 });
  if (source) {
    try {
      const u = new URL(source);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error();
      source = u.href;
    } catch {
      return json({ ok: false, error: 'source' }, { status: 400 });
    }
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!(await verifyTurnstile(clean(data.token, 4096), ip, env.TURNSTILE_SECRET))) {
    return json({ ok: false, error: 'challenge' }, { status: 403 });
  }
  if (!(await stats.contribAllowed(await hashClient(ip || 'unknown')))) {
    return json({ ok: false, error: 'rate' }, { status: 429 });
  }

  const body = [
    `**Font:** ${quote(font).slice(2)}`,
    `**About:** ${kind}`,
    '',
    '**Details**',
    quote(details),
    source ? `\n**Source:** <${source}>` : '',
    name ? `\n**Credit as:** ${quote(name).slice(2)}` : '',
    '\n---\nSent from the form on kalkandam.in/about. Check before adding it to the site.',
  ].join('\n');

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'kalkandam-worker',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: `Font info: ${font.replace(/@/g, '@\u200b')} (${kind})`, body, labels: ['font-info'] }),
  });
  if (!res.ok) {
    console.error('github issue failed', res.status);
    return json({ ok: false, error: 'upstream' }, { status: 502 });
  }
  return json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}

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

    if (url.pathname === '/api/config') {
      return json({ turnstile: env.TURNSTILE_SITEKEY || null }, { headers: { 'Cache-Control': 'public, max-age=300' } });
    }

    if (url.pathname === '/api/contribute') return contribute(request, env, stats);

    return env.ASSETS.fetch(request);
  },
};
