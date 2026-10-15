import { toLegacy, fromLegacy, toManglish, fromManglish } from './malayalam.js?v=8';
import * as motion from './motion.js?v=8';
import { store, REPO, initThemeToggle, initStars, track, trackVisit, initSiteStats, initFacts } from './common.js?v=8';
import { FACTS } from './facts.js?v=8';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const COLLECTION_ORDER = ['Unicode', 'MLU', 'FML', 'ML-TT', 'ML-KV'];
const COLLECTION_INFO = {
  Unicode: 'Free & open-source Unicode fonts. Work everywhere: phones, web, WhatsApp, Canva.',
  MLU: 'Unicode versions of the classic DTP faces.',
  FML: 'Legacy ASCII fonts (FML layout). Use the converter: “Copy to FML series”.',
  'ML-TT': 'Legacy ASCII fonts used in PageMaker / Photoshop DTP. Use “Copy to ML series”.',
  'ML-KV': 'Display & poster faces in the ML layout. Use “Copy to ML series”.',
};
const STYLE_FILTERS = ['All', 'Regular', 'Bold', 'Italic', 'Heavy'];
const PRESETS = [
  'ഇന്നത്തെ ഏറ്റവും പുതിയ വാർത്തകൾ',
  'ഓണാശംസകൾ',
  'വിവാഹ ക്ഷണക്കത്ത്',
  'സ്വാഗതം',
  'എന്റെ കേരളം എത്ര സുന്ദരം',
  'അമ്മ',
  'കൽക്കണ്ടം',
  'ഒരൊറ്റമതമുണ്ടുലകിന്നുയിരാം പ്രേമമതൊന്നല്ലോ',
];
const THEMES = [
  { fg: '', bg: 'transparent', sw: 'linear-gradient(135deg, #fff 50%, #121212 50%)', name: 'Plain', png: ['#121212', '#ffffff'] },
  { fg: '#fafaf8', bg: '#121212', sw: '#121212', name: 'Ink' },
  { fg: '#ffffff', bg: '#ff4f1f', sw: '#ff4f1f', name: 'Vermilion' },
  { fg: '#1f2b22', bg: '#dfe8dc', sw: '#dfe8dc', name: 'Sage' },
  { fg: '#10233a', bg: '#dbe8f6', sw: '#dbe8f6', name: 'Sky' },
  { fg: '#2b2210', bg: '#f6ecc9', sw: '#f6ecc9', name: 'Butter' },
];
const themeColors = (t) => (t.png ? { fg: t.png[0], bg: t.png[1] } : { fg: t.fg, bg: t.bg });

const state = {
  text: store.get('text', PRESETS[0]),
  manglish: store.get('manglish', false),
  manglishRaw: store.get('manglishRaw', ''),
  size: store.get('size', 34),
  theme: store.get('theme', 0),
  collection: 'All',
  style: 'All',
  query: '',
};

const DOWNLOAD_BASE = `https://raw.githubusercontent.com/${REPO}/main/`;
const downloadUrl = (font) => DOWNLOAD_BASE + font.file.split('/').map(encodeURIComponent).join('/');

let FAMILIES = [];
let BY_ID = new Map();

function displayText(text, encoding) {
  if (encoding === 'fml') return toLegacy(text, 'fml', { forDisplay: true });
  if (encoding === 'ml' || encoding === 'kv') return toLegacy(text, 'ml', { forDisplay: true });
  return text;
}

function copyText(text, encoding) {
  if (encoding === 'fml') return toLegacy(text, 'fml');
  if (encoding === 'ml' || encoding === 'kv') return toLegacy(text, 'ml');
  return text;
}

function hue(str) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h % 360;
}

const FONT_VERSION = 2;
const fontLoads = new Map();
const loadedFonts = new Set();
const nearViewport = (el, margin = window.innerHeight) => {
  const r = el.getBoundingClientRect();
  return r.bottom > -margin && r.top < window.innerHeight + margin;
};
const cssFamily = (font) => `k-${font.id}`;

function loadFont(font, attempt = 0) {
  if (!fontLoads.has(font.id)) {
    const face = new FontFace(cssFamily(font), `url("${encodeURI(font.web)}?v=${FONT_VERSION}")`, { display: 'swap' });
    fontLoads.set(font.id, face.load().then((loaded) => {
      document.fonts.add(loaded);
      loadedFonts.add(font.id);
      return loaded;
    }).catch((err) => {
      fontLoads.delete(font.id);
      if (attempt > 0) throw err;
      return new Promise((resolve) => setTimeout(resolve, 800)).then(() => loadFont(font, attempt + 1));
    }));
  }
  return fontLoads.get(font.id);
}

function groupFamilies(fonts) {
  const groups = new Map();
  for (const f of fonts) {
    const key = `${f.collection}|${f.family}`;
    if (!groups.has(key)) groups.set(key, { key, family: f.family, collection: f.collection, encoding: f.encoding, styles: [] });
    groups.get(key).styles.push(f);
  }
  const rank = (f) => (/^(regular|normal|book|roman)$/i.test(f.style) ? -1 : 0)
    + (f.italic || /oblique|italic/i.test(f.style) ? 1 : 0)
    + (/condensed|expanded|narrow|wide/i.test(f.style) ? 0.5 : 0)
    + Math.abs(f.weight - 400) / 1000;
  for (const g of groups.values()) {
    g.styles.sort((a, b) => a.weight - b.weight || Number(a.italic) - Number(b.italic));
    g.default = [...g.styles].sort((a, b) => rank(a) - rank(b))[0];
    labelStyles(g);
    g.hue = hue(g.family);
    g.search = `${g.family} ${g.collection} ${g.styles.map((s) => s.name).join(' ')}`.toLowerCase();
  }
  return [...groups.values()].sort((a, b) =>
    COLLECTION_ORDER.indexOf(a.collection) - COLLECTION_ORDER.indexOf(b.collection) || a.family.localeCompare(b.family));
}

function styleMatches(font, filter) {
  const s = font.style.toLowerCase();
  switch (filter) {
    case 'Regular': return !font.italic && font.weight < 600;
    case 'Bold': return !font.italic && font.weight >= 600 && font.weight < 800;
    case 'Italic': return font.italic || s.includes('italic');
    case 'Heavy': return font.weight >= 800 || /black|heavy|ultra|extra/.test(s);
    default: return true;
  }
}

function styleLabel(font) {
  return font.label || font.style.replace(/^Normal$/i, 'Regular');
}

function labelStyles(group) {
  const plain = group.styles.map((f) => f.style.replace(/^Normal$/i, 'Regular'));
  if (new Set(plain).size === plain.length) return;
  const familyWord = group.family.toLowerCase().replace(/[^a-z]/g, '');
  for (const f of group.styles) {
    const words = f.name.replace(/^(F?ML(-TT|-KV|U)?-?)/i, '').split(/[\s_-]+/)
      .filter((w) => w && !familyWord.startsWith(w.toLowerCase().replace(/[^a-z]/g, '')) && !/^(regular|normal)$/i.test(w));
    f.label = [...new Set(words)].join(' ') || 'Regular';
  }
}

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const card = entry.target;
    observer.unobserve(card);
    activateCard(card);
  }
}, { rootMargin: '600px 0px' });

function activateCard(card) {
  const font = card._font;
  loadFont(font)
    .then(() => card.classList.add('ready'))
    .catch(() => { card.classList.add('ready'); card.querySelector('.sub').textContent += ' · failed to load'; });
}

function buildCard(group, { own = false } = {}) {
  const card = document.createElement('article');
  card.className = 'card';
  card.style.setProperty('--h', group.hue);
  card._group = group;
  card._font = group.default;

  const styleCount = group.styles.length;
  card.innerHTML = `
    <div class="card-head">
      <div>
        <h3></h3>
        <div class="sub"></div>
      </div>
      <p class="badge"></p>
    </div>
    <p class="preview" role="button" tabindex="0"></p>
    <div class="card-styles"></div>
    <div class="card-actions">
      <button data-act="open">Open</button>
      <button data-act="copy">Copy</button>
      <button data-act="png">PNG</button>
      ${own ? '<button data-act="remove">Remove</button>' : '<a data-act="font" download>Font ↓</a>'}
    </div>`;
  $('h3', card).textContent = group.family;
  const designer = (group.styles[0].designer || '').replace(/[\s,;.]+$/, '');
  $('.sub', card).textContent = `${styleCount} style${styleCount > 1 ? 's' : ''}${designer ? ` · ${designer}` : ''}`;
  $('.badge', card).textContent = group.collection;

  const styles = $('.card-styles', card);
  if (styleCount > 1) {
    const MAX_CHIPS = 8;
    const shown = [group.default, ...group.styles.filter((f) => f !== group.default)].slice(0, MAX_CHIPS);
    for (const font of group.styles.filter((f) => shown.includes(f))) {
      const b = document.createElement('button');
      b.textContent = styleLabel(font);
      b.dataset.id = font.id;
      styles.append(b);
    }
    if (styleCount > MAX_CHIPS) {
      const more = document.createElement('button');
      more.textContent = `+${styleCount - MAX_CHIPS} more`;
      more.dataset.act = 'open';
      styles.append(more);
    }
  }
  setCardFont(card, group.default);
  updateCardText(card);
  return card;
}

function setCardFont(card, font, { lazy = false } = {}) {
  card._font = font;
  const preview = $('.preview', card);
  const family = `"${cssFamily(font)}", system-ui`;
  for (const b of $$('.card-styles button', card)) b.setAttribute('aria-pressed', String(b.dataset.id === font.id));
  const dl = $('[data-act="font"]', card);
  if (dl) {
    dl.href = downloadUrl(font);
    dl.setAttribute('download', font.file.split('/').pop());
  }
  if (!card.classList.contains('ready') || loadedFonts.has(font.id)) {
    preview.style.fontFamily = family;
    return;
  }
  if (lazy && !nearViewport(card)) {
    card.classList.remove('ready');
    preview.style.fontFamily = family;
    observer.observe(card);
    return;
  }
  loadFont(font)
    .then(() => { if (card._font === font) preview.style.fontFamily = family; })
    .catch(() => {});
}

function updateCardText(card) {
  const preview = $('.preview', card);
  const text = state.text || ' ';
  let span = preview.firstElementChild;
  if (!span) {
    span = document.createElement('span');
    span.className = 'pv';
    preview.replaceChildren(span);
  }
  span.textContent = displayText(text, card._group.encoding);
  preview.setAttribute('aria-label', `Open ${card._group.family}: ${text}`);
}

function renderControls() {
  const presets = $('#presets');
  for (const p of PRESETS) {
    const b = document.createElement('button');
    b.textContent = p;
    b.addEventListener('click', () => setText(p, { fromPreset: true }));
    presets.append(b);
  }

  const themes = $('#themes');
  THEMES.forEach((t, i) => {
    const b = document.createElement('button');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', t.name);
    b.title = t.name;
    b.style.background = t.sw;
    b.addEventListener('click', () => { state.theme = i; store.set('theme', i); applyTheme(); });
    themes.append(b);
  });

  const counts = { All: FAMILIES.length };
  for (const g of FAMILIES) counts[g.collection] = (counts[g.collection] || 0) + 1;
  const chips = $('#collections');
  for (const c of ['All', ...COLLECTION_ORDER]) {
    if (!counts[c]) continue;
    const b = document.createElement('button');
    b.innerHTML = `${c}<small>${counts[c]}</small>`;
    b.dataset.value = c;
    b.title = COLLECTION_INFO[c] || 'Every font';
    b.addEventListener('click', () => { state.collection = c; applyFilters({ animate: true }); });
    chips.append(b);
  }
  const styles = $('#styles');
  for (const s of STYLE_FILTERS) {
    const b = document.createElement('button');
    b.textContent = s;
    b.dataset.value = s;
    b.addEventListener('click', () => { state.style = s; applyFilters({ animate: true }); });
    styles.append(b);
  }

  const sample = $('#sample');
  const toggle = $('#manglish-toggle');
  const syncToggle = () => {
    toggle.setAttribute('aria-pressed', String(state.manglish));
    $('#manglish-hint').hidden = !state.manglish;
    sample.value = state.manglish ? state.manglishRaw : state.text;
    sample.placeholder = state.manglish ? 'Type Manglish: ente keraLam…' : 'Type Malayalam, or switch to Manglish…';
  };
  toggle.addEventListener('click', () => {
    state.manglish = !state.manglish;
    store.set('manglish', state.manglish);
    syncToggle();
    sample.focus();
  });
  sample.addEventListener('input', () => {
    if (state.manglish) {
      state.manglishRaw = sample.value;
      store.set('manglishRaw', state.manglishRaw);
      setText(fromManglish(sample.value));
    } else {
      setText(sample.value);
    }
  });
  syncToggle();

  const size = $('#size');
  size.value = state.size;
  size.addEventListener('input', () => {
    state.size = Number(size.value);
    store.set('size', state.size);
    refreshText();
  });

  let searchTimer;
  $('#search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.query = e.target.value.trim().toLowerCase(); applyFilters(); }, 120);
  });

  const composer = $('.composer');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const compact = composer.classList.contains('compact');
      if (y > 320 && !compact) {
        const full = composer.offsetHeight;
        composer.classList.add('compact');
        composer.style.marginBottom = `${full - composer.offsetHeight}px`;
      } else if (y < 120 && compact) {
        composer.classList.remove('compact');
        composer.style.marginBottom = '';
      }
      $('.top').classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    });
  }, { passive: true });

  $('#grid').addEventListener('click', onCardClick);
  $('#grid').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('preview')) openSheet(e.target.closest('.card'));
  });

  setChipIndicator = motion.indicator(chips);
  window.addEventListener('resize', () => setChipIndicator($('#collections button[aria-pressed="true"]')));
}
let setChipIndicator = () => {};

let textTimer;
function setText(text, { fromPreset = false } = {}) {
  state.text = text;
  store.set('text', text);
  if (fromPreset) {
    state.manglish = false;
    store.set('manglish', false);
    $('#manglish-toggle').setAttribute('aria-pressed', 'false');
    $('#manglish-hint').hidden = true;
    $('#sample').value = text;
  }
  clearTimeout(textTimer);
  if (fromPreset) {
    refreshText();
    motion.ripplePreviews($$('#grid .card:not([hidden]) .preview'));
  } else {
    textTimer = setTimeout(refreshText, 60);
  }
}

function refreshText() {
  for (const grid of $$('.grid')) grid.style.setProperty('--size', `${state.size}px`);
  for (const card of $$('.card')) updateCardText(card);
}

function applyTheme() {
  const t = THEMES[state.theme] || THEMES[0];
  for (const grid of $$('.grid')) {
    grid.style.setProperty('--size', `${state.size}px`);
    if (t.fg) grid.style.setProperty('--fg', t.fg);
    else grid.style.removeProperty('--fg');
    grid.style.setProperty('--pbg', t.bg);
  }
  $$('#themes button').forEach((b, i) => b.setAttribute('aria-checked', String(i === state.theme)));
  motion.pulse($$('#themes button')[state.theme]);
}

function applyFilters({ animate = false } = {}) {
  const cards = $$('#grid .card');
  if (animate) motion.flipGrid(cards, filterCards);
  else filterCards();
  const active = $('#collections button[aria-pressed="true"]');
  setChipIndicator(active);
  const bar = $('#collections');
  if (active && (active.offsetLeft < bar.scrollLeft || active.offsetLeft + active.offsetWidth > bar.scrollLeft + bar.clientWidth)) {
    bar.scrollTo({ left: active.offsetLeft - 24, behavior: motion.enabled ? 'smooth' : 'auto' });
  }
}

function filterCards() {
  let shown = 0;
  for (const card of $$('#grid .card')) {
    const g = card._group;
    const okCollection = state.collection === 'All' || g.collection === state.collection;
    const okQuery = !state.query || g.search.includes(state.query);
    const match = g.styles.find((f) => styleMatches(f, state.style));
    const visible = okCollection && okQuery && Boolean(match);
    card.hidden = !visible;
    if (visible) {
      shown++;
      if (state.style !== 'All' && !styleMatches(card._font, state.style)) setCardFont(card, match, { lazy: true });
    }
  }
  $$('#collections button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === state.collection)));
  $$('#styles button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === state.style)));
  const note = state.collection !== 'All' ? `. ${COLLECTION_INFO[state.collection]}` : '';
  $('#count').textContent = `${shown} famil${shown === 1 ? 'y' : 'ies'}${note}`;
}

function onCardClick(e) {
  const card = e.target.closest('.card');
  if (!card) return;
  const styleBtn = e.target.closest('.card-styles button[data-id]');
  if (styleBtn) {
    setCardFont(card, card._group.styles.find((f) => f.id === styleBtn.dataset.id));
    return;
  }
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (e.target.closest('.preview') || act === 'open') openSheet(card);
  else if (act === 'copy') copyForFont(card._group.encoding, state.text, e.target.closest('[data-act]'));
  else if (act === 'png') {
    const button = e.target.closest('[data-act]');
    exportPng(card._font, card._group.encoding, state.text, {
      size: state.size * 2, ...themeColors(THEMES[state.theme]), align: 'center',
    }).then((file) => { downloadBlob(file); motion.confirm(button, 'Saved ✓'); });
  } else if (act === 'font') track('download');
  else if (act === 'remove') card.remove();
}

function toast(msg) {
  motion.toast($('#toast'), msg);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

async function copyForFont(encoding, text, button) {
  if (encoding !== 'unicode') track('convert');
  await copyToClipboard(copyText(text, encoding));
  motion.confirm(button);
  toast(encoding === 'unicode' ? 'Copied' : `Copied in ${encoding === 'fml' ? 'FML' : 'ML'} encoding. Paste into a DTP app with this font`);
}

function downloadBlob({ blob, name }) {
  track('image');
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Image saved');
}

async function exportPng(font, encoding, text, { size, fg, bg, align = 'center', transparent = false }) {
  const family = font.local ? font.local : cssFamily(font);
  if (!font.local) await loadFont(font);
  const content = displayText(text || ' ', encoding);
  const px = Math.round(size);
  await document.fonts.load(`${px}px "${family}"`, content);

  const width = 1600;
  const pad = Math.round(px * 0.9);
  const maxLine = width - pad * 2;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${px}px "${family}"`;

  const lines = [];
  for (const para of content.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const probe = line ? `${line} ${word}` : word;
      if (ctx.measureText(probe).width > maxLine && line) {
        lines.push(line);
        line = word;
      } else line = probe;
    }
    lines.push(line);
  }
  const lineH = Math.round(px * 1.55);
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  canvas.width = transparent ? Math.ceil(Math.min(width, widest + pad * 2)) : width;
  canvas.height = lines.length * lineH + pad * 2;

  ctx.font = `${px}px "${family}"`;
  if (!transparent) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  const x = align === 'left' ? pad : align === 'right' ? canvas.width - pad : canvas.width / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, pad + lineH * i + lineH / 2));

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const slug = (font.family || 'font').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return { blob, name: `kalkandam-${slug}${transparent ? '-transparent' : ''}.png` };
}

const sheet = $('#sheet');
let sheetCard = null;

function openSheet(card) {
  sheetCard = card;
  const g = card._group;
  sheet.style.setProperty('--h', g.hue);
  $('#sheet-collection').textContent = g.collection;
  $('#sheet-title').textContent = g.family;
  $('#sheet-text').value = state.text;
  $('#sheet-bg').value = `#${hslToHex(g.hue, 65, 91)}`;
  $('#sheet-fg').value = '#121212';

  const chips = $('#sheet-styles');
  chips.innerHTML = '';
  if (g.styles.length > 1) {
    for (const f of g.styles) {
      const b = document.createElement('button');
      b.textContent = styleLabel(f);
      b.dataset.id = f.id;
      b.addEventListener('click', () => { setCardFont(card, f); renderSheet(); });
      chips.append(b);
    }
  }

  const others = FAMILIES.filter((o) => o !== g && o.family.toLowerCase() === g.family.toLowerCase());
  const also = $('#sheet-also');
  also.innerHTML = '';
  if (others.length) {
    also.append('Also in: ');
    for (const o of others) {
      const b = document.createElement('button');
      b.textContent = o.collection;
      b.addEventListener('click', () => {
        const target = $$('#grid .card').find((c) => c._group === o);
        if (target) { activateCard(target); openSheet(target); }
      });
      also.append(b, ' ');
    }
  }
  const wasOpen = sheet.open;
  renderSheet();
  if (!wasOpen) motion.openSheet(sheet);
}

function renderSheet() {
  if (!sheetCard) return;
  const font = sheetCard._font;
  const g = sheetCard._group;
  const stage = $('#stage');
  const text = $('#stage-text');
  const local = font.local;
  const family = `"${local || cssFamily(font)}", system-ui`;
  if (local || loadedFonts.has(font.id)) text.style.fontFamily = family;
  else loadFont(font).then(() => { if (sheetCard && sheetCard._font === font) text.style.fontFamily = family; }).catch(() => {});
  text.style.fontSize = `${$('#sheet-size').value}px`;
  text.style.color = $('#sheet-fg').value;
  text.style.textAlign = $('#sheet-align').value;
  stage.style.backgroundColor = $('#sheet-bg').value;
  text.textContent = displayText($('#sheet-text').value || ' ', g.encoding);
  if (g.encoding === 'unicode') {
    text.lang = 'ml';
    text.removeAttribute('aria-label');
  } else {
    text.removeAttribute('lang');
    text.setAttribute('aria-label', $('#sheet-text').value);
  }

  $$('#sheet-styles button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === font.id)));
  const kb = font.bytes ? `${Math.round(font.bytes / 1024)} KB` : '';
  const designer = (font.designer || '').replace(/[\s,;.]+$/, '');
  $('#sheet-meta').textContent = [styleLabel(font), designer, font.license, kb].filter(Boolean).join(' · ');
  const dl = $('#dl-font');
  dl.hidden = Boolean(local);
  if (!local) {
    dl.href = downloadUrl(font);
    dl.setAttribute('download', font.file.split('/').pop());
  }
  $('#sheet-note').textContent = g.encoding === 'unicode'
    ? 'Unicode font. Install it and type normally, or use it in Canva, CapCut, Photoshop.'
    : `Legacy ${g.encoding === 'fml' ? 'FML' : 'ML'} font. “Copy text” gives you the encoded text to paste into PageMaker / Photoshop with this font selected.`;
}

function sheetExportOpts(transparent) {
  return {
    size: Number($('#sheet-size').value) * 2,
    fg: $('#sheet-fg').value,
    bg: $('#sheet-bg').value,
    align: $('#sheet-align').value,
    transparent,
  };
}

function initSheet() {
  $('#sheet-close').addEventListener('click', () => motion.closeSheet(sheet));
  sheet.addEventListener('click', (e) => { if (e.target === sheet) motion.closeSheet(sheet); });
  sheet.addEventListener('cancel', (e) => { e.preventDefault(); motion.closeSheet(sheet); });
  motion.dragToDismiss(sheet, $('.sheet-head'));
  for (const id of ['#sheet-size', '#sheet-fg', '#sheet-bg', '#sheet-align']) $(id).addEventListener('input', renderSheet);
  $('#sheet-text').addEventListener('input', (e) => {
    setText(e.target.value);
    if (!state.manglish) $('#sample').value = e.target.value;
    renderSheet();
  });
  $('#dl-png').addEventListener('click', async () => {
    downloadBlob(await exportPng(sheetCard._font, sheetCard._group.encoding, $('#sheet-text').value, sheetExportOpts(false)));
  });
  $('#dl-transparent').addEventListener('click', async () => {
    downloadBlob(await exportPng(sheetCard._font, sheetCard._group.encoding, $('#sheet-text').value, sheetExportOpts(true)));
  });
  $('#dl-font').addEventListener('click', () => track('download'));
  $('#copy-text').addEventListener('click', (e) => copyForFont(sheetCard._group.encoding, $('#sheet-text').value, e.currentTarget));

  const share = $('#share-png');
  const probe = new File([new Blob()], 'x.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [probe] })) {
    share.hidden = false;
    share.addEventListener('click', async () => {
      const { blob, name } = await exportPng(sheetCard._font, sheetCard._group.encoding, $('#sheet-text').value, sheetExportOpts(false));
      try {
        await navigator.share({ files: [new File([blob], name, { type: 'image/png' })], title: 'Kalkandam' });
        track('image');
      } catch {}
    });
  }
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const CONVERTERS = {
  ml: { title: 'Converted to ML series', run: (t) => toLegacy(t, 'ml'), show: (t) => toLegacy(t, 'ml', { forDisplay: true }), fonts: ['ML-TT', 'ML-KV'] },
  fml: { title: 'Converted to FML series', run: (t) => toLegacy(t, 'fml'), show: (t) => toLegacy(t, 'fml'), fonts: ['FML'] },
  unicode: { title: 'Unicode Malayalam', run: fromLegacy, show: fromLegacy, fonts: ['Unicode', 'MLU'] },
  manglish: { title: 'Manglish', run: toManglish, show: toManglish, fonts: [] },
  'from-manglish': { title: 'Malayalam from Manglish', run: fromManglish, show: fromManglish, fonts: ['Unicode', 'MLU'] },
};
let lastConversion = null;

function initConverter() {
  const input = $('#conv-in');
  input.value = store.get('convIn', 'എന്റെ കേരളം എത്ര സുന്ദരം. കൽക്കണ്ടം പോലെ മധുരം!');
  input.addEventListener('input', () => store.set('convIn', input.value));
  const select = $('#conv-font');

  for (const b of $$('[data-conv]')) {
    b.addEventListener('click', () => {
      const conv = CONVERTERS[b.dataset.conv];
      track('convert');
      const src = input.value;
      lastConversion = { kind: b.dataset.conv, out: conv.run(src), src };
      const firstTime = $('#conv-result').hidden;
      $('#conv-result').hidden = false;
      if (firstTime) motion.showView($('#conv-result'));
      else motion.pulse($('#conv-out'));
      $('#conv-title').textContent = conv.title;
      $('#conv-out').value = conv.show(src);

      select.innerHTML = '';
      const candidates = FAMILIES.filter((g) => conv.fonts.includes(g.collection));
      select.hidden = candidates.length === 0;
      for (const g of candidates) {
        const opt = document.createElement('option');
        opt.value = g.default.id;
        opt.textContent = `${g.family} (${g.collection})`;
        select.append(opt);
      }
      const preferred = candidates.find((g) => /karthika|manjari/i.test(g.family));
      if (preferred) select.value = preferred.default.id;
      applyConvFont();

      const nda = b.dataset.conv === 'ml' && lastConversion.out.includes('\u00AD');
      $('#conv-note').textContent = nda
        ? 'ണ്ട is copied as the soft-hyphen byte ML fonts expect. It may look invisible here but pastes correctly in DTP apps.'
        : b.dataset.conv === 'unicode' ? 'Paste the ML/FML text exactly as typed in PageMaker/Word to get Unicode back.' : '';
      if (b.dataset.conv !== 'manglish' && b.dataset.conv !== 'unicode' && b.dataset.conv !== 'from-manglish') {
        copyToClipboard(lastConversion.out).then(() => toast('Converted & copied'));
      }
    });
  }
  select.addEventListener('change', applyConvFont);
  $('#conv-copy').addEventListener('click', () => {
    if (!lastConversion) return;
    copyToClipboard(lastConversion.out).then(() => { toast('Copied'); motion.confirm($('#conv-copy')); });
  });
  $('#conv-use').addEventListener('click', () => {
    if (!lastConversion) return;
    const k = lastConversion.kind;
    const unicode = k === 'unicode' || k === 'from-manglish' ? lastConversion.out : lastConversion.src;
    setText(unicode, { fromPreset: true });
    location.hash = '#fonts';
  });
}

function applyConvFont() {
  const id = $('#conv-font').value;
  const out = $('#conv-out');
  const font = BY_ID.get(id);
  if (!font || $('#conv-font').hidden) { out.style.fontFamily = ''; return; }
  loadFont(font).then(() => { out.style.fontFamily = `"${cssFamily(font)}", system-ui`; }).catch(() => {});
}

let ownCount = 0;
function initOwnFonts() {
  const input = $('#own-file');
  const drop = $('#drop');
  input.addEventListener('change', () => addOwnFonts(input.files));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    addOwnFonts(e.dataTransfer.files);
  });
  $('#own-grid').addEventListener('click', onCardClick);
}

async function addOwnFonts(files) {
  const encoding = $('#own-encoding').value;
  for (const file of files) {
    const local = `own-${++ownCount}`;
    try {
      const face = new FontFace(local, await file.arrayBuffer());
      document.fonts.add(await face.load());
    } catch {
      toast(`Couldn't read ${file.name}`);
      continue;
    }
    const family = file.name.replace(/\.[^.]+$/, '');
    const font = { id: local, local, family, name: family, style: 'Your font', weight: 400, italic: false, file: '', bytes: file.size };
    const group = { family, collection: 'Yours', encoding, styles: [font], default: font, hue: hue(family) };
    const card = buildCard(group, { own: true });
    $('.preview', card).style.fontFamily = `"${local}", system-ui`;
    card.classList.add('ready');
    $('#own-grid').prepend(card);
    motion.showView(card);
  }
  applyTheme();
}

let setTabIndicator = () => {};
let currentView = null;

function route() {
  const tab = (location.hash.replace('#', '') || 'fonts').split('/')[0];
  const known = ['fonts', 'convert', 'try'].includes(tab) ? tab : 'fonts';
  for (const v of $$('.view')) v.hidden = v.dataset.view !== known;
  for (const a of $$('[data-tab]')) {
    a.classList.toggle('active', a.dataset.tab === known);
    if (a.dataset.tab === known) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  setTabIndicator($(`.tabs a[data-tab="${known}"]`));
  if (sheet.open) motion.closeSheet(sheet);
  if (currentView && currentView !== known) {
    window.scrollTo({ top: 0 });
    motion.showView($(`.view[data-view="${known}"]`));
  }
  currentView = known;
}

const HERO_WORD = 'കൽക്കണ്ടം';
const HERO_MAX_FETCHES = 8;
let heroFetches = 0;

function initHero(fonts) {
  const stats = $('#stats');
  const collections = new Set(fonts.map((f) => f.collection)).size;
  for (const [label, value] of [['fonts', fonts.length], ['families', FAMILIES.length], ['collections', collections]]) {
    const row = document.createElement('div');
    row.innerHTML = '<dt></dt><dd>0</dd>';
    row.querySelector('dt').textContent = label;
    stats.append(row);
    motion.countUp(row.querySelector('dd'), value);
  }

  const pool = FAMILIES.filter((g) => g.collection !== 'Yours');
  let last = null;
  const word = $('#hero-word');
  motion.heroCycler({
    el: word,
    label: $('#hero-font'),
    pick: async () => {
      const loaded = pool.filter((g) => fontLoads.has(g.default.id) && g !== last);
      const canFetch = heroFetches < HERO_MAX_FETCHES && !navigator.connection?.saveData;
      const source = canFetch || !loaded.length ? pool : loaded;
      let g;
      do g = source[Math.floor(Math.random() * source.length)]; while (g === last && source.length > 1);
      if (!fontLoads.has(g.default.id)) heroFetches++;
      last = g;
      try { await loadFont(g.default); } catch { return null; }
      return g;
    },
    render: (g) => {
      word.style.fontFamily = `"${cssFamily(g.default)}", system-ui`;
      word.textContent = displayText(HERO_WORD, g.encoding);
    },
  });
}

function safely(fn) {
  try { fn(); } catch (err) { console.error(err); }
}

async function main() {
  const res = await fetch('./data/fonts.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`fonts.json ${res.status}`);
  const fonts = await res.json();
  BY_ID = new Map(fonts.map((f) => [f.id, f]));
  FAMILIES = groupFamilies(fonts);

  renderControls();
  const grid = $('#grid');
  const frag = document.createDocumentFragment();
  for (const g of FAMILIES) {
    const card = buildCard(g);
    frag.append(card);
    observer.observe(card);
  }
  grid.append(frag);

  applyTheme();
  applyFilters();
  safely(initSheet);
  safely(initConverter);
  safely(initOwnFonts);
  safely(() => initHero(fonts));
  safely(() => { setTabIndicator = motion.indicator($('.tabs'), 'tab-ind'); });
  window.addEventListener('hashchange', route);
  route();

  safely(motion.intro);
  safely(() => motion.revealCards($$('#grid .card')));
  safely(motion.pressFeedback);
  safely(() => initStars(motion));
  safely(() => initThemeToggle(motion));
  safely(() => initFacts(FACTS, motion));
  safely(trackVisit);
  initSiteStats(motion).catch(() => {});
}

main().catch((err) => {
  $('#count').textContent = 'Kalkandam could not load. Please refresh the page.';
  console.error(err);
});
