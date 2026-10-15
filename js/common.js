const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const REPO = 'Dexters-Hub/kalkandam';

export const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(`kalkandam:${key}`)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`kalkandam:${key}`, JSON.stringify(value)); } catch {}
  },
};

export function initThemeToggle(motion) {
  const root = document.documentElement;
  const button = $('#theme-toggle');
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const current = () => root.dataset.theme || (system.matches ? 'dark' : 'light');
  const sync = () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', `Switch to ${next} theme`);
    button.title = `Switch to ${next} theme`;
    const color = current() === 'dark' ? '#0b0b0c' : '#fafaf8';
    for (const meta of $$('meta[name="theme-color"]')) meta.setAttribute('content', color);
  };
  button.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('kalkandam:theme', next); } catch {}
      sync();
    };
    if (document.startViewTransition && motion.enabled) document.startViewTransition(apply);
    else apply();
    motion.spin(button.querySelector(next === 'dark' ? '.moon' : '.sun'));
  });
  system.addEventListener('change', sync);
  sync();
}

const STAR_TTL = 5 * 60 * 1000;

async function fetchStars() {
  const cached = store.get('stars', null);
  if (cached && Date.now() - cached.at < STAR_TTL) return cached.count;
  const res = await fetch(`https://api.github.com/repos/${REPO}`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(res.status);
  const { stargazers_count: count } = await res.json();
  store.set('stars', { count, at: Date.now() });
  return count;
}

export function initStars(motion) {
  const el = $('#star-count');
  let shown = null;
  const update = async () => {
    if (document.hidden) return;
    try {
      const count = await fetchStars();
      if (count === shown) return;
      el.hidden = count === 0;
      if (shown === null) motion.countUp(el, count);
      else { el.textContent = count.toLocaleString(); motion.pulse($('#star')); }
      shown = count;
    } catch {}
  };
  update();
  setInterval(update, STAR_TTL);
  document.addEventListener('visibilitychange', update);
}

export function track(event) {
  try {
    const body = new Blob([event], { type: 'text/plain' });
    if (navigator.sendBeacon?.('/api/hit', body)) return;
    fetch('/api/hit', { method: 'POST', body: event, keepalive: true }).catch(() => {});
  } catch {}
}

export function trackVisit() {
  try {
    if (sessionStorage.getItem('kalkandam:visited')) return;
    sessionStorage.setItem('kalkandam:visited', '1');
  } catch {}
  track('visit');
}

export async function initSiteStats(motion) {
  const el = $('#site-stats');
  if (!el) return;
  const res = await fetch('/api/stats');
  if (!res.ok) return;
  const t = await res.json();
  const items = [
    [t.visit, 'visit', 'visits'],
    [t.download, 'font downloaded', 'fonts downloaded'],
    [t.image, 'image made', 'images made'],
    [t.share, 'share', 'shares'],
    [t.convert, 'conversion', 'conversions'],
  ].filter(([n]) => Number.isFinite(n) && n > 0).map(([n, one, many]) => [n, n === 1 ? one : many]);
  if (!items.length) return;
  el.replaceChildren();
  items.forEach(([n, label], i) => {
    if (i) el.append(' · ');
    const num = document.createElement('b');
    num.textContent = '0';
    el.append(num, ` ${label}`);
    motion.countUp(num, n);
  });
  el.hidden = false;
}

export function initFacts(facts, motion, interval = 8000) {
  const box = $('#fact');
  if (!box || !facts.length) return;
  const body = box.querySelector('.fact-body');
  const text = box.querySelector('.fact-text');
  const src = box.querySelector('.fact-src');
  const order = facts.map((_, n) => n).sort(() => Math.random() - 0.5);
  let i = 0;
  const show = () => {
    const fact = facts[order[i]];
    text.textContent = fact.text;
    src.href = fact.src;
    const site = new URL(fact.src).hostname.replace(/^www\./, '');
    src.title = `Source: ${site}`;
    src.setAttribute('aria-label', `Source: ${site}`);
  };
  show();
  box.hidden = false;

  let visible = false;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(box);
  setInterval(() => {
    if (!visible || document.hidden || box.matches(':hover, :focus-within')) return;
    i = (i + 1) % order.length;
    motion.crossfade(body, show);
  }, interval);
}
