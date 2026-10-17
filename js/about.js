import * as motion from './motion.js?v=15';
import { initThemeToggle, initStars, initFacts, initSiteStats, trackVisit, designerNames, personSlug, loadFontInfo } from './common.js?v=15';
import { FACTS } from './facts.js?v=15';

const $ = (sel, root = document) => root.querySelector(sel);
const KINDS = { designer: 'Designer', year: 'Year', foundry: 'Foundry / publisher', licence: 'Licence', story: 'Story', correction: 'Correction', other: 'Other' };

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c != null) node.append(c);
  return node;
}

const FONT_VERSION = 3;
const SAMPLE = 'കൽക്കണ്ടം';

function pickStyle(styles) {
  const plain = styles.filter((f) => !/COLR/.test(f.style) && !f.italic);
  const pool = plain.length ? plain : styles;
  return pool.reduce((best, f) => (Math.abs(f.weight - 400) < Math.abs(best.weight - 400) ? f : best));
}

// Load each sample font only when its row scrolls near the screen.
const sampleObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    sampleObserver.unobserve(entry.target);
    const font = entry.target._font;
    const face = new FontFace(`cr-${font.id}`, `url("/${encodeURI(font.web)}?v=${FONT_VERSION}")`);
    face.load().then((f) => {
      document.fonts.add(f);
      entry.target.style.fontFamily = `"cr-${font.id}", system-ui`;
      entry.target.classList.add('ready');
    }).catch(() => entry.target.classList.add('ready'));
  }
}, { rootMargin: '300px 0px' }) : null;

function renderCredits(fonts) {
  const groups = new Map();
  for (const f of fonts.filter((x) => x.collection === 'Unicode')) {
    const key = f.foundry || (f.designer || 'Unknown').replace(/\s*\(.*$/, '');
    if (!groups.has(key)) groups.set(key, new Map());
    const fams = groups.get(key);
    if (!fams.has(f.family)) fams.set(f.family, []);
    fams.get(f.family).push(f);
  }
  const box = $('#credits');
  const sorted = [...groups.entries()].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
  for (const [foundry, fams] of sorted) {
    const list = el('ul', { class: 'credit-list' });
    for (const [family, styles] of [...fams.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const f = styles[0];
      const sample = el('span', { class: 'credit-sample', lang: 'ml', 'aria-hidden': 'true' }, SAMPLE);
      sample._font = pickStyle(styles);
      if (sampleObserver) sampleObserver.observe(sample);
      const name = f.source ? el('a', { href: f.source, target: '_blank', rel: 'noopener' }, family) : el('span', {}, family);
      const who = f.designer && f.designer !== foundry ? f.designer : '';
      list.append(el('li', { class: 'credit' },
        sample,
        el('div', { class: 'credit-meta' },
          el('b', { class: 'credit-name' }, name),
          who ? el('span', { class: 'credit-who' }, who) : null,
          f.license ? el('span', { class: 'credit-lic' }, f.license) : null)));
    }
    box.append(el('div', { class: 'credit-group' }, el('h3', {}, foundry, el('small', {}, `${fams.size} famil${fams.size === 1 ? 'y' : 'ies'}`)), list));
  }

  const counts = {};
  for (const f of fonts) if (f.collection !== 'Unicode') (counts[f.collection] ||= new Set()).add(f.family);
  const dtp = $('#dtp-counts');
  for (const c of ['MLU', 'FML', 'ML-TT', 'ML-KV']) {
    if (!counts[c]) continue;
    dtp.append(el('div', {}, el('b', {}, String(counts[c].size)), el('span', {}, `${c} families`)));
  }
}

function renderPeople(fonts, info) {
  const people = new Map();
  const add = (name, family, collection) => {
    if (!people.has(name)) people.set(name, new Map());
    people.get(name).set(`${family} (${collection})`, { family, collection });
  };
  for (const f of fonts) {
    if (f.collection === 'Unicode') for (const n of designerNames(f.designer)) add(n, f.family, f.collection);
  }
  for (const [key, entry] of Object.entries(info.fonts)) {
    const m = key.match(/^(.+) \((.+)\)$/);
    if (m && entry.designer) for (const n of designerNames(entry.designer)) add(n, m[1], m[2]);
  }
  const box = $('#people-list');
  const sorted = [...people.entries()].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
  for (const [name, fams] of sorted) {
    const extra = info.people[name] || {};
    const body = el('div', { class: 'person-body' });
    if (extra.about) body.append(el('p', {}, extra.about));
    body.append(el('p', { class: 'person-fonts' }, [...fams.values()].map((f) => f.family).sort().join(' · ')));
    if (extra.link && /^https?:\/\//.test(extra.link)) {
      body.append(el('a', { href: extra.link, target: '_blank', rel: 'noopener' }, extra.link.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')));
    }
    box.append(el('details', { class: 'person', id: personSlug(name) },
      el('summary', {}, el('b', {}, name), el('small', {}, `${fams.size} font${fams.size === 1 ? '' : 's'}`)),
      body));
  }
  const target = location.hash.startsWith('#p-') && document.getElementById(location.hash.slice(1));
  if (target) {
    target.open = true;
    target.scrollIntoView({ block: 'center' });
  }
}

let turnstileWidget = null;

async function initTurnstile(sitekey) {
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.append(s);
  });
  turnstileWidget = window.turnstile.render('#cf-turnstile', { sitekey, theme: 'auto', size: 'flexible' });
}

function initFontPicker(fonts) {
  const input = $('#cf-font');
  const list = $('#cf-fonts');
  const seen = new Set();
  const items = [];
  for (const f of fonts) {
    const value = `${f.family} (${f.collection})`;
    if (seen.has(value)) continue;
    seen.add(value);
    items.push({ value, family: f.family, collection: f.collection, key: f.family.toLowerCase() });
  }
  items.sort((a, b) => a.family.localeCompare(b.family) || a.collection.localeCompare(b.collection));
  let shown = [];
  let active = -1;

  const setActive = (i) => {
    active = i;
    [...list.children].forEach((li, j) => li.setAttribute('aria-selected', String(j === i)));
    if (i >= 0) {
      input.setAttribute('aria-activedescendant', `cf-opt-${i}`);
      list.children[i].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  };
  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    setActive(-1);
  };
  const open = () => {
    const q = input.value.trim().toLowerCase().replace(/\s*\(.*$/, '');
    const starts = items.filter((it) => it.key.startsWith(q));
    const contains = q ? items.filter((it) => !it.key.startsWith(q) && it.key.includes(q)) : [];
    shown = [...starts, ...contains].slice(0, 60);
    list.replaceChildren(...shown.map((it, i) => el('li', { id: `cf-opt-${i}`, role: 'option', 'aria-selected': 'false', 'data-i': String(i) },
      el('span', {}, it.family), el('small', {}, it.collection))));
    if (!shown.length) list.append(el('li', { class: 'combo-empty' }, 'Not in the list? Just type the name.'));
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(-1);
  };
  const pick = (i) => {
    if (!shown[i]) return;
    input.value = shown[i].value;
    close();
  };

  input.addEventListener('focus', open);
  input.addEventListener('input', open);
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (list.hidden) open();
      const n = shown.length;
      if (n) setActive(e.key === 'ArrowDown' ? (active + 1) % n : (active - 1 + n) % n);
    } else if (e.key === 'Enter' && !list.hidden && active >= 0) {
      e.preventDefault();
      pick(active);
    } else if (e.key === 'Escape' && !list.hidden) {
      e.preventDefault();
      close();
    }
  });
  list.addEventListener('pointerdown', (e) => e.preventDefault());
  list.addEventListener('click', (e) => {
    const li = e.target.closest('[data-i]');
    if (li) pick(Number(li.dataset.i));
  });
}

async function initForm(fonts) {
  const form = $('#contrib-form');
  const status = $('#cf-status');
  const button = $('#cf-submit');
  initFontPicker(fonts);

  const params = new URLSearchParams(location.search);
  if (params.get('font')) {
    $('#cf-font').value = params.get('font').slice(0, 80);
    if (params.get('kind') && KINDS[params.get('kind')]) $('#cf-kind').value = params.get('kind');
  }

  let config = { turnstile: null };
  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (res.ok) config = await res.json();
  } catch {}
  if (config.turnstile) initTurnstile(config.turnstile).catch(() => {});

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const data = Object.fromEntries(new FormData(form));
    delete data['cf-turnstile-response']; // Turnstile adds this field; the token is sent once as `token`.
    if (!data.font.trim() || !data.details.trim()) {
      status.textContent = 'Please add the font name and some details.';
      return;
    }
    if (data.source && !/^https?:\/\//i.test(data.source)) {
      status.textContent = 'The source link should start with http:// or https://';
      return;
    }
    const token = turnstileWidget !== null ? window.turnstile.getResponse(turnstileWidget) : '';
    if (config.turnstile && !token) {
      status.textContent = 'Please complete the quick check above.';
      return;
    }
    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const res = await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, token }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || res.status);
      form.reset();
      status.textContent = out.local
        ? 'Thank you! (Local preview: nothing was sent.)'
        : 'Thank you! Your note was sent for review.';
      motion.pulse(status);
    } catch (err) {
      status.textContent = String(err.message) === 'not-configured'
        ? 'Submissions open very soon. Meanwhile you can share it on GitHub: github.com/Dexters-Hub/kalkandam/issues'
        : 'Sorry, that did not go through. Please try again in a minute.';
    } finally {
      button.disabled = false;
      button.textContent = 'Send for review';
      if (turnstileWidget !== null) window.turnstile.reset(turnstileWidget);
    }
  });
}

function safely(fn) {
  try { fn(); } catch (err) { console.error(err); }
}

async function main() {
  const [fonts, info] = await Promise.all([
    fetch('./data/fonts.json', { cache: 'no-cache' }).then((r) => r.json()),
    loadFontInfo(),
  ]);
  safely(() => renderCredits(fonts));
  safely(() => renderPeople(fonts, info));
  await initForm(fonts);
  if (location.hash === '#contribute') $('#contribute').scrollIntoView();
}

main().catch((err) => console.error(err));
safely(motion.pressFeedback);
safely(() => initThemeToggle(motion));
safely(() => initStars(motion));
safely(() => initFacts(FACTS, motion));
safely(trackVisit);
initSiteStats(motion).catch(() => {});
