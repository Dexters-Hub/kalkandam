const gsap = window.gsap;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const enabled = Boolean(gsap) && !reduced;

if (enabled) {
  if (window.Flip) gsap.registerPlugin(window.Flip);
  gsap.defaults({ ease: 'power3.out', duration: 0.5 });
}

const isPhone = () => window.matchMedia('(max-width: 759px)').matches;

export function intro() {
  if (!enabled) return;
  const tl = gsap.timeline({ delay: 0.05 });
  tl.from('.top', { y: -12, opacity: 0, duration: 0.5 })
    .from('.eyebrow', { y: 12, opacity: 0 }, '-=0.25')
    .from('#hero-word', { yPercent: 60, opacity: 0, filter: 'blur(10px)', duration: 0.9, ease: 'expo.out' }, '-=0.3')
    .from('.hero-font, .stats > div', { y: 10, opacity: 0, stagger: 0.06 }, '-=0.55')
    .from('.composer', { y: 24, opacity: 0, duration: 0.7 }, '-=0.45')
    .from('.filters > *', { y: 12, opacity: 0, stagger: 0.06 }, '-=0.5');
}

export function countUp(el, value) {
  el.style.display = 'inline-block';
  el.style.minWidth = `${value.toLocaleString().length}ch`;
  if (!enabled) { el.textContent = value.toLocaleString(); return; }
  const obj = { n: 0 };
  gsap.to(obj, {
    n: value, duration: 1.4, ease: 'power2.out', delay: 0.4,
    onUpdate: () => { el.textContent = Math.round(obj.n).toLocaleString(); },
  });
}

export function heroCycler({ el, label, pick, render, interval = 2400 }) {
  let timer = null;
  let visible = true;
  let busy = false;

  async function next() {
    if (busy || !visible || document.hidden) return;
    busy = true;
    try {
      const choice = await pick();
      if (!choice) return;
      const swap = () => {
        render(choice);
        label.innerHTML = `set in <b></b> · ${choice.collection}`;
        label.querySelector('b').textContent = choice.family;
      };
      if (!enabled) { swap(); return; }
      await gsap.to(el, { yPercent: -40, opacity: 0, filter: 'blur(6px)', duration: 0.35, ease: 'power2.in' });
      swap();
      await gsap.fromTo(el,
        { yPercent: 40, opacity: 0, filter: 'blur(6px)' },
        { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out' });
      gsap.fromTo(label, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.3 });
    } finally {
      busy = false;
    }
  }

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(el);
  timer = setInterval(next, interval);
  setTimeout(next, enabled ? 1400 : 0);
  return () => clearInterval(timer);
}

export function revealCards(cards) {
  if (!enabled) return;
  gsap.set(cards, { opacity: 0, y: 28 });
  const io = new IntersectionObserver((entries) => {
    const batch = entries.filter((e) => e.isIntersecting).map((e) => e.target);
    if (!batch.length) return;
    for (const el of batch) io.unobserve(el);
    gsap.to(batch, { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, overwrite: true });
  }, { rootMargin: '0px 0px -30px 0px' });
  for (const card of cards) io.observe(card);
}

let activeFlip = null;

export function flipGrid(cards, mutate) {
  if (!enabled || !window.Flip) { mutate(); return; }
  if (activeFlip) {
    activeFlip.progress(1).kill();
    activeFlip = null;
  }
  const margin = window.innerHeight * 0.5;
  const near = (el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > -margin && r.top < window.innerHeight + margin;
  };
  const before = cards.filter((c) => !c.hidden && near(c));
  const state = window.Flip.getState(before);
  mutate();
  const after = cards.filter((c) => !c.hidden && near(c));
  if (!after.length) return;
  gsap.set(after, { opacity: 1, y: 0 });
  activeFlip = window.Flip.from(state, {
    targets: after,
    duration: 0.45,
    ease: 'power3.inOut',
    onEnter: (els) => els.length && gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.35 }),
    onComplete: () => { activeFlip = null; },
  });
}

export function ripplePreviews(previews) {
  if (!enabled) return;
  const onScreen = previews.filter((p) => {
    const r = p.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  });
  if (!onScreen.length) return;
  gsap.fromTo(onScreen, { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.5, clearProps: 'transform,opacity' });
}

export function crossfade(el, update) {
  if (!enabled) { update(); return; }
  gsap.killTweensOf(el);
  gsap.to(el, {
    opacity: 0, y: -6, filter: 'blur(4px)', duration: 0.35, ease: 'power2.in',
    onComplete: () => {
      update();
      gsap.fromTo(el, { opacity: 0, y: 6, filter: 'blur(4px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out', clearProps: 'filter' });
    },
  });
}

export function spin(el) {
  if (!enabled || !el) return;
  gsap.fromTo(el, { rotate: -90, scale: 0.6, opacity: 0 }, { rotate: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' });
}

export function pulse(el) {
  if (!enabled || !el) return;
  gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' });
}

export function indicator(container, className = 'chip-ind') {
  const ind = document.createElement('span');
  ind.className = className;
  container.prepend(ind);
  let first = true;
  return (active) => {
    if (!active) return;
    const props = { x: active.offsetLeft, width: active.offsetWidth };
    if (!enabled || first) {
      if (gsap) gsap.set(ind, props);
      else Object.assign(ind.style, { transform: `translateX(${props.x}px)`, width: `${props.width}px` });
      first = false;
      return;
    }
    gsap.to(ind, { ...props, duration: 0.45, ease: 'power3.out' });
  };
}

export function showView(view) {
  if (!enabled) return;
  gsap.fromTo(view, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, clearProps: 'transform' });
}

export function openSheet(dialog) {
  if (!dialog.open) dialog.showModal();
  if (!enabled) return;
  gsap.killTweensOf(dialog);
  if (isPhone()) {
    gsap.fromTo(dialog, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' });
  } else {
    gsap.fromTo(dialog, { opacity: 0, scale: 0.96, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'expo.out' });
  }
  gsap.from(dialog.querySelectorAll('.stage, .sheet-text, .controls, #sheet-styles, .actions'), {
    y: 16, opacity: 0, stagger: 0.05, duration: 0.5, delay: 0.1, clearProps: 'transform,opacity',
  });
}

export function closeSheet(dialog) {
  if (!dialog.open) return;
  if (!enabled) { dialog.close(); return; }
  gsap.killTweensOf(dialog);
  const done = () => { dialog.close(); gsap.set(dialog, { clearProps: 'all' }); };
  if (isPhone()) gsap.to(dialog, { yPercent: 100, duration: 0.35, ease: 'power3.in', onComplete: done });
  else gsap.to(dialog, { opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.in', onComplete: done });
}

export function dragToDismiss(dialog, handle) {
  let startY = null;
  let dy = 0;
  let dragging = false;
  handle.addEventListener('pointerdown', (e) => {
    if (!isPhone() || dialog.scrollTop > 0 || e.target.closest('button, a, input, select, textarea')) return;
    startY = e.clientY;
    dy = 0;
    dragging = false;
  });
  handle.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    dy = Math.max(0, e.clientY - startY);
    if (!dragging && dy > 6) {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
    }
    if (dragging && gsap) gsap.set(dialog, { y: dy });
  });
  const end = () => {
    if (startY === null) return;
    startY = null;
    if (!dragging) return;
    dragging = false;
    if (dy > 110) {
      if (enabled) {
        gsap.to(dialog, {
          y: dialog.offsetHeight, duration: 0.25, ease: 'power2.in',
          onComplete: () => { dialog.close(); gsap.set(dialog, { clearProps: 'all' }); },
        });
      } else dialog.close();
    } else if (gsap) {
      gsap.to(dialog, { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.6)' });
    }
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

let toastTween;
export function toast(el, msg) {
  el.textContent = msg;
  if (!enabled) {
    el.classList.add('show');
    clearTimeout(toastTween);
    toastTween = setTimeout(() => el.classList.remove('show'), 1800);
    return;
  }
  toastTween?.kill();
  toastTween = gsap.timeline()
    .fromTo(el, { y: 24, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' })
    .to(el, { y: 12, opacity: 0, duration: 0.3, ease: 'power2.in' }, '+=1.6');
}

export function pressFeedback(root = document) {
  if (!enabled) return;
  const selector = 'button, .btn, .card-actions > a';
  root.addEventListener('pointerdown', (e) => {
    const el = e.target.closest(selector);
    if (el) gsap.to(el, { scale: 0.94, duration: 0.12, ease: 'power2.out' });
  });
  const release = (e) => {
    const el = e.target.closest?.(selector);
    if (el) gsap.to(el, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointerout', release);
}

export function confirm(button, label = 'Copied ✓') {
  if (!button || button.dataset.busy) return;
  const original = button.textContent;
  button.dataset.busy = '1';
  button.classList.add('done');
  button.textContent = label;
  pulse(button);
  setTimeout(() => {
    button.textContent = original;
    button.classList.remove('done');
    delete button.dataset.busy;
  }, 1400);
}
