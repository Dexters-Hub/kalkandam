import { toManglish } from './malayalam.js?v=5';
import * as motion from './motion.js?v=5';
import { store, initThemeToggle, initStars } from './common.js?v=5';
import { VOWELS, CONSONANT_GROUPS, CHILLUS, SIGNS, CONJUNCTS, DIGITS } from './letters-data.js?v=5';

const $ = (sel, root = document) => root.querySelector(sel);
const FONT_VERSION = 2;
const DEFAULT_FONT = 'unicode-manjari-regular';

let mlVoice = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  return speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('ml')) || null;
}

function speak(text) {
  if (!mlVoice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = mlVoice;
  u.lang = mlVoice.lang;
  u.rate = 0.8;
  speechSynthesis.speak(u);
  return true;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'lang') node.lang = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c != null) node.append(c);
  return node;
}

function tile({ l, iso, ipa, word, meaning, note, say }) {
  const label = [l, iso && `(${iso})`, word && `as in ${word}`, meaning && `, ${meaning}`].filter(Boolean).join(' ');
  return el('button', { class: 'lt', type: 'button', 'data-say': say || l, 'aria-label': label },
    el('span', { class: 'lt-glyph', lang: 'ml' }, l),
    el('span', { class: 'lt-iso' }, iso || ''),
    ipa ? el('span', { class: 'lt-ipa' }, `/${ipa}/`) : null,
    word ? el('span', { class: 'lt-word' }, el('span', { lang: 'ml' }, word), meaning ? ` · ${meaning}` : '') : null,
    note ? el('span', { class: 'lt-note' }, note) : null,
  );
}

function section(id, title, en, intro, tiles, wide = false) {
  const grid = el('div', { class: `lt-grid${wide ? ' wide' : ''}` });
  for (const t of tiles) grid.append(t);
  return el('section', { class: 'lt-section', id, 'aria-labelledby': `${id}-h` },
    el('h2', { id: `${id}-h` }, el('span', { lang: 'ml' }, title), el('small', {}, en)),
    intro ? el('p', { class: 'lt-intro' }, intro) : null,
    grid,
  );
}

function render() {
  const root = $('#letters');
  root.append(section('vowels', 'സ്വരാക്ഷരങ്ങൾ', 'Vowels', 'Written at the start of a word. After a consonant, a vowel becomes a sign (see below).', VOWELS.map(tile)));

  const consonants = el('section', { class: 'lt-section', id: 'consonants', 'aria-labelledby': 'consonants-h' },
    el('h2', { id: 'consonants-h' }, el('span', { lang: 'ml' }, 'വ്യഞ്ജനാക്ഷരങ്ങൾ'), el('small', {}, 'Consonants')),
    el('p', { class: 'lt-intro' }, 'Each consonant carries an inherent "a". The first five rows are grouped by where the sound is made in the mouth.'));
  for (const g of CONSONANT_GROUPS) {
    const grid = el('div', { class: 'lt-grid' });
    for (const t of g.letters) grid.append(tile(t));
    consonants.append(el('h3', {}, el('span', { lang: 'ml' }, g.name), el('small', {}, g.en)), grid);
  }
  root.append(consonants);

  root.append(section('chillus', 'ചില്ലക്ഷരങ്ങൾ', 'Chillus', 'Pure consonants with no vowel, used at the end of syllables.', CHILLUS.map(tile)));

  root.append(section('signs', 'സ്വരചിഹ്നങ്ങൾ', 'Vowel signs', 'How each vowel attaches to a consonant, shown on ക.',
    SIGNS.map((s) => tile({ l: `ക${s.sign}`, iso: `k${s.iso.startsWith('(') ? '' : s.iso}`, note: s.iso.startsWith('(') ? 'chandrakkala, no vowel' : `◌${s.sign}` }))));

  root.append(section('conjuncts', 'കൂട്ടക്ഷരങ്ങൾ', 'Common conjuncts', 'Two or more consonants joined together.',
    CONJUNCTS.map((c) => tile({ l: c.l, iso: c.iso, word: c.word })), true));

  root.append(section('numbers', 'അക്കങ്ങൾ', 'Numerals', 'Traditional Malayalam digits. Everyday writing mostly uses 0 to 9.',
    DIGITS.map((d) => tile({ l: d.l, iso: String(d.n), word: d.word, say: d.word }))));

  for (const t of root.querySelectorAll('.lt')) {
    const glyph = t.querySelector('.lt-glyph').textContent;
    const raw = toManglish(glyph);
    const m = glyph.endsWith('\u0D4D') ? raw.replace(/u$/, '') : raw;
    if (m && m !== t.querySelector('.lt-iso').textContent) {
      t.querySelector('.lt-iso').after(el('span', { class: 'lt-mang' }, m));
    }
  }

  const jump = $('#letters-jump');
  for (const s of root.querySelectorAll('.lt-section')) {
    const a = el('a', { href: `#${s.id}` }, s.querySelector('h2 small').textContent);
    jump.append(a);
  }
}

async function initFontPicker() {
  const select = $('#letters-font');
  const fonts = await (await fetch('./data/fonts.json', { cache: 'no-cache' })).json();
  const options = fonts.filter((f) => f.encoding === 'unicode' && !/italic|oblique/i.test(f.style) && f.weight >= 400 && f.weight <= 500);
  const seen = new Set();
  for (const f of options) {
    const key = `${f.collection}|${f.family}`;
    if (seen.has(key)) continue;
    seen.add(key);
    select.append(el('option', { value: f.id }, `${f.family} (${f.collection})`));
  }
  const byId = new Map(fonts.map((f) => [f.id, f]));
  const apply = async (id) => {
    const font = byId.get(id);
    if (!font) return;
    const family = `l-${font.id}`;
    if (![...document.fonts].some((f) => f.family === family)) {
      const face = new FontFace(family, `url("${encodeURI(font.web)}?v=${FONT_VERSION}")`);
      document.fonts.add(await face.load());
    }
    document.documentElement.style.setProperty('--letters-font', `"${family}", system-ui`);
    store.set('lettersFont', id);
  };
  const saved = store.get('lettersFont', DEFAULT_FONT);
  select.value = byId.has(saved) && [...select.options].some((o) => o.value === saved) ? saved : DEFAULT_FONT;
  select.addEventListener('change', () => apply(select.value).catch(() => {}));
  await apply(select.value);
}

function initSpeech() {
  const note = $('#speech-note');
  const update = () => {
    mlVoice = pickVoice();
    note.textContent = mlVoice ? '' : ' (audio needs a Malayalam voice on your device)';
    document.body.classList.toggle('has-voice', Boolean(mlVoice));
  };
  update();
  if ('speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', update);

  $('#letters').addEventListener('click', (e) => {
    const t = e.target.closest('.lt');
    if (!t) return;
    speak(t.dataset.say);
    motion.pulse(t);
  });
}

function safely(fn) {
  try { fn(); } catch (err) { console.error(err); }
}

render();
safely(initSpeech);
initFontPicker().catch((err) => console.error(err));
safely(() => motion.revealCards([...document.querySelectorAll('.lt-section')]));
safely(motion.pressFeedback);
safely(() => initThemeToggle(motion));
safely(() => initStars(motion));
