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
