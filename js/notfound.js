import * as motion from '/js/motion.js?v=18';
import { initThemeToggle, initStars, initFacts } from '/js/common.js?v=18';
import { FACTS } from '/js/facts.js?v=18';

const WITH_DIGITS = [
  'unicode-anekmalayalam-wdth-wght', 'unicode-anjalioldlipi-regular', 'unicode-baloochettan2-wght', 'unicode-chilanka-regular',
  'unicode-dyuthi-regular', 'unicode-gayathri-bold', 'unicode-karumbi-regular', 'unicode-keraleeyam-regular', 'unicode-malini-bold',
  'unicode-manjari-bold', 'unicode-meera-regular', 'unicode-notosansmalayalam-bold', 'unicode-notoserifmalayalam-bold',
  'unicode-nupuram-bold-oblique', 'unicode-nupuram-calligraphy-bold', 'unicode-nupuram-color-colrv0', 'unicode-nupuram-display',
  'unicode-nupuram-dots', 'unicode-rit-bahadur-bold', 'unicode-ritchingam', 'unicode-rit-ezhuthu-regular', 'unicode-rit-indira-bold',
  'unicode-rit-karuna-bold', 'unicode-rit-keram-bold', 'unicode-rit-kutty-bold', 'unicode-rit-lekha', 'unicode-rit-panmana-regular',
  'unicode-rit-rachana-bold', 'unicode-rit-sundar', 'unicode-rit-tnjoy-bold', 'unicode-rit-thaara', 'unicode-rit-uroob',
  'unicode-rachana-bold', 'unicode-suruma', 'unicode-uroob-regular', 'mlu-mlu-chandrika-bold-old-lipi', 'mlu-mlu-keralam-bold',
];
const FONT_VERSION = 3;
const gsap = window.gsap;
const loaded = new Map();

function load(font) {
  if (!loaded.has(font.id)) {
    const face = new FontFace(`nf-${font.id}`, `url("/${encodeURI(font.web)}?v=${FONT_VERSION}")`);
    loaded.set(font.id, face.load().then((f) => { document.fonts.add(f); return f; }));
  }
  return loaded.get(font.id);
}

async function main() {
  const fonts = await (await fetch('/data/fonts.json', { cache: 'no-cache' })).json();
  const pool = fonts.filter((f) => WITH_DIGITS.includes(f.id));
  if (!pool.length) return;
  const digits = [...document.querySelectorAll('.nf-digit')];
  const label = document.querySelector('#nf-fonts');
  const current = digits.map(() => null);

  const pick = () => pool[Math.floor(Math.random() * pool.length)];
  const caption = () => {
    const names = [...new Set(current.filter(Boolean).map((f) => f.family))];
    label.textContent = names.length ? `set in ${names.join(' · ')}` : ' ';
  };

  const roll = async (i) => {
    let font = pick();
    if (current[i] && pool.length > 1) while (font.id === current[i].id) font = pick();
    try { await load(font); } catch { return; }
    const el = digits[i];
    const apply = () => {
      el.style.fontFamily = `"nf-${font.id}", system-ui`;
      current[i] = font;
      caption();
    };
    if (!motion.enabled) { apply(); return; }
    await gsap.to(el, { yPercent: -70, opacity: 0, duration: 0.18, ease: 'power2.in' });
    apply();
    await gsap.fromTo(el, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'back.out(2.2)' });
  };

  const shuffle = () => digits.forEach((_, i) => setTimeout(() => roll(i), i * 120));
  shuffle();
  document.querySelector('#nf-digits').addEventListener('click', shuffle);

  let tick = 0;
  setInterval(() => {
    if (document.hidden) return;
    roll(tick % digits.length);
    tick++;
  }, motion.enabled ? 1100 : 2500);

  if (motion.enabled) {
    gsap.from('.nf .fact', { y: 16, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out', delay: 0.15 });
  }
}

function safely(fn) {
  try { fn(); } catch (err) { console.error(err); }
}

main().catch((err) => console.error(err));
safely(motion.pressFeedback);
safely(() => initThemeToggle(motion));
safely(() => initStars(motion));
safely(() => initFacts(FACTS, motion));
